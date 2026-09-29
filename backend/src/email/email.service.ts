import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailSettingsService, ResolvedEmailSettings } from '../settings/email-settings.service';

type SendArgs = { to: string; subject: string; text: string; html: string };

// Thin wrapper that sends mail via whichever provider is configured —
// SMTP (any host: SendGrid, Postmark, SES, Gmail app password, ...) or
// Resend's HTTP API — read from the database first (Admin → Email
// Settings) and falling back to .env if nothing's been saved there yet
// (see EmailSettingsService). Used for OTP emails (Security page's
// Change Password/Change Email, and Forgot Password) and the settings
// screen's "Send test email" button — nothing else in this codebase sends
// email; reuse this service rather than adding a second mail client.
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private emailSettings: EmailSettingsService) {}

  private async send({ to, subject, text, html }: SendArgs) {
    const settings = await this.emailSettings.get();
    const fromName = settings.fromName || 'EFC';
    const fromEmail = settings.fromEmail || settings.smtpUser || 'no-reply@example.com';
    const from = `"${fromName}" <${fromEmail}>`;

    if (settings.provider === 'resend') {
      await this.sendViaResend(settings, from, to, subject, text, html);
    } else {
      await this.sendViaSmtp(settings, from, to, subject, text, html);
    }
  }

  private async sendViaSmtp(
    settings: ResolvedEmailSettings,
    from: string,
    to: string,
    subject: string,
    text: string,
    html: string,
  ) {
    if (!settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
      throw new BadRequestException(
        "Email sending isn't configured yet — set it up in Admin → Email Settings (or SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS in the API's .env as a fallback).",
      );
    }
    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort || 587,
      secure: Boolean(settings.smtpSecure ?? settings.smtpPort === 465),
      auth: { user: settings.smtpUser, pass: settings.smtpPass },
    });
    try {
      await transporter.sendMail({ from, to, subject, text, html });
    } catch (err) {
      this.logger.error(`Failed to send email to ${to} via SMTP`, err as Error);
      throw new BadRequestException('Could not send the email — please try again shortly.');
    }
  }

  private async sendViaResend(
    settings: ResolvedEmailSettings,
    from: string,
    to: string,
    subject: string,
    text: string,
    html: string,
  ) {
    if (!settings.resendApiKey) {
      throw new BadRequestException(
        "Email sending isn't configured yet — set it up in Admin → Email Settings (or RESEND_API_KEY in the API's .env as a fallback).",
      );
    }
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settings.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to, subject, text, html }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Resend API responded ${res.status}: ${body}`);
      }
    } catch (err) {
      this.logger.error(`Failed to send email to ${to} via Resend`, err as Error);
      throw new BadRequestException('Could not send the email — please try again shortly.');
    }
  }

  async sendOtpEmail(to: string, code: string, purpose: 'PASSWORD_CHANGE' | 'EMAIL_CHANGE' | 'PASSWORD_RESET') {
    const action =
      purpose === 'PASSWORD_CHANGE'
        ? 'change your admin password'
        : purpose === 'EMAIL_CHANGE'
          ? 'change your admin email address'
          : 'reset your admin password';

    await this.send({
      to,
      subject: `Your verification code: ${code}`,
      text: `Use this code to ${action}: ${code}\n\nThis code expires in 10 minutes. If you didn't request this, you can ignore this email — your account is unaffected.`,
      html: `<p>Use this code to ${action}:</p><p style="font-size:28px;font-weight:700;letter-spacing:0.15em;">${code}</p><p>This code expires in 10 minutes. If you didn't request this, you can ignore this email — your account is unaffected.</p>`,
    });
  }

  // Admin → Email Settings' "Send test email" button.
  async sendTestEmail(to: string) {
    await this.send({
      to,
      subject: 'Test email from EFC',
      text: 'This is a test email from your admin dashboard’s Email Settings page. If you received this, your email configuration is working.',
      html: '<p>This is a test email from your admin dashboard’s <strong>Email Settings</strong> page.</p><p>If you received this, your email configuration is working.</p>',
    });
  }
}
