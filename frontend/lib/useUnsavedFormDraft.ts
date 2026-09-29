"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// ---------------------------------------------------------------------------
// Safety net for the "401 mid-edit" problem: an admin fills out a long form,
// something interrupts them (their session expires, a tab crashes, they
// close the tab by accident), and whatever they typed is gone with no
// warning. This hook persists a form's field values to sessionStorage on
// every change, keyed by the page's path (+ its `lang` tab, so switching
// languages doesn't clobber another tab's draft), and hands back a
// Restore/Discard pair a banner component can wire up.
//
// It intentionally does NOT try to be a full "dirty state" tracker — it
// doesn't diff against the initial values or warn on navigation away. It's
// a plain draft: whatever was last typed, recoverable on the next visit to
// this same page. See components/admin/UnsavedChangesBanner.tsx for the
// paired UI, and the README section "Unsaved changes safety net" for how to
// wire this into another edit form.
// ---------------------------------------------------------------------------

const DRAFT_PREFIX = "sv-admin-draft:";

type DraftData = Record<string, string>;

function isFieldElement(
  el: Element,
): el is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;
}

// Fields a draft should never touch: file inputs can't be restored from
// sessionStorage at all, and anything password/secret/token-shaped is kept
// out on the same principle as the audit log's safeMetadata() — a draft
// safety net is not a place to accidentally park a credential.
function isDraftable(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): boolean {
  if (!el.name) return false;
  if (el instanceof HTMLInputElement && (el.type === "file" || el.type === "password")) return false;
  if (/password|secret|token/i.test(el.name)) return false;
  return true;
}

// Query params that only ever carry a one-shot redirect message (see
// Toast.tsx), not which page/tab is being edited — excluded from the
// storage key so a save's `?saved=...` redirect (or a failed save's
// `?error=...`) doesn't compute to a different key than the one the draft
// was written under while typing.
const VOLATILE_PARAMS = new Set(["saved", "error"]);

function stableKeySuffix(searchParams: URLSearchParams): string {
  const kept = Array.from(searchParams.entries()).filter(([key]) => !VOLATILE_PARAMS.has(key));
  if (kept.length === 0) return "";
  kept.sort(([a], [b]) => a.localeCompare(b));
  return `?${kept.map(([k, v]) => `${k}=${v}`).join("&")}`;
}

export function useUnsavedFormDraft(form: HTMLFormElement | null) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // A separate draft per page/tab this route is currently showing — e.g.
  // the Pages & Content editor reuses one path (`/admin/content`) for
  // every page via `?page=`, and edit forms keep translations behind a
  // `?lang=` tab, so either changing would otherwise collide on one key.
  const storageKey = `${DRAFT_PREFIX}${pathname}${stableKeySuffix(searchParams)}`;

  const [hasDraft, setHasDraft] = useState(false);

  // Detect an existing draft as soon as we know which page/tab we're on.
  useEffect(() => {
    try {
      setHasDraft(sessionStorage.getItem(storageKey) !== null);
    } catch {
      // sessionStorage unavailable (private browsing, locked-down browser
      // settings) — the safety net just quietly doesn't apply here.
    }
  }, [storageKey]);

  // A successful save redirects back with `?saved=...` (see Toast.tsx's
  // SUCCESS_KEYS) — once that's happened the draft describes content
  // that's now safely in the database, so it's stale and gets cleared
  // rather than sitting around to be "restored" over the fresh save.
  useEffect(() => {
    if (searchParams.get("saved") !== null) {
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
      setHasDraft(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString(), storageKey]);

  // Persist on every keystroke/change. Cheap enough not to debounce — it's
  // one JSON.stringify of a handful of short strings, not a network call.
  useEffect(() => {
    if (!form) return;

    const persist = () => {
      try {
        const data: DraftData = {};
        for (const el of Array.from(form.elements)) {
          if (!isFieldElement(el) || !isDraftable(el)) continue;
          if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
            data[el.name] = el.checked ? el.value || "on" : "";
            continue;
          }
          data[el.name] = el.value;
        }
        sessionStorage.setItem(storageKey, JSON.stringify(data));
        setHasDraft(true);
      } catch {
        // Storage full/unavailable — fail silently, same as everywhere
        // else this hook touches sessionStorage.
      }
    };

    form.addEventListener("input", persist);
    form.addEventListener("change", persist);
    return () => {
      form.removeEventListener("input", persist);
      form.removeEventListener("change", persist);
    };
  }, [form, storageKey]);

  const restore = useCallback(() => {
    if (!form) return;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const data: DraftData = JSON.parse(raw);
      for (const el of Array.from(form.elements)) {
        if (!isFieldElement(el) || !(el.name in data)) continue;
        if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
          el.checked = Boolean(data[el.name]);
          continue;
        }
        el.value = data[el.name];
        // Custom fields that mirror a hidden input's value into their own
        // DOM (RichTextField's contentEditable, for one) listen for input
        // events to re-sync — a raw `.value =` assignment above doesn't
        // fire one on its own, so nudge it explicitly.
        el.dispatchEvent(new Event("input", { bubbles: true }));
      }
    } catch {
      // ignore — worst case, nothing gets restored
    }
  }, [form, storageKey]);

  const discard = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
    setHasDraft(false);
  }, [storageKey]);

  return { hasDraft, restore, discard };
}
