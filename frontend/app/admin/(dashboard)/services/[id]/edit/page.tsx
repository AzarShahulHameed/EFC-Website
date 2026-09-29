import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { adminFetch } from "@/lib/session";
import {
  updateServiceAction,
  updateServiceImageAction,
  autoTranslateServiceAction,
  createSubServiceAction,
  deleteSubServiceAction,
} from "@/lib/admin-actions";
import FieldLabel from "@/components/admin/FieldLabel";
import LanguageTabs from "@/components/admin/LanguageTabs";
import ServiceFieldsForm from "@/components/admin/ServiceFieldsForm";
import ImageUploadField from "@/components/admin/ImageUploadField";
import AutoTranslateButton from "@/components/admin/AutoTranslateButton";
import { EditorLayout } from "@/components/admin/PreviewPanel";
import { locales, languageNames, defaultLocale } from "@/lib/i18n";

export default async function EditServicePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { lang?: string; saved?: string; error?: string };
}) {
  const lang = searchParams.lang ?? "en";
  const [res, teamRes] = await Promise.all([
    adminFetch(`/services/admin/${params.id}`),
    adminFetch("/team/admin/all"),
  ]);
  if (res.status === 401) redirect("/admin/login");
  if (!res.ok) notFound();

  const service: any = await res.json();
  const team: any[] = teamRes.ok ? await teamRes.json() : [];
  const translation = service.translations?.find((t: any) => t.languageCode === lang);
  const faqs: { question: string; answer: string }[] = Array.isArray(translation?.faqs) ? translation.faqs : [];
  const faqRows = Array.from({ length: Math.max(faqs.length + 1, 3) });

  return (
    <div className="px-9 py-8">
      <Link href="/admin/services" className="text-[13px] font-semibold text-muted hover:text-ink">
        &larr; Services
      </Link>
      <h1 className="text-2xl font-bold text-ink mt-4 mb-1">Edit Service</h1>
      <p className="text-[13.5px] text-slate-500 mb-5">
        Slug: <code>{service.slug}</code> — switch tabs to add or edit each language.
      </p>

      <LanguageTabs basePath={`/admin/services/${service.id}/edit`} current={lang} />

      {/* Image + Translation (below, past the Sub-Services block) are both
          "edit this record's fields" forms — each wrapped in its own
          `data-autosave-scope` so one "Save All Changes" bar (bottom of the
          page) covers both instead of needing two separate clicks; the
          guard treats every scope on the page as one combined set. The
          Sub-Services block in between is deliberately left outside any
          scope: Add/Delete there are immediate, one-off actions, not
          content someone edits and might forget to save. */}
      <div data-autosave-scope>
      <form
        action={updateServiceImageAction.bind(null, service.id)}
        encType="multipart/form-data"
        className="bg-white border border-line p-6 max-w-xl flex flex-col gap-4 mb-6"
      >
        <input type="hidden" name="currentLang" value={lang} />
        <h2 className="text-[13px] font-bold text-ink">Image</h2>
        <p className="text-[12.5px] text-slate-500 -mt-2">
          Shown on this service's card (homepage/Services list) and its detail page. Not tied to a language.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <ImageUploadField
            id="image"
            label="Image"
            hint="Uploaded to Cloudinary."
            fileFieldName="image"
            existingUrlFieldName="existingImageUrl"
            currentUrl={service.imageUrl}
            previewClassName="w-32 h-20 object-cover border border-line"
            previewStyle={{ objectPosition: service.imagePosition || "center" }}
          />
          <div>
            <FieldLabel htmlFor="imagePosition" hint="Which part of the image stays visible when it's cropped to fit.">Image Position</FieldLabel>
            <select id="imagePosition" name="imagePosition" defaultValue={service.imagePosition || "center"} className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white">
              <option value="top">Top</option>
              <option value="center">Center</option>
              <option value="bottom">Bottom</option>
            </select>
          </div>
        </div>
        <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--btn-radius)] self-start">
          Save Image
        </button>
      </form>
      </div>

      <div className="bg-white border border-line p-6 max-w-xl mb-6">
        <h2 className="text-[13px] font-bold text-ink mb-1">Sub-Services</h2>
        <p className="text-[12.5px] text-slate-500 mb-4">
          Named offerings within this service (e.g. Audit &rarr; External Audit, Internal Audit). Each one now has
          its own full page — own header, typography, animations and photo/video — and its own clickable entry in
          the header's Services dropdown. Not tied to a language.
        </p>

        {service.subServices && service.subServices.length > 0 ? (
          <div className="flex flex-col gap-2 mb-4">
            {service.subServices.map((ss: any) => (
              <div key={ss.id} className="flex items-start justify-between gap-3 border border-line px-3.5 py-2.5">
                <div>
                  <div className="text-[13.5px] font-medium text-ink">{ss.name}</div>
                  {ss.slug ? (
                    <div className="text-[11.5px] text-slate-400 font-mono mt-0.5">/services/{service.slug}/{ss.slug}</div>
                  ) : (
                    <div className="text-[11.5px] text-amber-700 mt-0.5">No slug yet — edit to add one and give it its own page.</div>
                  )}
                  {ss.description ? <div className="text-[12px] text-slate-500 mt-1">{ss.description}</div> : null}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <Link
                    href={`/admin/services/${service.id}/sub-services/${ss.id}/edit`}
                    className="text-[12px] font-semibold text-ink underline underline-offset-2"
                  >
                    Edit
                  </Link>
                  <form action={deleteSubServiceAction.bind(null, service.id, ss.id)}>
                    <button type="submit" className="text-[12px] font-semibold text-red-700">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[12.5px] text-slate-400 mb-4">No sub-services yet.</p>
        )}

        <form action={createSubServiceAction.bind(null, service.id)} className="flex flex-col gap-3 border-t border-slate-100 pt-4">
          <div>
            <FieldLabel htmlFor="ss_name" hint="Shown on this service's page and in the header dropdown.">Name</FieldLabel>
            <input id="ss_name" name="name" required maxLength={160} placeholder="e.g. Internal Audit" className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div>
            <FieldLabel htmlFor="ss_slug" hint="Used in this sub-service's own page URL. Leave blank to generate one from the name automatically.">URL Slug (optional)</FieldLabel>
            <input id="ss_slug" name="slug" maxLength={160} placeholder="e.g. internal-audit" className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div>
            <FieldLabel htmlFor="ss_description" hint="Optional — the short teaser shown on this service's page, not in the header dropdown. Full page content, photo and video are added after creating it, on its own edit page.">
              Short description
            </FieldLabel>
            <textarea id="ss_description" name="description" rows={2} maxLength={2000} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div className="w-28">
            <FieldLabel htmlFor="ss_order" hint="Lower numbers show first.">Order</FieldLabel>
            <input id="ss_order" name="order" type="number" defaultValue={service.subServices?.length ?? 0} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[13.5px] px-5 py-2.5 rounded-[var(--btn-radius)] self-start">
            Add Sub-Service
          </button>
        </form>
      </div>

      {!translation ? (
        <div className="bg-slate-50 border border-line px-5 py-3 mb-6 text-[13.5px] text-ink max-w-xl">
          No {lang.toUpperCase()} translation yet — fill in the fields below to add one.
        </div>
      ) : null}

      {lang === defaultLocale ? (
        <div className="max-w-5xl">
          <AutoTranslateButton
            action={autoTranslateServiceAction.bind(null, service.id)}
            targetLanguages={locales.filter((l) => l !== defaultLocale)}
            labels={languageNames}
          />
        </div>
      ) : null}

      <EditorLayout>
      <div data-autosave-scope>
      <form
        action={updateServiceAction.bind(null, service.id)}
        className="bg-white border border-line p-6 max-w-3xl flex flex-col gap-4"
      >
        <input type="hidden" name="languageCode" value={lang} />

        <div>
          <FieldLabel htmlFor="responsiblePersonId" hint="Who a visitor should contact about this service — shown on the detail page with their photo, name, position and linked-in/email/phone icons. Pulled from Team; add someone there first if they're not listed. Shared across every language.">
            Responsible Person
          </FieldLabel>
          <select id="responsiblePersonId" name="responsiblePersonId" defaultValue={service.responsiblePersonId ?? ""} className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white">
            <option value="">— None —</option>
            {team.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          {team.length === 0 ? (
            <p className="text-[12px] text-slate-400 mt-1.5">
              No team members yet — add one in Team first if you want to assign a Responsible Person here.
            </p>
          ) : null}
        </div>

        <ServiceFieldsForm
          defaults={{
            title: translation?.title ?? "",
            summary: translation?.summary ?? "",
            description: translation?.description ?? "",
            whatIsIt: translation?.whatIsIt ?? "",
            whoNeedsIt: translation?.whoNeedsIt ?? "",
            benefits: translation?.benefits ?? "",
            process: translation?.process ?? "",
            costFactors: translation?.costFactors ?? "",
            timeline: translation?.timeline ?? "",
            imageUrl: service.imageUrl,
            imagePosition: service.imagePosition,
          }}
        />

        <div className="border-t border-slate-100 pt-4 mt-1">
          <h3 className="text-[13px] font-bold text-ink mt-2 mb-2">Frequently Asked Questions</h3>
          <p className="text-[12.5px] text-slate-500 mb-3">
            Shown on the service page and marked up as FAQ schema for search engines and AI answers. Leave a row's
            question blank to skip it.
          </p>
          <div className="flex flex-col gap-3">
            {faqRows.map((_, i) => (
              <div key={i} className="border border-line p-3 flex flex-col gap-2">
                <input
                  name={`faq_${i}_question`}
                  defaultValue={faqs[i]?.question ?? ""}
                  placeholder={`Question ${i + 1}`}
                  className="w-full border border-line px-3 py-2 text-[13.5px] font-medium"
                />
                <textarea
                  name={`faq_${i}_answer`}
                  defaultValue={faqs[i]?.answer ?? ""}
                  placeholder="Answer"
                  rows={2}
                  className="w-full border border-line px-3 py-2 text-[13.5px]"
                />
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--btn-radius)] self-start mt-2">
          Save {lang.toUpperCase()} Translation
        </button>
      </form>
      </div>
      </EditorLayout>
    </div>
  );
}
