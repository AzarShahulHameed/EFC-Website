import { redirect } from "next/navigation";
import Link from "next/link";
import { adminFetch } from "@/lib/session";
import { getSiteConfig } from "@/lib/api";
import GreetingBanner from "@/components/admin/GreetingBanner";
import AdminIcon from "@/components/admin/AdminIcon";

const PIPELINE_STAGES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "WON"] as const;

async function fetchJsonOrRedirect(path: string) {
  const res = await adminFetch(path);
  if (res.status === 401) redirect("/admin/login");
  return res.ok ? res.json() : null;
}

export default async function AdminDashboardPage() {
  const [services, pipeline, recentLeads, analytics, me, siteConfig] = await Promise.all([
    fetchJsonOrRedirect("/services/admin/all"),
    fetchJsonOrRedirect("/leads/pipeline-summary"),
    fetchJsonOrRedirect("/leads"),
    fetchJsonOrRedirect("/analytics/summary?days=30"),
    fetchJsonOrRedirect("/auth/me"),
    getSiteConfig(),
  ]);

  const servicesList: any[] = services ?? [];
  const activeServices = servicesList.filter((s) => s.isActive).length;
  const pipelineCounts: Record<string, number> = pipeline ?? {};
  const totalLeads = Object.values(pipelineCounts).reduce((a, b) => a + (b ?? 0), 0);
  const leads: any[] = (recentLeads ?? []).slice(0, 5);
  const totalViews: number | null = analytics?.totalViews ?? null;

  return (
    <div className="px-9 py-8">
      <GreetingBanner name={me?.name} />

      <div className="flex items-baseline justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
          <p className="text-[13.5px] text-slate-500 mt-1.5">Live data from the {siteConfig.name} API.</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line mb-7 rounded-[var(--radius)] overflow-hidden">
        <div className="bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="text-[12.5px] text-slate-500 font-semibold">Total Leads</div>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <AdminIcon name="leads" className="w-[15px] h-[15px]" />
            </div>
          </div>
          <div className="text-[28px] font-bold text-ink mt-2">{totalLeads}</div>
          <div className="text-[12.5px] text-slate-400 mt-1.5">All-time, from /leads</div>
        </div>
        <div className="bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="text-[12.5px] text-slate-500 font-semibold">New Leads</div>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <AdminIcon name="bell" className="w-[15px] h-[15px]" />
            </div>
          </div>
          <div className="text-[28px] font-bold text-ink mt-2">{pipelineCounts.NEW ?? 0}</div>
          <div className="text-[12.5px] text-slate-400 mt-1.5">Awaiting first contact</div>
        </div>
        <div className="bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="text-[12.5px] text-slate-500 font-semibold">Active Services</div>
            <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
              <AdminIcon name="services" className="w-[15px] h-[15px]" />
            </div>
          </div>
          <div className="text-[28px] font-bold text-ink mt-2">{activeServices}</div>
          <div className="text-[12.5px] text-slate-400 mt-1.5">{servicesList.length - activeServices} disabled</div>
        </div>
        <div className="bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="text-[12.5px] text-slate-500 font-semibold">Website Views</div>
            <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <AdminIcon name="analytics" className="w-[15px] h-[15px]" />
            </div>
          </div>
          <div className={`text-[28px] font-bold mt-2 ${totalViews === null ? "text-slate-300" : "text-ink"}`}>
            {totalViews === null ? "—" : totalViews.toLocaleString()}
          </div>
          <Link href="/admin/analytics" className="text-[12.5px] text-slate-400 mt-1.5 hover:text-ink block">
            Last 30 days — view details &rarr;
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-6 mb-6">
        {/* Recent leads */}
        <div className="bg-white border border-line overflow-x-auto rounded-[var(--radius)]">
          <div className="px-6 py-4.5 border-b border-line flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-ink">Recent Leads</h2>
            <Link href="/admin/leads" className="text-[12.5px] font-semibold text-slate-500">
              View all &rarr;
            </Link>
          </div>
          {leads.length === 0 ? (
            <div className="px-6 py-8 text-[13.5px] text-slate-400">
              No leads yet — they&apos;ll appear here as soon as someone submits the contact form.
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left">
                  <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Name</th>
                  <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Source</th>
                  <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Received</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className="border-t border-slate-100">
                    <td className="px-6 py-3.5 text-[13.5px] text-ink font-medium">{lead.name}</td>
                    <td className="px-6 py-3.5 text-[13px] text-muted">{lead.source}</td>
                    <td className="px-6 py-3.5 text-[13px] text-muted">{lead.status}</td>
                    <td className="px-6 py-3.5 text-[13px] text-slate-400">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white border border-line p-5.5 h-fit rounded-[var(--radius)]">
          <h2 className="text-sm font-bold text-ink mb-3.5">Quick Actions</h2>
          <div className="flex flex-col gap-2">
            <Link
              href="/admin/content"
              className="bg-slate-50 border border-line px-3.5 py-2.5 text-[13px] font-medium text-ink rounded"
            >
              Edit Homepage Content
            </Link>
            <Link
              href="/admin/services"
              className="bg-slate-50 border border-line px-3.5 py-2.5 text-[13px] font-medium text-ink rounded"
            >
              Manage Services
            </Link>
            <Link
              href="/admin/team"
              className="bg-slate-50 border border-line px-3.5 py-2.5 text-[13px] font-medium text-ink rounded"
            >
              Add Team Member
            </Link>
            <Link
              href="/admin/leads"
              className="bg-slate-50 border border-line px-3.5 py-2.5 text-[13px] font-medium text-ink rounded"
            >
              Review Leads
            </Link>
          </div>
        </div>
      </div>

      {/* Leads pipeline */}
      <div className="bg-white border border-line p-6 rounded-[var(--radius)]">
        <div className="flex items-center justify-between mb-4.5">
          <h2 className="text-[15px] font-bold text-ink">Leads Pipeline</h2>
          <Link href="/admin/leads" className="text-[12.5px] font-semibold text-slate-500">
            Open CRM &rarr;
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {PIPELINE_STAGES.map((stage) => (
            <div key={stage} className="bg-slate-50 border border-line p-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {stage.replace("_", " ")}
              </div>
              <div className="text-[22px] font-bold text-ink mt-2">{pipelineCounts[stage] ?? 0}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
