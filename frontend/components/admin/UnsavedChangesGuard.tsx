"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// ---------------------------------------------------------------------------
// One consolidated Save button + working "restore my unsaved changes" banner
// for the whole admin dashboard, instead of every section on a page having
// its own Save button that silently loses whatever you forgot to click.
//
// HOW A PAGE OPTS IN: wrap the block of forms that make up one editable
// "record" (e.g. a service's Basic Info + Photo + Video + Typography forms)
// in a plain `<div data-autosave-scope>`. That's the only change a page
// needs — this component finds every <form> inside any such wrapper on the
// current page purely via the DOM, with no knowledge of what's inside them,
// so it works with every existing form/server-action unchanged. Forms that
// should stay as immediate, one-off actions (Add Sub-Service, Delete, a
// search/filter box) are simply left outside any `data-autosave-scope`
// wrapper and this component never touches them.
//
// WHY NOT JUST MERGE EVERYTHING INTO ONE <form>: these sections call
// different server actions (some multipart file uploads, some JSON-shaped
// content-block saves) written and tested independently, each writing its
// own non-overlapping slice of the record (the image, the translation text,
// the page's typography, ...). Rewriting them all into one action per page
// would be a much larger, riskier change for the same practical result.
// Instead this drives the *existing*, already-working forms from one
// button: clicking "Save All Changes" fires every form in the scope (see
// handleSaveAll below for why that's a lightly-staggered fire-and-forget
// rather than a wait-for-each-one-to-finish sequence).
//
// WHY A CSS CLASS HIDES THE INDIVIDUAL BUTTONS: see globals.css's
// `.autosave-active` rule. It's added to <html> once this component has
// mounted, so if JavaScript fails to load for any reason the original
// per-section Save buttons are still there and still work — this is a
// progressive enhancement, never the only way to save.
// ---------------------------------------------------------------------------

type Snapshot = Record<string, string>;

const SCOPE_SELECTOR = "[data-autosave-scope]";
const FIELD_SELECTOR =
  'input:not([type="file"]):not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), textarea, select';

function scopedFields(root: HTMLElement): (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)[] {
  const scopes = Array.from(root.querySelectorAll<HTMLElement>(SCOPE_SELECTOR));
  const fields: (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)[] = [];
  for (const scope of scopes) {
    scope.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(FIELD_SELECTOR).forEach((el) => {
      // Only fields that actually belong to a <form> are ever submitted, so
      // only those are meaningful to track — a stray labelled input outside
      // any form (rare, but not worth crashing over) is skipped.
      if (el.closest("form")) fields.push(el);
    });
  }
  return fields;
}

function scopedForms(root: HTMLElement): HTMLFormElement[] {
  const scopes = Array.from(root.querySelectorAll<HTMLElement>(SCOPE_SELECTOR));
  const forms = new Set<HTMLFormElement>();
  for (const scope of scopes) {
    scope.querySelectorAll<HTMLFormElement>("form").forEach((f) => forms.add(f));
  }
  return Array.from(forms);
}

function fieldKey(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, index: number): string {
  const name = el.name || `#${index}`;
  if (el instanceof HTMLInputElement && el.type === "radio") return `${name}:${el.value}`;
  return name;
}

function readSnapshot(root: HTMLElement): Snapshot {
  const snap: Snapshot = {};
  scopedFields(root).forEach((el, i) => {
    const key = fieldKey(el, i);
    if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
      snap[key] = el.checked ? "1" : "0";
    } else {
      snap[key] = el.value;
    }
  });
  return snap;
}

