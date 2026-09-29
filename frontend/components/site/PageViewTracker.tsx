"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { guessCountryFromTimezone } from "@/lib/timezone-country";
import { getAnalyticsSessionId } from "@/lib/analytics-session";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

// Records one page view per navigation, powering Admin → Analytics. Fires
// silently — never blocks rendering, never shows an error to the visitor
// if the request fails (e.g. the API is briefly down), and sends nothing
// personally identifying (no IP, no cookie, no visitor ID — see
// sterling-vance-api's PageView model). Mounted once in the marketing
// layout, so it runs on every public page including client-side
// navigations between them (a plain server-rendered <img> beacon would
// only catch the first load).
export default function PageViewTracker({ lang }: { lang: string }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    // Strip the /en, /ar, /de prefix — the backend records language
    // separately, so /en/services and /ar/services count as one path with
    // two language rows, not two different pages.
    const path = pathname.replace(/^\/(en|ar|de)(\/|$)/, "/") || "/";
    fetch(`${API_URL}/analytics/pageview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        path,
        languageCode: lang,
        referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
        sessionId: getAnalyticsSessionId(),
        country: guessCountryFromTimezone(),
      }),
    }).catch(() => {
      // Analytics is best-effort — never surface this to the visitor.
    });
  }, [pathname, lang]);

  return null;
}
