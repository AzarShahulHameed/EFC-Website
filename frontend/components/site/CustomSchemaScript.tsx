import { getSeoMeta } from "@/lib/api";
import { safeJsonLd } from "@/lib/json-ld";

/**
 * Renders the admin-set "Custom Schema.org JSON-LD" for a page (Admin →
 * SEO & Schema → Advanced: Structured Data), when one has been saved for
 * this exact path + language. Several pages (service/sub-service detail,
 * team, careers, branch pages) already build their own JSON-LD straight
 * from live data — Service, FAQPage, LocalBusiness, etc. — and don't need
 * this. This component exists for the generic pages that have no
 * auto-generated schema of their own (Home, About, Contact, Services list,
 * Insights list), so an admin can still add Organization/WebSite/FAQPage/
 * whatever structured data those pages need without any code change.
 *
 * Renders nothing if no `schemaJson` is saved for this path, so it's safe
 * to drop into any page unconditionally.
 */
export default async function CustomSchemaScript({ path, lang }: { path: string; lang: string }) {
  const seo = await getSeoMeta(path, lang);
  if (!seo?.schemaJson || typeof seo.schemaJson !== "object" || Array.isArray(seo.schemaJson) || Object.keys(seo.schemaJson).length === 0) {
    return null;
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={safeJsonLd(seo.schemaJson)}
    />
  );
}
