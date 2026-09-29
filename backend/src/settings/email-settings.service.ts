import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateEmailSettingsDto } from './dto/email-settings.dto';

export type ResolvedEmailSettings = {
  provider: 'smtp' | 'resend';
  fromName?: string | null;
  fromEmail?: string | null;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpSecure?: boolean;
  smtpUser?: string | null;
  smtpPass?: string | null;
  resendApiKey?: string | null;
  source: 'db' | 'env';
};

@Injectable()
export class EmailSettingsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  // The actual credentials, for EmailService to send with — never exposed
  // directly over HTTP (see getForAdmin() for the masked, client-safe
  // view). Falls back to .env if no admin-dashboard config has been saved
  // yet, so an existing deployment that already had SMTP_* set keeps
  // working unchanged after this upgrade.
  async get(): Promise<ResolvedEmailSettings> {
    const row = await this.prisma.emailSettings.findUnique({ where: { id: 'default' } });
    const hasDbConfig =
      row && ((row.provider === 'smtp' && row.smtpHost && row.smtpUser && row.smtpPass) || (row.provider === 'resend' && row.resendApiKey));

    if (hasDbConfig && row) {
      return {
        provider: row.provider as 'smtp' | 'resend',
        fromName: row.fromName,
        fromEmail: row.fromEmail,
        smtpHost: row.smtpHost,
        smtpPort: row.smtpPort,
        smtpSecure: row.smtpSecure,
        smtpUser: row.smtpUser,
        smtpPass: row.smtpPass,
        resendApiKey: row.resendApiKey,
        source: 'db',
      };
    }

    return {
      provider: 'smtp',
      fromName: this.config.get<string>('SMTP_FROM_NAME'),
      fromEmail: this.config.get<string>('SMTP_FROM') || this.config.get<string>('SMTP_USER'),
      smtpHost: this.config.get<string>('SMTP_HOST'),
      smtpPort: this.config.get<string>('SMTP_PORT') ? Number(this.config.get<string>('SMTP_PORT')) : undefined,
      smtpSecure: this.config.get<string>('SMTP_PORT') === '465',
      smtpUser: this.config.get<string>('SMTP_USER'),
      smtpPass: this.config.get<string>('SMTP_PASS'),
      resendApiKey: this.config.get<string>('RESEND_API_KEY'),
      source: 'env',
    };
  }

  // Client-safe view for the Admin → Email Settings screen: secrets are
  // masked, never round-tripped back to the browser. `configured` tells
  // the UI whether sending will actually work right now.
  async getForAdmin() {
    const settings = await this.get();
    const configured =
      settings.provider === 'smtp'
        ? Boolean(settings.smtpHost && settings.smtpUser && settings.smtpPass)
        : Boolean(settings.resendApiKey);

    return {
      provider: settings.provider,
      fromName: settings.fromName ?? '',
      fromEmail: settings.fromEmail ?? '',
      smtpHost: settings.smtpHost ?? '',
      smtpPort: settings.smtpPort ?? null,
      smtpSecure: Boolean(settings.smtpSecure),
      smtpUser: settings.smtpUser ?? '',
      smtpPassSet: Boolean(settings.smtpPass),
      resendApiKeySet: Boolean(settings.resendApiKey),
      source: settings.source,
      configured,
    };
  }

  async update(dto: UpdateEmailSettingsDto) {
    const existing = await this.prisma.emailSettings.findUnique({ where: { id: 'default' } });

    // Blank secret fields mean "leave unchanged" — the form never receives
    // the real value to send back, so there's no other way to distinguish
    // "didn't touch this field" from "wants to clear it," and clearing a
    // password silently would break email sending with no visible cause.
    const smtpPass = dto.smtpPass && dto.smtpPass.length > 0 ? dto.smtpPass : existing?.smtpPass;
    const resendApiKey = dto.resendApiKey && dto.resendApiKey.length > 0 ? dto.resendApiKey : existing?.resendApiKey;

    return this.prisma.emailSettings.upsert({
      where: { id: 'default' },
      update: {
        provider: dto.provider,
        fromName: dto.fromName,
        fromEmail: dto.fromEmail,
        smtpHost: dto.smtpHost,
        smtpPort: dto.smtpPort,
        smtpSecure: dto.smtpSecure ?? false,
        smtpUser: dto.smtpUser,
        smtpPass,
        resendApiKey,
      },
      create: {
        id: 'default',
        provider: dto.provider,
        fromName: dto.fromName,
        fromEmail: dto.fromEmail,
        smtpHost: dto.smtpHost,
        smtpPort: dto.smtpPort,
        smtpSecure: dto.smtpSecure ?? false,
        smtpUser: dto.smtpUser,
        smtpPass,
        resendApiKey,
      },
    });
  }
}
