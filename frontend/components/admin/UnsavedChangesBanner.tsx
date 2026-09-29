"use client";

import { useEffect, useRef, useState } from "react";
import { useUnsavedFormDraft } from "@/lib/useUnsavedFormDraft";

// Drop this anywhere inside an admin edit <form> (it renders no visible
// layout of its own beyond the banner, so it's safe next to any other
// field) and it silently starts saving a draft of that form's fields to
// sessionStorage as the admin types. If they come back to this same page
// later — after a session timeout, a crashed tab, an accidental navigation
// — with a draft still sitting in sessionStorage, this shows a small
// dismissible banner offering to restore it.
//
// It finds its enclosing <form> itself (via a marker element + closest()),
// so callers don't need to thread a ref through — just render
// `<UnsavedChangesBanner />` as a child of the form. See the README's
// "Unsaved changes safety net" section for the full pattern and which
// pages already use it.
export default function UnsavedChangesBanner() {
  const markerRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<HTMLFormElement | null>(null);

  useEffect(() => {
    setForm(markerRef.current?.closest("form") ?? null);
  }, []);

  const { hasDraft, restore, discard } = useUnsavedFormDraft(form);

  if (!hasDraft) {
    // Still need this mounted (even with nothing to show) so the effect
    // above has a marker to call closest("form") on.
    return <div ref={markerRef} className="hidden" aria-hidden />;
  }

  return (
    <div ref={markerRef} className="sticky top-0 z-20 -mx-6 -mt-6 mb-5 px-6 py-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between gap-4">
      <p className="text-[13px] text-amber-900">
        You have unsaved changes from your last session on this page.
      </p>
      <div className="flex items-center gap-4 flex-shrink-0">
        <button
          type="button"
          onClick={restore}
          className="text-[12.5px] font-semibold text-amber-900 underline underline-offset-2"
        >
          Restore
        </button>
        <button
          type="button"
          onClick={discard}
          className="text-[12.5px] font-semibold text-amber-700 hover:text-amber-900"
        >
          Discard
        </button>
      </div>
    </div>
  );
}
