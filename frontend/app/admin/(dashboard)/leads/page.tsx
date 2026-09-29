import { Fragment } from "react";
import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";
import { updateLeadStatusAction } from "@/lib/admin-actions";

const STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "WON", "LOST"];

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: { error?: string; saved?: string };
}) {
  const res = await adminFetch("/leads");
  if (res.status === 401) redirect("/admin/login");
  const leads: any[] = res.ok ? await res.json() : [];

  // Every lead's contact info plus `exitPage` — the last page their own
  // browser session viewed before they left (see LeadsService.withExitPages
  // on the API side) — as a ready-to-upload list for an ad platform's
  // custom-audience import or an email tool's "you were looking at X"
  // follow-up campaign. Built client-side from the already-authenticated
  // page's own data, the same way Admin → Newsletter's "Export CSV" button
  // works, rather than a separate browser fetch to the API (which wouldn't
  // carry the admin's session the way this server-rendered page does).
  function exportFollowUpCsv() {
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = ["Name,Email,Phone,Source,Status,Last Page Viewed,Submitted At"];
    for (const l of leads) {
      rows.push(
        [l.name, l.email, l.phone ?? "", l.source, l.status, l.exitPage ?? "", new Date(l.createdAt).toISOString()]
          .map((v) => escape(String(v)))
          .join(","),
      );
    }
    return rows.join("\n");
  }

  return (
    <div className="px-9 py-8">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-ink">Leads</h1>
        {leads.length > 0 ? (
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(exportFollowUpCsv())}`}
            download="leads-for-follow-up.csv"
            className="border border-line text-ink font-semibold text-[13px] px-4 py-2 rounded-[var(--radius)]"
          >
            Export for follow-up (email/ads)
          </a>
        ) : null}
      </div>
      <p className="text-[13.5px] text-slate-500 mb-7">
        Every inquiry from the contact form (and, once wired up, the chatbot and career applications) lands here.
        Each row also carries the last page that visitor was on before they left — export the list to build a
        retargeting audience or a "you were looking at X" follow-up email.
      </p>


      <div className="bg-white border border-line overflow-x-auto">
        {leads.length === 0 ? (
          <div className="px-6 py-8 text-[13.5px] text-slate-400">
            No leads yet — submit the public site&apos;s contact form to see one appear.
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left">
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Name</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Contact</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Source</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Last Page Viewed</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Received</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <Fragment key={lead.id}>
                  <tr className="border-t border-slate-100">
                    <td className="px-6 py-3.5 text-[13.5px] text-ink font-medium">
                      {lead.name}
                      {lead.company ? <div className="text-[12px] text-slate-400">{lead.company}</div> : null}
                    </td>
                    <td className="px-6 py-3.5 text-[13px] text-muted">
                      {lead.email}
                      {lead.phone ? <div className="text-[12px] text-slate-400">{lead.phone}</div> : null}
                    </td>
                    <td className="px-6 py-3.5 text-[13px] text-muted">{lead.source}</td>
                    <td className="px-6 py-3.5">
                      <form action={updateLeadStatusAction.bind(null, lead.id)} className="flex items-center gap-2">
                        <select
                          name="status"
                          defaultValue={lead.status}
                          className="border border-line text-[12.5px] px-2 py-1.5 bg-white"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                        <button type="submit" className="text-[12px] font-semibold text-ink border-b border-ink">
                          Save
                        </button>
                      </form>
                    </td>
                    <td className="px-6 py-3.5 text-[12.5px] text-muted font-mono">
                      {lead.exitPage ?? <span className="text-slate-300 font-sans">—</span>}
                    </td>
                    <td className="px-6 py-3.5 text-[13px] text-slate-400">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {lead.message || lead.serviceOfInterest || lead.sessionId ? (
                        <span className="text-[11.5px] font-semibold text-slate-400">see below ↓</span>
                      ) : (
                        <span className="text-[11.5px] text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                  {/* What the person actually submitted — previously the
                      table only showed name/contact/source/status, never
                      the service they asked about or their message, which
                      is the whole reason a lead needs a "detail" view.
                      A plain <details> row needs no client JS. */}
                  {lead.message || lead.serviceOfInterest || lead.sessionId ? (
                    <tr className="border-t border-slate-50 bg-paper-2">
                      <td colSpan={7} className="px-6 py-4">
                        <details>
                          <summary className="text-[12.5px] font-semibold text-ink cursor-pointer select-none">
                            What {lead.name} asked
                          </summary>
                          <div className="mt-3 flex flex-col gap-2 max-w-2xl">
                            {lead.serviceOfInterest ? (
                              <div className="text-[13px]">
                                <span className="font-semibold text-ink">Service of interest: </span>
                                <span className="text-muted">{lead.serviceOfInterest}</span>
                              </div>
                            ) : null}
                            {lead.message ? (
                              <div className="text-[13px]">
                                <span className="font-semibold text-ink block mb-1">Message:</span>
                                <p className="text-muted leading-relaxed whitespace-pre-wrap">{lead.message}</p>
                              </div>
                            ) : null}
                            {lead.branch?.city ? (
                              <div className="text-[13px]">
                                <span className="font-semibold text-ink">Branch: </span>
                                <span className="text-muted">{lead.branch.city}</span>
                              </div>
                            ) : null}
                            {lead.sessionId ? (
                              <div className="text-[13px]">
                                <a href={`/admin/leads/${lead.id}/journey`} className="font-semibold text-ink underline">
                                  View browsing history →
                                </a>
                                <span className="text-muted"> — the pages they viewed before submitting this.</span>
                              </div>
                            ) : null}
                          </div>
                        </details>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
