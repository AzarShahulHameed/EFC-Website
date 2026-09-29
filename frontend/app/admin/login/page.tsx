import Link from "next/link";
import { loginAction } from "@/lib/admin-actions";
import PasswordField from "@/components/admin/PasswordField";
import { getSiteConfig } from "@/lib/api";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string; mfa?: string; email?: string; reset?: string };
}) {
  const mfaStep = searchParams.mfa === "1";
  // Was a hardcoded "Sterling & Vance" placeholder regardless of what's set
  // in Site Settings — same bug the dashboard sidebar had (see
  // app/admin/(dashboard)/layout.tsx), just on the page that renders before
  // that layout even applies. Same source of truth now, everywhere.
  const siteConfig = await getSiteConfig();

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-6 relative overflow-hidden">
      {/* Two soft radial glows — purely decorative, gives the login screen
          some depth instead of a flat navy field. */}
      <div className="pointer-events-none absolute -top-40 -left-32 w-[420px] h-[420px] rounded-full bg-gold/[0.08] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -right-24 w-[480px] h-[480px] rounded-full bg-navy-2/60 blur-3xl" />

      <div className="bg-white w-full max-w-sm p-8 rounded-[var(--radius)] shadow-2xl relative">
        {/* The uploaded logo (Admin → Site Settings) was never actually
            rendered here before — this always fell straight through to the
            hardcoded shield icon regardless of what was set. Centered as a
            column (not the old inline left-aligned row) since a real logo
            reads better as its own centered lockup on a sign-in screen; size
            is Admin → Site Settings → Logo Sizing → "Login Screen Logo
            Height", not a fixed value. */}
        <div className="flex flex-col items-center text-center gap-2.5 mb-1">
          {siteConfig.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={siteConfig.logoUrl}
              alt={siteConfig.name}
              style={{ height: siteConfig.logoSizing.loginHeight }}
              className="w-auto max-w-[220px] object-contain"
            />
          ) : (
            <svg width="24" height="24" viewBox="0 0 30 30" fill="none" aria-hidden="true">
              <path d="M15 2L27 8V15C27 21.5 21.8 26.8 15 28C8.2 26.8 3 21.5 3 15V8L15 2Z" stroke="#B08D3F" strokeWidth="1.8" />
              <path d="M9.5 15.3L13 18.8L20.5 11.2" stroke="#B08D3F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          <span className="font-serif text-lg font-semibold text-ink">{siteConfig.name}</span>
        </div>
        <div className="text-[13px] text-muted text-center mb-6">Admin sign in</div>

        {searchParams.error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 text-[13px] px-4 py-3 mb-5">
            Invalid email, password{mfaStep ? ", or authenticator code" : ""}.
          </div>
        ) : null}
        {searchParams.reset === "1" ? (
          <div className="bg-green-50 border border-green-200 text-green-800 text-[13px] px-4 py-3 mb-5">
            Your password has been reset — sign in with your new password.
          </div>
        ) : null}

        <form action={loginAction} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-[13px] font-semibold text-ink mb-1.5">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              defaultValue={searchParams.email ?? ""}
              className="w-full border border-line px-3.5 py-2.5 text-[14px] rounded-[var(--radius)] focus:outline-none focus:border-ink"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-[13px] font-semibold text-ink">
                Password
              </label>
              <Link href="/admin/forgot-password" className="text-[12.5px] font-medium text-[#8A6D2E] hover:underline">
                Forgot password?
              </Link>
            </div>
            <PasswordField id="password" name="password" label="" autoComplete="current-password" />
          </div>

          {mfaStep ? (
            <div>
              <label htmlFor="mfaCode" className="block text-[13px] font-semibold text-ink mb-1.5">
                Authenticator Code
              </label>
              <input
                id="mfaCode"
                name="mfaCode"
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                placeholder="6-digit code"
                className="w-full border border-line px-3.5 py-2.5 text-[14px] tracking-[0.3em] rounded-[var(--radius)] focus:outline-none focus:border-ink"
              />
              <p className="text-[12px] text-slate-500 mt-2">
                Password verified — enter the code from your authenticator app to finish signing in.
              </p>
            </div>
          ) : null}

          <button
            type="submit"
            className="bg-gold text-[#1A1204] font-semibold text-[14.5px] px-5 py-3 rounded-[var(--radius)] mt-2"
          >
            {mfaStep ? "Verify & Sign In" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
