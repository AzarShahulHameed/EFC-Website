import { Module } from '@nestjs/common';
import { CloudinarySettingsService } from './cloudinary-settings.service';

@Module({
  providers: [CloudinarySettingsService],
  exports: [CloudinarySettingsService],
})
export class CloudinarySettingsModule {}
