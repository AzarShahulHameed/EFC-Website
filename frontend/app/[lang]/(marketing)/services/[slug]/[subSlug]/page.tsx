import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getSubService,
  subServicePageKey,
  getPageBlocks,
  getSectionAnimations,
  getSectionEffects,
  DELAY_MS,
  defaultSectionEffect,
  getSectionVisibility,
  buildPageMetadata,
  getPageTypography,
  getPageHeader,
  getSiteConfig,
  SITE_URL,
  HEADING_SIZE_PX,
  BODY_SIZE_PX,
  HEADING_FONT_CLASS,
  getClientLogos,
  getClientLogosDisplay,
  getTestimonials,
  getTestimonialsDisplay,
} from "@/lib/api";
import { isLocale, lh, type Locale } from "@/lib/i18n";
import { sanitizeRichText } from "@/lib/rich-text";
import { safeJsonLd } from "@/lib/json-ld";
import Reveal from "@/components/site/Reveal";
import type { RevealVariant } from "@/components/site/Reveal";
import PageBlocks from "@/components/site/PageBlocks";
import ClientLogosStrip from "@/components/site/ClientLogosStrip";
import TestimonialsSection from "@/components/site/TestimonialsSection";
import { contrastTextColor } from "@/lib/theme-runtime";
import ContactIcons from "@/components/site/ContactIcons";

export async function generateMetadata({ params }: { params: { lang: string; slug: string; subSlug: string } }) {
  const found = await getSubService(params.slug, params.subSlug, params.lang);
  const title = found ? `${found.subService.name} — ${found.service.title}` : "Service";
  return buildPageMetadata(
    `/services/${params.slug}/${params.subSlug}`,
    params.lang,
    `${title} — EFC`,
    found?.subService.description ?? found?.service.summary ?? "Audit, tax and advisory services from EFC.",
  );
}

