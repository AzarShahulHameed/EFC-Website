import type { MetadataRoute } from "next";
import { SITE_URL, getSiteConfig } from "@/lib/api";

/**
 * Generates /robots.txt automatically (Next.js App Router convention).
 * This also didn't exist before — without it, crawlers fall back to
 * default behavior (usually "crawl everything, including /admin"), which
 * both wastes crawl budget on pages that should never be indexed and,
 * worse, risks the admin dashboard itself turning up in search results.
 *
 * /admin and /api are always blocked; Admin → Site Settings can add more
 * paths (`robotsExtraDisallow`), and its "block this entire site" switch
 * (`sitewideNoindex`, meant for a staging/preview deployment) disallows
 * everything here too, on top of the per-page `noindex` meta tag that
 * `buildPageMetadata` already emits for that case.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const siteConfig = await getSiteConfig();
  const extra = (siteConfig.robotsExtraDisallow || "")
    .split("\n")
    .map((p) => p.trim())
    .filter(Boolean);

  if (siteConfig.sitewideNoindex) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", ...extra],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
