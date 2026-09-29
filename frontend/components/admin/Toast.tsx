"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// A floating success/error notification, mounted once in the admin shell
// (see app/admin/(dashboard)/layout.tsx) instead of each page rendering its
// own top-of-page banner. Every admin write action already redirects back
// with a `?error=...` or a one-shot success flag in the URL (see
// lib/admin-actions.ts) — this reads those same query params, shows them
// as a toast that's visible no matter how far down the page you are, then
// strips them from the URL so refreshing or going back doesn't re-show it.
//
// A handful of query params are deliberately left untouched because they
// carry ongoing UI state rather than a one-shot message — stripping them
// would reset that state right after the toast disappears:
//   - pwOtpSent / emOtpSent / emNewEmail / otpauthUrl / secret (Security page's
//     in-progress OTP/MFA forms)
//   - lang / page / q / days / entityType (filters & pagination)
const SUCCESS_KEYS: Record<string, (value: string) => string> = {
  // `saved` is used two ways across the admin: a plain flag (`saved=1`)
  // and a descriptive label (`saved=footer`, `saved=Hero`, `saved=home`)
  // — only capitalize and name the section when it's actually a label.
  saved: (v) => (/^\d+$/.test(v) ? "Saved." : `${v.charAt(0).toUpperCase()}${v.slice(1)} saved.`),
  created: () => "Created successfully.",
  enabled: () => "Enabled.",
  disabled: () => "Disabled.",
  deleted: () => "Deleted.",
  pwChanged: () => "Your password has been changed.",
  emChanged: () => "Your email address has been updated.",
  testSent: () => "Test email sent — check your inbox.",
};

const ERROR_KEYS = ["error", "pwError", "emError"];

type ToastState = { kind: "success" | "error"; message: string } | null;

export default function Toast() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    let next: ToastState = null;
    const remaining = new URLSearchParams(searchParams.toString());
    let changed = false;

    for (const key of ERROR_KEYS) {
      const value = searchParams.get(key);
      if (value !== null) {
        next = { kind: "error", message: value || "Something went wrong." };
        remaining.delete(key);
        changed = true;
        break; // only ever show one toast at a time
      }
    }

    if (!next) {
      for (const [key, toMessage] of Object.entries(SUCCESS_KEYS)) {
        const value = searchParams.get(key);
        if (value !== null) {
          next = { kind: "success", message: toMessage(value) };
          remaining.delete(key);
          changed = true;
          break;
        }
      }
    }

    if (next) {
      setToast(next);
      if (changed) {
        const query = remaining.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
      }
    }
    // Only re-run when the URL's query string actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <div className="fixed top-5 right-5 z-[100] max-w-sm">
      <div
        role="status"
        className={`admin-toast flex items-start gap-3 px-4 py-3.5 rounded-[var(--radius)] shadow-xl border text-[13.5px] leading-relaxed ${
          toast.kind === "error" ? "bg-red-50 border-red-200 text-red-800" : "bg-white border-line text-ink"
        }`}
      >
        <span className="flex-1">{toast.message}</span>
        <button
          type="button"
          onClick={() => setToast(null)}
          aria-label="Dismiss"
          className={`flex-shrink-0 text-[15px] leading-none ${toast.kind === "error" ? "text-red-400 hover:text-red-700" : "text-slate-400 hover:text-slate-700"}`}
        >
          &times;
        </button>
      </div>
    </div>
  );
}
