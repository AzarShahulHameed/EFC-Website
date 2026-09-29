import { redirect } from "next/navigation";
import Link from "next/link";
import { adminFetch } from "@/lib/session";
import { createTestimonialAction, updateTestimonialsDisplayAction } from "@/lib/admin-actions";
import FieldLabel from "@/components/admin/FieldLabel";
import TestimonialFieldsForm from "@/components/admin/TestimonialFieldsForm";
import ImageUploadField from "@/components/admin/ImageUploadField";
import TestimonialsDisplayForm from "@/components/admin/TestimonialsDisplayForm";
import { EditorLayout } from "@/components/admin/PreviewPanel";
import TestimonialsTableBody from "@/components/admin/reorder/TestimonialsTableBody";

export default async function AdminTestimonialsPage({
  searchParams,
}: {
  searchParams: { error?: string; saved?: string };
}) {
  const [res, contentRes] = await Promise.all([
    adminFetch("/testimonials/admin/all"),
    adminFetch("/content/global/en"),
  ]);
  if (res.status === 401) redirect("/admin/login");
  const testimonials: any[] = res.ok ? await res.json() : [];
  const content: any = contentRes.ok ? await contentRes.json() : {};
  const display = {
    layout: "grid",
    cardSize: "md",
    autoAdvanceSpeed: "normal",
    pauseOnHover: true,
    showOnServicesPage: false,
    showOnServiceDetailPage: false,
    showOnSubServicePage: false,
    googleReviewUrl: undefined,
    googleRating: undefined,
    googleReviewCount: undefined,
    showGoogleBadge: false,
    showOnContactPage: false,
    sectionBackgroundColor: "",
    ...(content.testimonialsDisplay ?? {}),
  };
  const activeTestimonials = testimonials
    .filter((t) => t.isActive)
    .map((t) => ({
      quote: t.translations?.find((tr: any) => tr.languageCode === "en")?.quote ?? t.translations?.[0]?.quote ?? "",
      name: t.clientName,
      role: t.clientTitle,
      photoUrl: t.clientPhotoUrl ?? undefined,
      rating: typeof t.rating === "number" ? t.rating : 5,
    }))
    .filter((t) => t.quote);

  return (
    <div className="px-9 py-8">
      <h1 className="text-2xl font-bold text-ink mb-1">Testimonials</h1>
      <p className="text-[13.5px] text-slate-500 mb-7">Client quotes shown on the homepage slider.</p>


      <div className="bg-white border border-line mb-8 overflow-x-auto">
        {testimonials.length === 0 ? (
          <div className="px-6 py-8 text-[13.5px] text-slate-400">No testimonials yet — add the first one below.</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left">
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide" colSpan={2}>Order</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Client</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Quote</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide"></th>
              </tr>
            </thead>
            <TestimonialsTableBody testimonials={testimonials} />
          </table>
        )}
      </div>

      <EditorLayout label="Live Preview">
      <div className="bg-white border border-line p-6 max-w-2xl mb-8">
        <h2 className="text-[15px] font-bold text-ink mb-1">Display Settings</h2>
        <p className="text-[12.5px] text-slate-400 mb-4">How the testimonials section behaves and looks.</p>
        <form action={updateTestimonialsDisplayAction} className="flex flex-col gap-4">
          <TestimonialsDisplayForm
            testimonials={activeTestimonials}
            defaultLayout={display.layout}
            defaultCardSize={display.cardSize}
            defaultAutoAdvanceSpeed={display.autoAdvanceSpeed}
            defaultPauseOnHover={display.pauseOnHover}
            defaultShowOnServicesPage={display.showOnServicesPage}
            defaultShowOnServiceDetailPage={display.showOnServiceDetailPage}
            defaultShowOnSubServicePage={display.showOnSubServicePage}
            defaultGoogleReviewUrl={display.googleReviewUrl}
            defaultGoogleRating={display.googleRating}
            defaultGoogleReviewCount={display.googleReviewCount}
            defaultShowGoogleBadge={display.showGoogleBadge}
            defaultShowOnContactPage={display.showOnContactPage}
            defaultSectionBackgroundColor={display.sectionBackgroundColor}
          />
          <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)] self-start">
            Save Display Settings
          </button>
        </form>
      </div>
      </EditorLayout>

      <EditorLayout>
      <div className="bg-white border border-line p-6 max-w-2xl">
        <h2 className="text-[15px] font-bold text-ink mb-4">Add a Testimonial</h2>
        <form action={createTestimonialAction} encType="multipart/form-data" className="flex flex-col gap-4">
          <div>
            <FieldLabel htmlFor="languageCode" hint="Which language this quote is written in. Add other languages from the Edit screen afterward.">Language</FieldLabel>
            <select id="languageCode" name="languageCode" defaultValue="en" className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white">
              <option value="en">English</option>
              <option value="ar">Arabic</option>
              <option value="de">German</option>
            </select>
          </div>

          <TestimonialFieldsForm />

          <div>
            <FieldLabel htmlFor="rating" hint="1–5 stars, shown next to the quote if your design uses it.">Rating</FieldLabel>
            <select id="rating" name="rating" defaultValue="5" className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white">
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>
              ))}
            </select>
          </div>
          <ImageUploadField
            id="clientPhoto"
            label="Client Photo"
            hint="Optional headshot. Uploaded to Cloudinary; leave empty for no photo."
            fileFieldName="clientPhoto"
          />
          <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)] self-start">
            Add Testimonial
          </button>
        </form>
      </div>
      </EditorLayout>
    </div>
  );
}
