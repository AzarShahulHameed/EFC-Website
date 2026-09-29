import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { adminFetch } from "@/lib/session";
import { updateBranchAction } from "@/lib/admin-actions";
import FieldLabel from "@/components/admin/FieldLabel";
import { COUNTRIES } from "@/lib/countries";

export default async function EditBranchPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const res = await adminFetch(`/branches/admin/${params.id}`);
  if (res.status === 401) redirect("/admin/login");
  if (res.status === 404) notFound();
  const branch: any = res.ok ? await res.json() : null;
  if (!branch) notFound();

  const action = updateBranchAction.bind(null, params.id);

  return (
    <div className="px-9 py-8">
      <div className="mb-1 flex items-center gap-2 text-[13px]">
        <Link href="/admin/branches" className="text-slate-500 hover:text-ink">
          Branches &amp; Locations
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-ink font-medium">Edit</span>
      </div>
      <h1 className="text-2xl font-bold text-ink mb-1">Edit Branch</h1>
      <p className="text-[13.5px] text-slate-500 mb-7">
        Powers every location dropdown and the /contact page's office list on the public site.
      </p>


      <div className="bg-white border border-line p-6 max-w-xl">
        <form action={action} className="flex flex-col gap-4">
          <div>
            <FieldLabel htmlFor="city" hint="Shown as the branch name throughout the site (e.g. 'Dubai').">City</FieldLabel>
            <input id="city" name="city" defaultValue={branch.city} required className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div>
            <FieldLabel htmlFor="country" hint="Optional — country this branch is in. Also groups branches for the location picker (Site Settings → Location Gate) — two branches sharing the exact same value here appear as one choice in that picker — and matches a flag icon to this branch in the header's location dropdown, so pick from the list for a reliable match.">Country</FieldLabel>
            <input id="country" name="country" list="country-list" defaultValue={branch.country ?? ""} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
            <datalist id="country-list">
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.name} />
              ))}
            </datalist>
          </div>
          <div>
            <FieldLabel htmlFor="addressLine" hint="Full street address, shown on the Contact page.">Address</FieldLabel>
            <input id="addressLine" name="addressLine" defaultValue={branch.addressLine} required className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="phone" hint="Main landline, shown on the Contact page and used for the tel: link.">Phone</FieldLabel>
              <input id="phone" name="phone" defaultValue={branch.phone} required className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
            </div>
            <div>
              <FieldLabel htmlFor="whatsapp" hint="Optional — number for the WhatsApp contact option, if you use one.">WhatsApp</FieldLabel>
              <input id="whatsapp" name="whatsapp" defaultValue={branch.whatsapp ?? ""} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="email" hint="Branch-specific email, shown on the Contact page.">Email</FieldLabel>
            <input id="email" name="email" type="email" defaultValue={branch.email} required className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div>
            <FieldLabel htmlFor="workingHours" hint="Free text, shown as-is on the Contact page (e.g. 'Sun–Thu, 9:00 AM – 6:00 PM').">Working Hours</FieldLabel>
            <input id="workingHours" name="workingHours" defaultValue={branch.workingHours} required className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div>
            <FieldLabel htmlFor="googleMapsUrl" hint="Optional — full Google Maps link, used for a 'Get Directions' link if your design shows one.">Google Maps URL</FieldLabel>
            <input id="googleMapsUrl" name="googleMapsUrl" defaultValue={branch.googleMapsUrl ?? ""} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div>
            <FieldLabel htmlFor="externalUrl" hint="Only if this location already has its own separate website. If set, choosing this location on the site's location picker sends visitors straight there instead of into this site.">
              External Website URL (optional)
            </FieldLabel>
            <input id="externalUrl" name="externalUrl" placeholder="https://" defaultValue={branch.externalUrl ?? ""} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div className="flex gap-3 mt-2">
            <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)]">
              Save Changes
            </button>
            <Link
              href="/admin/branches"
              className="border border-line text-ink font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)] flex items-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
