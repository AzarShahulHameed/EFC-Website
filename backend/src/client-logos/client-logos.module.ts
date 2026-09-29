import { Module } from '@nestjs/common';
import { ClientLogosService } from './client-logos.service';
import { ClientLogosController } from './client-logos.controller';

@Module({
  controllers: [ClientLogosController],
  providers: [ClientLogosService],
})
export class ClientLogosModule {}
