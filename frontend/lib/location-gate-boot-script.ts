// Pure string-building helper, deliberately kept OUT of
// components/site/LocationGate.tsx (a "use client" file) even though it's
// conceptually part of the same feature. A Server Component (the marketing
// layout) calls this directly to build an inline <script> tag's contents —
// but once a file has "use client" at the top, Next.js turns every one of
// its exports into a client-reference proxy when a Server Component
// imports it, not the real function. That's invisible in `tsc` and even in
// `next dev`, but a production `next build` throws "... is not a function"
// the moment the code path that calls it actually runs (i.e. once Location
// Gate is turned on) — exactly the bug this file's existence fixes.
const STORAGE_KEY = "efc_region";

export type LocationGateTrigger = "once" | "session" | "always";

// The gate's *visibility* is decided before hydration by this inline
// script (via the `lg-open` class on <html>), so there is no flash of the
// homepage underneath it. Built per-request from the admin's trigger
// setting (rather than a fixed template) since "always" must skip the
// storage check entirely and "session" must check sessionStorage instead
// of localStorage.
export function locationGateBootScript(trigger: LocationGateTrigger = "once"): string {
  if (trigger === "always") {
    return `document.documentElement.classList.add("lg-open");`;
  }
  const store = trigger === "session" ? "sessionStorage" : "localStorage";
  return `
(function () {
  try {
    if (!window.${store}.getItem("${STORAGE_KEY}")) {
      document.documentElement.classList.add("lg-open");
    }
  } catch (e) {
    // Storage unavailable — don't gate the site over it.
  }
})();
`;
}
