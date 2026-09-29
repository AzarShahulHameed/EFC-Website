import { Module } from '@nestjs/common';
import { FreezoneService } from './freezone.service';
import { FreezoneController } from './freezone.controller';

@Module({
  controllers: [FreezoneController],
  providers: [FreezoneService],
})
export class FreezoneModule {}
