import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertSeoMetaDto } from './dto/seo-meta.dto';

@Injectable()
export class SeoService {
  constructor(private prisma: PrismaService) {}

  // The frontend calls this per-route to populate <head> — meta title,
  // description, canonical URL, OG tags and JSON-LD schema, all admin-set.
  getByPath(path: string, languageCode: string) {
    return this.prisma.seoMeta.findUnique({ where: { path_languageCode: { path, languageCode } } });
  }

  listAll() {
    return this.prisma.seoMeta.findMany({ orderBy: { path: 'asc' } });
  }

  upsert(dto: UpsertSeoMetaDto) {
    const data = { ...dto, schemaJson: dto.schemaJson as Prisma.InputJsonValue | undefined };
    return this.prisma.seoMeta.upsert({
      where: { path_languageCode: { path: dto.path, languageCode: dto.languageCode } },
      update: data,
      create: data,
    });
  }

  // Robots.txt content, served by the frontend or a thin proxy route.
  robotsTxt(siteUrl: string) {
    return `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`;
  }

  // XML sitemap generated from every published, public-facing path this
  // API knows about (SEO records + published services/insights/branches).
  async sitemapEntries() {
    const [seoRows, services, insights, branches] = await Promise.all([
      this.prisma.seoMeta.findMany({ select: { path: true, languageCode: true } }),
      this.prisma.service.findMany({
        where: { isActive: true },
        select: { slug: true, subServices: { where: { isActive: true }, select: { slug: true } } },
      }),
      this.prisma.insightArticle.findMany({ where: { isPublished: true }, select: { slug: true } }),
      this.prisma.branch.findMany({ where: { isActive: true }, select: { city: true } }),
    ]);

    const paths = new Set<string>(seoRows.map((r) => r.path));
    services.forEach((s) => {
      paths.add(`/services/${s.slug}`);
      // A sub-service only gets its own live URL once an admin has given
      // it a slug (see the amber "No slug yet" note on its edit page) —
      // without one, it's still shown on its parent's page but has no
      // page of its own to add here.
      s.subServices.forEach((ss) => {
        if (ss.slug) paths.add(`/services/${s.slug}/${ss.slug}`);
      });
    });
    insights.forEach((a) => paths.add(`/insights/${a.slug}`));
    // Same "<city>-audit-firm" slug the frontend derives in lib/api.ts's
    // branchSlug() — kept in sync by the same simple rule on both sides
    // rather than storing a duplicate slug column.
    branches.forEach((b) => {
      const slug = b.city
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      paths.add(`/${slug}-audit-firm`);
    });

    return Array.from(paths);
  }
}
