import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { EmailModule } from '../email/email.module';
import { CloudinarySettingsModule } from './cloudinary-settings.module';
import { TranslateSettingsModule } from './translate-settings.module';

@Module({
  imports: [EmailModule, CloudinarySettingsModule, TranslateSettingsModule],
  controllers: [SettingsController],
})
export class SettingsModule {}
