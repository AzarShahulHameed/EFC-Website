import Link from "next/link";
import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";
import { createServiceAction } from "@/lib/admin-actions";
import FieldLabel from "@/components/admin/FieldLabel";
import ServiceFieldsForm from "@/components/admin/ServiceFieldsForm";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { EditorLayout } from "@/components/admin/PreviewPanel";
import ServicesTableBody from "@/components/admin/reorder/ServicesTableBody";

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: { error?: string; saved?: string };
}) {
  const [res, teamRes] = await Promise.all([
    adminFetch("/services/admin/all"),
    adminFetch("/team/admin/all"),
  ]);
  if (res.status === 401) redirect("/admin/login");
  const services: any[] = res.ok ? await res.json() : [];
  const team: any[] = teamRes.ok ? await teamRes.json() : [];

  return (
    <div className="px-9 py-8">
      <h1 className="text-2xl font-bold text-ink mb-1">Services</h1>
      <p className="text-[13.5px] text-slate-500 mb-7">
        Add, edit, and enable or disable the services shown on the public site — changes are live immediately, no
        deploy needed. Use the arrows to change which service shows first, on the homepage and the Services page.
      </p>


      <div className="bg-white border border-line mb-8 overflow-x-auto">
        {services.length === 0 ? (
          <div className="px-6 py-8 text-[13.5px] text-slate-400">No services yet — add the first one below.</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left">
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide" colSpan={2}>Order</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide"></th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Title</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Slug</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide"></th>
              </tr>
            </thead>
            <ServicesTableBody services={services} />
          </table>
        )}
      </div>

      <EditorLayout>
      <div className="bg-white border border-line p-6 max-w-3xl">
        <h2 className="text-[15px] font-bold text-ink mb-4">Add a Service</h2>
        <form action={createServiceAction} className="flex flex-col gap-4">
          <div>
            <FieldLabel htmlFor="languageCode" hint="Which language this initial title/summary/description is written in. Add the other languages afterward from the Edit screen.">
              Language
            </FieldLabel>
            <select id="languageCode" name="languageCode" defaultValue="en" className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white">
              <option value="en">English</option>
              <option value="ar">Arabic</option>
              <option value="de">German</option>
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="slug" hint="URL-safe identifier, e.g. 'transfer-pricing' becomes /services/transfer-pricing. Can't be changed later without breaking links.">
              Slug
            </FieldLabel>
            <input
              id="slug"
              name="slug"
              required
              placeholder="e.g. transfer-pricing"
              className="w-full border border-line px-3.5 py-2.5 text-[14px] focus:outline-none focus:border-ink"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ImageUploadField
              id="image"
              label="Image"
              hint="Shown on the service's card (homepage/Services list) and its detail page. Uploaded to Cloudinary."
              fileFieldName="image"
            />
            <div>
              <FieldLabel htmlFor="imagePosition" hint="Which part of the image stays visible when it's cropped to fit.">
                Image Position
              </FieldLabel>
              <select id="imagePosition" name="imagePosition" defaultValue="center" className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white">
                <option value="top">Top</option>
                <option value="center">Center</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>
          </div>

          <div>
            <FieldLabel htmlFor="responsiblePersonId" hint="Who a visitor should contact about this service — shown on the detail page with their photo, name, position and linked-in/email/phone icons. Pulled from Team; add someone there first if they're not listed. Optional.">
              Responsible Person
            </FieldLabel>
            <select id="responsiblePersonId" name="responsiblePersonId" defaultValue="" className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white">
              <option value="">— None —</option>
              {team.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <p className="text-[12px] text-slate-400 -mt-1">
            Detail page content below is optional — fill it in now, or add/change it later from the Edit screen.
          </p>
          <ServiceFieldsForm defaults={{}} />

          <div className="border-t border-line pt-4 mt-1">
            <h3 className="text-[13px] font-bold text-ink mb-2">Frequently Asked Questions</h3>
            <p className="text-[12.5px] text-slate-500 mb-3">
              Shown on the service page and marked up as FAQ schema for search engines and AI answers. Leave a
              row's question blank to skip it.
            </p>
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="border border-line p-3 flex flex-col gap-2">
                  <input
                    name={`faq_${i}_question`}
                    placeholder={`Question ${i + 1}`}
                    className="w-full border border-line px-3 py-2 text-[13.5px] font-medium"
                  />
                  <textarea
                    name={`faq_${i}_answer`}
                    placeholder="Answer"
                    rows={2}
                    className="w-full border border-line px-3 py-2 text-[13.5px]"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)] self-start mt-2"
          >
            Create Service
          </button>
        </form>
        <p className="text-[12px] text-slate-400 mt-4">
          After creating a service, use its Edit screen to add the remaining languages.
        </p>
        {team.length === 0 ? (
          <p className="text-[12px] text-slate-400 mt-1">
            No team members yet — add one in Team first if you want to assign a Responsible Person here.
          </p>
        ) : null}
      </div>
      </EditorLayout>
    </div>
  );
}
