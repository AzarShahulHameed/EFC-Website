import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { InsightsService } from './insights.service';
import { CreateInsightArticleDto, CreateInsightCategoryDto, UpdateInsightArticleDto } from './dto/insight-article.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('insights')
export class InsightsController {
  constructor(private insightsService: InsightsService) {}

  @Get('categories')
  listCategories() {
    return this.insightsService.listCategories();
  }

  @Get()
  findAllPublic(
    @Query('lang') lang?: string,
    @Query('category') category?: string,
    @Query('type') type?: string,
  ) {
    return this.insightsService.findAllPublic(lang, category, type);
  }

  @Get(':slug')
  findOnePublic(@Param('slug') slug: string, @Query('lang') lang?: string) {
    return this.insightsService.findOnePublic(slug, lang);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Post('categories')
  createCategory(@Body() dto: CreateInsightCategoryDto) {
    return this.insightsService.createCategory(dto.slug, dto.order);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Get('admin/all')
  findAllAdmin() {
    return this.insightsService.findAllAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Get('admin/:id')
  findOneAdmin(@Param('id') id: string) {
    return this.insightsService.findOneAdmin(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Post('admin')
  create(@Body() dto: CreateInsightArticleDto) {
    return this.insightsService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Patch('admin/:id')
  update(@Param('id') id: string, @Body() dto: UpdateInsightArticleDto) {
    return this.insightsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Delete('admin/:id')
  remove(@Param('id') id: string) {
    return this.insightsService.remove(id);
  }
}
