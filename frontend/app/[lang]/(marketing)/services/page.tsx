import Link from "next/link";
import { notFound } from "next/navigation";
import { getServices, getPageBlocks, getSectionAnimations, getSectionEffects, DELAY_MS, defaultSectionEffect, getSectionVisibility, buildPageMetadata, getPageTypography, getPageHeader, HEADING_SIZE_PX, BODY_SIZE_PX, HEADING_FONT_CLASS, getClientLogos, getClientLogosDisplay, getTestimonials, getTestimonialsDisplay } from "@/lib/api";
import { isLocale, lh, type Locale } from "@/lib/i18n";
import Reveal from "@/components/site/Reveal";
import type { RevealVariant } from "@/components/site/Reveal";
import PageBlocks from "@/components/site/PageBlocks";
import { richTextToPlainText } from "@/lib/rich-text";
import ClientLogosStrip from "@/components/site/ClientLogosStrip";
import TestimonialsSection from "@/components/site/TestimonialsSection";
import { contrastTextColor } from "@/lib/theme-runtime";
import CustomSchemaScript from "@/components/site/CustomSchemaScript";

export async function generateMetadata({ params }: { params: { lang: string } }) {
  return buildPageMetadata(
    "/services",
    params.lang,
    "Services — EFC",
    "Full-spectrum assurance, tax and advisory services across the UAE.",
  );
}

export default async function ServicesPage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const [services, sectionAnim, sectionEffects, sectionVis, typography, header, pageBlocks, clientLogos, clientLogosDisplay, testimonials, testimonialsDisplay] = await Promise.all([
    getServices(lang),
    getSectionAnimations("services"),
    getSectionEffects("services"),
    getSectionVisibility("services"),
    getPageTypography("services"),
    getPageHeader("services", lang),
    getPageBlocks("services", lang),
    getClientLogos(),
    getClientLogosDisplay(),
    getTestimonials(lang),
    getTestimonialsDisplay(),
  ]);
  const anim = (key: string): RevealVariant => (sectionAnim[key] as RevealVariant) || "fade-up";
  const fx = (key: string) => sectionEffects[key] ?? defaultSectionEffect;
  const visible = (key: string): boolean => sectionVis[key] !== false;

  return (
    <>
    <CustomSchemaScript path="/services" lang={lang} />
    <div className="container-page py-24">
      <div className={typography.align === "center" ? "text-center" : ""}>
        {header.eyebrow ? (
          <div className="text-[13px] font-semibold tracking-[0.14em] text-gold uppercase mb-3.5">{header.eyebrow}</div>
        ) : null}
        <h1 className={`${HEADING_FONT_CLASS[typography.fontFamily]} text-ink max-w-2xl leading-tight mb-6 ${typography.align === "center" ? "mx-auto" : ""}`} style={{ fontSize: HEADING_SIZE_PX[typography.headingSize] }}>
          {header.headline}
        </h1>
        {header.lead ? (
        <p className={`text-muted leading-relaxed max-w-2xl ${typography.align === "center" ? "mx-auto" : ""}`} style={{ fontSize: BODY_SIZE_PX[typography.bodySize] }}>
          {header.lead}
        </p>
        ) : null}
      </div>

      {visible("grid") ? (
      <Reveal variant={anim("grid")} speed={fx("grid").speed} delay={DELAY_MS[fx("grid").delay]} hover={fx("grid").hover} stagger={fx("grid").stagger} background={fx("grid").background} backgroundColor={fx("grid").backgroundColor} backgroundTextColor={fx("grid").backgroundTextColor} className="grid grid-cols-1 sm:grid-cols-2 card-grid gap-px bg-line border border-line mt-14">
        {services.map((service) => (
          <div key={service.slug} className="bg-white p-10">
            {service.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={service.imageUrl}
                alt=""
                style={{ objectPosition: service.imagePosition || "center" }}
                className="w-full h-40 object-cover rounded-[var(--radius)] mb-6"
              />
            ) : null}
            <h2 className="font-serif text-xl text-ink font-semibold">{service.title}</h2>
            <p className="text-[15px] text-muted leading-relaxed mt-3 line-clamp-3">
              {richTextToPlainText(service.description)}
            </p>
            <Link
              href={lh(lang, `/services/${service.slug}`)}
              className="inline-block mt-5 text-[13.5px] font-semibold text-ink border-b border-ink pb-0.5"
            >
              See more &rarr;
            </Link>
          </div>
        ))}
      </Reveal>
      ) : null}
    </div>
    <PageBlocks blocks={pageBlocks} lang={lang} />
    {/* Trusted-by / testimonials, shown here only when the admin has
        turned it on for this page (Admin → Client Logos / Testimonials →
        Display Settings → "Also show on") — the homepage's own showing is
        controlled separately by its Section Visibility toggle. Combined
        into one dark band with a heading and clear internal spacing when
        both are on — see the matching comment on the Service detail page
        for why. */}
    {(clientLogos.length > 0 && clientLogosDisplay.showOnServicesPage) ||
    (testimonials.length > 0 && testimonialsDisplay.showOnServicesPage) ? (
      <div
        className={`w-full pt-16 pb-20 ${clientLogosDisplay.bandColor ? "" : "bg-navy"}`}
        style={clientLogosDisplay.bandColor ? { backgroundColor: clientLogosDisplay.bandColor } : undefined}
      >
        {clientLogos.length > 0 && clientLogosDisplay.showOnServicesPage ? (
          <ClientLogosStrip logos={clientLogos} display={clientLogosDisplay} tone="dark" className="!pt-0 !pb-14" />
        ) : null}
        {testimonials.length > 0 && testimonialsDisplay.showOnServicesPage ? (
          <div className="container-page">
            {clientLogos.length > 0 && clientLogosDisplay.showOnServicesPage ? (
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
