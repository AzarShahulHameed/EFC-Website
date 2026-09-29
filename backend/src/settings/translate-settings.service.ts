import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateTranslateSettingsDto } from './dto/translate-settings.dto';

export type ResolvedTranslateSettings = {
  apiKey?: string | null;
  source: 'db' | 'env';
};

// Google Cloud Translation (Basic, v2 REST) "Basic" tier pricing as of this
// integration: $20 per 1,000,000 characters, with the first 500,000
// characters each month free. Used only to show a rough cost *estimate* on
// the KPI panel — Google's actual bill depends on the calendar-month free
// tier and any negotiated pricing, so this is clearly labelled an estimate,
// never presented as an invoice figure.
export const GOOGLE_TRANSLATE_PRICE_PER_MILLION_CHARS = 20;
export const GOOGLE_TRANSLATE_FREE_CHARS_PER_MONTH = 500_000;

@Injectable()
export class TranslateSettingsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  // The actual key, for LanguagesService.translateBatch() to call Google
  // with — never exposed directly over HTTP (see getForAdmin()). Falls back
  // to .env if nothing's been saved from the admin dashboard yet, so an
  // existing GOOGLE_TRANSLATE_API_KEY-configured deployment keeps working
  // unchanged after this upgrade.
  async get(): Promise<ResolvedTranslateSettings> {
    const row = await this.prisma.translateSettings.findUnique({ where: { id: 'default' } });
    if (row?.apiKey) return { apiKey: row.apiKey, source: 'db' };
    return { apiKey: this.config.get<string>('GOOGLE_TRANSLATE_API_KEY'), source: 'env' };
  }

  // Client-safe view for the Admin → Translate Settings screen: the key
  // itself is masked, never round-tripped back to the browser.
  async getForAdmin() {
    const settings = await this.get();
    return {
      apiKeySet: Boolean(settings.apiKey),
      source: settings.source,
      configured: Boolean(settings.apiKey),
    };
  }

  async update(dto: UpdateTranslateSettingsDto) {
    const existing = await this.prisma.translateSettings.findUnique({ where: { id: 'default' } });
    // Blank means "leave unchanged" — same reasoning as
    // EmailSettingsService.update()'s smtpPass/resendApiKey handling.
    const apiKey = dto.apiKey && dto.apiKey.length > 0 ? dto.apiKey : existing?.apiKey;
    return this.prisma.translateSettings.upsert({
      where: { id: 'default' },
      update: { apiKey },
      create: { id: 'default', apiKey },
    });
  }

  // KPI panel data: totals plus a per-language and per-source breakdown, and
  // the most recent calls so an admin can sanity-check what's actually
  // triggering translation traffic. Character counts are summed straight
  // from TranslationUsageLog rows written by translateBatch() after every
  // successful Google Translate call.
  async getUsage() {
    // Google's 500,000-character free tier resets every calendar month —
    // it is NOT a one-time, all-time allowance. This used to sum every
    // TranslationUsageLog row ever written and subtract the free tier from
    // that all-time total, which only looked right for the first month:
    // from the second month on, a site that translated, say, 600K
    // characters total in month one and then nothing at all in month two
    // would still show ~$2 of "estimated" cost in month two, because the
    // all-time total (600K) still exceeded the free tier — with no actual
    // usage that month. Scoping every query below to the current calendar
    // month (UTC, matching how Google's own billing cycle resets) is what
    // makes this estimate track an admin's real monthly bill.
    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const monthFilter = { createdAt: { gte: monthStart } };

    const [totals, byLanguage, bySource, recent, allTimeTotals] = await Promise.all([
      this.prisma.translationUsageLog.aggregate({ where: monthFilter, _sum: { charCount: true }, _count: { _all: true } }),
      this.prisma.translationUsageLog.groupBy({
        by: ['languageCode'],
        where: monthFilter,
        _sum: { charCount: true },
        _count: { _all: true },
        orderBy: { _sum: { charCount: 'desc' } },
      }),
      this.prisma.translationUsageLog.groupBy({
        by: ['source'],
        where: monthFilter,
        _sum: { charCount: true },
        _count: { _all: true },
        orderBy: { _sum: { charCount: 'desc' } },
      }),
      // "Recent calls" is a diagnostic log, not a billing figure, so it
      // deliberately isn't month-scoped — an admin checking "what just
      // triggered translation traffic" wants to see it even a minute after
      // a month boundary ticked over.
      this.prisma.translationUsageLog.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
      this.prisma.translationUsageLog.aggregate({ _sum: { charCount: true }, _count: { _all: true } }),
    ]);

    const monthChars = totals._sum.charCount ?? 0;
    const billableChars = Math.max(0, monthChars - GOOGLE_TRANSLATE_FREE_CHARS_PER_MONTH);
    const estimatedCostUsd = Math.round((billableChars / 1_000_000) * GOOGLE_TRANSLATE_PRICE_PER_MILLION_CHARS * 100) / 100;

    return {
      // "This month" is the figure the free-tier/cost estimate is actually
      // based on — the field names stay as `totalCharacters`/`totalRequests`
      // (what the admin UI already reads) but now mean "this month", with
      // the true all-time figures added alongside under their own names so
      // nothing existing breaks and the lifetime total is still visible.
      totalCharacters: monthChars,
      totalRequests: totals._count._all,
      allTimeCharacters: allTimeTotals._sum.charCount ?? 0,
      allTimeRequests: allTimeTotals._count._all,
      billingPeriodStart: monthStart.toISOString(),
      estimatedCostUsd,
      pricePerMillionChars: GOOGLE_TRANSLATE_PRICE_PER_MILLION_CHARS,
      freeCharsPerMonth: GOOGLE_TRANSLATE_FREE_CHARS_PER_MONTH,
      byLanguage: byLanguage.map((row) => ({
        languageCode: row.languageCode,
        characters: row._sum.charCount ?? 0,
        requests: row._count._all,
      })),
      bySource: bySource.map((row) => ({
        source: row.source,
        characters: row._sum.charCount ?? 0,
        requests: row._count._all,
      })),
      recent: recent.map((row) => ({
        id: row.id,
        charCount: row.charCount,
        languageCode: row.languageCode,
        source: row.source,
        createdAt: row.createdAt,
      })),
    };
  }

  async logUsage(charCount: number, languageCode: string, source: string) {
    if (charCount <= 0) return;
    await this.prisma.translationUsageLog.create({ data: { charCount, languageCode, source } });
  }
}
