import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecordPageViewDto } from './dto/record-pageview.dto';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // Fire-and-forget from the public site (see
  // sterling-vance-web/components/site/PageViewTracker.tsx) — never throws
  // in a way that would surface to a visitor; the controller just returns
  // 201 either way as far as the browser's concerned.
  record(dto: RecordPageViewDto, device: string, browser: string) {
    return this.prisma.pageView.create({
      data: {
        path: dto.path,
        languageCode: dto.languageCode ?? 'en',
        referrer: dto.referrer || null,
        sessionId: dto.sessionId || null,
        country: dto.country || null,
        device,
        browser,
      },
    });
  }

  // Powers Admin → Analytics. `days` controls the trend window (default 30).
  //
  // Every date computation in here deliberately uses the *UTC* Date methods
  // (setUTCDate/setUTCHours, not setDate/setHours) end to end. Each
  // PageView's `createdAt` is stored as a real UTC instant, and day buckets
  // are keyed by `.toISOString().slice(0, 10)` (also UTC). Mixing in a
  // local-timezone method anywhere in that chain — as this used to do for
  // `since` — shifts that one date by a day on any server whose system
  // timezone isn't UTC (e.g. running the API locally in a UTC+4 timezone
  // shifts local midnight back to 20:00 the previous UTC day), silently
  // misaligning the buckets from the actual rows and making the "Yesterday"
  // stat (and any day near the edge of the trend window) read as 0 even
  // with real traffic recorded for that day.
  async summary(days = 30) {
    const startOfTodayUTC = new Date();
    startOfTodayUTC.setUTCHours(0, 0, 0, 0);
    const since = new Date(startOfTodayUTC);
    since.setUTCDate(since.getUTCDate() - (days - 1));

    const [
      totalViews,
      topPagesRaw,
      topReferrersRaw,
      countriesRaw,
      devicesRaw,
      browsersRaw,
      rowsForTrend,
      sessionRows,
    ] = await Promise.all([
      this.prisma.pageView.count({ where: { createdAt: { gte: since } } }),
      this.prisma.pageView.groupBy({
        by: ['path'],
        where: { createdAt: { gte: since } },
        _count: { path: true },
        orderBy: { _count: { path: 'desc' } },
        take: 10,
      }),
      this.prisma.pageView.groupBy({
        by: ['referrer'],
        where: { createdAt: { gte: since }, referrer: { not: null } },
        _count: { referrer: true },
        orderBy: { _count: { referrer: 'desc' } },
        take: 8,
      }),
      this.prisma.pageView.groupBy({
        by: ['country'],
        where: { createdAt: { gte: since }, country: { not: null } },
        _count: { country: true },
        orderBy: { _count: { country: 'desc' } },
        take: 12,
      }),
      this.prisma.pageView.groupBy({
        by: ['device'],
        where: { createdAt: { gte: since }, device: { not: null } },
        _count: { device: true },
        orderBy: { _count: { device: 'desc' } },
      }),
      this.prisma.pageView.groupBy({
        by: ['browser'],
        where: { createdAt: { gte: since }, browser: { not: null } },
        _count: { browser: true },
        orderBy: { _count: { browser: 'desc' } },
        take: 8,
      }),
      this.prisma.pageView.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      // Entry/exit pages and page-to-page flow all come from ordering each
      // session's own rows — there's no single groupBy for "first/last row
      // per group" that works the same across databases, so (matching the
      // day-bucketing above) this is fetched raw and walked in JS. Capped
      // so a very high-traffic window can't pull an unbounded result set.
      this.prisma.pageView.findMany({
        where: { createdAt: { gte: since }, sessionId: { not: null } },
        select: { sessionId: true, path: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
        take: 20000,
      }),
    ]);

    // Bucket into one count per calendar day so the dashboard can draw a
    // simple bar chart — done in JS rather than a raw SQL date_trunc so
    // this doesn't assume a specific database engine.
    const dayBuckets = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setUTCDate(d.getUTCDate() + i);
      dayBuckets.set(d.toISOString().slice(0, 10), 0);
    }
    for (const row of rowsForTrend) {
      const key = row.createdAt.toISOString().slice(0, 10);
      if (dayBuckets.has(key)) dayBuckets.set(key, (dayBuckets.get(key) ?? 0) + 1);
    }

    const today = startOfTodayUTC.toISOString().slice(0, 10);
    const startOfYesterdayUTC = new Date(startOfTodayUTC);
    startOfYesterdayUTC.setUTCDate(startOfYesterdayUTC.getUTCDate() - 1);
    const yesterday = startOfYesterdayUTC.toISOString().slice(0, 10);

    // Group session rows by sessionId (rows already arrive ordered by
    // createdAt) to get each session's ordered page sequence, then derive
    // entry page, exit page, and every consecutive A → B transition.
    const sessions = new Map<string, string[]>();
    for (const row of sessionRows) {
      const sid = row.sessionId as string;
      const list = sessions.get(sid);
      if (list) list.push(row.path);
      else sessions.set(sid, [row.path]);
    }
    const entryCounts = new Map<string, number>();
    const exitCounts = new Map<string, number>();
    const flowCounts = new Map<string, number>();
    for (const pages of sessions.values()) {
      entryCounts.set(pages[0], (entryCounts.get(pages[0]) ?? 0) + 1);
      exitCounts.set(pages[pages.length - 1], (exitCounts.get(pages[pages.length - 1]) ?? 0) + 1);
      for (let i = 0; i < pages.length - 1; i++) {
        if (pages[i] === pages[i + 1]) continue; // ignore same-page re-renders/refreshes
        const key = `${pages[i]} -> ${pages[i + 1]}`;
        flowCounts.set(key, (flowCounts.get(key) ?? 0) + 1);
      }
    }
    const topN = (map: Map<string, number>, n: number) =>
      Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([key, count]) => ({ key, count }));

    return {
      totalViews,
      sessions: sessions.size,
      todayViews: dayBuckets.get(today) ?? 0,
      yesterdayViews: dayBuckets.get(yesterday) ?? 0,
      viewsByDay: Array.from(dayBuckets.entries()).map(([date, count]) => ({ date, count })),
      topPages: topPagesRaw.map((r) => ({ path: r.path, count: r._count.path })),
      topReferrers: topReferrersRaw.map((r) => ({ referrer: r.referrer as string, count: r._count.referrer })),
      countries: countriesRaw.map((r) => ({ country: r.country as string, count: r._count.country })),
      devices: devicesRaw.map((r) => ({ device: r.device as string, count: r._count.device })),
      browsers: browsersRaw.map((r) => ({ browser: r.browser as string, count: r._count.browser })),
      entryPages: topN(entryCounts, 8).map(({ key, count }) => ({ path: key, count })),
      exitPages: topN(exitCounts, 8).map(({ key, count }) => ({ path: key, count })),
      topFlows: topN(flowCounts, 10).map(({ key, count }) => {
        const [from, to] = key.split(' -> ');
        return { from, to, count };
      }),
    };
  }

  // Joins converted leads back to the page-view trail their analytics
  // sessionId ties them to (see Lead.sessionId / PageView.sessionId), then
  // reduces that into a handful of plain-English "key insights" so an
  // admin doesn't have to cross-reference the Leads and Analytics screens
  // by hand — "which pages actually turn a visitor into an inquiry".
  async leadInsights(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const leads = await this.prisma.lead.findMany({
      where: { createdAt: { gte: since } },
      select: { id: true, email: true, sessionId: true, serviceOfInterest: true, source: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    const totalLeads = leads.length;
    const leadsWithSession = leads.filter((l) => l.sessionId);
    const sessionIds = leadsWithSession.map((l) => l.sessionId as string);

    // One query for every converting session's ordered page trail, then
    // grouped in JS — same approach as summary()'s flow/entry-page logic
    // above, for the same cross-database reason.
    const pageViews = sessionIds.length
      ? await this.prisma.pageView.findMany({
          where: { sessionId: { in: sessionIds } },
          select: { sessionId: true, path: true, referrer: true, createdAt: true },
          orderBy: { createdAt: 'asc' },
        })
      : [];

    const bySession = new Map<string, { path: string; referrer: string | null }[]>();
    for (const pv of pageViews) {
      const sid = pv.sessionId as string;
      const list = bySession.get(sid);
      if (list) list.push({ path: pv.path, referrer: pv.referrer });
      else bySession.set(sid, [{ path: pv.path, referrer: pv.referrer }]);
    }

    const entryCounts = new Map<string, number>();
    const referrerCounts = new Map<string, number>();
    let pagesBeforeLeadTotal = 0;
    let convertingSessionsWithTrail = 0;

    // Per-lead journey summary, most recent first, for a "Recent Leads &
    // Their Journeys" list on the Analytics page.
    const leadJourneys = leadsWithSession.map((lead) => {
      const trail = bySession.get(lead.sessionId as string) ?? [];
      if (trail.length > 0) {
        convertingSessionsWithTrail += 1;
        pagesBeforeLeadTotal += trail.length;
        entryCounts.set(trail[0].path, (entryCounts.get(trail[0].path) ?? 0) + 1);
        const firstReferrer = trail.find((p) => p.referrer)?.referrer;
        if (firstReferrer) referrerCounts.set(firstReferrer, (referrerCounts.get(firstReferrer) ?? 0) + 1);
      }
      return {
        leadId: lead.id,
        email: lead.email,
        source: lead.source,
        createdAt: lead.createdAt,
        pagesViewed: trail.length,
        entryPage: trail[0]?.path,
        path: trail.map((p) => p.path),
      };
    });

    const serviceCounts = new Map<string, number>();
    for (const lead of leads) {
      if (lead.serviceOfInterest) serviceCounts.set(lead.serviceOfInterest, (serviceCounts.get(lead.serviceOfInterest) ?? 0) + 1);
    }

    const topN = (map: Map<string, number>, n: number) =>
      Array.from(map.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([key, count]) => ({ key, count }));

    const topEntryPages = topN(entryCounts, 5);
    const topReferrers = topN(referrerCounts, 5);
    const topServices = topN(serviceCounts, 5);
    const avgPagesBeforeLead = convertingSessionsWithTrail > 0 ? pagesBeforeLeadTotal / convertingSessionsWithTrail : 0;
    const sessionCoveragePct = totalLeads > 0 ? Math.round((leadsWithSession.length / totalLeads) * 100) : 0;

    // The auto-generated "key insight" sentences — plain language, only
    // included when there's enough data behind them to say something
    // meaningful (an empty window or an all-WhatsApp period without a
    // session shouldn't produce a hollow/misleading insight).
    const insights: string[] = [];
    if (totalLeads > 0) {
      insights.push(
        `${sessionCoveragePct}% of the last ${days} days' leads (${leadsWithSession.length} of ${totalLeads}) have a tracked browsing session, so their page-by-page journey is visible below.`,
      );
    }
    if (avgPagesBeforeLead > 0) {
      insights.push(`Visitors who convert view an average of ${avgPagesBeforeLead.toFixed(1)} pages before submitting an inquiry.`);
    }
    if (topEntryPages.length > 0) {
      insights.push(`The page that most often starts a converting visit is "${topEntryPages[0].key}" (${topEntryPages[0].count} lead${topEntryPages[0].count === 1 ? '' : 's'}).`);
    }
    if (topReferrers.length > 0) {
      insights.push(`The top traffic source behind converting visitors is ${topReferrers[0].key} (${topReferrers[0].count} lead${topReferrers[0].count === 1 ? '' : 's'}).`);
    }
    if (topServices.length > 0) {
      insights.push(`The most requested service among recent leads is "${topServices[0].key}" (${topServices[0].count} lead${topServices[0].count === 1 ? '' : 's'}).`);
    }
    if (totalLeads > 0 && leadsWithSession.length === 0) {
      insights.push('No recent lead carries a browsing session yet — this rolls out going forward, so today\'s and tomorrow\'s inquiries should start showing a journey here.');
    }

    return {
      totalLeads,
      leadsWithSession: leadsWithSession.length,
      sessionCoveragePct,
      avgPagesBeforeLead,
      topEntryPages: topEntryPages.map(({ key, count }) => ({ path: key, count })),
      topReferrers: topReferrers.map(({ key, count }) => ({ referrer: key, count })),
      topServices: topServices.map(({ key, count }) => ({ service: key, count })),
      insights,
      recentJourneys: leadJourneys.slice(0, 15),
    };
  }
}
