import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { adminFetch } from "@/lib/session";
import { updateTestimonialAction, autoTranslateTestimonialAction } from "@/lib/admin-actions";
import FieldLabel from "@/components/admin/FieldLabel";
import LanguageTabs from "@/components/admin/LanguageTabs";
import TestimonialFieldsForm from "@/components/admin/TestimonialFieldsForm";
import ImageUploadField from "@/components/admin/ImageUploadField";
import AutoTranslateButton from "@/components/admin/AutoTranslateButton";
import { EditorLayout } from "@/components/admin/PreviewPanel";
import { locales, languageNames, defaultLocale } from "@/lib/i18n";

export default async function EditTestimonialPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { lang?: string; saved?: string; error?: string };
}) {
  const lang = searchParams.lang ?? "en";
  const res = await adminFetch("/testimonials/admin/all");
  if (res.status === 401) redirect("/admin/login");
  const all: any[] = res.ok ? await res.json() : [];
  const testimonial = all.find((t) => t.id === params.id);
  if (!testimonial) notFound();

  const translation = testimonial.translations?.find((t: any) => t.languageCode === lang);

  return (
    <div className="px-9 py-8">
      <Link href="/admin/testimonials" className="text-[13px] font-semibold text-muted hover:text-ink">
        &larr; Testimonials
      </Link>
      <h1 className="text-2xl font-bold text-ink mt-4 mb-1">Edit Testimonial — {testimonial.clientName}</h1>
      <p className="text-[13.5px] text-slate-500 mb-5">
        Client name, title, photo and rating are shared across languages — the quote is per language.
      </p>

      <LanguageTabs basePath={`/admin/testimonials/${testimonial.id}/edit`} current={lang} />

      {!translation ? (
        <div className="bg-slate-50 border border-line px-5 py-3 mb-6 text-[13.5px] text-ink max-w-xl">
          No {lang.toUpperCase()} translation yet — fill in the quote below to add one.
        </div>
      ) : null}

      {lang === defaultLocale ? (
        <div className="max-w-3xl">
          <AutoTranslateButton
            action={autoTranslateTestimonialAction.bind(null, testimonial.id)}
            targetLanguages={locales.filter((l) => l !== defaultLocale)}
            labels={languageNames}
          />
        </div>
      ) : null}

      <EditorLayout>
      <form
        action={updateTestimonialAction.bind(null, testimonial.id, testimonial.clientPhotoUrl)}
        encType="multipart/form-data"
        className="bg-white border border-line p-6 max-w-2xl flex flex-col gap-4"
      >
        <input type="hidden" name="languageCode" value={lang} />

        <ImageUploadField
          id="clientPhoto"
          label="Client Photo"
          hint="Optional headshot. Uploaded to Cloudinary; leave empty for no photo. Shared across every language."
          fileFieldName="clientPhoto"
          currentUrl={testimonial.clientPhotoUrl}
          previewClassName="w-16 h-16 rounded-full object-cover border border-line"
        />

        <TestimonialFieldsForm
          defaultClientName={testimonial.clientName}
          defaultClientTitle={testimonial.clientTitle ?? ""}
          defaultValueHtml={translation?.quote ?? ""}
          quoteLabel={`Quote (${lang.toUpperCase()})`}
        />

        <div>
          <FieldLabel htmlFor="rating" hint="Shared across every language.">Rating</FieldLabel>
          <select id="rating" name="rating" defaultValue={String(testimonial.rating ?? 5)} className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white">
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>
            ))}
          </select>
        </div>

        <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)] self-start">
          Save Changes
        </button>
      </form>
      </EditorLayout>
    </div>
  );
}
