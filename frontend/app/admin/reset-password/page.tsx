import Link from "next/link";
import { resetPasswordAction } from "@/lib/admin-actions";
import PasswordField from "@/components/admin/PasswordField";
import { getSiteConfig } from "@/lib/api";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string; email?: string };
}) {
  const siteConfig = await getSiteConfig();
  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-6">
      <div className="bg-white w-full max-w-sm p-8 rounded-[var(--radius)]">
        <div className="flex items-center gap-2.5 mb-1">
          <svg width="24" height="24" viewBox="0 0 30 30" fill="none" aria-hidden="true">
            <path d="M15 2L27 8V15C27 21.5 21.8 26.8 15 28C8.2 26.8 3 21.5 3 15V8L15 2Z" stroke="#B08D3F" strokeWidth="1.8" />
            <path d="M9.5 15.3L13 18.8L20.5 11.2" stroke="#B08D3F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-serif text-lg font-semibold text-ink">{siteConfig.name}</span>
        </div>
        <div className="text-[13px] text-muted mb-6">Enter your code &amp; new password</div>

        {searchParams.error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 text-[13px] px-4 py-3 mb-5">
            {searchParams.error}
          </div>
        ) : null}

        <form action={resetPasswordAction} className="flex flex-col gap-4">
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
              className="w-full border border-line px-3.5 py-2.5 text-[14px] focus:outline-none focus:border-ink"
            />
          </div>
          <div>
            <label htmlFor="otp" className="block text-[13px] font-semibold text-ink mb-1.5">
              Verification Code
            </label>
            <input
              id="otp"
              name="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              placeholder="6-digit code"
              className="w-full border border-line px-3.5 py-2.5 text-[14px] tracking-[0.3em] focus:outline-none focus:border-ink"
            />
          </div>
          <PasswordField id="newPassword" name="newPassword" label="New Password" autoComplete="new-password" />
          <PasswordField id="confirmPassword" name="confirmPassword" label="Confirm New Password" autoComplete="new-password" />
          <p className="text-[12px] text-slate-500 -mt-1">At least 10 characters.</p>

          <button
            type="submit"
            className="bg-gold text-[#1A1204] font-semibold text-[14.5px] px-5 py-3 rounded-[var(--radius)] mt-2"
          >
            Reset Password
          </button>
        </form>

        <div className="flex items-center justify-between mt-6 text-[12.5px] font-medium">
          <Link href="/admin/forgot-password" className="text-slate-500 hover:text-ink">
            Resend code
          </Link>
          <Link href="/admin/login" className="text-slate-500 hover:text-ink">
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
