import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailSettingsService } from '../settings/email-settings.service';

@Module({
  providers: [EmailService, EmailSettingsService],
  exports: [EmailService, EmailSettingsService],
})
export class EmailModule {}
