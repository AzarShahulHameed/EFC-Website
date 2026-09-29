import { notFound, redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";

type Journey = {
  lead: { id: string; name: string; email: string; source: string; createdAt: string; serviceOfInterest?: string };
  pageViews: { path: string; referrer: string | null; createdAt: string }[];
};

// The browsing history behind one lead — every page view tagged with the
// same analytics sessionId the contact form captured at submission time
// (see lib/analytics-session.ts / components/site/SessionIdField.tsx),
// ordered so a follow-up call or email can open with "I saw you were
// looking at X" instead of a cold "thanks for reaching out".
export default async function LeadJourneyPage({ params }: { params: { id: string } }) {
  const res = await adminFetch(`/leads/${params.id}/journey`);
  if (res.status === 401) redirect("/admin/login");
  if (res.status === 404) notFound();
  const data: Journey | null = res.ok ? await res.json() : null;

  if (!data) {
    return (
      <div className="px-9 py-8">
        <div className="bg-white border border-line px-6 py-8 text-[13.5px] text-slate-400">
          Couldn&apos;t load this lead&apos;s browsing history right now — try refreshing.
        </div>
      </div>
    );
  }

  const { lead, pageViews } = data;

  return (
    <div className="px-9 py-8">
      <a href="/admin/leads" className="text-[13px] text-slate-500 hover:text-ink mb-4 inline-block">
        &larr; Back to Leads
      </a>
      <h1 className="text-2xl font-bold text-ink mb-1">{lead.name}&apos;s Browsing History</h1>
      <p className="text-[13.5px] text-slate-500 mb-7">
        {lead.email} · submitted {new Date(lead.createdAt).toLocaleString()} via {lead.source.replace(/_/g, " ").toLowerCase()}
        {lead.serviceOfInterest ? ` · asked about ${lead.serviceOfInterest}` : ""}
      </p>

      <div className="bg-white border border-line">
        <div className="px-6 py-4.5 border-b border-line">
          <h2 className="text-[15px] font-bold text-ink">Pages Viewed, In Order</h2>
        </div>
        {pageViews.length === 0 ? (
          <div className="px-6 py-6 text-[13.5px] text-slate-400">
            No page-view trail was recorded for this session — either it happened before this feature shipped, or the
            visitor had analytics storage blocked.
          </div>
        ) : (
          <ol className="flex flex-col">
            {pageViews.map((pv, i) => {
              const isLast = i === pageViews.length - 1;
              return (
                <li
                  key={i}
                  className={`flex items-center justify-between gap-4 px-6 py-3.5 border-t border-slate-100 first:border-t-0 ${
                    isLast ? "bg-amber-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full text-[11.5px] font-bold flex items-center justify-center flex-shrink-0 ${
                        isLast ? "bg-amber-200 text-amber-900" : "bg-paper-2 text-slate-500"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="text-[13.5px] text-ink font-mono truncate">{pv.path}</span>
                    {isLast ? (
                      <span className="text-[10.5px] font-bold uppercase tracking-wide text-amber-700 bg-amber-100 border border-amber-200 rounded-full px-2 py-0.5 flex-shrink-0">
                        Left off here
                      </span>
                    ) : null}
                  </div>
                  <span className="text-[12px] text-slate-400 flex-shrink-0">
                    {new Date(pv.createdAt).toLocaleTimeString()}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
