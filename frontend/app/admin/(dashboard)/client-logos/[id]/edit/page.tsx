import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { adminFetch } from "@/lib/session";
import { updateClientLogoAction } from "@/lib/admin-actions";
import FieldLabel from "@/components/admin/FieldLabel";
import ImageUploadField from "@/components/admin/ImageUploadField";

export default async function EditClientLogoPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const res = await adminFetch("/client-logos/admin/all");
  if (res.status === 401) redirect("/admin/login");
  const logos: any[] = res.ok ? await res.json() : [];
  const logo = logos.find((l) => l.id === params.id);
  if (!logo) notFound();

  const action = updateClientLogoAction.bind(null, params.id, logo.imageUrl);

  return (
    <div className="px-9 py-8">
      <div className="mb-1 flex items-center gap-2 text-[13px]">
        <Link href="/admin/client-logos" className="text-slate-500 hover:text-ink">
          Client Logos
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-ink font-medium">Edit</span>
      </div>
      <h1 className="text-2xl font-bold text-ink mb-1">Edit Logo</h1>
      <p className="text-[13.5px] text-slate-500 mb-7">The logo carousel shown on the homepage.</p>


      <div className="bg-white border border-line p-6 max-w-md">
        <form action={action} encType="multipart/form-data" className="flex flex-col gap-4">
          <div>
            <FieldLabel htmlFor="name" hint="Used as the image's alt text for accessibility and SEO.">Client / Company Name</FieldLabel>
            <input id="name" name="name" defaultValue={logo.name} required className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <ImageUploadField
            id="logo"
            label="Logo Image"
            hint="Leave empty to keep the current image. PNG or SVG with a transparent background works best."
            fileFieldName="logo"
            currentUrl={logo.imageUrl}
            previewClassName="h-12 object-contain"
          />
          <div className="flex gap-3 mt-2">
            <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)]">
              Save Changes
            </button>
            <Link
              href="/admin/client-logos"
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
