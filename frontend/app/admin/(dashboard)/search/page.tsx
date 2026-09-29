import { redirect } from "next/navigation";
import Link from "next/link";
import { adminFetch } from "@/lib/session";

type Hit = { type: string; title: string; sub?: string; href: string };

function matches(q: string, ...fields: (string | undefined | null)[]) {
  const needle = q.toLowerCase();
  return fields.some((f) => f && f.toLowerCase().includes(needle));
}

export default async function AdminSearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim();

  if (!q) {
    return (
      <div className="px-9 py-8">
        <h1 className="text-2xl font-bold text-ink mb-1">Search</h1>
        <p className="text-[13.5px] text-slate-500">Type something into the search box at the top to look across services, team, branches, leads and insights.</p>
      </div>
    );
  }

  // Fan out to the admin list endpoints already used by each section's own
  // page and filter client-side — there's no dedicated search endpoint on
  // the API yet, and the admin dataset is small enough that this is fast
  // and needs no new backend work.
  const [servicesRes, teamRes, branchesRes, leadsRes, insightsRes, testimonialsRes] = await Promise.all([
    adminFetch("/services/admin/all"),
    adminFetch("/team/admin/all"),
    adminFetch("/branches/admin/all"),
    adminFetch("/leads"),
    adminFetch("/insights/admin/all"),
    adminFetch("/testimonials/admin/all"),
  ]);
  if ([servicesRes, teamRes, branchesRes, leadsRes, insightsRes, testimonialsRes].some((r) => r.status === 401)) {
    redirect("/admin/login");
  }

  const hits: Hit[] = [];

  if (servicesRes.ok) {
    const services: any[] = await servicesRes.json();
    for (const s of services) {
      const t = s.translations?.find((tr: any) => tr.languageCode === "en") ?? s.translations?.[0];
      if (matches(q, t?.title, s.slug)) {
        hits.push({ type: "Service", title: t?.title ?? s.slug, sub: s.slug, href: `/admin/services/${s.id}/edit` });
      }
    }
  }
  if (teamRes.ok) {
    const team: any[] = await teamRes.json();
    for (const m of team) {
      if (matches(q, m.name, m.qualification)) {
        hits.push({ type: "Team", title: m.name, sub: m.qualification ?? undefined, href: `/admin/team/${m.id}/edit` });
      }
    }
  }
  if (branchesRes.ok) {
    const branches: any[] = await branchesRes.json();
    for (const b of branches) {
      if (matches(q, b.city, b.addressLine, b.email)) {
        hits.push({ type: "Branch", title: b.city, sub: b.addressLine, href: `/admin/branches/${b.id}/edit` });
      }
    }
  }
  if (leadsRes.ok) {
    const leads: any[] = await leadsRes.json();
    for (const l of leads) {
      if (matches(q, l.name, l.email, l.company)) {
        hits.push({ type: "Lead", title: l.name, sub: l.email, href: `/admin/leads` });
      }
    }
  }
  if (insightsRes.ok) {
    const insights: any[] = await insightsRes.json();
    for (const a of insights) {
      const t = a.translations?.find((tr: any) => tr.languageCode === "en") ?? a.translations?.[0];
      if (matches(q, t?.title, a.slug)) {
        hits.push({ type: "Insight", title: t?.title ?? a.slug, sub: a.slug, href: `/admin/insights/${a.id}/edit` });
      }
    }
  }
  if (testimonialsRes.ok) {
    const testimonials: any[] = await testimonialsRes.json();
    for (const t of testimonials) {
      const tr = t.translations?.find((x: any) => x.languageCode === "en") ?? t.translations?.[0];
      if (matches(q, t.clientName, tr?.quote)) {
        hits.push({ type: "Testimonial", title: t.clientName, sub: tr?.quote?.slice(0, 60), href: `/admin/testimonials` });
      }
    }
  }

  return (
    <div className="px-9 py-8">
      <h1 className="text-2xl font-bold text-ink mb-1">Search results for &ldquo;{q}&rdquo;</h1>
      <p className="text-[13.5px] text-slate-500 mb-7">{hits.length} match{hits.length === 1 ? "" : "es"} across services, team, branches, leads, insights and testimonials.</p>

      {hits.length === 0 ? (
        <div className="bg-white border border-line px-6 py-8 text-[13.5px] text-slate-400">
          Nothing found for &ldquo;{q}&rdquo;. Try a different word, or check the specific section in the sidebar.
        </div>
      ) : (
        <div className="bg-white border border-line max-w-2xl">
          {hits.map((h, i) => (
            <Link
              key={`${h.type}-${i}`}
              href={h.href}
              className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
            >
              <div className="min-w-0">
                <div className="text-[14px] text-ink font-medium truncate">{h.title}</div>
                {h.sub ? <div className="text-[12.5px] text-slate-500 truncate">{h.sub}</div> : null}
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 flex-shrink-0">{h.type}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
