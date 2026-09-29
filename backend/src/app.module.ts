import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ServicesModule } from './services/services.module';
import { TeamModule } from './team/team.module';
import { BranchesModule } from './branches/branches.module';
import { TestimonialsModule } from './testimonials/testimonials.module';
import { ClientLogosModule } from './client-logos/client-logos.module';
import { InsightsModule } from './insights/insights.module';
import { CareersModule } from './careers/careers.module';
import { LeadsModule } from './leads/leads.module';
import { LanguagesModule } from './languages/languages.module';
import { SeoModule } from './seo/seo.module';
import { ThemeModule } from './theme/theme.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { MediaModule } from './media/media.module';
import { AuditModule } from './audit/audit.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PageBlocksModule } from './page-blocks/page-blocks.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { FreezoneModule } from './freezone/freezone.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]), // basic rate limiting
    PrismaModule,
    AuthModule,
    UsersModule,
    ServicesModule,
    TeamModule,
    BranchesModule,
    TestimonialsModule,
    ClientLogosModule,
    InsightsModule,
    CareersModule,
    LeadsModule,
    LanguagesModule,
    SeoModule,
    ThemeModule,
    ChatbotModule,
    MediaModule,
    AuditModule,
    AnalyticsModule,
    PageBlocksModule,
    NewsletterModule,
    FreezoneModule,
    NotificationsModule,
    SettingsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
