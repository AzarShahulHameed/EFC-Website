"use client";

import { useState, useTransition } from "react";
import { languageNames } from "@/lib/i18n";

type TranslateAllResult = { ok: boolean; summary?: string; message?: string };

// The "Translate Everything Now" button on Admin → Translate Settings — the
// one-click version of every per-record "Auto-translate" button elsewhere
// in the dashboard. See translateEntireSiteAction in lib/admin-actions.ts
// for exactly what it covers.
export default function TranslateAllButton({
  action,
  languageOptions,
}: {
  action: (targetLanguages: string[], overwrite: boolean) => Promise<TranslateAllResult>;
  languageOptions: string[];
}) {
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>(languageOptions);
  const [overwrite, setOverwrite] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  function toggle(code: string) {
    setSelected((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  }

  function handleClick() {
    if (selected.length === 0) return;
    setStatus("idle");
    setMessage("");
    startTransition(async () => {
      const result = await action(selected, overwrite);
      if (result.ok) {
        setStatus("success");
        setMessage(result.summary ?? "Done.");
      } else {
        setStatus("error");
        setMessage(result.message ?? "Something went wrong.");
      }
    });
  }

  return (
    <div className="bg-white border-2 border-gold p-6 mb-8 max-w-2xl">
      <div className="text-[15px] font-bold text-ink mb-1">Translate Everything Now</div>
      <p className="text-[13px] text-slate-500 mb-4">
        Runs Google Translate once across every service, sub-service, team member, testimonial, blog post and page
        of site copy (hero text, about page, careers, legal pages, headers, footers, form labels) that's been saved
        in English, and fills in the language(s) below in one go. Review the new language tabs afterward — this
        fills in a first draft, it doesn't replace reviewing it.
      </p>

      <div className="flex flex-wrap gap-4 mb-4">
        {languageOptions.map((code) => (
          <label key={code} className="flex items-center gap-2 text-[13.5px] font-medium text-ink">
            <input type="checkbox" checked={selected.includes(code)} onChange={() => toggle(code)} className="w-4 h-4" />
            {languageNames[code as keyof typeof languageNames] ?? code.toUpperCase()}
          </label>
        ))}
      </div>

      <label className="flex items-start gap-2.5 text-[13px] text-ink mb-4">
        <input
          type="checkbox"
          checked={overwrite}
          onChange={(e) => setOverwrite(e.target.checked)}
          className="w-4 h-4 mt-0.5"
        />
        <span>
          Overwrite existing translations
          <span className="block text-[12px] text-slate-400 font-normal">
            Off (recommended): only fills in items that don't have a translation for that language yet — anything
            you've already reviewed or hand-edited is left alone. On: re-translates everything from the current
            English content, replacing what's there.
          </span>
        </span>
      </label>

      <button
        type="button"
        onClick={handleClick}
        disabled={isPending || selected.length === 0}
        className="bg-gold hover:bg-gold-light text-[#1A1204] font-semibold text-[14px] px-5 py-2.5 rounded-[var(--btn-radius)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending ? "Translating everything… this can take a minute" : "Translate Everything Now"}
      </button>

      {status === "success" ? <div className="text-[12.5px] text-emerald-700 mt-3">{message}</div> : null}
      {status === "error" ? <div className="text-[12.5px] text-red-700 mt-3">{message}</div> : null}
    </div>
  );
}
