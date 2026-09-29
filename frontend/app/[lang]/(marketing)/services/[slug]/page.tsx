import Link from "next/link";
import { notFound } from "next/navigation";
import { services as fallbackServices } from "@/lib/content";
import { getService, getSectionAnimations, getSectionEffects, DELAY_MS, defaultSectionEffect, getSectionVisibility, buildPageMetadata, getPageTypography, getSiteConfig, SITE_URL, HEADING_SIZE_PX, getClientLogos, getClientLogosDisplay, getTestimonials, getTestimonialsDisplay } from "@/lib/api";
import { isLocale, lh, type Locale } from "@/lib/i18n";
import Reveal from "@/components/site/Reveal";
import type { RevealVariant } from "@/components/site/Reveal";
import { sanitizeRichText } from "@/lib/rich-text";
import { safeJsonLd } from "@/lib/json-ld";
import ContactIcons from "@/components/site/ContactIcons";
import SubServiceCard from "@/components/site/SubServiceCard";
import ClientLogosStrip from "@/components/site/ClientLogosStrip";
import TestimonialsSection from "@/components/site/TestimonialsSection";
import { contrastTextColor } from "@/lib/theme-runtime";

// Static params are generated from the fallback list so `next build` never
// depends on the API being up; the page itself still fetches live data
// for each slug at request time (ISR via the `revalidate` in lib/api.ts).
export function generateStaticParams() {
  return fallbackServices.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: { lang: string; slug: string } }) {
  const service = await getService(params.slug, params.lang);
  return buildPageMetadata(
    `/services/${params.slug}`,
    params.lang,
    service ? `${service.title} — EFC` : "Service — EFC",
    service?.summary ?? "Audit, tax and advisory services from EFC.",
  );
}

