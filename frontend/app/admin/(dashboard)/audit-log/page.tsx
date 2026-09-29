import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";
import AuditLogRow from "@/components/admin/AuditLogRow";

const ACTIONS = ["POST", "PATCH", "PUT", "DELETE"];

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: { entityType?: string; action?: string; days?: string; page?: string };
}) {
  const page = Math.max(Number(searchParams.page) || 1, 1);
  const params = new URLSearchParams();
  if (searchParams.entityType) params.set("entityType", searchParams.entityType);
  if (searchParams.action) params.set("action", searchParams.action);
  if (searchParams.days) params.set("days", searchParams.days);
  params.set("page", String(page));
  params.set("pageSize", "50");

  const [res, typesRes] = await Promise.all([
    adminFetch(`/audit-logs?${params.toString()}`),
    adminFetch("/audit-logs/entity-types"),
  ]);
  if (res.status === 401) redirect("/admin/login");
  const data: { items: any[]; total: number; page: number; totalPages: number } = res.ok
    ? await res.json()
    : { items: [], total: 0, page: 1, totalPages: 1 };
  const entityTypes: string[] = typesRes.ok ? await typesRes.json() : [];

  function pageHref(targetPage: number) {
    const p = new URLSearchParams(params);
    p.set("page", String(targetPage));
    return `/admin/audit-log?${p.toString()}`;
  }

  return (
    <div className="px-9 py-8">
      <h1 className="text-2xl font-bold text-ink mb-1">Audit Log</h1>
      <p className="text-[13.5px] text-slate-500 mb-7">
        Every create, update and delete made by a signed-in admin — who, what, and when — most recent first.
        Logged automatically; nothing here needs configuring. Sensitive fields (passwords, verification codes,
        tokens) are never recorded, even when they were part of the original request.
      </p>

      <form method="GET" className="flex flex-wrap items-end gap-4 mb-5 bg-white border border-line p-4">
        <div>
          <label className="block text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Resource</label>
          <select name="entityType" defaultValue={searchParams.entityType ?? ""} className="border border-line px-3 py-2 text-[13.5px] bg-white min-w-[160px]">
            <option value="">All resources</option>
            {entityTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Action</label>
          <select name="action" defaultValue={searchParams.action ?? ""} className="border border-line px-3 py-2 text-[13.5px] bg-white min-w-[140px]">
            <option value="">All actions</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Time range</label>
          <select name="days" defaultValue={searchParams.days ?? ""} className="border border-line px-3 py-2 text-[13.5px] bg-white min-w-[140px]">
            <option value="">All time</option>
            <option value="1">Last 24 hours</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
        <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[13.5px] px-4 py-2 rounded-[var(--radius)]">
          Filter
        </button>
        {searchParams.entityType || searchParams.action || searchParams.days ? (
          <a href="/admin/audit-log" className="text-[13px] font-medium text-slate-500 hover:text-ink">Clear filters</a>
        ) : null}
      </form>

      <div className="bg-white border border-line overflow-x-auto">
        {data.items.length === 0 ? (
          <div className="px-6 py-8 text-[13.5px] text-slate-400">
            No activity logged{searchParams.entityType || searchParams.action || searchParams.days ? " for these filters" : " yet"} —
            it appears here as soon as anyone makes a change in the dashboard.
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left">
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">When</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Who</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Action</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Resource</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Record ID</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((log) => (
                <AuditLogRow key={log.id} log={log} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data.totalPages > 1 ? (
        <div className="flex items-center justify-between mt-4 text-[13px] text-slate-500">
          <span>
            Page {data.page} of {data.totalPages} — {data.total} total {data.total === 1 ? "entry" : "entries"}
          </span>
          <div className="flex gap-2">
            <a
              href={pageHref(Math.max(page - 1, 1))}
              aria-disabled={page <= 1}
              className={`px-3 py-1.5 border border-line rounded-[var(--radius)] ${page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-50"}`}
            >
              ← Newer
            </a>
            <a
              href={pageHref(Math.min(page + 1, data.totalPages))}
              aria-disabled={page >= data.totalPages}
              className={`px-3 py-1.5 border border-line rounded-[var(--radius)] ${page >= data.totalPages ? "pointer-events-none opacity-40" : "hover:bg-slate-50"}`}
            >
              Older →
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
