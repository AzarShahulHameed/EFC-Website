import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateFaqDto, LogMessageDto, UpdateFaqDto } from './dto/chatbot.dto';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // --- FAQ knowledge base, consumed by the chatbot's response engine ---

  async listFaqs(languageCode = 'en', category?: string) {
    const rows = await this.prisma.faqItem.findMany({
      where: { isActive: true, category },
      orderBy: { order: 'asc' },
      include: { translations: { where: { languageCode } } },
    });
    return rows.map((f) => ({
      id: f.id,
      category: f.category,
      question: f.translations[0]?.question,
      answer: f.translations[0]?.answer,
    }));
  }

  listFaqsAdmin() {
    return this.prisma.faqItem.findMany({ orderBy: { order: 'asc' }, include: { translations: true } });
  }

  createFaq(dto: CreateFaqDto) {
    return this.prisma.faqItem.create({
      data: {
        category: dto.category,
        isActive: dto.isActive ?? true,
        order: dto.order ?? 0,
        translations: { create: dto.translations },
      },
      include: { translations: true },
    });
  }

  async updateFaq(id: string, dto: UpdateFaqDto) {
    const existing = await this.prisma.faqItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('FAQ not found.');

    return this.prisma.$transaction(async (tx) => {
      if (dto.translations) {
        for (const t of dto.translations) {
          await tx.faqTranslation.upsert({
            where: { faqId_languageCode: { faqId: id, languageCode: t.languageCode } },
            update: t,
            create: { ...t, faqId: id },
          });
        }
      }
      return tx.faqItem.update({
        where: { id },
        data: { category: dto.category, isActive: dto.isActive, order: dto.order },
        include: { translations: true },
      });
    });
  }

  async removeFaq(id: string) {
    const existing = await this.prisma.faqItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('FAQ not found.');
    await this.prisma.faqItem.delete({ where: { id } });
    return { deleted: true };
  }

  // --- Conversation logging ---

  private async getOrCreateConversation(sessionId: string) {
    return this.prisma.chatConversation.upsert({
      where: { sessionId },
      update: {},
      create: { sessionId },
    });
  }

  async logMessage(dto: LogMessageDto) {
    const conversation = await this.getOrCreateConversation(dto.sessionId);
    return this.prisma.chatMessage.create({
      data: { conversationId: conversation.id, role: dto.role, content: dto.content },
    });
  }

  // When the visitor leaves a name/email on "talk to a person", this also
  // creates a Lead (source CHATBOT, message = the conversation transcript
  // so far) and links it to the conversation — that link is what lets the
  // admin conversations list show exactly who asked, not just "escalated:
  // true" with no identity attached.
  async escalate(sessionId: string, name?: string, email?: string) {
    const conversation = await this.getOrCreateConversation(sessionId);

    let leadId = conversation.leadId;
    if (!leadId && name && email) {
      const transcript = await this.prisma.chatMessage.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'asc' },
      });
      const lead = await this.prisma.lead.create({
        data: {
          name,
          email,
          message: transcript.map((m) => `${m.role === 'USER' ? 'Visitor' : 'Bot'}: ${m.content}`).join('\n') || undefined,
          source: 'CHATBOT',
        },
      });
      leadId = lead.id;

      this.notifications
        .create('CHATBOT_ESCALATION', `Chatbot handoff: ${name} wants to talk to a person`, undefined, '/admin/chatbot')
        .catch((err) => this.logger.warn(`Failed to write notification for chatbot escalation: ${err.message}`));
    }

    return this.prisma.chatConversation.update({
      where: { id: conversation.id },
      data: { escalated: true, leadId: leadId ?? undefined },
    });
  }

  findConversations(escalatedOnly = false) {
    return this.prisma.chatConversation.findMany({
      where: escalatedOnly ? { escalated: true } : undefined,
      orderBy: { startedAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'asc' } }, lead: true },
    });
  }
}
