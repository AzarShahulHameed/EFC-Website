import Link from "next/link";
import { requestPasswordResetAction } from "@/lib/admin-actions";
import { getSiteConfig } from "@/lib/api";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: { sent?: string; email?: string };
}) {
  const sent = searchParams.sent === "1";
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
        <div className="text-[13px] text-muted mb-6">Reset your password</div>

        {sent ? (
          <>
            <div className="bg-green-50 border border-green-200 text-green-800 text-[13px] px-4 py-3 mb-5 leading-relaxed">
              If an account exists for <strong>{searchParams.email}</strong>, a 6-digit code has been emailed to it.
              The code expires in 10 minutes.
            </div>
            <Link
              href={`/admin/reset-password${searchParams.email ? `?email=${encodeURIComponent(searchParams.email)}` : ""}`}
              className="block text-center bg-gold text-[#1A1204] font-semibold text-[14.5px] px-5 py-3 rounded-[var(--radius)]"
            >
              I have my code
            </Link>
          </>
        ) : (
          <form action={requestPasswordResetAction} className="flex flex-col gap-4">
            <p className="text-[13px] text-slate-500 -mt-2 leading-relaxed">
              Enter your admin account&apos;s email and we&apos;ll send a 6-digit verification code to reset your
              password.
            </p>
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
            <button
              type="submit"
              className="bg-gold text-[#1A1204] font-semibold text-[14.5px] px-5 py-3 rounded-[var(--radius)] mt-2"
            >
              Send Reset Code
            </button>
          </form>
        )}

        <Link href="/admin/login" className="block text-center text-[12.5px] font-medium text-slate-500 hover:text-ink mt-6">
          ← Back to sign in
        </Link>
      </div>
    </div>
  );
}