export default async function SubServiceDetailPage({
  params,
}: {
  params: { lang: string; slug: string; subSlug: string };
}) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;

  const found = await getSubService(params.slug, params.subSlug, lang);
  if (!found) notFound();
  const { service, subService } = found;

  const page = subServicePageKey(service.slug, subService.slug || subService.id);
  const [header, typography, sectionAnim, sectionEffects, sectionVis, siteConfig, pageBlocks, clientLogos, clientLogosDisplay, testimonials, testimonialsDisplay] = await Promise.all([
    getPageHeader(page, lang),
    getPageTypography(page),
    getSectionAnimations(page),
    getSectionEffects(page),
    getSectionVisibility(page),
    getSiteConfig(lang),
    getPageBlocks(page, lang),
    getClientLogos(),
    getClientLogosDisplay(),
    getTestimonials(lang),
    getTestimonialsDisplay(),
  ]);
  const anim = (key: string): RevealVariant => (sectionAnim[key] as RevealVariant) || "fade-up";
  const fx = (key: string) => sectionEffects[key] ?? defaultSectionEffect;
  const visible = (key: string): boolean => sectionVis[key] !== false;

  // The admin Page Header form is blank by default for a brand-new
  // composite key — fall back to the sub-service's own name/description
  // rather than showing an empty heading until an admin fills it in.
  const headline = header.headline || subService.name;
  const lead = header.lead || subService.description || "";
  const bodyHtml = subService.body ? sanitizeRichText(subService.body) : "";

  const benefits = (subService.benefits ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  const processSteps = (subService.process ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  const faqs = Array.isArray(subService.faqs) ? subService.faqs.filter((f) => f.question && f.answer) : [];

  // FAQPage schema.org JSON-LD — same AEO/SEO pattern as the parent
  // Service detail page (see the matching comment there).
  const faqSchema =
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }
      : null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/${lang}` },
      { "@type": "ListItem", position: 2, name: "Services", item: `${SITE_URL}/${lang}/services` },
      { "@type": "ListItem", position: 3, name: service.title, item: `${SITE_URL}/${lang}/services/${service.slug}` },
      {
        "@type": "ListItem",
        position: 4,
        name: subService.name,
        item: `${SITE_URL}/${lang}/services/${service.slug}/${subService.slug}`,
      },
    ],
  };
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: subService.name,
    description: subService.description || subService.name,
    provider: { "@type": "ProfessionalService", name: siteConfig.name, url: SITE_URL },
    areaServed: "AE",
    isPartOf: { "@type": "Service", name: service.title, url: `${SITE_URL}/${lang}/services/${service.slug}` },
  };

  return (
    <>
    <div className="container-page py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={safeJsonLd(breadcrumbSchema)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={safeJsonLd(serviceSchema)} />
      {faqSchema ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={safeJsonLd(faqSchema)} />
      ) : null}

      <Link href={lh(lang, `/services/${service.slug}`)} className="text-[13.5px] font-semibold text-muted hover:text-ink">
        &larr; {service.title}
      </Link>

      <div className={`mt-6 ${typography.align === "center" ? "text-center mx-auto" : ""}`}>
        {header.eyebrow ? (
          <div className="text-[13px] font-semibold tracking-[0.14em] text-gold uppercase mb-3.5">{header.eyebrow}</div>
        ) : null}
        <h1
          className={`${HEADING_FONT_CLASS[typography.fontFamily]} text-ink max-w-2xl leading-tight mb-5 ${typography.align === "center" ? "mx-auto" : ""}`}
          style={{ fontSize: HEADING_SIZE_PX[typography.headingSize] }}
        >
          {headline}
        </h1>
        {lead ? (
          <p
            className={`text-muted leading-relaxed max-w-2xl ${typography.align === "center" ? "mx-auto" : ""}`}
            style={{ fontSize: BODY_SIZE_PX[typography.bodySize] }}
          >
            {lead}
          </p>
        ) : null}
      </div>

      {/* Responsible Person sidebar — same pattern (and the same
          `align-items: stretch` default, NOT `items-start`) as the parent
          Service detail page. See the comment there for exactly why
          `items-start` breaks `position: sticky` in a CSS grid: it shrinks
          this grid item's own box to the card's height, leaving the sticky
          card no room to stay pinned while the content column scrolls.
          Also see that same comment for why the `top` offset below is
          `var(--site-header-h)` rather than a fixed value. */}
      <div
        className={`grid grid-cols-1 gap-12 mt-12 ${
          subService.responsiblePerson && visible("responsiblePerson") ? "md:grid-cols-[280px_1fr]" : ""
        }`}
      >
        {subService.responsiblePerson && visible("responsiblePerson") ? (
          // `variant="none"` here on purpose, overriding the admin's chosen
          // entrance animation for every other section: Reveal's animated
          // variants apply an inline `transform` (translateY/scale/etc, even
          // if it resolves to "none" once revealed) to this very element,
          // and a `position: sticky` element that also ever carries its own
          // `transform` is a well-known cross-browser sticky-breaker
          // (notably Safari/iOS, but flaky elsewhere too) — the card would
          // just scroll away instead of pinning. `variant="none"` is the one
          // Reveal path that never touches `transform` on this element, so
          // sticky behaves reliably. A sticky sidebar has no real need to
          // animate in anyway — it stays on screen the whole time.
          <Reveal
            variant="none"
            hover={fx("responsiblePerson").hover}
            background={fx("responsiblePerson").background} backgroundColor={fx("responsiblePerson").backgroundColor} backgroundTextColor={fx("responsiblePerson").backgroundTextColor}
            className="md:sticky md:top-[calc(var(--site-header-h,7rem)+16px)] order-2 md:order-1"
          >
            <div className="bg-paper-2 border border-line p-6 flex flex-col items-start gap-1">
              {subService.responsiblePerson.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={subService.responsiblePerson.photoUrl}
                  alt={subService.responsiblePerson.name}
                  style={{ objectPosition: subService.responsiblePerson.photoPosition || "center" }}
                  className="w-16 h-16 rounded-full object-cover mb-3"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-200 mb-3" aria-hidden="true" />
              )}
              <div className="text-[11.5px] font-semibold tracking-[0.1em] text-gold uppercase mb-1">
                Responsible Person
              </div>
              <div className="font-serif text-lg text-ink font-semibold">{subService.responsiblePerson.name}</div>
              {subService.responsiblePerson.position ? (
                <div className="text-[13.5px] text-muted">{subService.responsiblePerson.position}</div>
              ) : null}
              <div className="mt-4">
                <ContactIcons
                  name={subService.responsiblePerson.name}
                  linkedinUrl={subService.responsiblePerson.linkedinUrl}
                  email={subService.responsiblePerson.email}
                  phone={subService.responsiblePerson.phone}
                  size="md"
                />
              </div>
            </div>
          </Reveal>
        ) : null}

        <div className="order-1 md:order-2 min-w-0">
      {visible("content") ? (
        <Reveal
          variant={anim("content")}
          speed={fx("content").speed}
          delay={DELAY_MS[fx("content").delay]}
          hover={fx("content").hover}
          stagger={fx("content").stagger}
          background={fx("content").background} backgroundColor={fx("content").backgroundColor} backgroundTextColor={fx("content").backgroundTextColor}
          className="max-w-3xl"
        >
          {subService.videoUrl ? (
            <video src={subService.videoUrl} controls className="w-full h-80 object-cover rounded-[var(--radius)] mb-8 bg-black" />
          ) : subService.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={subService.imageUrl}
              alt={subService.name}
              style={{ objectPosition: subService.imagePosition || "center" }}
              className="hover-target w-full h-80 object-cover rounded-[var(--radius)] mb-8"
            />
          ) : null}
          {bodyHtml ? (
            <div
              className="text-[16px] text-muted leading-relaxed [&_p]:mb-4 [&_p:last-child]:mb-0 [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-2"
              dangerouslySetInnerHTML={{ __html: bodyHtml }}
            />
          ) : (
            <p className="text-[15px] text-muted leading-relaxed">
              Contact us to learn more about {subService.name.toLowerCase()}.
            </p>
          )}
        </Reveal>
      ) : null}

      {subService.whatIsIt ? (
        <div className="mt-10 max-w-2xl">
          <h2 className="font-serif text-xl text-ink mb-3">What is it?</h2>
          <div
            className="text-[15px] text-muted leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeRichText(subService.whatIsIt) }}
          />
        </div>
      ) : null}

      {visible("detail") ? (
        <Reveal
          variant={anim("detail")}
          speed={fx("detail").speed}
          delay={DELAY_MS[fx("detail").delay]}
          hover={fx("detail").hover}
          stagger={fx("detail").stagger}
          background={fx("detail").background} backgroundColor={fx("detail").backgroundColor} backgroundTextColor={fx("detail").backgroundTextColor}
          className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-16"
        >
          <div>
            <h2 className="font-serif text-xl text-ink mb-3">Who needs it?</h2>
            {subService.whoNeedsIt ? (
              <div
                className="text-[15px] text-muted leading-relaxed"
                dangerouslySetInnerHTML={{ __html: sanitizeRichText(subService.whoNeedsIt) }}
              />
            ) : (
              <p className="text-[15px] text-muted leading-relaxed">
                Contact us to discuss whether this fits your situation.
              </p>
            )}
          </div>
          <div>
            <h2 className="font-serif text-xl text-ink mb-3">Our process</h2>
            {processSteps.length > 0 ? (
              <ol className="text-[15px] text-muted leading-relaxed list-decimal list-inside space-y-1">
                {processSteps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            ) : (
              <p className="text-[15px] text-muted leading-relaxed">
                Every engagement starts with a scoping consultation — get in touch to discuss the steps involved.
              </p>
            )}
          </div>
          <div>
            <h2 className="font-serif text-xl text-ink mb-3">Timeline</h2>
            <p className="text-[15px] text-muted leading-relaxed">
              {subService.timeline || "Varies by engagement scope — ask us for an estimate."}
            </p>
          </div>
          <div>
            <h2 className="font-serif text-xl text-ink mb-3">Cost factors</h2>
            <p className="text-[15px] text-muted leading-relaxed">
              {subService.costFactors || "Fees depend on scope and complexity — contact us for a tailored quote."}
            </p>
          </div>
        </Reveal>
      ) : null}

      {benefits.length > 0 && visible("benefits") ? (
        <Reveal
          variant={anim("benefits")}
          speed={fx("benefits").speed}
          delay={DELAY_MS[fx("benefits").delay]}
          hover={fx("benefits").hover}
          stagger={fx("benefits").stagger}
          background={fx("benefits").background} backgroundColor={fx("benefits").backgroundColor} backgroundTextColor={fx("benefits").backgroundTextColor}
          className="mt-16"
        >
          <h2 className="font-serif text-xl text-ink mb-4">Benefits</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-[15px] text-muted leading-relaxed list-disc list-inside max-w-3xl">
            {benefits.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </Reveal>
      ) : null}

      {faqs.length > 0 && visible("faqs") ? (
        <Reveal
          variant={anim("faqs")}
          speed={fx("faqs").speed}
          delay={DELAY_MS[fx("faqs").delay]}
          hover={fx("faqs").hover}
          stagger={fx("faqs").stagger}
          background={fx("faqs").background} backgroundColor={fx("faqs").backgroundColor} backgroundTextColor={fx("faqs").backgroundTextColor}
          className="mt-16 max-w-2xl"
        >
          <h2 className="font-serif text-xl text-ink mb-4">Frequently Asked Questions</h2>
          <div className="flex flex-col gap-5">
            {faqs.map((f, i) => (
              <div key={i}>
                <h3 className="text-[15px] font-semibold text-ink mb-1">{f.question}</h3>
                <p className="text-[14.5px] text-muted leading-relaxed">{f.answer}</p>
              </div>
            ))}
          </div>
        </Reveal>
      ) : null}
        </div>
      </div>

      <div className="mt-16 bg-paper-2 p-10 max-w-3xl">
        <h2 className="font-serif text-2xl text-ink mb-3">Ready to talk?</h2>
        <p className="text-[15px] text-muted leading-relaxed max-w-lg mb-6">
          Book a confidential consultation with one of our partners to discuss {subService.name.toLowerCase()}.
        </p>
        <Link
          href={lh(lang, "/contact")}
          className="inline-block bg-gold text-[#1A1204] font-semibold text-[15px] px-7 py-3.5 rounded-[var(--btn-radius)]"
        >
          Book a Consultation
        </Link>
      </div>
    </div>
    <PageBlocks blocks={pageBlocks} lang={lang} />
    {/* Same shared dark band as the parent Service detail page — see the
        comment there for why logos and testimonials are combined into one
        section instead of two independently-padded blocks. */}
    {(clientLogos.length > 0 && clientLogosDisplay.showOnSubServicePage) ||
    (testimonials.length > 0 && testimonialsDisplay.showOnSubServicePage) ? (
      <div
        className={`w-full pt-16 pb-20 ${clientLogosDisplay.bandColor ? "" : "bg-navy"}`}
        style={clientLogosDisplay.bandColor ? { backgroundColor: clientLogosDisplay.bandColor } : undefined}
      >
        {clientLogos.length > 0 && clientLogosDisplay.showOnSubServicePage ? (
          <ClientLogosStrip logos={clientLogos} display={clientLogosDisplay} tone="dark" className="!pt-0 !pb-14" />
        ) : null}
        {testimonials.length > 0 && testimonialsDisplay.showOnSubServicePage ? (
          <div className="container-page">
            {clientLogos.length > 0 && clientLogosDisplay.showOnSubServicePage ? (
              <h2
                className="font-serif text-2xl text-center mb-12"
                style={{ color: contrastTextColor(clientLogosDisplay.bandColor, "#FAF7EF") }}
              >
                What Our Clients Say
              </h2>
            ) : null}
            <TestimonialsSection testimonials={testimonials} display={testimonialsDisplay} />
          </div>
        ) : null}
      </div>
    ) : null}
    </>
  );
}
