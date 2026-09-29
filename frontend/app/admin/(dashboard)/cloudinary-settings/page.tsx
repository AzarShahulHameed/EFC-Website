import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";
import { updateCloudinarySettingsAction } from "@/lib/admin-actions";

type CloudinarySettings = {
  cloudName: string;
  apiKey: string;
  apiSecretSet: boolean;
  source: "db" | "env";
  configured: boolean;
};

export default async function AdminCloudinarySettingsPage() {
  const meRes = await adminFetch("/auth/me");
  if (meRes.status === 401) redirect("/admin/login");
  const me: any = meRes.ok ? await meRes.json() : null;

  if (me?.role !== "ADMIN" && me?.role !== "SUPER_ADMIN") {
    return (
      <div className="px-9 py-8">
        <h1 className="text-2xl font-bold text-ink mb-1">Cloudinary Settings</h1>
        <div className="bg-amber-50 border border-amber-200 px-5 py-4 mt-6 max-w-xl text-[13.5px] text-amber-800 rounded-[var(--radius)]">
          This page is only available to Admins and Super Admins.
        </div>
      </div>
    );
  }

  const res = await adminFetch("/settings/cloudinary");
  if (res.status === 401) redirect("/admin/login");
  const settings: CloudinarySettings | null = res.ok ? await res.json() : null;

  return (
    <div className="px-9 py-8">
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-2xl font-bold text-ink">Cloudinary Settings</h1>
        {settings?.configured ? (
          <span className="text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
            Configured
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            Not configured
          </span>
        )}
      </div>
      <p className="text-[13.5px] text-slate-500 mb-7 max-w-xl">
        Every image and video an admin uploads (team photos, client logos, service images, hero media, and more)
        goes through this Cloudinary account.{" "}
        {settings?.source === "env" ? "Currently falling back to values from the API's .env file." : null}
      </p>

      <form
        action={updateCloudinarySettingsAction}
        className="bg-white border border-line p-6 max-w-xl flex flex-col gap-5"
      >
        <div>
          <label htmlFor="cloudName" className="block text-[13px] font-semibold text-ink mb-1.5">
            Cloud name
          </label>
          <input
            id="cloudName"
            name="cloudName"
            type="text"
            defaultValue={settings?.cloudName ?? ""}
            placeholder="your-cloud-name"
            className="w-full border border-line px-3.5 py-2.5 text-[14px] rounded-[var(--radius)] focus:outline-none focus:border-ink"
          />
        </div>
        <div>
          <label htmlFor="apiKey" className="block text-[13px] font-semibold text-ink mb-1.5">
            API key
          </label>
          <input
            id="apiKey"
            name="apiKey"
            type="text"
            defaultValue={settings?.apiKey ?? ""}
            className="w-full border border-line px-3.5 py-2.5 text-[14px] rounded-[var(--radius)] focus:outline-none focus:border-ink"
          />
        </div>
        <div>
          <label htmlFor="apiSecret" className="block text-[13px] font-semibold text-ink mb-1.5">
            API secret
          </label>
          <input
            id="apiSecret"
            name="apiSecret"
            type="password"
            placeholder={settings?.apiSecretSet ? "•••••••• (leave blank to keep)" : ""}
            className="w-full border border-line px-3.5 py-2.5 text-[14px] rounded-[var(--radius)] focus:outline-none focus:border-ink"
          />
          <p className="text-[11.5px] text-slate-400 mt-1.5">
            All three values are on your{" "}
            <a
              href="https://console.cloudinary.com/settings/api-keys"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-ink"
            >
              Cloudinary dashboard
            </a>
            . The secret is never shown again after saving.
          </p>
        </div>

        <button
          type="submit"
          className="bg-gold hover:bg-gold-light text-[#1A1204] font-semibold text-[14px] px-5 py-2.5 rounded-[var(--btn-radius)] self-start transition-colors"
        >
          Save changes
        </button>
      </form>
    </div>
  );
}