export default async function ServiceDetailPage({
  params,
}: {
  params: { lang: string; slug: string };
}) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;

  const [service, sectionAnim, sectionEffects, sectionVis, typography, siteConfig, clientLogos, clientLogosDisplay, testimonials, testimonialsDisplay] = await Promise.all([
    getService(params.slug, lang),
    getSectionAnimations("services"),
    getSectionEffects("services"),
    getSectionVisibility("services"),
    getPageTypography("services"),
    getSiteConfig(lang),
    getClientLogos(),
    getClientLogosDisplay(),
    getTestimonials(lang),
    getTestimonialsDisplay(),
  ]);
  if (!service) notFound();
  const anim = (key: string): RevealVariant => (sectionAnim[key] as RevealVariant) || "fade-up";
  const fx = (key: string) => sectionEffects[key] ?? defaultSectionEffect;
  const visible = (key: string): boolean => sectionVis[key] !== false;

  const benefits = (service.benefits ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  const processSteps = (service.process ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  const faqs = Array.isArray(service.faqs) ? service.faqs.filter((f) => f.question && f.answer) : [];

  // FAQPage schema.org JSON-LD — this is the concrete "FAQ Schema" piece of
  // the site's AEO/SEO setup: it lets Google, AI Overviews and other answer
  // engines lift these Q&As directly instead of having to parse the page.
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

  // BreadcrumbList + Service schema.org JSON-LD — the breadcrumb helps
  // search/answer engines place this page in the site's hierarchy (and
  // often renders as the breadcrumb trail under the search result itself);
  // the Service entry describes what's actually being offered, who
  // provides it, and where — all things an answer engine can quote
  // directly instead of having to infer them from prose.
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/${lang}` },
      { "@type": "ListItem", position: 2, name: "Services", item: `${SITE_URL}/${lang}/services` },
      { "@type": "ListItem", position: 3, name: service.title, item: `${SITE_URL}/${lang}/services/${service.slug}` },
    ],
  };
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.title,
    description: service.summary,
    provider: { "@type": "ProfessionalService", name: siteConfig.name, url: SITE_URL },
    areaServed: "AE",
    ...(service.subServices && service.subServices.length > 0
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: service.title,
            itemListElement: service.subServices.map((ss) => ({
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: ss.name,
                description: ss.description,
                ...(ss.slug ? { url: `${SITE_URL}/${lang}/services/${service.slug}/${ss.slug}` } : {}),
              },
            })),
          },
        }
      : {}),
  };

  return (
    <>
    <div className="container-page py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={safeJsonLd(breadcrumbSchema)}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={safeJsonLd(serviceSchema)}
      />
      {faqSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={safeJsonLd(faqSchema)}
        />
      ) : null}

      <Link href={lh(lang, "/services")} className="text-[13.5px] font-semibold text-muted hover:text-ink">
        &larr; All Services
      </Link>

      <h1 className="font-serif text-ink max-w-2xl leading-tight mt-6 mb-6" style={{ fontSize: HEADING_SIZE_PX[typography.headingSize] }}>{service.title}</h1>

      {/* `items-start` used to be here, but CSS Grid's `align-items` only
          matters for how a grid ITEM's own box is sized within its row —
          "start" makes each item's box shrink to hug its own content
          instead of stretching to the tallest sibling's height. That's
          exactly what breaks `position: sticky` on the Responsible Person
          card below: sticky is applied to that grid item's own box, and
          sticky positioning needs room to "travel" inside that box as the
          page scrolls. With `items-start` the box was already exactly the
          card's height, so it had nowhere to stick — it just scrolled
          away with the rest of the row instead of pinning below the header.
          (The `top` offset itself is `var(--site-header-h)`, published by
          Header.tsx's ResizeObserver — see that file's comment for why a
          fixed `top-24` went stale once the header's own height became
          admin-configurable: too small an offset means this card pins
          *underneath* the sticky header instead of below it, which is
          what "the sidebar disappears after scrolling" actually was.)
          Leaving alignment at its default (`stretch`) makes the sidebar's
          grid-item box stretch to match the (much taller) content column,
          which gives the sticky card real room to stay pinned while the
          content scrolls past. This has no visual side effect on the
          content column since its own children are plain block content
          (no background), and on mobile the grid collapses to a single
          column so cross-axis alignment doesn't apply anyway. */}
      <div
        className={`grid grid-cols-1 gap-12 ${
          service.responsiblePerson && visible("responsiblePerson") ? "md:grid-cols-[280px_1fr]" : ""
        }`}
      >
        {/* RESPONSIBLE PERSON — who to contact about this service, set from
            Admin → Services → Edit → Responsible Person (picked from Team).
            Sits in the left rail so it's visible alongside the whole page;
            simply doesn't render when a service has no one assigned. */}
        {/* `variant="none"` here on purpose, overriding the admin's chosen
            entrance animation for every other section: Reveal's animated
            variants apply an inline `transform` (translateY/scale/etc, even
            if it resolves to "none" once revealed) to this very element, and
            a `position: sticky` element that also ever carries its own
            `transform` is a well-known cross-browser sticky-breaker (notably
            Safari/iOS, but flaky elsewhere too) — the card would just scroll
            away instead of pinning. `variant="none"` is the one Reveal path
            that never touches `transform` on this element, so sticky
            behaves reliably. A sticky sidebar has no real need to animate in
            anyway — it stays on screen the whole time. */}
        {service.responsiblePerson && visible("responsiblePerson") ? (
          <Reveal variant="none" hover={fx("responsiblePerson").hover} background={fx("responsiblePerson").background} backgroundColor={fx("responsiblePerson").backgroundColor} backgroundTextColor={fx("responsiblePerson").backgroundTextColor} className="md:sticky md:top-[calc(var(--site-header-h,7rem)+16px)] order-2 md:order-1">
            <div className="bg-paper-2 border border-line p-6 flex flex-col items-start gap-1">
              {service.responsiblePerson.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={service.responsiblePerson.photoUrl}
                  alt={service.responsiblePerson.name}
                  style={{ objectPosition: service.responsiblePerson.photoPosition || "center" }}
                  className="w-16 h-16 rounded-full object-cover mb-3"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-200 mb-3" aria-hidden="true" />
              )}
              <div className="text-[11.5px] font-semibold tracking-[0.1em] text-gold uppercase mb-1">
                Responsible Person
              </div>
              <div className="font-serif text-lg text-ink font-semibold">{service.responsiblePerson.name}</div>
              {service.responsiblePerson.position ? (
                <div className="text-[13.5px] text-muted">{service.responsiblePerson.position}</div>
              ) : null}
              <div className="mt-4">
                <ContactIcons
                  name={service.responsiblePerson.name}
                  linkedinUrl={service.responsiblePerson.linkedinUrl}
                  email={service.responsiblePerson.email}
                  phone={service.responsiblePerson.phone}
                  size="md"
                />
              </div>
            </div>
          </Reveal>
        ) : null}

        <div className="order-1 md:order-2 min-w-0">
      {service.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={service.imageUrl}
          alt=""
          style={{ objectPosition: service.imagePosition || "center" }}
          className="hover-target w-full max-w-3xl h-72 object-cover rounded-[var(--radius)] mb-8"
        />
      ) : null}

      <div
        className="text-[17px] text-muted leading-relaxed max-w-2xl"
        dangerouslySetInnerHTML={{ __html: sanitizeRichText(service.description) }}
      />

      {service.whatIsIt ? (
        <div className="mt-10 max-w-2xl">
          <h2 className="font-serif text-xl text-ink mb-3">What is it?</h2>
          <div
            className="text-[15px] text-muted leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeRichText(service.whatIsIt) }}
          />
        </div>
      ) : null}

      {service.subServices && service.subServices.length > 0 ? (
        <div className="mt-14">
          <h2 className="font-serif text-xl text-ink mb-6">What this includes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 card-grid gap-5">
            {[...service.subServices].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((ss) => (
              <SubServiceCard
                key={ss.id}
                name={ss.name}
                description={ss.description}
                imageUrl={ss.imageUrl}
                imagePosition={ss.imagePosition}
                href={ss.slug ? lh(lang, `/services/${service.slug}/${ss.slug}`) : undefined}
              />
            ))}
          </div>
        </div>
      ) : null}

      {visible("detail") ? (
      <Reveal variant={anim("detail")} speed={fx("detail").speed} delay={DELAY_MS[fx("detail").delay]} hover={fx("detail").hover} stagger={fx("detail").stagger} background={fx("detail").background} backgroundColor={fx("detail").backgroundColor} backgroundTextColor={fx("detail").backgroundTextColor} className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-16">
        <div>
          <h2 className="font-serif text-xl text-ink mb-3">Who needs it?</h2>
          {service.whoNeedsIt ? (
            <div
              className="text-[15px] text-muted leading-relaxed"
              dangerouslySetInnerHTML={{ __html: sanitizeRichText(service.whoNeedsIt) }}
            />
          ) : (
            <p className="text-[15px] text-muted leading-relaxed">
              Contact us to discuss whether this service fits your situation.
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
            {service.timeline || "Varies by engagement scope — ask us for an estimate."}
          </p>
        </div>
        <div>
          <h2 className="font-serif text-xl text-ink mb-3">Cost factors</h2>
          <p className="text-[15px] text-muted leading-relaxed">
            {service.costFactors || "Fees depend on scope and complexity — contact us for a tailored quote."}
          </p>
        </div>
      </Reveal>
      ) : null}

      {benefits.length > 0 && visible("benefits") ? (
        <Reveal variant={anim("benefits")} speed={fx("benefits").speed} delay={DELAY_MS[fx("benefits").delay]} hover={fx("benefits").hover} stagger={fx("benefits").stagger} background={fx("benefits").background} backgroundColor={fx("benefits").backgroundColor} backgroundTextColor={fx("benefits").backgroundTextColor} className="mt-16">
          <h2 className="font-serif text-xl text-ink mb-4">Benefits</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-[15px] text-muted leading-relaxed list-disc list-inside max-w-3xl">
            {benefits.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </Reveal>
      ) : null}

      {faqs.length > 0 && visible("faqs") ? (
        <Reveal variant={anim("faqs")} speed={fx("faqs").speed} delay={DELAY_MS[fx("faqs").delay]} hover={fx("faqs").hover} stagger={fx("faqs").stagger} background={fx("faqs").background} backgroundColor={fx("faqs").backgroundColor} backgroundTextColor={fx("faqs").backgroundTextColor} className="mt-16 max-w-2xl">
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

      <div className="mt-16 bg-paper-2 p-10">
        <h2 className="font-serif text-2xl text-ink mb-3">Ready to talk?</h2>
        <p className="text-[15px] text-muted leading-relaxed max-w-lg mb-6">
          Book a confidential consultation with one of our partners to discuss {(service.title ?? "this service").toLowerCase()}.
        </p>
        <Link
          href={lh(lang, "/contact")}
          className="inline-block bg-gold text-[#1A1204] font-semibold text-[15px] px-7 py-3.5 rounded-[var(--btn-radius)]"
        >
          Book a Consultation
        </Link>
      </div>
    </div>
    {/* Trusted-by / testimonials — off by default, turned on per-page from
        Admin → Client Logos / Testimonials → Display Settings → "Also
        show on" → Service detail pages. When both are on they share one
        dark band with a clear heading and generous internal spacing
        between the two, instead of two independently-padded blocks
        stacked flush against each other (the logos strip would otherwise
        sit on the page's light background immediately above the dark
        testimonials block, with no visual transition between them). */}
    {(clientLogos.length > 0 && clientLogosDisplay.showOnServiceDetailPage) ||
    (testimonials.length > 0 && testimonialsDisplay.showOnServiceDetailPage) ? (
      <div
        className={`w-full pt-16 pb-20 ${clientLogosDisplay.bandColor ? "" : "bg-navy"}`}
        style={clientLogosDisplay.bandColor ? { backgroundColor: clientLogosDisplay.bandColor } : undefined}
      >
        {clientLogos.length > 0 && clientLogosDisplay.showOnServiceDetailPage ? (
          <ClientLogosStrip logos={clientLogos} display={clientLogosDisplay} tone="dark" className="!pt-0 !pb-14" />
        ) : null}
        {testimonials.length > 0 && testimonialsDisplay.showOnServiceDetailPage ? (
          <div className="container-page">
            {clientLogos.length > 0 && clientLogosDisplay.showOnServiceDetailPage ? (
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
