import { Body, Controller, Get, Post, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { SeoService } from './seo.service';
import { UpsertSeoMetaDto } from './dto/seo-meta.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('seo')
export class SeoController {
  constructor(private seoService: SeoService) {}

  @Get('meta')
  getByPath(@Query('path') path: string, @Query('lang') lang: string = 'en') {
    return this.seoService.getByPath(path, lang);
  }

  @Get('robots.txt')
  async robots(@Query('siteUrl') siteUrl: string, @Res() res: Response) {
    res.type('text/plain').send(this.seoService.robotsTxt(siteUrl));
  }

  @Get('sitemap')
  sitemap(@Query('siteUrl') siteUrl?: string) {
    return this.seoService.sitemapEntries();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Get('admin/all')
  listAll() {
    return this.seoService.listAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.EDITOR)
  @Post('admin')
  upsert(@Body() dto: UpsertSeoMetaDto) {
    return this.seoService.upsert(dto);
  }
}
