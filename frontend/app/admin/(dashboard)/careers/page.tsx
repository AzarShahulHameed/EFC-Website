import Link from "next/link";
import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";
import { closeJobAction, createJobAction, deleteJobAction, updateCareersIntroAction } from "@/lib/admin-actions";
import FieldLabel from "@/components/admin/FieldLabel";
import RichTextField from "@/components/admin/RichTextField";
import { careersIntro as defaultCareersIntro } from "@/lib/content";

export default async function AdminCareersPage({
  searchParams,
}: {
  searchParams: { error?: string; saved?: string };
}) {
  const [res, contentRes] = await Promise.all([
    adminFetch("/careers/admin/jobs"),
    adminFetch("/content/careers/en"),
  ]);
  if (res.status === 401) redirect("/admin/login");
  const jobs: any[] = res.ok ? await res.json() : [];
  const content: any = contentRes.ok ? await contentRes.json() : {};
  const intro = { ...defaultCareersIntro, ...(content.intro ?? {}) };

  return (
    <div className="px-9 py-8">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-ink">Careers</h1>
        <div className="flex items-center gap-5">
          <Link href="/admin/careers/form-builder" className="text-[13px] font-semibold text-ink border-b border-ink">
            Application Form Builder &rarr;
          </Link>
          <Link href="/admin/careers/applications" className="text-[13px] font-semibold text-ink border-b border-ink">
            View Applications &rarr;
          </Link>
        </div>
      </div>
      <p className="text-[13.5px] text-slate-500 mb-7">
        Job openings shown on the public /careers page. Use{" "}
        <Link href="/admin/careers/form-builder" className="underline">Application Form Builder</Link> to configure
        what extra details you collect from applicants.
      </p>


      <div className="bg-white border border-line p-6 max-w-2xl mb-8">
        <h2 className="text-[15px] font-bold text-ink mb-1">Careers Page Intro</h2>
        <p className="text-[12.5px] text-slate-400 mb-4">
          The paragraph shown under the &ldquo;Build your career in practice&rdquo; heading on the public /careers
          page, above the list of openings.
        </p>
        <form action={updateCareersIntroAction} className="flex flex-col gap-4">
          <RichTextField
            name="story"
            label="Intro Paragraph"
            hint="Culture, training pathways (ACCA/CPA support, etc.) and what makes the firm a good place to build a career. Use the toolbar for bold, italic, underline, size and color."
            defaultValueHtml={intro.story}
            rows={3}
          />
          <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)] self-start">
            Save Intro
          </button>
        </form>
      </div>

      <div className="bg-white border border-line mb-8 overflow-x-auto">
        {jobs.length === 0 ? (
          <div className="px-6 py-8 text-[13.5px] text-slate-400">No job openings yet — add the first one below.</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left">
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Title</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Department</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Location</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Applicants</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className="border-t border-slate-100">
                  <td className="px-6 py-3.5 text-[13.5px] text-ink font-medium">{j.title}</td>
                  <td className="px-6 py-3.5 text-[13.5px] text-muted">{j.department}</td>
                  <td className="px-6 py-3.5 text-[13.5px] text-muted">{j.location}</td>
                  <td className="px-6 py-3.5 text-[13.5px] text-muted">{j._count?.applications ?? 0}</td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        j.isOpen ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {j.isOpen ? "Open" : "Closed"}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right whitespace-nowrap">
                    {j.isOpen ? (
                      <form action={closeJobAction.bind(null, j.id)} className="inline">
                        <button type="submit" className="text-[12.5px] font-semibold text-ink mr-4">Close</button>
                      </form>
                    ) : null}
                    <form action={deleteJobAction.bind(null, j.id)} className="inline">
                      <button type="submit" className="text-[12.5px] font-semibold text-red-700">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white border border-line p-6 max-w-2xl">
        <h2 className="text-[15px] font-bold text-ink mb-4">Add a Job Opening</h2>
        <form action={createJobAction} className="flex flex-col gap-4">
          <div>
            <FieldLabel htmlFor="title" hint="Shown as the job's headline on the public careers page.">Job Title</FieldLabel>
            <input id="title" name="title" required className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="department" hint="e.g. External Audit, Tax & VAT — used as a filter on the public page.">Department</FieldLabel>
              <input id="department" name="department" required className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
            </div>
            <div>
              <FieldLabel htmlFor="location" hint="City or branch — used as a filter on the public page.">Location</FieldLabel>
              <input id="location" name="location" required className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="employmentType" hint="Shown next to the department/location on the listing.">Employment Type</FieldLabel>
            <select id="employmentType" name="employmentType" defaultValue="Full-time" className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white">
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Contract</option>
              <option>Graduate Program</option>
            </select>
          </div>
          <RichTextField
            name="description"
            label="Description"
            hint="Full job description shown when a candidate opens the listing. Use the toolbar for bold, italic, underline, size and color."
            rows={5}
          />
          <div>
            <FieldLabel htmlFor="responsibilities" hint="One responsibility per line — shown as a bullet list under 'Key Responsibilities' on the apply page.">
              Key Responsibilities
            </FieldLabel>
            <textarea
              id="responsibilities"
              name="responsibilities"
              rows={4}
              placeholder={"Lead fieldwork for statutory audit engagements\nReview working papers prepared by junior staff\n..."}
              className="w-full border border-line px-3.5 py-2.5 text-[14px]"
            />
          </div>
          <div>
            <FieldLabel htmlFor="qualifications" hint="One qualification per line — shown as a bullet list under 'Preferred Qualifications' on the apply page.">
              Preferred Qualifications
            </FieldLabel>
            <textarea
              id="qualifications"
              name="qualifications"
              rows={4}
              placeholder={"ACCA / CPA qualified or finalist\n3+ years in external audit\n..."}
              className="w-full border border-line px-3.5 py-2.5 text-[14px]"
            />
          </div>
          <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)] self-start">
            Post Job
          </button>
        </form>
      </div>
    </div>
  );
}
