import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SubscribeDto } from './dto/newsletter.dto';

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // Idempotent on purpose: re-subscribing with the same email (a visitor
  // who forgot they already signed up, or double-clicked Subscribe) is a
  // success, not a 409 the footer would have to explain. The `@unique` on
  // email is what makes this a plain upsert instead of a race-prone
  // find-then-create.
  async subscribe(dto: SubscribeDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.newsletterSubscriber.findUnique({ where: { email } });
    await this.prisma.newsletterSubscriber.upsert({
      where: { email },
      update: {},
      create: { email },
    });
    // Only notify on a genuinely new signup — a repeat subscribe shouldn't
    // ping the admin dashboard every time someone re-submits the form.
    if (!existing) {
      this.notifications
        .create('NEWSLETTER_SIGNUP', `New newsletter signup: ${email}`, undefined, '/admin/newsletter')
        .catch((err) => this.logger.warn(`Failed to write notification for newsletter signup: ${err.message}`));
    }
    return { subscribed: true };
  }

  findAllAdmin() {
    return this.prisma.newsletterSubscriber.findMany({ orderBy: { createdAt: 'desc' } });
  }

  count() {
    return this.prisma.newsletterSubscriber.count();
  }
}
