import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { EmailSettingsService } from './email-settings.service';
import { CloudinarySettingsService } from './cloudinary-settings.service';
import { TranslateSettingsService } from './translate-settings.service';
import { UpdateEmailSettingsDto } from './dto/email-settings.dto';
import { UpdateCloudinarySettingsDto } from './dto/cloudinary-settings.dto';
import { UpdateTranslateSettingsDto } from './dto/translate-settings.dto';
import { EmailService } from '../email/email.service';

// Both settings screens hold real credentials (an SMTP password, a Resend
// API key, a Cloudinary API secret), so — unlike most content settings in
// this app, which EDITOR can touch — these are Admin/Super Admin only.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('settings')
export class SettingsController {
  constructor(
    private emailSettings: EmailSettingsService,
    private cloudinarySettings: CloudinarySettingsService,
    private translateSettings: TranslateSettingsService,
    private emailService: EmailService,
  ) {}

  @Get('email')
  getEmail() {
    return this.emailSettings.getForAdmin();
  }

  @Patch('email')
  updateEmail(@Body() dto: UpdateEmailSettingsDto) {
    return this.emailSettings.update(dto);
  }

  // Sends a real email to the signed-in admin's own address so they can
  // confirm SMTP/Resend actually works before relying on it — rate
  // limited since it triggers a real outbound send through a
  // possibly-metered provider.
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('email/test')
  async sendTestEmail(@CurrentUser() user: { id: string; email: string }) {
    await this.emailService.sendTestEmail(user.email);
    return { sent: true };
  }

  @Get('cloudinary')
  getCloudinary() {
    return this.cloudinarySettings.getForAdmin();
  }

  @Patch('cloudinary')
  updateCloudinary(@Body() dto: UpdateCloudinarySettingsDto) {
    return this.cloudinarySettings.update(dto);
  }

  @Get('translate')
  getTranslate() {
    return this.translateSettings.getForAdmin();
  }

  @Patch('translate')
  updateTranslate(@Body() dto: UpdateTranslateSettingsDto) {
    return this.translateSettings.update(dto);
  }

  // Usage/cost KPI panel for Admin → Translate Settings — how much has
  // actually been translated, broken down by language and by which admin
  // screen triggered it, plus a rough cost estimate (see
  // TranslateSettingsService.getUsage() for the pricing assumptions).
  @Get('translate/usage')
  getTranslateUsage() {
    return this.translateSettings.getUsage();
  }
}