function applySnapshot(root: HTMLElement, snap: Snapshot) {
  scopedFields(root).forEach((el, i) => {
    const key = fieldKey(el, i);
    if (!(key in snap)) return;
    if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
      el.checked = snap[key] === "1";
    } else {
      el.value = snap[key];
    }
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

function snapshotsEqual(a: Snapshot, b: Snapshot): boolean {
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  return ak.every((k) => a[k] === b[k]);
}

const STORAGE_PREFIX = "efc-admin-draft:";

export default function UnsavedChangesGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const rootRef = useRef<HTMLDivElement>(null);
  const baselineRef = useRef<Snapshot>({});
  const draftRef = useRef<Snapshot | null>(null);
  const [dirty, setDirty] = useState(false);
  const [hasScope, setHasScope] = useState(false);
  const [showRestore, setShowRestore] = useState(false);
  const [saving, setSaving] = useState(false);
  const storageKey = `${STORAGE_PREFIX}${pathname}`;

  // Progressive-enhancement flag — see the comment on `.autosave-active` in
  // globals.css. Only ever added, never removed: the layout this lives in
  // persists across admin navigations, so there's no moment where it should
  // come back off.
  useEffect(() => {
    document.documentElement.classList.add("autosave-active");
  }, []);

  // Re-baseline whenever the page (or its saved data) changes: take a fresh
  // snapshot of the just-rendered, just-saved field values, then check for a
  // leftover draft from an earlier, never-saved visit to this exact page.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const scopePresent = root.querySelector(SCOPE_SELECTOR) !== null;
    setHasScope(scopePresent);
    if (!scopePresent) {
      setDirty(false);
      setShowRestore(false);
      return;
    }
    baselineRef.current = readSnapshot(root);
    setDirty(false);
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        setShowRestore(false);
        return;
      }
      const draft: Snapshot = JSON.parse(raw);
      if (snapshotsEqual(draft, baselineRef.current)) {
        window.localStorage.removeItem(storageKey);
        setShowRestore(false);
      } else {
        draftRef.current = draft;
        setShowRestore(true);
      }
    } catch {
      // Corrupt/blocked storage — draft recovery just isn't offered this
      // time; never breaks the page over it.
      setShowRestore(false);
    }
    // Re-run on every navigation to this route (pathname) AND every time the
    // server data backing it changes (a save redirects with a new query
    // string) so the baseline always reflects what's actually saved.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParamsString, storageKey]);

  // Track edits (debounced) and persist a draft so it survives an accidental
  // tab close, browser crash, or simply navigating away without saving.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !hasScope) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const handler = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const current = readSnapshot(root);
        // A newly-picked file can't be diffed as text (or restored from a
        // draft — browsers won't allow re-populating a file input
        // programmatically for security reasons), but it's still a real
        // unsaved change: without this, picking a new photo/video with
        // nothing else edited would never show the Save bar at all, and
        // since that section's own submit button is hidden (see
        // `.autosave-active` in globals.css) there'd be no way to save it.
        const hasPendingFile = Array.from(
          root.querySelectorAll<HTMLInputElement>('[data-autosave-scope] input[type="file"]'),
        ).some((el) => (el.files?.length ?? 0) > 0);
        const isDirty = hasPendingFile || !snapshotsEqual(current, baselineRef.current);
        setDirty(isDirty);
        try {
          if (isDirty) window.localStorage.setItem(storageKey, JSON.stringify(current));
          else window.localStorage.removeItem(storageKey);
        } catch {
          // Storage full/blocked — dirty-state tracking (and the Save All
          // bar) still works for the current tab, just without persistence.
        }
      }, 350);
    };
    root.addEventListener("input", handler);
    root.addEventListener("change", handler);
    return () => {
      root.removeEventListener("input", handler);
      root.removeEventListener("change", handler);
      if (timer) clearTimeout(timer);
    };
  }, [hasScope, storageKey]);

  // A real page unload (tab close, refresh, typing a new URL) isn't a
  // client-side navigation this component ever sees otherwise, so it needs
  // its own guard — the draft is already saved to localStorage by the
  // handler above, but the browser's own confirmation dialog is the only
  // way to give a chance to back out first.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const handleRestore = useCallback(() => {
    const root = rootRef.current;
    if (!root || !draftRef.current) return;
    applySnapshot(root, draftRef.current);
    setShowRestore(false);
    setDirty(true);
  }, []);

  const handleDiscardDraft = useCallback(() => {
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // Nothing to clean up if storage isn't available anyway.
    }
    draftRef.current = null;
    setShowRestore(false);
  }, [storageKey]);

  // Fires every form in the scope, lightly staggered rather than one at a
  // time waiting for each round-trip: every action here redirects back to
  // essentially the same page with the same `?saved=1` (or `?lang=..&saved=1`)
  // query string once it finishes, so a "did this specific submission land
  // yet" check based on watching the URL can't reliably tell two of these
  // apart — they often resolve to the exact same string, which would make
  // that kind of check hang until a timeout instead of actually detecting
  // completion. There's no need for one anyway: each of these forms writes
  // its own, non-overlapping slice of the record (the image, the
  // translation text, the page's typography, ...), so nothing is lost or
  // corrupted by two of them being in flight at once — the small stagger
  // below exists only to avoid firing several Cloudinary uploads in the
  // exact same instant, not to enforce an ordering the data needs.
  const handleSaveAll = useCallback(async () => {
    const root = rootRef.current;
    if (!root) return;
    const forms = scopedForms(root);
    if (forms.length === 0) return;
    setSaving(true);
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      // Best-effort — a save that's about to succeed shouldn't be blocked by
      // a storage-clearing failure.
    }
    for (const form of forms) {
      form.requestSubmit();
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    // The forms' own redirects bring the page back with freshly-saved data
    // (whichever one's navigation lands last "wins" the URL, but by then
    // every PATCH has already been sent) — this just clears the local
    // "you have unsaved changes" state optimistically once every submit has
    // been fired.
    window.setTimeout(() => setSaving(false), 900);
    setDirty(false);
  }, [storageKey]);

  return (
    <div ref={rootRef} className="relative min-h-full">
      {showRestore ? (
        <div className="sticky top-0 z-40 bg-amber-50 border-b border-amber-200 px-9 py-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13.5px] text-amber-900">
            You have unsaved changes on this page from earlier that were never saved.
          </p>
          <div className="flex items-center gap-4 flex-shrink-0">
            <button
              type="button"
              onClick={handleRestore}
              className="text-[12.5px] font-semibold bg-amber-900 text-white px-4 py-2 rounded-[var(--btn-radius)]"
            >
              Restore changes
            </button>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="text-[12.5px] font-semibold text-amber-900 underline underline-offset-2"
            >
              Discard
            </button>
          </div>
        </div>
      ) : null}

      {children}

      {hasScope && dirty ? (
        <div className="sticky bottom-0 z-40 bg-navy text-white px-9 py-4 flex flex-wrap items-center justify-between gap-4 shadow-[0_-4px_16px_rgba(0,0,0,0.25)]">
          <p className="text-[13.5px]">You have unsaved changes on this page.</p>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="bg-gold text-[#1A1204] font-semibold text-[13.5px] px-6 py-2.5 rounded-[var(--btn-radius)] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save All Changes"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
