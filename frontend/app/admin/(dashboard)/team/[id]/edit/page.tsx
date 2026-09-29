import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { adminFetch } from "@/lib/session";
import { updateTeamMemberAction, autoTranslateTeamMemberAction } from "@/lib/admin-actions";
import FieldLabel from "@/components/admin/FieldLabel";
import LanguageTabs from "@/components/admin/LanguageTabs";
import TeamBioField from "@/components/admin/TeamBioField";
import ImageUploadField from "@/components/admin/ImageUploadField";
import AutoTranslateButton from "@/components/admin/AutoTranslateButton";
import { EditorLayout } from "@/components/admin/PreviewPanel";
import { locales, languageNames, defaultLocale } from "@/lib/i18n";

export default async function EditTeamMemberPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { lang?: string; saved?: string; error?: string };
}) {
  const lang = searchParams.lang ?? "en";
  const [memberRes, branchesRes] = await Promise.all([
    adminFetch(`/team/admin/${params.id}`),
    adminFetch("/branches/admin/all"),
  ]);
  if (memberRes.status === 401) redirect("/admin/login");
  if (!memberRes.ok) notFound();

  const member: any = await memberRes.json();
  const branches: any[] = branchesRes.ok ? await branchesRes.json() : [];
  const translation = member.translations?.find((t: any) => t.languageCode === lang);

  return (
    <div className="px-9 py-8">
      <Link href="/admin/team" className="text-[13px] font-semibold text-muted hover:text-ink">
        &larr; Team
      </Link>
      <h1 className="text-2xl font-bold text-ink mt-4 mb-1">Edit {member.name}</h1>
      <p className="text-[13.5px] text-slate-500 mb-5">
        Name, photo, branch and qualification are shared across languages — position and bio are per language.
      </p>

      <LanguageTabs basePath={`/admin/team/${member.id}/edit`} current={lang} />

      {searchParams.saved ? (
        <div className="bg-slate-50 border border-line px-5 py-3 mb-6 text-[13.5px] text-ink max-w-xl">
          Saved the {lang.toUpperCase()} translation.
        </div>
      ) : null}
      {!translation ? (
        <div className="bg-slate-50 border border-line px-5 py-3 mb-6 text-[13.5px] text-ink max-w-xl">
          No {lang.toUpperCase()} translation yet — fill in position and bio below to add one.
        </div>
      ) : null}

      {lang === defaultLocale ? (
        <div className="max-w-3xl">
          <AutoTranslateButton
            action={autoTranslateTeamMemberAction.bind(null, member.id)}
            targetLanguages={locales.filter((l) => l !== defaultLocale)}
            labels={languageNames}
          />
        </div>
      ) : null}

      <EditorLayout>
      <form
        action={updateTeamMemberAction.bind(null, member.id)}
        encType="multipart/form-data"
        className="bg-white border border-line p-6 max-w-2xl flex flex-col gap-4"
      >
        <input type="hidden" name="languageCode" value={lang} />

        <ImageUploadField
          id="photo"
          label="Photo"
          hint="Uploaded to Cloudinary. Leave empty to keep the current photo. Shared across every language."
          fileFieldName="photo"
          currentUrl={member.photoUrl}
          previewClassName="w-24 h-24 object-cover border border-line"
          previewStyle={{ objectPosition: member.photoPosition || "center" }}
        />
        <div>
          <FieldLabel htmlFor="photoPosition" hint="Which part of the photo stays visible when it's cropped into the card's fixed shape — useful when a face sits above or below dead-center. Shared across every language.">
            Photo Position
          </FieldLabel>
          <select
            id="photoPosition"
            name="photoPosition"
            defaultValue={member.photoPosition || "center"}
            className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white"
          >
            <option value="top">Top</option>
            <option value="center">Center</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="category" hint="Which sub-section of the Team page this person appears under — shared across every language.">Category</FieldLabel>
          <select id="category" name="category" defaultValue={member.category === "Partner" ? "Partner" : "Key Member"} className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white">
            <option value="Partner">Partner</option>
            <option value="Key Member">Key Member</option>
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="branchId" hint="Which office this person is based at — shared across every language.">Branch</FieldLabel>
          <select id="branchId" name="branchId" defaultValue={member.branchId ?? ""} className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white">
            <option value="">— None —</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.city}</option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="qualification" hint="e.g. FCCA, CPA — shared across every language.">Qualification</FieldLabel>
          <input id="qualification" name="qualification" defaultValue={member.qualification ?? ""} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <FieldLabel htmlFor="linkedinUrl" hint="Full profile URL — shown as an icon wherever this person is featured. Shared across every language.">LinkedIn URL</FieldLabel>
            <input id="linkedinUrl" name="linkedinUrl" defaultValue={member.linkedinUrl ?? ""} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div>
            <FieldLabel htmlFor="email" hint="Shown as a mail icon — e.g. if this person is set as a Service's Responsible Person. Shared across every language.">Email</FieldLabel>
            <input id="email" name="email" type="email" defaultValue={member.email ?? ""} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div>
            <FieldLabel htmlFor="phone" hint="Shown as a phone icon, any format. Shared across every language.">Mobile Number</FieldLabel>
            <input id="phone" name="phone" defaultValue={member.phone ?? ""} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
        </div>
        <div>
          <FieldLabel htmlFor="languagesSpoken" hint="Comma-separated — used by the Find an Expert language filter. Shared across every language.">Languages Spoken (comma-separated)</FieldLabel>
          <input
            id="languagesSpoken"
            name="languagesSpoken"
            defaultValue={(member.languagesSpoken ?? []).join(", ")}
            className="w-full border border-line px-3.5 py-2.5 text-[14px]"
          />
        </div>
        <TeamBioField
          defaultName={member.name}
          defaultPosition={translation?.position ?? ""}
          qualification={member.qualification}
          photoUrl={member.photoUrl}
          photoPosition={member.photoPosition}
          defaultValueHtml={translation?.bio ?? ""}
          nameLabel="Full Name"
          positionLabel={`Position (${lang.toUpperCase()})`}
        />

        <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)] self-start">
          Save Changes
        </button>
      </form>
      </EditorLayout>
    </div>
  );
}
