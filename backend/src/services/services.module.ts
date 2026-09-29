import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { LanguagesModule } from '../languages/languages.module';

@Module({
  imports: [LanguagesModule],
  controllers: [ServicesController],
  providers: [ServicesService],
})
export class ServicesModule {}
