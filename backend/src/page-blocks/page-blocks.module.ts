import { Module } from '@nestjs/common';
import { PageBlocksService } from './page-blocks.service';
import { PageBlocksController } from './page-blocks.controller';

@Module({
  controllers: [PageBlocksController],
  providers: [PageBlocksService],
})
export class PageBlocksModule {}
