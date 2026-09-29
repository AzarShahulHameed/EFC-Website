import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";

export default async function AdminNewsletterPage() {
  const res = await adminFetch("/newsletter/admin/all");
  if (res.status === 401) redirect("/admin/login");
  const subscribers: { id: string; email: string; createdAt: string }[] = res.ok ? await res.json() : [];

  function exportCsv() {
    const rows = ["Email,Subscribed"];
    for (const s of subscribers) rows.push(`${s.email},${new Date(s.createdAt).toISOString()}`);
    return rows.join("\n");
  }

  return (
    <div className="px-9 py-8">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-ink">Newsletter Subscribers</h1>
        {subscribers.length > 0 ? (
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(exportCsv())}`}
            download="newsletter-subscribers.csv"
            className="border border-line text-ink font-semibold text-[13px] px-4 py-2 rounded-[var(--radius)]"
          >
            Export CSV
          </a>
        ) : null}
      </div>
      <p className="text-[13.5px] text-slate-500 mb-7">
        Everyone who signed up through the footer&apos;s &ldquo;Stay Informed&rdquo; form, most recent first.
      </p>

      <div className="bg-white border border-line overflow-x-auto">
        {subscribers.length === 0 ? (
          <div className="px-6 py-8 text-[13.5px] text-slate-400">
            No subscribers yet — they&apos;ll appear here as soon as someone signs up from the footer.
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left">
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Email</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Subscribed</th>
              </tr>
            </thead>
            <tbody>
              {[...subscribers]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((s) => (
                  <tr key={s.id} className="border-t border-slate-100">
                    <td className="px-6 py-3.5 text-[13.5px] text-ink font-medium">{s.email}</td>
                    <td className="px-6 py-3.5 text-[13px] text-slate-400 whitespace-nowrap">
                      {new Date(s.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
