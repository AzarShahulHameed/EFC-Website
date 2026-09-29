import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { adminFetch } from "@/lib/session";
import { subServicePageKey } from "@/lib/api";
import {
  updateSubServiceAction,
  updateSubServiceImageAction,
  updateSubServiceVideoAction,
} from "@/lib/admin-actions";
import FieldLabel from "@/components/admin/FieldLabel";
import RichTextField from "@/components/admin/RichTextField";
import ImageUploadField from "@/components/admin/ImageUploadField";
import TypographyForm from "@/components/admin/TypographyForm";
import PageHeaderForm from "@/components/admin/PageHeaderForm";
import SectionAnimationsForm from "@/components/admin/SectionAnimationsForm";

const SUB_SERVICE_SECTIONS: [string, string][] = [["content", "Main Content"]];

export default async function EditSubServicePage({
  params,
  searchParams,
}: {
  params: { id: string; subId: string };
  searchParams: { saved?: string; error?: string };
}) {
  const [res, teamRes] = await Promise.all([
    adminFetch(`/services/admin/${params.id}`),
    adminFetch("/team/admin/all"),
  ]);
  if (res.status === 401) redirect("/admin/login");
  if (!res.ok) notFound();
  const service: any = await res.json();
  const subService = (service.subServices ?? []).find((ss: any) => ss.id === params.subId);
  if (!subService) notFound();
  const team: any[] = teamRes.ok ? await teamRes.json() : [];
  const faqs: { question: string; answer: string }[] = Array.isArray(subService.faqs) ? subService.faqs : [];
  const faqRows = Array.from({ length: Math.max(faqs.length + 1, 3) });

  // Falls back to the sub-service's id when it has no slug yet — its own
  // public page won't exist until a slug is set (see the amber note on the
  // parent Edit Service page), but the design settings below can still be
  // prepared ahead of time under a stable key.
  const page = subServicePageKey(service.slug, subService.slug || subService.id);
  const contentRes = await adminFetch(`/content/${page}/en`);
  const content: Record<string, any> = contentRes.ok ? await contentRes.json() : {};

  return (
    <div className="px-9 py-8">
      <Link href={`/admin/services/${service.id}/edit`} className="text-[13px] font-semibold text-muted hover:text-ink">
        &larr; {service.slug}
      </Link>
      <h1 className="text-2xl font-bold text-ink mt-4 mb-1">Edit Sub-Service</h1>
      <p className="text-[13.5px] text-slate-500 mb-6">
        {subService.slug ? (
          <>Live at <code>/services/{service.slug}/{subService.slug}</code></>
        ) : (
          "Set a URL slug below to give this sub-service its own live page."
        )}
      </p>

      {searchParams.error ? (
        <div className="bg-red-50 border border-red-200 px-5 py-3 mb-6 text-[13.5px] text-red-800 max-w-3xl">
          {searchParams.error}
        </div>
      ) : null}

      {/* Every form on this page edits the same sub-service record (or its
          per-page design settings), so they're all wrapped in one
          `data-autosave-scope` — one "Save All Changes" bar at the bottom
          covers Basic Info, Photo, Video and the design forms together
          instead of needing six separate clicks. See
          components/admin/UnsavedChangesGuard.tsx. */}
      <div data-autosave-scope>
      {/* Basic fields */}
      <form
        action={updateSubServiceAction.bind(null, service.id, subService.id)}
        className="bg-white border border-line p-6 max-w-3xl flex flex-col gap-4 mb-6"
      >
        <h2 className="text-[15px] font-bold text-ink mb-1">Basic Info</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="name" hint="Shown on the parent service's page and in the header dropdown.">Name</FieldLabel>
            <input id="name" name="name" required maxLength={160} defaultValue={subService.name} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div>
            <FieldLabel htmlFor="slug" hint="This sub-service's own page URL.">URL Slug</FieldLabel>
            <input id="slug" name="slug" maxLength={160} defaultValue={subService.slug ?? ""} placeholder="e.g. internal-audit" className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
        </div>
        <div>
          <FieldLabel htmlFor="description" hint="Short teaser shown on the compact card on the parent service's page, and as this page's search-engine description.">Short Description</FieldLabel>
          <textarea id="description" name="description" rows={2} maxLength={2000} defaultValue={subService.description ?? ""} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
        </div>
        <RichTextField
          name="body"
          label="Full Page Content"
          hint="The main content of this sub-service's own page. Use the Link tool in the toolbar to add a redirect link to any other page on the site (or an external URL)."
          defaultValueHtml={subService.body ?? ""}
          rows={8}
        />
        <div className="grid grid-cols-2 gap-4 items-end">
          <div className="w-28">
            <FieldLabel htmlFor="order" hint="Lower numbers show first, both on the parent page and in the header dropdown.">Order</FieldLabel>
            <input id="order" name="order" type="number" defaultValue={subService.order ?? 0} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <label className="flex items-center gap-2.5 text-[13.5px] font-medium text-ink pb-2.5">
            <input type="checkbox" name="isActive" defaultChecked={subService.isActive !== false} className="w-4 h-4" />
            Active (shown on the site)
          </label>
        </div>

        <div className="border-t border-slate-100 pt-4 mt-1">
          <FieldLabel htmlFor="responsiblePersonId" hint="Who a visitor should contact about this specific sub-service — shown on its page with their photo, name, position and linked-in/email/phone icons. Independent of the parent service's own Responsible Person; leave as None to not show this card here.">
            Responsible Person
          </FieldLabel>
          <select id="responsiblePersonId" name="responsiblePersonId" defaultValue={subService.responsiblePersonId ?? ""} className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white">
            <option value="">— None —</option>
            {team.map((m: any) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          {team.length === 0 ? (
            <p className="text-[12px] text-slate-400 mt-1.5">
              No team members yet — add one in Team first if you want to assign a Responsible Person here.
            </p>
          ) : null}
        </div>

        <div className="border-t border-slate-100 pt-4 mt-1">
          <h2 className="text-[13.5px] font-bold text-ink mb-3">Answer Engine Sections</h2>
          <p className="text-[12.5px] text-slate-500 mb-4">
            Same as a full Service page — these answer the questions AI answer engines and voice search look for.
            Fill in what applies, leave the rest blank.
          </p>
          <div className="flex flex-col gap-4">
            <RichTextField
              name="whatIsIt"
              label="What is it?"
              hint="A plain-language definition of this sub-service."
              defaultValueHtml={subService.whatIsIt ?? ""}
              rows={2}
            />
            <RichTextField
              name="whoNeedsIt"
              label="Who needs it?"
              hint="Who this sub-service is for — the typical client profile."
              defaultValueHtml={subService.whoNeedsIt ?? ""}
              rows={2}
            />
            <div>
              <FieldLabel htmlFor="benefits" hint="One benefit per line — shown as a bullet list.">
                Benefits (one per line)
              </FieldLabel>
              <textarea
                id="benefits"
                name="benefits"
                rows={4}
                defaultValue={subService.benefits ?? ""}
                placeholder={"Reduced audit risk\nFaster year-end close\n..."}
                className="w-full border border-line px-3.5 py-2.5 text-[14px]"
              />
            </div>
            <div>
              <FieldLabel htmlFor="process" hint="One step per line, in order — shown as a numbered list.">
                Our process (one step per line)
              </FieldLabel>
              <textarea
                id="process"
                name="process"
                rows={4}
                defaultValue={subService.process ?? ""}
                placeholder={"Initial consultation\nScoping & engagement letter\n..."}
                className="w-full border border-line px-3.5 py-2.5 text-[14px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel htmlFor="costFactors" hint="What drives the fee for this sub-service.">
                  Cost factors
                </FieldLabel>
                <textarea id="costFactors" name="costFactors" rows={2} defaultValue={subService.costFactors ?? ""} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
              </div>
              <div>
                <FieldLabel htmlFor="timeline" hint="Typical engagement duration, e.g. '1–2 weeks'.">
                  Timeline
                </FieldLabel>
                <textarea id="timeline" name="timeline" rows={2} defaultValue={subService.timeline ?? ""} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 mt-1">
          <h3 className="text-[13px] font-bold text-ink mt-2 mb-2">Frequently Asked Questions</h3>
          <p className="text-[12.5px] text-slate-500 mb-3">
            Shown on this sub-service's page and marked up as FAQ schema for search engines and AI answers. Leave a
            row's question blank to skip it.
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
          Save Basic Info
        </button>
      </form>

      {/* Photo */}
      <form
        action={updateSubServiceImageAction.bind(null, service.id, subService.id)}
        encType="multipart/form-data"
        className="bg-white border border-line p-6 max-w-3xl flex flex-col gap-4 mb-6"
      >
        <h2 className="text-[15px] font-bold text-ink mb-1">Photo</h2>
        <div className="grid grid-cols-2 gap-4">
          <ImageUploadField
            id="image"
            label="Image"
            hint="Shown at the top of this sub-service's page and on its compact card."
            fileFieldName="image"
            existingUrlFieldName="existingImageUrl"
            currentUrl={subService.imageUrl}
            previewClassName="w-32 h-20 object-cover border border-line"
            previewStyle={{ objectPosition: subService.imagePosition || "center" }}
          />
          <div>
            <FieldLabel htmlFor="imagePosition" hint="Which part of the image stays visible when it's cropped to fit.">Image Position</FieldLabel>
            <select id="imagePosition" name="imagePosition" defaultValue={subService.imagePosition || "center"} className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white">
              <option value="top">Top</option>
              <option value="center">Center</option>
              <option value="bottom">Bottom</option>
            </select>
          </div>
        </div>
        <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--btn-radius)] self-start">
          Save Photo
        </button>
      </form>

      {/* Video */}
      <form
        action={updateSubServiceVideoAction.bind(null, service.id, subService.id)}
        encType="multipart/form-data"
        className="bg-white border border-line p-6 max-w-3xl flex flex-col gap-4 mb-6"
      >
        <h2 className="text-[15px] font-bold text-ink mb-1">Video</h2>
        <p className="text-[12.5px] text-slate-400 -mt-2">
          Optional — plays inline on this sub-service's page, above the content. Leave empty to show the photo
          instead.
        </p>
        {subService.videoUrl ? (
          <div className="flex items-center gap-4">
            <video src={subService.videoUrl} className="w-40 h-24 object-cover border border-line" muted />
            <span className="text-[12.5px] text-slate-500">Current video — upload a new file to replace it.</span>
            <input type="hidden" name="existingVideoUrl" value={subService.videoUrl} />
          </div>
        ) : null}
        <input name="video" type="file" accept="video/*" className="w-full text-[13.5px]" />
        {subService.videoUrl ? (
          <label className="flex items-center gap-2 text-[12.5px] text-red-700">
            <input type="checkbox" name="removeVideo" className="w-3.5 h-3.5" />
            Remove the current video
          </label>
        ) : null}
        <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--btn-radius)] self-start">
          Save Video
        </button>
      </form>

      {/* Design controls — identical mechanism to a main Service page */}
      <TypographyForm page={page} saved={content.typography ?? {}} />
      <PageHeaderForm page={page} saved={content.pageHeader ?? {}} />
      <SectionAnimationsForm
        page={page}
        sections={SUB_SERVICE_SECTIONS}
        savedAnimations={content.sectionAnimations ?? {}}
        savedVisibility={content.sectionVisibility ?? {}}
        savedEffects={content.sectionEffects ?? {}}
      />
      </div>

      <div className="bg-white border border-line p-6 max-w-3xl">
        <h2 className="text-[15px] font-bold text-ink mb-1">Add More Content</h2>
        <p className="text-[12.5px] text-slate-400 mb-3">
          Need something beyond the main content above — an extra photo, a quote, a gallery, a second call-to-action?
          Add it in the Page Builder, on this sub-service's own key.
        </p>
        <Link
          href={`/admin/builder?page=${encodeURIComponent(page)}`}
          className="inline-block text-[13px] font-semibold text-ink border-b border-ink pb-0.5"
        >
          Open in Page Builder &rarr;
        </Link>
      </div>
    </div>
  );
}
