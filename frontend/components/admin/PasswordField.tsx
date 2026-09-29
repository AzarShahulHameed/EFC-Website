"use client";

import { useState } from "react";

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" stroke="currentColor" strokeWidth="1.6" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M3 3l18 18M10.6 5.2C11 5.1 11.5 5 12 5c7 0 10.5 7 10.5 7-.6 1.2-1.7 2.9-3.4 4.3M6.6 6.6C3.9 8.3 1.5 12 1.5 12S5 19 12 19c1.4 0 2.7-.3 3.8-.7M9.9 9.9a3 3 0 0 0 4.2 4.2"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// A password <input> with a show/hide eye toggle — used on Login,
// Forgot/Reset Password, and anywhere else a password is typed. Renders a
// bare input + button (no <form> of its own), so it drops straight into an
// existing form the same way the site's other bare-field components do.
export default function PasswordField({
  id,
  name,
  label,
  required = true,
  autoComplete,
  placeholder,
}: {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      {label ? (
        <label htmlFor={id} className="block text-[13px] font-semibold text-ink mb-1.5">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="w-full border border-line px-3.5 py-2.5 pr-10 text-[14px] rounded-[var(--radius)] focus:outline-none focus:border-ink"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute right-0 top-0 bottom-0 px-3 flex items-center text-slate-400 hover:text-ink"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}
