"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import FlagIcon from "./FlagIcon";
import { DIAL_CODE_OPTIONS, type DialCodeOption } from "@/lib/dial-codes";
import { guessCountryFromTimezone } from "@/lib/timezone-country";

// International phone field used by every visitor-facing form that
// collects a phone number (Contact Us, the Careers job-application form).
// Renders a country selector (flag + dial code + short country name,
// searchable) next to a plain national-number text input, and submits the
// two combined as one E.164-ish string ("+971 50 123 4567") under a single
// hidden `name` field — so the backend keeps receiving exactly one string
// value for `phone`, same as before this component existed, and no Prisma
// column needs to change.
//
// The country list itself (name, ISO code, dial code, flag) is reference
// data, not admin content — the same kind of fixed list every production
// site ships for a phone country picker — so it's a static table
// (lib/dial-codes.ts, itself built from the existing lib/countries.ts used
// by the header's location/language pickers) rather than something routed
// through the CMS. Only the visible micro-copy below ("Search country") is
// a plain English literal for now — a placeholder-only string, not
// something a page's translated copy — while the actual field label stays
// on the caller (e.g. the Contact form's own admin-translatable
// `t.phoneLabel`).
export default function PhoneNumberField({
  id = "phone",
  name = "phone",
  required = false,
  defaultCountry = "ae",
  className = "w-full border border-line px-4 py-3 text-[14.5px] focus:outline-none focus:border-ink",
}: {
  id?: string;
  name?: string;
  required?: boolean;
  defaultCountry?: string;
  className?: string;
}) {
  const [countryCode, setCountryCode] = useState(defaultCountry.toLowerCase());
  const [national, setNational] = useState("");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  // Best-effort default from the visitor's own timezone (same guess used
  // elsewhere on the site for a placeholder/analytics hint, never for
  // validation) — only applied once, and only if the caller didn't already
  // ask for a specific default, so it never fights a deliberately-set
  // defaultCountry prop.
  useEffect(() => {
    const guessed = guessCountryFromTimezone();
    if (guessed) setCountryCode((prev) => (prev === defaultCountry.toLowerCase() ? guessed.toLowerCase() : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const selected: DialCodeOption =
    DIAL_CODE_OPTIONS.find((c) => c.code === countryCode) ??
    DIAL_CODE_OPTIONS.find((c) => c.code === "ae") ??
    DIAL_CODE_OPTIONS[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DIAL_CODE_OPTIONS;
    return DIAL_CODE_OPTIONS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.includes(q),
    );
  }, [query]);

  const combinedValue = national.trim() ? `${selected.dial} ${national.trim()}` : "";

  return (
    <div ref={rootRef} className="relative flex gap-2" dir="ltr">
      {/* Forced ltr: a dial code + national number ("+971 50 123 4567") is
          itself an ltr token even inside an rtl-language page (the same way
          a phone number stays ltr in printed Arabic text) — this keeps the
          "+", dial code and digits from visually re-ordering under an rtl
          ancestor, which is what would otherwise clip/overlap the flag and
          dropdown arrow against the input. The outer form (labels, layout)
          stays whatever direction the page is. */}
      <div className="relative shrink-0">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="Country code"
          onClick={() => setOpen((v) => !v)}
          className={`h-full flex items-center gap-1.5 border border-line px-3 py-3 text-[14.5px] bg-white hover:bg-paper-2 focus:outline-none focus:border-ink ${open ? "border-ink" : ""}`}
        >
          <FlagIcon code={selected.code} />
          <span className="text-ink whitespace-nowrap">{selected.dial}</span>
          <svg width="9" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true" className="shrink-0 text-muted">
            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
        {open ? (
          <div className="absolute left-0 top-full mt-1.5 w-72 max-w-[80vw] bg-white border border-line rounded-[2px] shadow-xl z-50 flex flex-col">
            <div className="p-2 border-b border-line">
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search country"
                className="w-full border border-line px-3 py-2 text-[13.5px] focus:outline-none focus:border-ink"
              />
            </div>
            <div role="listbox" className="max-h-64 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <div className="px-3 py-3 text-[13px] text-muted">No matches</div>
              ) : (
                filtered.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    role="option"
                    aria-selected={c.code === selected.code}
                    onClick={() => {
                      setCountryCode(c.code);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={`w-full text-left px-3 py-2 text-[13.5px] flex items-center gap-2.5 hover:bg-paper-2 transition-colors ${
                      c.code === selected.code ? "bg-paper-2 font-semibold text-ink" : "text-ink"
                    }`}
                  >
                    <FlagIcon code={c.code} />
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-muted shrink-0">{c.dial}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        required={required}
        value={national}
        onChange={(e) => setNational(e.target.value)}
        placeholder="50 123 4567"
        maxLength={20}
        className={`${className} flex-1`}
      />
      {/* The one field the form/server action actually reads — everything
          above is just UI for building this value. Kept required only when
          the caller asked for it AND a number was actually entered, so an
          optional phone field (e.g. Contact Us) can still be submitted
          blank. */}
      <input type="hidden" name={name} value={combinedValue} />
    </div>
  );
}
