"use client";

import { useState } from "react";
import { subscribeNewsletter } from "@/lib/api";
import { isValidEmail } from "@/lib/validation";

type Status = "idle" | "submitting" | "success" | "error";

// The footer's "Stay Informed" form — previously a dead `<form>` with no
// `onSubmit`/`action` and a plain `type="button"` Subscribe button, so
// clicking it did nothing at all: no validation, no request, no feedback,
// success or failure. This is a real client component now: validates the
// email the same way every other form on the site does (lib/validation.ts,
// the one shared pattern), posts to the new `/newsletter/subscribe`
// endpoint, and shows an inline message either way instead of leaving the
// visitor to wonder if anything happened.
export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setStatus("error");
      setMessage("Enter a valid email address.");
      return;
    }
    setStatus("submitting");
    setMessage(null);
    try {
      await subscribeNewsletter(email.trim());
      setStatus("success");
      setMessage("You're subscribed — thanks for staying in touch.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong — please try again in a moment.");
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex" noValidate>
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status !== "idle") {
              setStatus("idle");
              setMessage(null);
            }
          }}
          placeholder="Email address"
          autoComplete="email"
          disabled={status === "submitting"}
          className="bg-navy-2 border border-[#26374F] text-slate-200 text-[13px] px-3.5 py-2.5 w-full rounded-l-[2px] focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="bg-gold text-[#1A1204] font-semibold text-[13px] px-4 rounded-r-[2px] disabled:opacity-60 whitespace-nowrap"
        >
          {status === "submitting" ? "Sending…" : "Subscribe"}
        </button>
      </form>
      {message ? (
        <p
          className={`text-[12px] mt-2 ${status === "success" ? "text-emerald-400" : "text-red-400"}`}
          role="status"
          aria-live="polite"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
