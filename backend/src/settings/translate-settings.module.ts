import { Module } from '@nestjs/common';
import { TranslateSettingsService } from './translate-settings.service';

@Module({
  providers: [TranslateSettingsService],
  exports: [TranslateSettingsService],
})
export class TranslateSettingsModule {}
