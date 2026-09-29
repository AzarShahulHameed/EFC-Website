import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getBranchBySlug, getBranches, getServices, getSiteConfig, buildPageMetadata } from "@/lib/api";
import { isLocale, lh, type Locale } from "@/lib/i18n";
import { safeJsonLd } from "@/lib/json-ld";

// ---------------------------------------------------------------------------
// Auto-generated local-SEO landing page, one per branch — e.g.
// /en/dubai-audit-firm, /en/abu-dhabi-audit-firm — per the "Advanced Local
// SEO" section of the brief. Nothing here is hardcoded: the branch list
// comes from /admin/branches, and each slug ("<city>-audit-firm") is
// derived automatically from the branch's city, so adding a new branch in
// the dashboard adds a new landing page with no code change. It sits
// alongside the other static route folders (about/, services/, contact/,
// …) — Next.js matches those first, and only an unmatched single segment
// falls through to this dynamic one.
// ---------------------------------------------------------------------------

export async function generateStaticParams() {
  const branches = await getBranches();
  // A branch with an External Website URL set (Admin → Branches → Edit)
  // runs its own separate site — it never gets an internal landing page of
  // its own, matching how the header's location picker, the Location Gate,
  // and the Contact page's office links all already send a visitor there
  // directly instead of into this site.
  return branches.filter((b) => b.slug && !b.externalUrl).map((b) => ({ branchSlug: b.slug! }));
}

export async function generateMetadata({ params }: { params: { lang: string; branchSlug: string } }) {
  const branch = await getBranchBySlug(params.branchSlug);
  if (!branch) return {};
  const siteConfig = await getSiteConfig(params.lang);
  return buildPageMetadata(
    `/${params.branchSlug}`,
    params.lang,
    `Audit & Accounting Firm in ${branch.city} — ${siteConfig.name}`,
    `${siteConfig.name} in ${branch.city}: external and internal audit, accounting, VAT and tax advisory. ${branch.address}.`,
  );
}

export default async function BranchLandingPage({
  params,
}: {
  params: { lang: string; branchSlug: string };
}) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;

  const branch = await getBranchBySlug(params.branchSlug);
  if (!branch) notFound();
  // Defense in depth: this page is no longer statically generated for a
  // branch with an External Website URL set (see generateStaticParams
  // above), but if it's ever hit anyway — a stale bookmark, an old search
  // result, a direct URL typed in — send the visitor to that branch's real
  // site instead of showing them a generic internal page for it.
  if (branch.externalUrl) redirect(branch.externalUrl);

  const [siteConfig, services] = await Promise.all([getSiteConfig(lang), getServices(lang)]);

  // LocalBusiness structured data — the concrete "Structured Data" +
  // "Google Map Integration" items the brief calls for on every
  // auto-generated branch page.
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `${siteConfig.name} — ${branch.city}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: branch.address,
      addressLocality: branch.city,
    },
    telephone: branch.phone,
    email: branch.email,
    ...(branch.googleMapsUrl ? { hasMap: branch.googleMapsUrl } : {}),
  };

  return (
    <div className="container-page py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={safeJsonLd(schema)} />

      <p className="text-[13px] font-semibold text-gold uppercase tracking-wide mb-3">{branch.city} Office</p>
      <h1 className="font-serif text-4xl text-ink max-w-2xl leading-tight mb-6">
        Audit &amp; Accounting Firm in {branch.city}
      </h1>
      <p className="text-[17px] text-muted leading-relaxed max-w-2xl mb-12">
        {siteConfig.name} provides external and internal audit, accounting, VAT and corporate tax advisory to
        businesses in {branch.city} and across the UAE, from our office at {branch.address}.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-2">
          <h2 className="font-serif text-xl text-ink mb-4">Services available in {branch.city}</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-[15px] text-muted">
            {services.map((s) => (
              <li key={s.slug}>
                <Link href={lh(lang, `/services/${s.slug}`)} className="hover:text-ink underline underline-offset-2">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-paper-2 p-6 h-fit">
          <h2 className="font-serif text-lg text-ink mb-4">{branch.city} Office</h2>
          <dl className="text-[14px] text-muted flex flex-col gap-3">
            <div>
              <dt className="font-semibold text-ink">Address</dt>
              <dd>{branch.address}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Phone</dt>
              <dd>
                <a href={`tel:${branch.phone.replace(/\s/g, "")}`} className="hover:text-ink">
                  {branch.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Email</dt>
              <dd>
                <a href={`mailto:${branch.email}`} className="hover:text-ink">
                  {branch.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Hours</dt>
              <dd>{branch.hours}</dd>
            </div>
            {branch.googleMapsUrl ? (
              <div>
                <a
                  href={branch.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-[13.5px] font-semibold text-ink underline underline-offset-2"
                >
                  Get Directions
                </a>
              </div>
            ) : null}
          </dl>
        </div>
      </div>

      <div className="mt-16 bg-navy p-10 text-center">
        <h2 className="font-serif text-2xl text-[#F2E9D2] mb-3">Speak to our {branch.city} team</h2>
        <Link
          href={lh(lang, "/contact")}
          className="inline-block bg-gold text-[#1A1204] font-semibold text-[15px] px-8 py-3.5 rounded-[var(--btn-radius)] mt-3"
        >
          Book a Consultation
        </Link>
      </div>
    </div>
  );
}
