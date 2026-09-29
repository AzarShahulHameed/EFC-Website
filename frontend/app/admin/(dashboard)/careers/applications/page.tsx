import Link from "next/link";
import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";
import { updateApplicationStatusAction } from "@/lib/admin-actions";

const STATUSES = ["RECEIVED", "UNDER_REVIEW", "INTERVIEWING", "OFFERED", "REJECTED"];

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: { error?: string; saved?: string };
}) {
  const res = await adminFetch("/careers/admin/applications");
  if (res.status === 401) redirect("/admin/login");
  const applications: any[] = res.ok ? await res.json() : [];

  return (
    <div className="px-9 py-8">
      <Link href="/admin/careers" className="text-[13px] font-semibold text-muted hover:text-ink">
        &larr; Job Openings
      </Link>
      <h1 className="text-2xl font-bold text-ink mt-4 mb-1">Applications</h1>
      <p className="text-[13.5px] text-slate-500 mb-7">
        Every submission from the public careers page, across all job openings.
      </p>


      <div className="bg-white border border-line overflow-x-auto">
        {applications.length === 0 ? (
          <div className="px-6 py-8 text-[13.5px] text-slate-400">No applications yet.</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left">
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Applicant</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Job</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Resume</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Details</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Applied</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((a) => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="px-6 py-3.5 text-[13.5px] text-ink font-medium">
                    {a.fullName}
                    <div className="text-[12px] text-slate-400">{a.email}</div>
                  </td>
                  <td className="px-6 py-3.5 text-[13.5px] text-muted">{a.job?.title}</td>
                  <td className="px-6 py-3.5 text-[13px]">
                    <a href={a.resumeUrl} target="_blank" rel="noreferrer" className="text-ink font-semibold border-b border-ink">
                      View
                    </a>
                  </td>
                  <td className="px-6 py-3.5 text-[12.5px] text-muted max-w-[260px]">
                    {a.phone ? <div>{a.phone}</div> : null}
                    {a.answers && typeof a.answers === "object"
                      ? Object.entries(a.answers as Record<string, string>).map(([label, value]) => (
                          <div key={label}>
                            <span className="text-slate-400">{label}:</span> {String(value)}
                          </div>
                        ))
                      : null}
                    {a.coverLetter ? (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-slate-400">Cover letter</summary>
                        <p className="mt-1 whitespace-pre-line">{a.coverLetter}</p>
                      </details>
                    ) : null}
                  </td>
                  <td className="px-6 py-3.5">
                    <form action={updateApplicationStatusAction.bind(null, a.id)} className="flex items-center gap-2">
                      <select name="status" defaultValue={a.status} className="border border-line text-[12.5px] px-2 py-1.5 bg-white">
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s.replace("_", " ")}</option>
                        ))}
                      </select>
                      <button type="submit" className="text-[12px] font-semibold text-ink border-b border-ink">Save</button>
                    </form>
                  </td>
                  <td className="px-6 py-3.5 text-[13px] text-slate-400">{new Date(a.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
