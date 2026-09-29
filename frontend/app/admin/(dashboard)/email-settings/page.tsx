import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";
import { updateEmailSettingsAction, sendTestEmailAction } from "@/lib/admin-actions";

type EmailSettings = {
  provider: "smtp" | "resend";
  fromName: string;
  fromEmail: string;
  smtpHost: string;
  smtpPort: number | null;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassSet: boolean;
  resendApiKeySet: boolean;
  source: "db" | "env";
  configured: boolean;
};

export default async function AdminEmailSettingsPage() {
  const meRes = await adminFetch("/auth/me");
  if (meRes.status === 401) redirect("/admin/login");
  const me: any = meRes.ok ? await meRes.json() : null;

  if (me?.role !== "ADMIN" && me?.role !== "SUPER_ADMIN") {
    return (
      <div className="px-9 py-8">
        <h1 className="text-2xl font-bold text-ink mb-1">Email Settings</h1>
        <div className="bg-amber-50 border border-amber-200 px-5 py-4 mt-6 max-w-xl text-[13.5px] text-amber-800 rounded-[var(--radius)]">
          This page is only available to Admins and Super Admins.
        </div>
      </div>
    );
  }

  const res = await adminFetch("/settings/email");
  if (res.status === 401) redirect("/admin/login");
  const settings: EmailSettings | null = res.ok ? await res.json() : null;
  const provider = settings?.provider ?? "smtp";

  return (
    <div className="px-9 py-8">
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-2xl font-bold text-ink">Email Settings</h1>
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
        Powers OTP verification emails (Security page, Forgot Password) and any other outbound email. Choose SMTP
        (any provider) or Resend.{" "}
        {settings?.source === "env" ? "Currently falling back to values from the API's .env file." : null}
      </p>

      <form action={updateEmailSettingsAction} className="bg-white border border-line p-6 max-w-xl flex flex-col gap-5">
        <div>
          <label className="block text-[13px] font-semibold text-ink mb-2">Provider</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-[13.5px] text-ink">
              <input type="radio" name="provider" value="smtp" defaultChecked={provider === "smtp"} />
              SMTP
            </label>
            <label className="flex items-center gap-2 text-[13.5px] text-ink">
              <input type="radio" name="provider" value="resend" defaultChecked={provider === "resend"} />
              Resend
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="fromName" className="block text-[13px] font-semibold text-ink mb-1.5">
              From name
            </label>
            <input
              id="fromName"
              name="fromName"
              type="text"
              defaultValue={settings?.fromName ?? ""}
              placeholder="EFC"
              className="w-full border border-line px-3.5 py-2.5 text-[14px] rounded-[var(--radius)] focus:outline-none focus:border-ink"
            />
          </div>
          <div>
            <label htmlFor="fromEmail" className="block text-[13px] font-semibold text-ink mb-1.5">
              From email
            </label>
            <input
              id="fromEmail"
              name="fromEmail"
              type="email"
              defaultValue={settings?.fromEmail ?? ""}
              placeholder="no-reply@yourdomain.com"
              className="w-full border border-line px-3.5 py-2.5 text-[14px] rounded-[var(--radius)] focus:outline-none focus:border-ink"
            />
          </div>
        </div>

        <div className="border-t border-line pt-5">
          <h2 className="text-[13px] font-bold text-ink mb-3">SMTP</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="smtpHost" className="block text-[13px] font-semibold text-ink mb-1.5">
                Host
              </label>
              <input
                id="smtpHost"
                name="smtpHost"
                type="text"
                defaultValue={settings?.smtpHost ?? ""}
                placeholder="smtp.sendgrid.net"
                className="w-full border border-line px-3.5 py-2.5 text-[14px] rounded-[var(--radius)] focus:outline-none focus:border-ink"
              />
            </div>
            <div>
              <label htmlFor="smtpPort" className="block text-[13px] font-semibold text-ink mb-1.5">
                Port
              </label>
              <input
                id="smtpPort"
                name="smtpPort"
                type="number"
                defaultValue={settings?.smtpPort ?? 587}
                className="w-full border border-line px-3.5 py-2.5 text-[14px] rounded-[var(--radius)] focus:outline-none focus:border-ink"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="smtpUser" className="block text-[13px] font-semibold text-ink mb-1.5">
                Username
              </label>
              <input
                id="smtpUser"
                name="smtpUser"
                type="text"
                defaultValue={settings?.smtpUser ?? ""}
                className="w-full border border-line px-3.5 py-2.5 text-[14px] rounded-[var(--radius)] focus:outline-none focus:border-ink"
              />
            </div>
            <div>
              <label htmlFor="smtpPass" className="block text-[13px] font-semibold text-ink mb-1.5">
                Password
              </label>
              <input
                id="smtpPass"
                name="smtpPass"
                type="password"
                placeholder={settings?.smtpPassSet ? "•••••••• (leave blank to keep)" : ""}
                className="w-full border border-line px-3.5 py-2.5 text-[14px] rounded-[var(--radius)] focus:outline-none focus:border-ink"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-[13px] text-ink">
            <input type="checkbox" name="smtpSecure" value="1" defaultChecked={settings?.smtpSecure} />
            Use TLS (usually on for port 465)
          </label>
        </div>

        <div className="border-t border-line pt-5">
          <h2 className="text-[13px] font-bold text-ink mb-3">Resend</h2>
          <label htmlFor="resendApiKey" className="block text-[13px] font-semibold text-ink mb-1.5">
            API key
          </label>
          <input
            id="resendApiKey"
            name="resendApiKey"
            type="password"
            placeholder={settings?.resendApiKeySet ? "•••••••• (leave blank to keep)" : "re_xxxxxxxxxxxx"}
            className="w-full border border-line px-3.5 py-2.5 text-[14px] rounded-[var(--radius)] focus:outline-none focus:border-ink"
          />
          <p className="text-[11.5px] text-slate-400 mt-1.5">
            From your Resend dashboard at{" "}
            <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" className="underline hover:text-ink">
              resend.com/api-keys
            </a>
            .
          </p>
        </div>

        <button
          type="submit"
          className="bg-gold hover:bg-gold-light text-[#1A1204] font-semibold text-[14px] px-5 py-2.5 rounded-[var(--btn-radius)] self-start transition-colors"
        >
          Save changes
        </button>
      </form>

      <form action={sendTestEmailAction} className="mt-5">
        <button
          type="submit"
          className="border border-line text-ink font-semibold text-[13px] px-4.5 py-2.5 rounded-[var(--btn-radius)] hover:border-ink transition-colors"
        >
          Send test email to myself
        </button>
      </form>
    </div>
  );
}
