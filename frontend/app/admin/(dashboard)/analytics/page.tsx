import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";
import AdminIcon from "@/components/admin/AdminIcon";

type Summary = {
  totalViews: number;
  sessions: number;
  todayViews: number;
  yesterdayViews: number;
  viewsByDay: { date: string; count: number }[];
  topPages: { path: string; count: number }[];
  topReferrers: { referrer: string; count: number }[];
  countries: { country: string; count: number }[];
  devices: { device: string; count: number }[];
  browsers: { browser: string; count: number }[];
  entryPages: { path: string; count: number }[];
  exitPages: { path: string; count: number }[];
  topFlows: { from: string; to: string; count: number }[];
};

type LeadInsights = {
  totalLeads: number;
  leadsWithSession: number;
  sessionCoveragePct: number;
  avgPagesBeforeLead: number;
  topEntryPages: { path: string; count: number }[];
  topReferrers: { referrer: string; count: number }[];
  topServices: { service: string; count: number }[];
  insights: string[];
  recentJourneys: {
    leadId: string;
    email: string;
    source: string;
    createdAt: string;
    pagesViewed: number;
    entryPage?: string;
    path: string[];
  }[];
};

// Small country-code → flag emoji helper for the Countries card — purely
// cosmetic, falls back to just the code for anything not in A–Z range.
function flagEmoji(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return "";
  const base = 127397;
  return String.fromCodePoint(...[...code.toUpperCase()].map((c) => base + c.charCodeAt(0)));
}

