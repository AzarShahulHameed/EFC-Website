import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { LanguagesService } from './languages.service';
import { TranslateBatchDto, UpsertContentBlockDto, UpsertLanguageDto, UpsertTranslationDto } from './dto/languages.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller()
export class LanguagesController {
  constructor(private languagesService: LanguagesService) {}

  // --- Public ---

  @Get('languages')
  listLanguages() {
    return this.languagesService.listLanguages();
  }

  @Get('translations/:languageCode')
  getTranslations(@Param('languageCode') languageCode: string) {
    return this.languagesService.getTranslations(languageCode);
  }

  @Get('content/:page/:languageCode')
  getPageContent(@Param('page') page: string, @Param('languageCode') languageCode: string) {
    return this.languagesService.getPageContent(page, languageCode);
  }

  // --- Admin: Languages & Theme Builder's "content" side ---

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Get('admin/languages')
  listAllLanguages() {
    return this.languagesService.listAllLanguages();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @Post('admin/languages')
  upsertLanguage(@Body() dto: UpsertLanguageDto) {
    return this.languagesService.upsertLanguage(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Post('admin/translations')
  upsertTranslation(@Body() dto: UpsertTranslationDto) {
    return this.languagesService.upsertTranslation(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Post('admin/content-blocks')
  upsertContentBlock(@Body() dto: UpsertContentBlockDto, @CurrentUser() user: { id: string }) {
    return this.languagesService.upsertContentBlock(dto, user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Post('admin/translate')
  translate(@Body() dto: TranslateBatchDto) {
    return this.languagesService.translateBatch(dto.texts, dto.targetLanguage, dto.htmlKeys, dto.source || 'manual');
  }
}
