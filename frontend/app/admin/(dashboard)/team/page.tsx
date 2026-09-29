import Link from "next/link";
import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";
import { createTeamMemberAction } from "@/lib/admin-actions";
import FieldLabel from "@/components/admin/FieldLabel";
import TeamBioField from "@/components/admin/TeamBioField";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { EditorLayout } from "@/components/admin/PreviewPanel";
import TeamTableBody from "@/components/admin/reorder/TeamTableBody";

export default async function AdminTeamPage({
  searchParams,
}: {
  searchParams: { error?: string; saved?: string };
}) {
  const [teamRes, branchesRes] = await Promise.all([
    adminFetch("/team/admin/all"),
    adminFetch("/branches/admin/all"),
  ]);
  if (teamRes.status === 401) redirect("/admin/login");

  const team: any[] = teamRes.ok ? await teamRes.json() : [];
  const branches: any[] = branchesRes.ok ? await branchesRes.json() : [];

  return (
    <div className="px-9 py-8">
      <h1 className="text-2xl font-bold text-ink mb-1">Team</h1>
      <p className="text-[13.5px] text-slate-500 mb-7">
        Everyone listed on the public Team and Find an Expert pages, managed here.
      </p>


      <div className="bg-white border border-line mb-8 overflow-x-auto">
        {team.length === 0 ? (
          <div className="px-6 py-8 text-[13.5px] text-slate-400">No team members yet — add the first one below.</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left">
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide" colSpan={2}>Order</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide"></th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Name</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Category</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Position</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Branch</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide"></th>
              </tr>
            </thead>
            <TeamTableBody team={team} />
          </table>
        )}
      </div>

      <EditorLayout>
      <div className="bg-white border border-line p-6 max-w-2xl">
        <h2 className="text-[15px] font-bold text-ink mb-4">Add a Team Member</h2>
        <form action={createTeamMemberAction} encType="multipart/form-data" className="flex flex-col gap-4">
          <div>
            <FieldLabel htmlFor="languageCode" hint="Which language this initial position/bio is written in. Add the other languages afterward from the Edit screen.">
              Language
            </FieldLabel>
            <select id="languageCode" name="languageCode" defaultValue="en" className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white">
              <option value="en">English</option>
              <option value="ar">Arabic</option>
              <option value="de">German</option>
            </select>
          </div>
          <ImageUploadField
            id="photo"
            label="Photo"
            hint="Optional headshot, uploaded to Cloudinary."
            fileFieldName="photo"
          />
          <div>
            <FieldLabel htmlFor="category" hint="Which sub-section of the Team page this person appears under.">Category</FieldLabel>
            <select id="category" name="category" defaultValue="Key Member" className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white">
              <option value="Partner">Partner</option>
              <option value="Key Member">Key Member</option>
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="branchId" hint="Which office this person is based at — used for location filtering.">Branch</FieldLabel>
            <select id="branchId" name="branchId" className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white">
              <option value="">— None —</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.city}</option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="qualification" hint="e.g. FCCA, CPA — shown as a credential badge.">Qualification</FieldLabel>
            <input id="qualification" name="qualification" placeholder="e.g. FCCA" className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div>
            <FieldLabel htmlFor="languagesSpoken" hint="Comma-separated — used by the Find an Expert language filter.">Languages (comma-separated)</FieldLabel>
            <input id="languagesSpoken" name="languagesSpoken" placeholder="English, Arabic" className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <FieldLabel htmlFor="linkedinUrl" hint="Full profile URL — shown as an icon wherever this person is featured.">LinkedIn URL</FieldLabel>
              <input id="linkedinUrl" name="linkedinUrl" placeholder="https://linkedin.com/in/..." className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
            </div>
            <div>
              <FieldLabel htmlFor="email" hint="Shown as a mail icon — e.g. if this person is set as a Service's Responsible Person.">Email</FieldLabel>
              <input id="email" name="email" type="email" placeholder="name@firm.com" className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
            </div>
            <div>
              <FieldLabel htmlFor="phone" hint="Shown as a phone icon, any format.">Mobile Number</FieldLabel>
              <input id="phone" name="phone" placeholder="+971 5X XXX XXXX" className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
            </div>
          </div>

          <TeamBioField />

          <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)] self-start">
            Add Team Member
          </button>
        </form>
        {branches.length === 0 ? (
          <p className="text-[12px] text-slate-400 mt-4">
            No branches yet — add one in Branches &amp; Locations first if you want to assign one here.
          </p>
        ) : null}
      </div>
      </EditorLayout>
    </div>
  );
}
