import Link from "next/link";
import { getJobOpenings, getCareersIntro, getPageBlocks, getSectionAnimations, getSectionEffects, DELAY_MS, defaultSectionEffect, getSectionVisibility, buildPageMetadata, getSystemMessage, getPageTypography, getPageHeader, getSiteConfig, HEADING_SIZE_PX, BODY_SIZE_PX, HEADING_FONT_CLASS, SITE_URL } from "@/lib/api";
import { isLocale, lh, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import { sanitizeRichText } from "@/lib/rich-text";
import { safeJsonLd } from "@/lib/json-ld";
import Reveal from "@/components/site/Reveal";
import type { RevealVariant } from "@/components/site/Reveal";
import PageBlocks from "@/components/site/PageBlocks";

export async function generateMetadata({ params }: { params: { lang: string } }) {
  return buildPageMetadata(
    "/careers",
    params.lang,
    "Careers — EFC",
    "Build your career in audit, tax and advisory practice at EFC.",
  );
}

export default async function CareersPage({
  params,
  searchParams,
}: {
  params: { lang: string };
  searchParams: { applied?: string };
}) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const [jobOpenings, intro, sectionAnim, sectionEffects, sectionVis, typography, header, siteConfig, pageBlocks] = await Promise.all([
    getJobOpenings(),
    getCareersIntro(lang),
    getSectionAnimations("careers"),
    getSectionEffects("careers"),
    getSectionVisibility("careers"),
    getPageTypography("careers"),
    getPageHeader("careers", lang),
    getSiteConfig(lang),
    getPageBlocks("careers", lang),
  ]);
  const appliedMessage = searchParams.applied ? await getSystemMessage("message.career.applied", lang) : null;
  const anim = (key: string): RevealVariant => (sectionAnim[key] as RevealVariant) || "fade-up";
  const fx = (key: string) => sectionEffects[key] ?? defaultSectionEffect;
  const visible = (key: string): boolean => sectionVis[key] !== false;

  // One JobPosting entry per open role, straight from Admin → Careers — a
  // strong Google Jobs rich-result candidate, and previously this whole
  // page had no structured data at all despite being exactly the kind of
  // content that format exists for.
  const jobPostingSchemas = jobOpenings.map((job) => ({
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    datePosted: job.postedAt || undefined,
    validThrough: job.closesAt || undefined,
    employmentType: (job.type || "").toUpperCase().replace(/[\s-]+/g, "_") || undefined,
    hiringOrganization: { "@type": "Organization", name: siteConfig.name, url: SITE_URL },
    jobLocation: job.location
      ? { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.location, addressCountry: "AE" } }
      : undefined,
    description: job.description || job.title,
  }));

  return (
    <>
    <div className="container-page py-24">
      {jobPostingSchemas.map((schema, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={safeJsonLd(schema)} />
      ))}
      <div className={typography.align === "center" ? "text-center" : ""}>
        {header.eyebrow ? (
          <div className="text-[13px] font-semibold tracking-[0.14em] text-gold uppercase mb-3.5">{header.eyebrow}</div>
        ) : null}
        <h1 className={`${HEADING_FONT_CLASS[typography.fontFamily]} text-ink max-w-2xl leading-tight mb-6 ${typography.align === "center" ? "mx-auto" : ""}`} style={{ fontSize: HEADING_SIZE_PX[typography.headingSize] }}>{header.headline}</h1>
        <div
          className={`text-muted leading-relaxed max-w-2xl [&_p]:mb-3 [&_p:last-child]:mb-0 ${typography.align === "center" ? "mx-auto" : ""}`}
          style={{ fontSize: BODY_SIZE_PX[typography.bodySize] }}
          dangerouslySetInnerHTML={{ __html: sanitizeRichText(intro.story) }}
        />
      </div>

      {appliedMessage ? (
        <div className="bg-paper-2 border border-line px-5 py-4 mt-8 max-w-2xl text-[14.5px] text-ink">
          {appliedMessage}
        </div>
      ) : null}

      {visible("openings") ? (
      <Reveal variant={anim("openings")} speed={fx("openings").speed} delay={DELAY_MS[fx("openings").delay]} hover={fx("openings").hover} stagger={fx("openings").stagger} background={fx("openings").background} backgroundColor={fx("openings").backgroundColor} backgroundTextColor={fx("openings").backgroundTextColor}>
        <div className="mt-16">
          <h2 className="font-serif text-2xl text-ink mb-8">Current Openings</h2>
          <div className="flex flex-col border border-line">
            {jobOpenings.length === 0 ? (
              <div className="p-6 text-[14.5px] text-muted">No open positions right now — check back soon.</div>
            ) : (
              jobOpenings.map((job, i) => (
                <div
                  key={job.id ?? job.title}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-6 ${
                    i !== 0 ? "border-t border-line" : ""
                  }`}
                >
                  <div>
                    <div className="text-[16px] font-semibold text-ink">{job.title}</div>
                    <div className="text-[13.5px] text-muted mt-1">
                      {job.department} · {job.location} · {job.type}
                    </div>
                  </div>
                  {job.id ? (
                    <Link
                      href={lh(lang, `/careers/${job.id}/apply`)}
                      className="border border-ink text-ink text-[13.5px] font-semibold px-5 py-2.5 rounded-[var(--btn-radius)] self-start sm:self-auto"
                    >
                      View &amp; Apply
                    </Link>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </Reveal>
      ) : null}
    </div>
    <PageBlocks blocks={pageBlocks} lang={lang} />
    </>
  );
}
