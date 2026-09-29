import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";
import {
  confirmMfaAction,
  disableMfaAction,
  setupMfaAction,
  requestPasswordOtpAction,
  confirmPasswordChangeAction,
  requestEmailOtpAction,
  confirmEmailChangeAction,
} from "@/lib/admin-actions";

export default async function AdminSecurityPage({
  searchParams,
}: {
  searchParams: {
    otpauthUrl?: string;
    secret?: string;
    enabled?: string;
    disabled?: string;
    error?: string;
    pwOtpSent?: string;
    pwError?: string;
    pwChanged?: string;
    emOtpSent?: string;
    emNewEmail?: string;
    emError?: string;
    emChanged?: string;
  };
}) {
  const res = await adminFetch("/auth/me");
  if (res.status === 401) redirect("/admin/login");
  const me: any = res.ok ? await res.json() : null;

  const qrImageUrl = searchParams.otpauthUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(searchParams.otpauthUrl)}`
    : null;

  return (
    <div className="px-9 py-8">
      <h1 className="text-2xl font-bold text-ink mb-1">Security</h1>
      <p className="text-[13.5px] text-slate-500 mb-7">Signed in as {me?.email}.</p>

      {/* Success/error messages surface as the floating toast (components/admin/Toast.tsx,
          mounted once in the dashboard shell) instead of a banner here that you'd have to
          scroll back up to see. */}

      <div className="bg-white border border-line p-6 max-w-xl">
        <h2 className="text-[15px] font-bold text-ink mb-2">Multi-Factor Authentication</h2>

        {me?.mfaEnabled ? (
          <>
            <p className="text-[13.5px] text-muted mb-4">
              MFA is <span className="font-semibold text-green-700">enabled</span> on this account. You'll be asked
              for a 6-digit authenticator code every time you sign in.
            </p>
            <form action={disableMfaAction}>
              <button type="submit" className="border border-red-300 text-red-700 text-[13.5px] font-semibold px-5 py-2.5 rounded-[var(--radius)]">
                Disable MFA
              </button>
            </form>
          </>
        ) : qrImageUrl ? (
          <>
            <p className="text-[13.5px] text-muted mb-4">
              Scan this QR code with an authenticator app (Google Authenticator, Authy, 1Password, etc.), then enter
              the 6-digit code it shows to finish enabling MFA.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrImageUrl} alt="MFA QR code" className="border border-line mb-3" width={200} height={200} />
            <p className="text-[12px] text-slate-400 mb-4">
              Can't scan it? Enter this code manually: <code className="font-mono">{searchParams.secret}</code>
            </p>
            <form action={confirmMfaAction} className="flex items-end gap-3">
              <div>
                <label htmlFor="code" className="block text-[13px] font-semibold text-ink mb-1.5">
                  6-digit code
                </label>
                <input
                  id="code"
                  name="code"
                  required
                  maxLength={6}
                  inputMode="numeric"
                  className="border border-line px-3.5 py-2.5 text-[14px] tracking-[0.3em] w-40"
                />
              </div>
              <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)]">
                Confirm &amp; Enable
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="text-[13.5px] text-muted mb-4">
              MFA is <span className="font-semibold text-slate-500">not enabled</span> on this account. Turning it on
              requires an authenticator code every time you sign in, in addition to your password.
            </p>
            <form action={setupMfaAction}>
              <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)]">
                Enable MFA
              </button>
            </form>
          </>
        )}
      </div>

      <div className="bg-white border border-line p-6 max-w-xl mt-6">
        <h2 className="text-[15px] font-bold text-ink mb-2">Change Password</h2>
        <p className="text-[13.5px] text-muted mb-4">
          For your security, this sends a 6-digit code to <span className="font-semibold text-ink">{me?.email}</span> that
          you'll need to enter along with your new password.
        </p>

        {searchParams.pwOtpSent ? (
          <form action={confirmPasswordChangeAction} className="flex flex-col gap-3.5">
            <div>
              <label htmlFor="otp" className="block text-[13px] font-semibold text-ink mb-1.5">
                6-digit code
              </label>
              <input
                id="otp"
                name="otp"
                required
                pattern="\d{6}"
                maxLength={6}
                inputMode="numeric"
                className="border border-line px-3.5 py-2.5 text-[14px] tracking-[0.3em] w-40"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-[13px] font-semibold text-ink mb-1.5">
                New password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                minLength={10}
                maxLength={72}
                className="border border-line px-3.5 py-2.5 text-[14px] w-full max-w-xs"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-[13px] font-semibold text-ink mb-1.5">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={10}
                maxLength={72}
                className="border border-line px-3.5 py-2.5 text-[14px] w-full max-w-xs"
              />
            </div>
            <div className="flex items-center gap-3 mt-1">
              <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)]">
                Confirm &amp; Change Password
              </button>
            </div>
          </form>
        ) : null}
        {searchParams.pwOtpSent ? (
          <form action={requestPasswordOtpAction} className="mt-3">
            <button type="submit" className="text-[12.5px] font-semibold text-slate-500 underline">
              Resend code
            </button>
          </form>
        ) : (
          <form action={requestPasswordOtpAction}>
            <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)]">
              Send Verification Code
            </button>
          </form>
        )}
      </div>

      <div className="bg-white border border-line p-6 max-w-xl mt-6">
        <h2 className="text-[15px] font-bold text-ink mb-2">Change Email Address</h2>
        <p className="text-[13.5px] text-muted mb-4">
          We'll send a 6-digit code to the <span className="font-semibold text-ink">new</span> address to confirm you
          own it before switching your account over.
        </p>


        {searchParams.emOtpSent ? (
          <form action={confirmEmailChangeAction} className="flex flex-col gap-3.5">
            <p className="text-[13px] text-muted">
              Code sent to <span className="font-semibold text-ink">{searchParams.emNewEmail}</span>.
            </p>
            <div>
              <label htmlFor="emOtp" className="block text-[13px] font-semibold text-ink mb-1.5">
                6-digit code
              </label>
              <input
                id="emOtp"
                name="otp"
                required
                pattern="\d{6}"
                maxLength={6}
                inputMode="numeric"
                className="border border-line px-3.5 py-2.5 text-[14px] tracking-[0.3em] w-40"
              />
            </div>
            <div className="flex items-center gap-3 mt-1">
              <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)]">
                Confirm &amp; Change Email
              </button>
            </div>
          </form>
        ) : (
          <form action={requestEmailOtpAction} className="flex items-end gap-3">
            <div>
              <label htmlFor="newEmail" className="block text-[13px] font-semibold text-ink mb-1.5">
                New email address
              </label>
              <input
                id="newEmail"
                name="newEmail"
                type="email"
                required
                maxLength={254}
                className="border border-line px-3.5 py-2.5 text-[14px] w-64"
              />
            </div>
            <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)]">
              Send Code
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
