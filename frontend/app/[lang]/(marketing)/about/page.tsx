import { getAboutContent, getSectionAnimations, getSectionEffects, DELAY_MS, defaultSectionEffect, getSectionVisibility, buildPageMetadata, getPageTypography, getPageHeader, HEADING_SIZE_PX, BODY_SIZE_PX, HEADING_FONT_CLASS } from "@/lib/api";
import { isLocale, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import { sanitizeRichText } from "@/lib/rich-text";
import Reveal from "@/components/site/Reveal";
import type { RevealVariant } from "@/components/site/Reveal";
import PhotoGallery from "@/components/site/PhotoGallery";
import MilestoneTimeline from "@/components/site/MilestoneTimeline";
import PageBlocks from "@/components/site/PageBlocks";
import { getPageBlocks } from "@/lib/api";
import CustomSchemaScript from "@/components/site/CustomSchemaScript";

export async function generateMetadata({ params }: { params: { lang: string } }) {
  return buildPageMetadata(
    "/about",
    params.lang,
    "About Us — EFC",
    "A UAE-based audit, tax and advisory practice — our story, mission, values and leadership.",
  );
}

export default async function AboutPage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const [{ intro, values, timeline, leadership, gallery, milestoneAnimation }, sectionAnim, sectionEffects, sectionVis, typography, header, pageBlocks] = await Promise.all([
    getAboutContent(lang),
    getSectionAnimations("about"),
    getSectionEffects("about"),
    getSectionVisibility("about"),
    getPageTypography("about"),
    getPageHeader("about", lang),
    getPageBlocks("about", lang),
  ]);
  // Falls back to "fade-up" for any section an admin hasn't explicitly set
  // yet — see Admin → Content → About → Section Visibility & Animations.
  const anim = (key: string): RevealVariant => (sectionAnim[key] as RevealVariant) || "fade-up";
  const fx = (key: string) => sectionEffects[key] ?? defaultSectionEffect;
  const visible = (key: string): boolean => sectionVis[key] !== false;

  return (
    <>
    <CustomSchemaScript path="/about" lang={lang} />
    <div className="container-page py-24">
      <div className={typography.align === "center" ? "text-center mx-auto" : ""}>
        {header.eyebrow ? (
          <div className="text-[13px] font-semibold tracking-[0.14em] text-gold uppercase mb-3.5">{header.eyebrow}</div>
        ) : null}
        <h1 className={`${HEADING_FONT_CLASS[typography.fontFamily]} text-ink max-w-2xl leading-tight mb-8 ${typography.align === "center" ? "mx-auto" : ""}`} style={{ fontSize: HEADING_SIZE_PX[typography.headingSize] }}>
          {header.headline}
        </h1>
      </div>
      {visible("intro") ? (
      <Reveal variant={anim("intro")} speed={fx("intro").speed} delay={DELAY_MS[fx("intro").delay]} hover={fx("intro").hover} stagger={fx("intro").stagger} background={fx("intro").background} backgroundColor={fx("intro").backgroundColor} backgroundTextColor={fx("intro").backgroundTextColor} className="grid grid-cols-1 lg:grid-cols-[1fr_0.8fr] gap-14 items-start">
        <p className="text-muted leading-relaxed max-w-2xl" style={{ fontSize: BODY_SIZE_PX[typography.bodySize] }}>
          {header.lead ? `${header.lead} ` : ""}
          <span dangerouslySetInnerHTML={{ __html: sanitizeRichText(intro.story) }} />
        </p>
        {intro.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={intro.imageUrl}
            alt=""
            style={{ objectPosition: intro.imagePosition || "center" }}
            className="hover-target w-full h-64 object-cover rounded-[var(--radius)]"
          />
        ) : null}
      </Reveal>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-14 mt-20">
        <div>
          <h2 className="font-serif text-2xl text-ink mb-3">Mission</h2>
          <p className="text-[15px] text-muted leading-relaxed">{intro.mission}</p>
        </div>
        <div>
          <h2 className="font-serif text-2xl text-ink mb-3">Vision</h2>
          <p className="text-[15px] text-muted leading-relaxed">{intro.vision}</p>
        </div>
      </div>

      {visible("gallery") && gallery.photos.length > 0 ? (
      <Reveal variant={anim("gallery")} speed={fx("gallery").speed} delay={DELAY_MS[fx("gallery").delay]} hover={fx("gallery").hover} stagger={fx("gallery").stagger} background={fx("gallery").background} backgroundColor={fx("gallery").backgroundColor} backgroundTextColor={fx("gallery").backgroundTextColor} className="mt-20">
        <h2 className="font-serif text-2xl text-ink mb-8">Our Team &amp; Offices</h2>
        <PhotoGallery photos={gallery.photos} />
      </Reveal>
      ) : null}

      {visible("values") ? (
      <Reveal variant={anim("values")} speed={fx("values").speed} delay={DELAY_MS[fx("values").delay]} hover={fx("values").hover} stagger={fx("values").stagger} background={fx("values").background} backgroundColor={fx("values").backgroundColor} backgroundTextColor={fx("values").backgroundTextColor} className="mt-20">
        <h2 className="font-serif text-2xl text-ink mb-8">Our Values</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {values.map((v) => (
            <div key={v.title} className="border border-line p-7">
              <h3 className="text-[16px] font-semibold text-ink">{v.title}</h3>
              <p className="text-[14px] text-muted leading-relaxed mt-2.5">{v.description}</p>
            </div>
          ))}
        </div>
      </Reveal>
      ) : null}

      {visible("timeline") ? (
      <Reveal variant={anim("timeline")} speed={fx("timeline").speed} delay={DELAY_MS[fx("timeline").delay]} hover={fx("timeline").hover} stagger={fx("timeline").stagger} background={fx("timeline").background} backgroundColor={fx("timeline").backgroundColor} backgroundTextColor={fx("timeline").backgroundTextColor} className="mt-20">
        <h2 className="font-serif text-2xl text-ink mb-10 text-center">Milestones</h2>
        <MilestoneTimeline timeline={timeline} animation={milestoneAnimation} lang={lang} />
      </Reveal>
      ) : null}

      {visible("leadership") ? (
      <Reveal variant={anim("leadership")} speed={fx("leadership").speed} delay={DELAY_MS[fx("leadership").delay]} hover={fx("leadership").hover} stagger={fx("leadership").stagger} background={fx("leadership").background} backgroundColor={fx("leadership").backgroundColor} backgroundTextColor={fx("leadership").backgroundTextColor} className="mt-20 bg-paper-2 p-10 flex flex-col sm:flex-row gap-8 items-start">
        {leadership.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={leadership.imageUrl}
            alt={leadership.name}
            style={{ objectPosition: leadership.imagePosition || "center" }}
            className="hover-target w-28 h-28 rounded-full object-cover flex-shrink-0"
          />
        ) : null}
        <div>
          <h2 className="font-serif text-2xl text-ink mb-3">A Message From Leadership</h2>
          <p className="text-[15px] text-muted leading-relaxed max-w-2xl">
            &ldquo;<span dangerouslySetInnerHTML={{ __html: sanitizeRichText(leadership.message) }} />&rdquo;
          </p>
          <div className="mt-5 text-sm font-semibold text-ink">{leadership.name}</div>
        </div>
      </Reveal>
      ) : null}
    </div>
    <PageBlocks blocks={pageBlocks} lang={lang} />
    </>
  );
}
