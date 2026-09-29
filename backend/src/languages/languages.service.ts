import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TranslateSettingsService } from '../settings/translate-settings.service';
import { UpsertContentBlockDto, UpsertLanguageDto, UpsertTranslationDto } from './dto/languages.dto';

@Injectable()
export class LanguagesService {
  constructor(
    private prisma: PrismaService,
    private translateSettings: TranslateSettingsService,
  ) {}

  // --- Auto-translate (Google Cloud Translation API v2) ---
  //
  // Called from every "Auto-translate" button across the admin dashboard
  // (Insights, Services, Team, Testimonials edit screens) to fill in a
  // non-English translation from the English content in one click, which
  // the admin can then review/edit before saving — never saved directly
  // without a human looking at it first. Also called automatically right
  // after an English save to fill in any language that has no translation
  // row yet at all (see each entity service's `update()` — e.g.
  // services.service.ts — for that auto-fill-on-save call), without ever
  // overwriting a translation an admin has already reviewed or hand-edited.
  //
  // Uses the simple API-key REST endpoint (not the gRPC/service-account
  // client) since that's all a single API key needs — the key itself is
  // admin-configurable (Admin → Translate Settings) rather than
  // .env-only, via TranslateSettingsService, which falls back to
  // GOOGLE_TRANSLATE_API_KEY in .env if nothing's been saved there yet.
  // Splits the request into an HTML-format call (for RichTextField values,
  // so markup like bold/color survives) and a plain-text call (for titles,
  // excerpts, etc.), each sent as one batched request to Google rather than
  // one request per field. `source` identifies which admin screen (or
  // "auto-on-save") triggered this, purely for the usage KPI breakdown.
  async translateBatch(texts: Record<string, string>, targetLanguage: string, htmlKeys: string[] = [], source = 'manual') {
    const { apiKey } = await this.translateSettings.get();
    if (!apiKey) {
      throw new BadRequestException(
        'The Google Translate API key isn\'t set yet — add it in Admin → Translate Settings (or GOOGLE_TRANSLATE_API_KEY in the API\'s .env as a fallback).',
      );
    }

    const entries = Object.entries(texts ?? {}).filter(([, v]) => typeof v === 'string' && v.trim().length > 0);
    if (entries.length === 0) return {};

    const htmlSet = new Set(htmlKeys ?? []);
    const groups: Array<[string, [string, string][]]> = [
      ['html', entries.filter(([k]) => htmlSet.has(k))],
      ['text', entries.filter(([k]) => !htmlSet.has(k))],
    ];

    const result: Record<string, string> = {};
    let charCount = 0;
    for (const [format, group] of groups) {
      if (group.length === 0) continue;
      const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: group.map(([, value]) => value),
          target: targetLanguage,
          source: 'en',
          format,
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new BadRequestException(`Google Translate API error (${res.status}): ${body || res.statusText}`);
      }
      const json: any = await res.json();
      const translations = json?.data?.translations ?? [];
      group.forEach(([key, value], i) => {
        result[key] = translations[i]?.translatedText ?? group[i][1];
        charCount += value.length;
      });
    }
    // Best-effort — logging the KPI number should never be the reason an
    // otherwise-successful translation fails to return.
    await this.translateSettings.logUsage(charCount, targetLanguage, source).catch(() => undefined);
    return result;
  }

  // --- Languages (EN / AR / FR / HI) ---

  listLanguages() {
    return this.prisma.language.findMany({ where: { isActive: true } });
  }

  listAllLanguages() {
    return this.prisma.language.findMany();
  }

  upsertLanguage(dto: UpsertLanguageDto) {
    return this.prisma.language.upsert({
      where: { code: dto.code },
      update: dto,
      create: { ...dto, isRTL: dto.isRTL ?? false, isActive: dto.isActive ?? true, isDefault: dto.isDefault ?? false },
    });
  }

  // --- Generic UI-string translations (buttons, errors, nav labels) ---

  async getTranslations(languageCode: string) {
    const rows = await this.prisma.translation.findMany({ where: { languageCode } });
    return rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {} as Record<string, string>);
  }

  upsertTranslation(dto: UpsertTranslationDto) {
    return this.prisma.translation.upsert({
      where: { key_languageCode: { key: dto.key, languageCode: dto.languageCode } },
      update: { value: dto.value },
      create: dto,
    });
  }

  // --- Content blocks (hero, stats, trust strip, CTA bands, etc.) ---

  async getContentBlock(page: string, section: string, languageCode: string) {
    const block = await this.prisma.contentBlock.findUnique({
      where: { page_section_languageCode: { page, section, languageCode } },
    });
    return block?.data ?? null;
  }

  async getPageContent(page: string, languageCode: string) {
    const blocks = await this.prisma.contentBlock.findMany({
      where: { page, languageCode, isPublished: true },
    });
    return blocks.reduce((acc, b) => ({ ...acc, [b.section]: b.data }), {} as Record<string, unknown>);
  }

  upsertContentBlock(dto: UpsertContentBlockDto, updatedById?: string) {
    const data = dto.data as Prisma.InputJsonValue;
    return this.prisma.contentBlock.upsert({
      where: {
        page_section_languageCode: { page: dto.page, section: dto.section, languageCode: dto.languageCode },
      },
      update: { data, isPublished: dto.isPublished ?? true, updatedById },
      create: { ...dto, data, isPublished: dto.isPublished ?? true, updatedById },
    });
  }
}
