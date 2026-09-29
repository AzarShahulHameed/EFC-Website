"use client";

import { useState, useTransition } from "react";

type TranslateResult = { ok: true } | { ok: false; message: string };

// Generic "Auto-translate" button for any admin edit screen that has an
// English tab plus other-language tabs (Insights, Services, Team,
// Testimonials). Calls the bound server action, which reads the saved
// English content, translates it via Google Cloud Translation API, and
// PATCHes the result straight into the non-English translations — the
// admin still reviews/edits it on the other-language tab before it's
// really "done," this just fills in a first draft instead of a blank form.
export default function AutoTranslateButton({
  action,
  targetLanguages,
  labels,
}: {
  action: (targetLanguages: string[]) => Promise<TranslateResult>;
  targetLanguages: string[];
  labels?: Record<string, string>;
}) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState<string>("");

  const languageList = targetLanguages.map((code) => labels?.[code] ?? code.toUpperCase()).join(" & ");

  function handleClick() {
    setStatus("idle");
    setMessage("");
    startTransition(async () => {
      const result = await action(targetLanguages);
      if (result.ok) {
        setStatus("success");
        setMessage(`Translated into ${languageList}. Review the other-language tabs before saving.`);
      } else {
        setStatus("error");
        setMessage(result.message);
      }
    });
  }

  return (
    <div className="border border-dashed border-line bg-paper-2 px-4 py-3.5 mb-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[13.5px] font-semibold text-ink">Auto-translate</div>
          <div className="text-[12.5px] text-muted mt-0.5">
            Fill in {languageList} from this English content using Google Translate. You can edit the result afterward.
          </div>
        </div>
        <button
          type="button"
          onClick={handleClick}
          disabled={isPending}
          className="shrink-0 border border-ink bg-white px-4 py-2 text-[13px] font-semibold text-ink disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Translating…" : `Auto-translate to ${languageList}`}
        </button>
      </div>
      {status === "success" ? (
        <div className="text-[12.5px] text-emerald-700 mt-2.5">{message}</div>
      ) : null}
      {status === "error" ? (
        <div className="text-[12.5px] text-red-700 mt-2.5">{message}</div>
      ) : null}
    </div>
  );
}
