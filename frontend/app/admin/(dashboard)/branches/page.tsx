import Link from "next/link";
import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";
import { createBranchAction } from "@/lib/admin-actions";
import FieldLabel from "@/components/admin/FieldLabel";
import BranchesTableBody from "@/components/admin/reorder/BranchesTableBody";
import { COUNTRIES } from "@/lib/countries";

export default async function AdminBranchesPage({
  searchParams,
}: {
  searchParams: { error?: string; saved?: string };
}) {
  const res = await adminFetch("/branches/admin/all");
  if (res.status === 401) redirect("/admin/login");
  const branches: any[] = res.ok ? await res.json() : [];

  return (
    <div className="px-9 py-8">
      <h1 className="text-2xl font-bold text-ink mb-1">Branches &amp; Locations</h1>
      <p className="text-[13.5px] text-slate-500 mb-7">
        Powers every location dropdown and the /contact page's office list on the public site.
      </p>


      <div className="bg-white border border-line mb-8 overflow-x-auto">
        {branches.length === 0 ? (
          <div className="px-6 py-8 text-[13.5px] text-slate-400">No branches yet — add the first one below.</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left">
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide" colSpan={2}>Order</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">City</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Country</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Address</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Phone</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide"></th>
              </tr>
            </thead>
            <BranchesTableBody branches={branches} />
          </table>
        )}
      </div>

      <div className="bg-white border border-line p-6 max-w-xl">
        <h2 className="text-[15px] font-bold text-ink mb-4">Add a Branch</h2>
        <form action={createBranchAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="city" hint="Shown as the branch name throughout the site (e.g. 'Dubai').">City</FieldLabel>
              <input id="city" name="city" required className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
            </div>
            <div>
              <FieldLabel htmlFor="country" hint="Groups branches for the site's location picker (Site Settings → Location Gate), and matches a flag icon next to this branch in the header's location dropdown — pick from the list so the flag matches reliably. Leave empty to default to United Arab Emirates.">Country</FieldLabel>
              <input id="country" name="country" list="country-list" placeholder="United Arab Emirates" className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
              <datalist id="country-list">
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.name} />
                ))}
              </datalist>
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="addressLine" hint="Full street address, shown on the Contact page.">Address</FieldLabel>
            <input id="addressLine" name="addressLine" required className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="phone" hint="Main landline, shown on the Contact page and used for the tel: link.">Phone</FieldLabel>
              <input id="phone" name="phone" required className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
            </div>
            <div>
              <FieldLabel htmlFor="whatsapp" hint="Optional — number for the WhatsApp contact option, if you use one.">WhatsApp</FieldLabel>
              <input id="whatsapp" name="whatsapp" className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="email" hint="Branch-specific email, shown on the Contact page.">Email</FieldLabel>
            <input id="email" name="email" type="email" required className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div>
            <FieldLabel htmlFor="workingHours" hint="Free text, shown as-is on the Contact page (e.g. 'Sun–Thu, 9:00 AM – 6:00 PM').">Working Hours</FieldLabel>
            <input id="workingHours" name="workingHours" placeholder="Sun–Thu, 9:00 AM – 6:00 PM" required className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div>
            <FieldLabel htmlFor="googleMapsUrl" hint="Optional — full Google Maps link, used for a 'Get Directions' link if your design shows one.">Google Maps URL</FieldLabel>
            <input id="googleMapsUrl" name="googleMapsUrl" className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div>
            <FieldLabel htmlFor="externalUrl" hint="Only if this location already has its own separate website. If set, choosing this location on the site's location picker sends visitors straight there instead of into this site.">
              External Website URL (optional)
            </FieldLabel>
            <input id="externalUrl" name="externalUrl" placeholder="https://" className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)] self-start">
            Add Branch
          </button>
        </form>
      </div>
    </div>
  );
}
