import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInsightArticleDto, UpdateInsightArticleDto } from './dto/insight-article.dto';

@Injectable()
export class InsightsService {
  constructor(private prisma: PrismaService) {}

  async findAllPublic(languageCode = 'en', categorySlug?: string, postType?: string) {
    const rows = await this.prisma.insightArticle.findMany({
      where: {
        isPublished: true,
        category: categorySlug ? { slug: categorySlug } : undefined,
        postType: postType ? postType : undefined,
      },
      orderBy: { publishAt: 'desc' },
      // Fetch the requested language plus English, so an article that
      // hasn't been translated into e.g. Arabic yet still renders (in
      // English) instead of coming back with blank title/excerpt/body.
      include: { translations: { where: { languageCode: { in: [languageCode, 'en'] } } }, category: true },
    });
    return rows.map((a) => this.flatten(a, languageCode));
  }

  async findOnePublic(slug: string, languageCode = 'en') {
    const article = await this.prisma.insightArticle.findUnique({
      where: { slug },
      include: { translations: { where: { languageCode: { in: [languageCode, 'en'] } } }, category: true },
    });
    if (!article || !article.isPublished) throw new NotFoundException('Article not found.');
    return this.flatten(article, languageCode);
  }

  findAllAdmin() {
    return this.prisma.insightArticle.findMany({
      orderBy: { createdAt: 'desc' },
      include: { translations: true, category: true },
    });
  }

  async findOneAdmin(id: string) {
    const article = await this.prisma.insightArticle.findUnique({
      where: { id },
      include: { translations: true, category: true },
    });
    if (!article) throw new NotFoundException('Article not found.');
    return article;
  }

  create(dto: CreateInsightArticleDto) {
    return this.prisma.insightArticle.create({
      data: {
        slug: dto.slug,
        categoryId: dto.categoryId,
        postType: dto.postType ?? 'insight',
        linkedinUrl: dto.linkedinUrl,
        coverImageUrl: dto.coverImageUrl,
        coverImagePosition: dto.coverImagePosition ?? 'center',
        coverVideoUrl: dto.coverVideoUrl,
        isPublished: dto.isPublished ?? false,
        publishAt: dto.publishAt ? new Date(dto.publishAt) : undefined,
        translations: { create: dto.translations },
      },
      include: { translations: true },
    });
  }

  async update(id: string, dto: UpdateInsightArticleDto) {
    await this.findOneAdmin(id);
    return this.prisma.$transaction(async (tx) => {
      if (dto.translations) {
        for (const t of dto.translations) {
          await tx.insightTranslation.upsert({
            where: { articleId_languageCode: { articleId: id, languageCode: t.languageCode } },
            update: t,
            create: { ...t, articleId: id },
          });
        }
      }
      return tx.insightArticle.update({
        where: { id },
        data: {
          slug: dto.slug,
          categoryId: dto.categoryId,
          postType: dto.postType,
          linkedinUrl: dto.linkedinUrl,
          coverImageUrl: dto.coverImageUrl,
          coverImagePosition: dto.coverImagePosition,
          coverVideoUrl: dto.coverVideoUrl,
          isPublished: dto.isPublished,
          publishAt: dto.publishAt ? new Date(dto.publishAt) : undefined,
        },
        include: { translations: true },
      });
    });
  }

  async remove(id: string) {
    await this.findOneAdmin(id);
    await this.prisma.insightArticle.delete({ where: { id } });
    return { deleted: true };
  }

  // Categories — Audit Updates, Tax Updates, VAT Updates, etc.
  listCategories() {
    return this.prisma.insightCategory.findMany({ orderBy: { order: 'asc' } });
  }

  createCategory(slug: string, order = 0) {
    return this.prisma.insightCategory.create({ data: { slug, order } });
  }

  private flatten(article: any, languageCode = 'en') {
    // Prefer the requested language; fall back to English (or whatever
    // translation exists) rather than leaving fields blank.
    const t =
      article.translations.find((tr: any) => tr.languageCode === languageCode) ??
      article.translations.find((tr: any) => tr.languageCode === 'en') ??
      article.translations[0];
    return {
      slug: article.slug,
      category: article.category?.slug,
      postType: article.postType,
      linkedinUrl: article.linkedinUrl || undefined,
      coverImageUrl: article.coverImageUrl,
      coverImagePosition: article.coverImagePosition,
      coverVideoUrl: article.coverVideoUrl,
      publishAt: article.publishAt,
      title: t?.title,
      excerpt: t?.excerpt,
      body: t?.body,
      metaTitle: t?.metaTitle,
      metaDescription: t?.metaDescription,
    };
  }
}
