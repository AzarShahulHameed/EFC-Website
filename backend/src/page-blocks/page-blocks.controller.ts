import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PageBlocksService } from './page-blocks.service';
import { CreatePageBlockDto, UpdatePageBlockDto } from './dto/page-block.dto';
import { ReorderDto } from '../common/dto/reorder.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('page-blocks')
export class PageBlocksController {
  constructor(private pageBlocksService: PageBlocksService) {}

  // Public — the frontend calls this per-page to render whatever an admin
  // has added there. `:page` is a single path segment (same constraint as
  // GET /content/:page/:languageCode), so a sub-service's composite key
  // (`subservice::slug::slug`) works here too since it never contains "/".
  @Get(':page')
  findAllPublic(@Param('page') page: string, @Query('lang') lang?: string) {
    return this.pageBlocksService.findAllPublic(page, lang || 'en');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Get('admin/all/:page')
  findAllAdmin(@Param('page') page: string) {
    return this.pageBlocksService.findAllAdmin(page);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Post('admin')
  create(@Body() dto: CreatePageBlockDto) {
    return this.pageBlocksService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Patch('admin/reorder/:page')
  reorder(@Param('page') page: string, @Body() dto: ReorderDto) {
    return this.pageBlocksService.reorder(page, dto.ids);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Patch('admin/:id')
  update(@Param('id') id: string, @Body() dto: UpdatePageBlockDto) {
    return this.pageBlocksService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete('admin/:id')
  remove(@Param('id') id: string) {
    return this.pageBlocksService.remove(id);
  }
}
