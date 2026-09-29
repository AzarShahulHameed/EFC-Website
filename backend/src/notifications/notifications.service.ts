import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type NotificationType = 'NEW_LEAD' | 'NEWSLETTER_SIGNUP' | 'CHATBOT_ESCALATION' | 'JOB_APPLICATION';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  // Called from wherever something admin-worthy happens (a new lead, a
  // newsletter signup, a chatbot escalation, a job application) — never
  // awaited by the caller in a way that could fail the real operation; see
  // each call site's .catch() for why.
  create(type: NotificationType, title: string, body?: string, link?: string) {
    return this.prisma.notification.create({ data: { type, title, body, link } });
  }

  findRecent(limit = 20) {
    return this.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
    });
  }

  unreadCount() {
    return this.prisma.notification.count({ where: { isRead: false } });
  }

  async markRead(id: string) {
    await this.prisma.notification.update({ where: { id }, data: { isRead: true } });
    return { read: true };
  }

  async markAllRead() {
    await this.prisma.notification.updateMany({ where: { isRead: false }, data: { isRead: true } });
    return { read: true };
  }
}
