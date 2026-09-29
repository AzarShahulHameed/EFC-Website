import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/api";
import { locales } from "@/lib/i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

// Always-present pages, even before any admin content exists, so the
// sitemap is never empty on a fresh install.
const STATIC_PATHS = ["/", "/about", "/services", "/team", "/insights", "/careers", "/contact"];

/**
 * Generates /sitemap.xml automatically (Next.js App Router convention —
 * this file's default export is all that's needed, no route handler).
 * This didn't exist at all before: search engines had no single list of
 * every page to crawl, which matters directly for "why isn't my site
 * showing up on Google" — a sitemap doesn't guarantee ranking, but a
 * missing one makes discovery slower and less complete, especially for
 * pages with few inbound links (a specific service or insight article).
 *
 * The actual list of paths (every active service, published insight and
 * branch landing page, plus anything with a custom Admin → SEO record)
 * is computed server-side by GET /seo/sitemap — see
 * sterling-vance-api/src/seo/seo.service.ts's sitemapEntries(), which
 * already existed but nothing on the frontend was calling it.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let paths: string[] = STATIC_PATHS;
  try {
    const res = await fetch(`${API_URL}/seo/sitemap`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const apiPaths: string[] = await res.json();
      paths = Array.from(new Set([...STATIC_PATHS, ...apiPaths]));
    }
  } catch {
    // API unreachable at build time — ship the static paths rather than
    // failing the whole sitemap (and the build, since this route is
    // statically generated).
  }

  const entries: MetadataRoute.Sitemap = [];
  for (const path of paths) {
    for (const lang of locales) {
      entries.push({
        url: `${SITE_URL}/${lang}${path === "/" ? "" : path}`,
        lastModified: new Date(),
        changeFrequency: path === "/" ? "weekly" : "monthly",
        priority: path === "/" ? 1 : path.startsWith("/services") || path.startsWith("/insights") ? 0.7 : 0.5,
        alternates: {
          languages: Object.fromEntries(
            locales.map((l) => [l, `${SITE_URL}/${l}${path === "/" ? "" : path}`]),
          ),
        },
      });
    }
  }
  return entries;
}
