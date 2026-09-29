import { Module } from '@nestjs/common';
import { LanguagesService } from './languages.service';
import { LanguagesController } from './languages.controller';
import { TranslateSettingsModule } from '../settings/translate-settings.module';

@Module({
  imports: [TranslateSettingsModule],
  controllers: [LanguagesController],
  providers: [LanguagesService],
  // Exported so other feature modules (Services, Insights, Team,
  // Testimonials) can inject LanguagesService directly to auto-fill a
  // missing translation right after an English save, instead of only being
  // reachable through the manual "Auto-translate" button's HTTP endpoint.
  exports: [LanguagesService],
})
export class LanguagesModule {}