// A minimal, self-contained horizontal bar list used by the new breakdown
// cards (Countries/Devices/Browsers/Entry/Exit) — same visual language as
// the existing Top Pages/Top Referrers lists, just with a proportional bar
// so relative share is visible at a glance.
function BreakdownList({
  title,
  empty,
  rows,
}: {
  title: string;
  empty: string;
  rows: { label: string; count: number }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="bg-white border border-line rounded-[var(--radius)]">
      <div className="px-6 py-4.5 border-b border-line">
        <h2 className="text-[15px] font-bold text-ink">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <div className="px-6 py-6 text-[13px] text-slate-400">{empty}</div>
      ) : (
        <div className="flex flex-col px-6 py-4 gap-3">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="flex items-center justify-between text-[13px] mb-1">
                <span className="text-ink font-medium truncate mr-3">{r.label}</span>
                <span className="text-slate-500 font-semibold flex-shrink-0">{r.count}</span>
              </div>
              <div className="h-1.5 bg-paper-2 rounded-full overflow-hidden">
                <div className="h-full bg-gold rounded-full" style={{ width: `${(r.count / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Turns a referrer URL into a readable source name — "https://google.com/..."
// becomes "google.com" — so the table reads like a normal "where visitors
// came from" list instead of raw URLs.
function referrerLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: { days?: string };
}) {
  const days = searchParams.days === "7" || searchParams.days === "90" ? searchParams.days : "30";
  const [res, leadInsightsRes] = await Promise.all([
    adminFetch(`/analytics/summary?days=${days}`),
    adminFetch(`/analytics/lead-insights?days=${days}`),
  ]);
  if (res.status === 401) redirect("/admin/login");
  const summary: Summary | null = res.ok ? await res.json() : null;
  const leadInsights: LeadInsights | null = leadInsightsRes.ok ? await leadInsightsRes.json() : null;

  const viewsByDay = summary?.viewsByDay ?? [];
  const maxCount = Math.max(1, ...viewsByDay.map((d) => d.count));
  const change =
    summary && summary.yesterdayViews > 0
      ? Math.round(((summary.todayViews - summary.yesterdayViews) / summary.yesterdayViews) * 100)
      : null;

  return (
    <div className="px-9 py-8">
      <div className="flex items-baseline justify-between mb-1">
        <h1 className="text-2xl font-bold text-ink">Analytics</h1>
      </div>
      <p className="text-[13.5px] text-slate-500 mb-7">
        Page views recorded directly by this site — no Google Analytics or other third-party account needed. Every
        visit to a public page (this admin dashboard isn&apos;t counted) adds one row here.
      </p>

      <div className="flex gap-2 mb-7">
        {(["7", "30", "90"] as const).map((d) => (
          <a
            key={d}
            href={`/admin/analytics?days=${d}`}
            className={`text-[13px] font-semibold px-3.5 py-2 rounded-[var(--radius)] border ${
              days === d ? "bg-navy text-white border-navy" : "border-line text-muted hover:border-ink"
            }`}
          >
            Last {d} days
          </a>
        ))}
      </div>

      {!summary ? (
        <div className="bg-white border border-line px-6 py-8 text-[13.5px] text-slate-400 rounded-[var(--radius)]">
          Couldn&apos;t load analytics right now — try refreshing.
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-px bg-line border border-line mb-7 rounded-[var(--radius)] overflow-hidden">
            <div className="bg-white p-6">
              <div className="flex items-center justify-between">
                <div className="text-[12.5px] text-slate-500 font-semibold">Total Views</div>
                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                  <AdminIcon name="analytics" className="w-[15px] h-[15px]" />
                </div>
              </div>
              <div className="text-[28px] font-bold text-ink mt-2">{summary.totalViews.toLocaleString()}</div>
              <div className="text-[12.5px] text-slate-400 mt-1.5">Last {days} days</div>
            </div>
            <div className="bg-white p-6">
              <div className="flex items-center justify-between">
                <div className="text-[12.5px] text-slate-500 font-semibold">Sessions</div>
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <AdminIcon name="team" className="w-[15px] h-[15px]" />
                </div>
              </div>
              <div className="text-[28px] font-bold text-ink mt-2">{summary.sessions.toLocaleString()}</div>
              <div className="text-[12.5px] text-slate-400 mt-1.5">Distinct visits, last {days} days</div>
            </div>
            <div className="bg-white p-6">
              <div className="flex items-center justify-between">
                <div className="text-[12.5px] text-slate-500 font-semibold">Today</div>
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AdminIcon name="sun" className="w-[15px] h-[15px]" />
                </div>
              </div>
              <div className="text-[28px] font-bold text-ink mt-2">{summary.todayViews.toLocaleString()}</div>
              <div
                className={`text-[12.5px] mt-1.5 font-medium flex items-center gap-1 ${
                  change === null ? "text-slate-400" : change >= 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                {change !== null ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={change < 0 ? "rotate-180" : undefined}>
                    <path d="M5 8.5V1.5M5 1.5L1.5 5M5 1.5L8.5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : null}
                {change === null ? "No data for yesterday yet" : `${change >= 0 ? "+" : ""}${change}% vs. yesterday`}
              </div>
            </div>
            <div className="bg-white p-6">
              <div className="flex items-center justify-between">
                <div className="text-[12.5px] text-slate-500 font-semibold">Yesterday</div>
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                  <AdminIcon name="moon" className="w-[15px] h-[15px]" />
                </div>
              </div>
              <div className="text-[28px] font-bold text-ink mt-2">{summary.yesterdayViews.toLocaleString()}</div>
              <div className="text-[12.5px] text-slate-400 mt-1.5">For comparison</div>
            </div>
          </div>

          {/* Views over time — a plain CSS bar chart, no charting library
              dependency (keeps this project's install simple). */}
          <div className="bg-white border border-line p-6 mb-7 rounded-[var(--radius)]">
            <h2 className="text-[15px] font-bold text-ink mb-5">Views over time</h2>
            {viewsByDay.every((d) => d.count === 0) ? (
              <p className="text-[13.5px] text-slate-400">
                No page views recorded yet — they&apos;ll start appearing as soon as someone visits the public site.
              </p>
            ) : (
              <div className="relative">
                {/* Subtle horizontal gridlines at 0/25/50/75/100% of the tallest bar —
                    gives the eye a reference scale instead of bars floating with
                    nothing to compare against. */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="border-t border-slate-100 w-full" />
                  ))}
                </div>
                <div className="relative flex items-end gap-[2px] h-40">
                  {viewsByDay.map((d) => (
                    <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                      <div
                        className="w-full bg-gold/80 hover:bg-gold rounded-t-[2px] transition-colors"
                        style={{ height: `${Math.max(2, (d.count / maxCount) * 100)}%` }}
                      />
                      <div className="pointer-events-none absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-navy text-white text-[11px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg">
                        {d.date}: {d.count}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-2">
                  <span>{viewsByDay[0]?.date}</span>
                  <span>{viewsByDay[viewsByDay.length - 1]?.date}</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top pages */}
            <div className="bg-white border border-line rounded-[var(--radius)]">
              <div className="px-6 py-4.5 border-b border-line">
                <h2 className="text-[15px] font-bold text-ink">Top Pages</h2>
              </div>
              {summary.topPages.length === 0 ? (
                <div className="px-6 py-6 text-[13px] text-slate-400">No views recorded yet.</div>
              ) : (
                <div className="flex flex-col">
                  {summary.topPages.map((p) => (
                    <div key={p.path} className="flex items-center justify-between px-6 py-3 border-t border-slate-100 first:border-t-0">
                      <span className="text-[13.5px] text-ink font-mono truncate mr-4">{p.path}</span>
                      <span className="text-[13px] text-slate-500 font-semibold flex-shrink-0">{p.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top referrers */}
            <div className="bg-white border border-line rounded-[var(--radius)]">
              <div className="px-6 py-4.5 border-b border-line">
                <h2 className="text-[15px] font-bold text-ink">Top Referrers</h2>
              </div>
              {summary.topReferrers.length === 0 ? (
                <div className="px-6 py-6 text-[13px] text-slate-400">
                  No external referrers yet — visits so far were direct, or from search with no referrer data.
                </div>
              ) : (
                <div className="flex flex-col">
                  {summary.topReferrers.map((r) => (
                    <div key={r.referrer} className="flex items-center justify-between px-6 py-3 border-t border-slate-100 first:border-t-0">
                      <span className="text-[13.5px] text-ink truncate mr-4">{referrerLabel(r.referrer)}</span>
                      <span className="text-[13px] text-slate-500 font-semibold flex-shrink-0">{r.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Where visitors are, and what they're on — this is the "traffic
              and how it flows" breakdown, all derived first-party (no
              GA4/third-party account): country is a client-side timezone
              guess, device/browser are parsed from the request's own
              User-Agent — nothing IP-based is collected anywhere. */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <BreakdownList
              title="Countries"
              empty="No country data yet."
              rows={summary.countries.map((c) => ({ label: `${flagEmoji(c.country)} ${c.country}`.trim(), count: c.count }))}
            />
            <BreakdownList
              title="Devices"
              empty="No device data yet."
              rows={summary.devices.map((d) => ({ label: d.device, count: d.count }))}
            />
            <BreakdownList
              title="Browsers"
              empty="No browser data yet."
              rows={summary.browsers.map((b) => ({ label: b.browser, count: b.count }))}
            />
          </div>

          {/* Entry/exit pages — where a session starts and where it stops,
              the two halves of "how traffic flows" beyond a flat page-view
              count. */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <BreakdownList
              title="Top Entry Pages"
              empty="No session data yet."
              rows={summary.entryPages.map((p) => ({ label: p.path, count: p.count }))}
            />
            <BreakdownList
              title="Top Exit Pages"
              empty="No session data yet."
              rows={summary.exitPages.map((p) => ({ label: p.path, count: p.count }))}
            />
          </div>

          {/* Page-to-page flow — the most common single "A, then B" step a
              visitor's session takes, aggregated across every session in
              the window. */}
          <div className="bg-white border border-line mt-6 rounded-[var(--radius)]">
            <div className="px-6 py-4.5 border-b border-line">
              <h2 className="text-[15px] font-bold text-ink">Traffic Flow</h2>
              <p className="text-[12.5px] text-slate-400 mt-1">Most common next step within a visit.</p>
            </div>
            {summary.topFlows.length === 0 ? (
              <div className="px-6 py-6 text-[13px] text-slate-400">
                Not enough multi-page sessions recorded yet to show a flow.
              </div>
            ) : (
              <div className="flex flex-col">
                {summary.topFlows.map((f) => (
                  <div
                    key={`${f.from}->${f.to}`}
                    className="flex items-center justify-between px-6 py-3 border-t border-slate-100 first:border-t-0"
                  >
                    <span className="text-[13px] text-ink font-mono truncate mr-4">
                      {f.from} <span className="text-slate-400">&rarr;</span> {f.to}
                    </span>
                    <span className="text-[13px] text-slate-500 font-semibold flex-shrink-0">{f.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leads joined back to the browsing session that led up to them
              (Lead.sessionId <-> PageView.sessionId), reduced to a handful
              of auto-generated, plain-English "key insights" — so
              following up doesn't mean cross-referencing this page against
              Admin → Leads by hand. */}
          <div className="bg-white border border-line mt-6 rounded-[var(--radius)]">
            <div className="px-6 py-4.5 border-b border-line">
              <h2 className="text-[15px] font-bold text-ink">Key Insights</h2>
              <p className="text-[12.5px] text-slate-400 mt-1">
                Automatically generated from leads and the browsing sessions that led to them, last {days} days.
              </p>
            </div>
            {!leadInsights || leadInsights.totalLeads === 0 ? (
              <div className="px-6 py-6 text-[13px] text-slate-400">
                No inquiries in this window yet — insights will appear here once the contact form starts receiving them.
              </div>
            ) : (
              <div className="flex flex-col">
                {leadInsights.insights.map((line, i) => (
                  <div key={i} className="flex items-start gap-3 px-6 py-3.5 border-t border-slate-100 first:border-t-0">
                    <span className="text-gold text-[15px] leading-none mt-0.5">&#9679;</span>
                    <span className="text-[13.5px] text-ink leading-relaxed">{line}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {leadInsights && leadInsights.recentJourneys.length > 0 ? (
            <div className="bg-white border border-line mt-6 rounded-[var(--radius)]">
              <div className="px-6 py-4.5 border-b border-line">
                <h2 className="text-[15px] font-bold text-ink">Recent Leads &amp; Their Journeys</h2>
                <p className="text-[12.5px] text-slate-400 mt-1">
                  Each converting visitor&apos;s email, matched to the pages they viewed beforehand — open a lead&apos;s
                  own history from <a href="/admin/leads" className="underline">Leads</a>.
                </p>
              </div>
              <div className="flex flex-col">
                {leadInsights.recentJourneys.map((j) => (
                  <div key={j.leadId} className="px-6 py-3.5 border-t border-slate-100 first:border-t-0">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="text-[13.5px] text-ink font-semibold truncate">{j.email}</span>
                      <span className="text-[12px] text-slate-400 flex-shrink-0">
                        {new Date(j.createdAt).toLocaleDateString()} · {j.source.replace(/_/g, " ")}
                      </span>
                    </div>
                    {j.path.length > 0 ? (
                      <div className="text-[12.5px] text-slate-500 font-mono truncate">
                        {j.path.join(" → ")}
                        <span className="text-slate-400 font-sans ml-2">
                          ({j.pagesViewed} page{j.pagesViewed === 1 ? "" : "s"})
                        </span>
                      </div>
                    ) : (
                      <div className="text-[12.5px] text-slate-400">No page-view trail recorded for this session.</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
