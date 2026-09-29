import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";
import {
  createClientLogoAction,
  updateClientLogosDisplayAction,
} from "@/lib/admin-actions";
import FieldLabel from "@/components/admin/FieldLabel";
import ClientLogosDisplayForm from "@/components/admin/ClientLogosDisplayForm";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { EditorLayout } from "@/components/admin/PreviewPanel";
import ClientLogosGrid from "@/components/admin/reorder/ClientLogosGrid";

export default async function AdminClientLogosPage({
  searchParams,
}: {
  searchParams: { error?: string; saved?: string };
}) {
  const [res, contentRes] = await Promise.all([
    adminFetch("/client-logos/admin/all"),
    adminFetch("/content/global/en"),
  ]);
  if (res.status === 401) redirect("/admin/login");
  const logos: any[] = res.ok ? await res.json() : [];
  const content: any = contentRes.ok ? await contentRes.json() : {};
  const display = {
    alignment: "center",
    size: "md",
    grayscale: true,
    motion: "scroll",
    speed: "normal",
    pauseOnHover: true,
    showOnServicesPage: false,
    showOnServiceDetailPage: false,
    showOnSubServicePage: false,
    bandColor: "",
    ...(content.clientLogosDisplay ?? {}),
  };
  const activeLogos = logos.filter((l) => l.isActive).map((l) => ({ name: l.name, imageUrl: l.imageUrl }));

  return (
    <div className="px-9 py-8">
      <h1 className="text-2xl font-bold text-ink mb-1">Client Logos</h1>
      <p className="text-[13.5px] text-slate-500 mb-7">The logo carousel shown on the homepage.</p>


      {logos.length === 0 ? (
        <div className="col-span-full px-6 py-8 text-[13.5px] text-slate-400 bg-white border border-line mb-8">
          No logos yet — upload the first one below.
        </div>
      ) : (
        <div className="mb-8">
          <ClientLogosGrid logos={logos} />
        </div>
      )}

      <EditorLayout label="Homepage Preview">
      <div className="bg-white border border-line p-6 max-w-2xl mb-8">
        <h2 className="text-[15px] font-bold text-ink mb-1">Display Settings</h2>
        <p className="text-[12.5px] text-slate-400 mb-4">
          How the &ldquo;Trusted By&rdquo; strip behaves and looks on the homepage.
        </p>
        <form action={updateClientLogosDisplayAction} className="flex flex-col gap-4">
          <ClientLogosDisplayForm
            logos={activeLogos}
            defaultAlignment={display.alignment}
            defaultSize={display.size}
            defaultGrayscale={display.grayscale}
            defaultMotion={display.motion}
            defaultSpeed={display.speed}
            defaultPauseOnHover={display.pauseOnHover}
            defaultShowOnServicesPage={display.showOnServicesPage}
            defaultShowOnServiceDetailPage={display.showOnServiceDetailPage}
            defaultShowOnSubServicePage={display.showOnSubServicePage}
            defaultBandColor={display.bandColor}
          />
          <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)] self-start">
            Save Display Settings
          </button>
        </form>
      </div>
      </EditorLayout>

      <div className="bg-white border border-line p-6 max-w-md">
        <h2 className="text-[15px] font-bold text-ink mb-4">Add a Logo</h2>
        <form action={createClientLogoAction} encType="multipart/form-data" className="flex flex-col gap-4">
          <div>
            <FieldLabel htmlFor="name" hint="Used as the image's alt text for accessibility and SEO.">Client / Company Name</FieldLabel>
            <input id="name" name="name" required className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <ImageUploadField
            id="logo"
            label="Logo Image"
            hint="PNG or SVG with a transparent background works best. Uploaded to Cloudinary."
            fileFieldName="logo"
          />
          <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)] self-start">
            Upload Logo
          </button>
        </form>
      </div>
    </div>
  );
}
