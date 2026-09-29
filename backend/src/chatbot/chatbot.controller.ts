import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ChatbotService } from './chatbot.service';
import { CreateFaqDto, EscalateConversationDto, LogMessageDto, UpdateFaqDto } from './dto/chatbot.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('chatbot')
export class ChatbotController {
  constructor(private chatbotService: ChatbotService) {}

  // --- Public: used by the chatbot widget ---

  @Get('faqs')
  listFaqs(@Query('lang') lang?: string, @Query('category') category?: string) {
    return this.chatbotService.listFaqs(lang, category);
  }

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Post('messages')
  logMessage(@Body() dto: LogMessageDto) {
    return this.chatbotService.logMessage(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('escalate')
  escalate(@Body() dto: EscalateConversationDto) {
    return this.chatbotService.escalate(dto.sessionId, dto.name, dto.email);
  }

  // --- Admin: FAQ / knowledge base management + human-agent handoff queue ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Get('admin/faqs')
  listFaqsAdmin() {
    return this.chatbotService.listFaqsAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Post('admin/faqs')
  createFaq(@Body() dto: CreateFaqDto) {
    return this.chatbotService.createFaq(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Patch('admin/faqs/:id')
  updateFaq(@Param('id') id: string, @Body() dto: UpdateFaqDto) {
    return this.chatbotService.updateFaq(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete('admin/faqs/:id')
  removeFaq(@Param('id') id: string) {
    return this.chatbotService.removeFaq(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Get('admin/conversations')
  findConversations(@Query('escalatedOnly') escalatedOnly?: string) {
    return this.chatbotService.findConversations(escalatedOnly === 'true');
  }
}
