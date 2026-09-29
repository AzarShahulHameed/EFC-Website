import Link from "next/link";
import { getBranches, getClientLogos, getClientLogosDisplay, getTestimonialsDisplay, getFreezoneApprovals, getFreezoneDisplay, getHomeContent, getInsights, getPageBlocks, getSectionAnimations, getSectionEffects, DELAY_MS, defaultSectionEffect, getSectionVisibility, getServices, getTestimonials, buildPageMetadata, getPageTypography, HEADING_SIZE_PX, BODY_SIZE_PX, getScrollFrameHero, getScrollMotion } from "@/lib/api";
import ScrollFrameHero from "@/components/site/ScrollFrameHero";
import type { RevealVariant } from "@/components/site/Reveal";
import { isLocale, lh, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import Reveal from "@/components/site/Reveal";
import PageBlocks from "@/components/site/PageBlocks";
import { sanitizeRichText } from "@/lib/rich-text";
import { heroScrim } from "@/lib/hero-scrim";
import ClientLogosStrip from "@/components/site/ClientLogosStrip";
import TestimonialsSection from "@/components/site/TestimonialsSection";
import FreezoneCarousel from "@/components/site/FreezoneCarousel";
import { LinkedInMark } from "@/components/site/LinkedInBadge";
import { contrastTextColor } from "@/lib/theme-runtime";
import CustomSchemaScript from "@/components/site/CustomSchemaScript";

export async function generateMetadata({ params }: { params: { lang: string } }) {
  return buildPageMetadata(
    "/",
    params.lang,
    "EFC — Audit, Tax & Advisory in the UAE",
    "External and internal audit, tax, VAT and corporate advisory across the United Arab Emirates.",
  );
}

export default async function HomePage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;

  const [homeContent, services, testimonials, branches, clientLogos, clientLogosDisplay, testimonialsDisplay, freezoneApprovals, freezoneDisplay, insights, sectionAnim, sectionEffects, sectionVis, typography, pageBlocks, scrollFrameHero, scrollMotion] = await Promise.all([
    getHomeContent(lang),
    getServices(lang),
    getTestimonials(lang),
    getBranches(),
    getClientLogos(),
    getClientLogosDisplay(),
    getTestimonialsDisplay(),
    getFreezoneApprovals(lang),
    getFreezoneDisplay(),
    getInsights(lang),
    getSectionAnimations("home"),
    getSectionEffects("home"),
    getSectionVisibility("home"),
    getPageTypography("home"),
    getPageBlocks("home", lang),
    getScrollFrameHero(),
    getScrollMotion(),
  ]);
  // Parallax and the classic Ken Burns drift both animate the same
  // `transform` property on the hero image, and a CSS animation's final
  // frame (`animation-fill-mode: forwards`) always wins that property over
  // a plain stylesheet rule — so stacking both classes would silently make
  // the parallax rule a no-op on the <img> once Ken Burns finishes. They're
  // mutually exclusive by design anyway (both exist to keep the hero image
  // from feeling static), so pick one per the admin's Scroll & Motion
  // setting instead of applying both.
  const heroImageMotionClass = scrollMotion.parallaxHero ? "parallax-bg" : "hero-kenburns";
  const { hero: heroContent, stats, trustBadges, whyChooseUs, industries } = homeContent;
  // Falls back to "fade-up" (the site's original look) for any section an
  // admin hasn't explicitly set yet — see Admin → Content → Home → Section
  // Visibility & Animations.
  const anim = (key: string): RevealVariant => (sectionAnim[key] as RevealVariant) || "fade-up";
  const fx = (key: string) => sectionEffects[key] ?? defaultSectionEffect;
  // A section with no saved choice is visible by default.
  const visible = (key: string): boolean => sectionVis[key] !== false;

  return (
    <>
      <CustomSchemaScript path="/" lang={lang} />
      {/* HERO — either the admin-uploaded scroll-driven frame-sequence
          animation (Admin → Landing Animation), when turned on and frames
          are actually uploaded, or the normal full-bleed video/image hero
          with its floating stats card below. */}
      {scrollFrameHero.enabled && scrollFrameHero.frames.length > 0 ? (
        <ScrollFrameHero lang={lang} hero={scrollFrameHero} branches={branches} />
      ) : (
      <section className="relative w-full h-[86vh] min-h-[560px] max-h-[820px] overflow-hidden bg-navy" data-cursor-glow-surface>
        {heroContent.videoUrl ? (
          <video
            className="parallax-bg absolute inset-0 w-full h-full object-cover"
            src={heroContent.videoUrl}
            poster={heroContent.imageUrl || undefined}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : heroContent.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={heroContent.imageUrl}
            alt=""
            style={{ objectPosition: heroContent.imagePosition || "center" }}
            className={`absolute inset-0 w-full h-full object-cover ${heroImageMotionClass}`}
          />
        ) : (
          <div className="absolute inset-0 overflow-hidden">
            <svg width="100%" height="100%" viewBox="0 0 1440 820" fill="none" preserveAspectRatio="xMidYMax slice" aria-hidden="true" className="opacity-80">
              <rect x="120" y="480" width="90" height="340" fill="#132844" />
              <rect x="230" y="360" width="80" height="460" fill="#152C4B" />
              <rect x="330" y="560" width="70" height="260" fill="#132844" />
              <rect x="420" y="220" width="100" height="600" fill="#173456" />
              <rect x="540" y="400" width="76" height="420" fill="#132844" />
              <rect x="636" y="120" width="56" height="700" fill="#B08D3F" opacity="0.7" />
              <rect x="712" y="440" width="86" height="380" fill="#152C4B" />
              <rect x="818" y="300" width="70" height="520" fill="#132844" />
              <rect x="908" y="500" width="80" height="320" fill="#173456" />
              <rect x="1008" y="380" width="64" height="440" fill="#132844" />
              <rect x="1092" y="460" width="90" height="360" fill="#152C4B" />
              <rect x="1202" y="300" width="70" height="520" fill="#132844" />
              <rect x="1292" y="420" width="94" height="400" fill="#173456" />
            </svg>
          </div>
        )}
        {/* Scrim so light text stays readable over any photo/video — darkness
            is admin-configurable (Admin → Content → Home → Hero → Overlay
            Darkness) rather than fixed, since a fixed-dark scrim can make a
            bright video look dull/muddy. */}
        <div className="absolute inset-0" style={{ background: heroScrim(heroContent.overlayOpacity ?? 55) }} />

        <div className="relative z-10 h-full container-page flex flex-col justify-center">
          <div className={`max-w-2xl hero-anim-${heroContent.animation || "fade-up"}`}>
            {heroContent.eyebrow ? (
              <div className="text-[13px] font-semibold tracking-[0.14em] text-gold-light uppercase mb-5">
                {heroContent.eyebrow}
              </div>
            ) : null}
            {heroContent.headline ? (
              <h1
                className="font-serif leading-[1.08] text-white font-semibold"
                style={{ fontSize: `calc(${HEADING_SIZE_PX[typography.headingSize]} * 1.25)` }}
              >
                {heroContent.headline}
              </h1>
            ) : null}
            {heroContent.body ? (
              <div
                className="leading-relaxed text-slate-300 max-w-lg mt-6"
                style={{ fontSize: BODY_SIZE_PX[typography.bodySize] }}
                dangerouslySetInnerHTML={{ __html: sanitizeRichText(heroContent.body) }}
              />
            ) : null}
            {heroContent.primaryCta.label || heroContent.secondaryCta.label ? (
              <div className="flex flex-wrap gap-4 mt-9">
                {heroContent.primaryCta.label ? (
                  <Link
                    href={lh(lang, heroContent.primaryCta.href)}
                    className="bg-gold text-[#1A1204] font-semibold text-[15px] px-7 py-4 rounded-[var(--btn-radius)] hover:bg-gold-light transition-colors"
                  >
                    {heroContent.primaryCta.label}
                  </Link>
                ) : null}
                {heroContent.secondaryCta.label ? (
                  <Link
                    href={lh(lang, heroContent.secondaryCta.href)}
                    className="border border-white/35 text-white font-semibold text-[15px] px-7 py-3.5 rounded-[var(--btn-radius)] hover:border-white transition-colors"
                  >
                    {heroContent.secondaryCta.label}
                  </Link>
                ) : null}
              </div>
            ) : null}
            {heroContent.credentialLine ? (
              <p className="text-[13.5px] text-slate-400 mt-8">{heroContent.credentialLine}</p>
            ) : null}
          </div>
        </div>

        {/* Scroll cue */}
        <a
          href="#stats"
          aria-label="Scroll to explore"
          className="hero-scroll-cue absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-slate-300 hover:text-white transition-colors"
        >
          <span className="text-[11px] tracking-[0.16em] uppercase">Scroll</span>
          <svg width="16" height="24" viewBox="0 0 16 24" fill="none" aria-hidden="true">
            <rect x="1" y="1" width="14" height="22" rx="7" stroke="currentColor" strokeWidth="1.4" />
            <circle className="hero-scroll-dot" cx="8" cy="7" r="2" fill="currentColor" />
          </svg>
        </a>
      </section>
      )}

      {/* Floating stats card, overlapping the hero's bottom edge */}
      <section id="stats" className="container-page relative z-20 -mt-16 sm:-mt-20 pb-16">
        {visible("stats") ? (
        <Reveal variant={anim("stats")} speed={fx("stats").speed} delay={DELAY_MS[fx("stats").delay]} hover={fx("stats").hover} stagger={fx("stats").stagger} background={fx("stats").background} backgroundColor={fx("stats").backgroundColor} backgroundTextColor={fx("stats").backgroundTextColor}>
          {/* Known, deliberately-scoped gap (documented rather than silently
              left): this card's own white fill (and the equivalent
              bg-white/bg-paper fills on the trust-badge tiles, service
              cards, and location cards further down this page) is not yet
              wired to a Section Background admin field the way the
              section wrapper above it is — the admin Section Background
              picker changes the wrapper `<Reveal>`'s panel behind this
              card, but not the card's own fill. Fixing this properly means
              a distinct "card background" control (as opposed to
              "section background"), which doesn't exist as a concept in
              the admin dashboard yet; adding it is a real follow-up, not
              done here to avoid rushing a half-considered field into the
              schema. */}
          <div className="bg-white rounded-[var(--radius)] shadow-[0_18px_60px_-15px_rgba(10,27,51,0.35)] grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10 px-8 sm:px-12 py-9">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-serif text-3xl sm:text-4xl font-semibold text-gold">{s.value}</div>
                <div className="text-[13px] text-muted mt-2">{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
        ) : null}
      </section>

      {/* APPROVED FREEZONE / PARTNERSHIP BANNER — one or more admin-managed
          approvals (photo/video, headline, body, link). With more than one
          active entry, FreezoneCarousel auto-rotates them horizontally on
          the admin's chosen interval (Admin → Freezone Approvals). */}
      {freezoneDisplay.enabled && freezoneApprovals.length > 0 && visible("freezone") ? (
        <Reveal
          variant={anim("freezone")}
          speed={fx("freezone").speed}
          delay={DELAY_MS[fx("freezone").delay]}
          hover={fx("freezone").hover}
          stagger={fx("freezone").stagger}
          background={fx("freezone").background} backgroundColor={fx("freezone").backgroundColor} backgroundTextColor={fx("freezone").backgroundTextColor}
          // The `bg-paper-2` fallback only applies while the admin hasn't
          // picked a Section Background in Admin → Animations/Design for
          // this section (background === "none", the untouched default) —
          // otherwise it would sit in the same class attribute as Reveal's
          // own background class and silently outrank or fight with
          // whatever the admin chose, making that control a no-op.
          className={`w-full ${fx("freezone").background === "none" ? "bg-paper-2" : ""}`}
        >
          <FreezoneCarousel approvals={freezoneApprovals} display={freezoneDisplay} lang={lang} />
        </Reveal>
      ) : null}

      {/* TRUST STRIP */}
      {visible("trustBadges") ? (
      <Reveal variant={anim("trustBadges")} speed={fx("trustBadges").speed} delay={DELAY_MS[fx("trustBadges").delay]} hover={fx("trustBadges").hover} stagger={fx("trustBadges").stagger} background={fx("trustBadges").background} backgroundColor={fx("trustBadges").backgroundColor} backgroundTextColor={fx("trustBadges").backgroundTextColor} className="container-page pb-18">
        <div className="text-center text-[12.5px] tracking-[0.14em] text-slate-500 uppercase mb-6">
          Regulated &amp; Recognised By
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 card-grid gap-px bg-line border border-line">
          {trustBadges.map((badge) => (
            <div key={badge.label} className="bg-paper py-5 px-4 flex flex-col items-center justify-center gap-2 text-center">
              {badge.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={badge.logoUrl} alt={badge.label} className="h-8 object-contain" />
              ) : null}
              <span className="font-serif text-[14.5px] font-semibold text-[#3A4557]">{badge.label}</span>
            </div>
          ))}
        </div>
      </Reveal>
      ) : null}

      {/* CLIENT LOGOS */}
      {clientLogos.length > 0 && visible("clientLogos") ? (
        <Reveal variant={anim("clientLogos")} speed={fx("clientLogos").speed} delay={DELAY_MS[fx("clientLogos").delay]} hover={fx("clientLogos").hover} stagger={fx("clientLogos").stagger} background={fx("clientLogos").background} backgroundColor={fx("clientLogos").backgroundColor} backgroundTextColor={fx("clientLogos").backgroundTextColor}>
          <ClientLogosStrip logos={clientLogos} display={clientLogosDisplay} />
        </Reveal>
      ) : null}

      {/* SERVICES */}
      {visible("services") ? (
      <Reveal variant={anim("services")} speed={fx("services").speed} delay={DELAY_MS[fx("services").delay]} hover={fx("services").hover} stagger={fx("services").stagger} background={fx("services").background} backgroundColor={fx("services").backgroundColor} backgroundTextColor={fx("services").backgroundTextColor} id="services" className="container-page py-28">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mb-14">
          <div>
            <div className="text-[13px] font-semibold tracking-[0.14em] text-gold uppercase mb-3.5">
              What We Do
            </div>
            <h2 className="font-serif text-4xl text-ink max-w-lg leading-tight">
              Full-spectrum assurance, tax and advisory
            </h2>
          </div>
          <p className="text-[15.5px] text-muted max-w-sm leading-relaxed">
            Every engagement is led by a partner and staffed by specialists who know your sector&apos;s regulatory
            pressure points.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 card-grid gap-px bg-line border border-line">
          {services.map((service) => (
            <div key={service.slug} className="bg-white p-9">
              {service.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={service.imageUrl}
                  alt=""
                  style={{ objectPosition: service.imagePosition || "center" }}
                  className="w-full h-36 object-cover rounded-[var(--radius)] mb-5"
                />
              ) : null}
              <h3 className="font-serif text-lg text-ink font-semibold">{service.title}</h3>
              <p className="text-[14.5px] text-muted leading-relaxed mt-2.5 line-clamp-3">{service.summary}</p>
              <Link
                href={lh(lang, `/services/${service.slug}`)}
                className="inline-block mt-4 text-[13.5px] font-semibold text-ink border-b border-ink pb-0.5"
              >
                Learn more &rarr;
              </Link>
            </div>
          ))}
        </div>
      </Reveal>
      ) : null}

      {/* WHY CHOOSE US */}
      {visible("whyChooseUs") ? (
      <Reveal variant={anim("whyChooseUs")} speed={fx("whyChooseUs").speed} delay={DELAY_MS[fx("whyChooseUs").delay]} hover={fx("whyChooseUs").hover} stagger={fx("whyChooseUs").stagger} background={fx("whyChooseUs").background} backgroundColor={fx("whyChooseUs").backgroundColor} backgroundTextColor={fx("whyChooseUs").backgroundTextColor} className={`w-full ${fx("whyChooseUs").background === "none" ? "bg-paper-2" : ""}`}>
        <div className="container-page py-24">
          <div className="text-[13px] font-semibold tracking-[0.14em] text-gold uppercase mb-3.5">
            Why {'\u0053terling & Vance'}
          </div>
          <h2 className="font-serif text-3xl text-ink max-w-xl leading-tight mb-14">
            Built for businesses that answer to regulators
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {whyChooseUs.map((item) => (
              <div key={item.title}>
                {item.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.iconUrl} alt="" className="w-11 h-11 rounded-full object-cover" />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-navy flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                      <path d="M3.5 9.5L7 13L14.5 5" stroke="#C9A354" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
                <h3 className="text-[17px] text-ink font-semibold mt-5">{item.title}</h3>
                <p className="text-sm text-muted leading-relaxed mt-2.5">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
      ) : null}

      {/* INDUSTRIES */}
      {visible("industries") ? (
      <Reveal variant={anim("industries")} speed={fx("industries").speed} delay={DELAY_MS[fx("industries").delay]} hover={fx("industries").hover} stagger={fx("industries").stagger} background={fx("industries").background} backgroundColor={fx("industries").backgroundColor} backgroundTextColor={fx("industries").backgroundTextColor} id="industries" className="container-page py-24">
        <div className="text-[13px] font-semibold tracking-[0.14em] text-gold uppercase mb-3.5">
          Industries Served
        </div>
        <h2 className="font-serif text-3xl text-ink max-w-lg leading-tight mb-10">Specialist teams, by sector</h2>
        <div className="flex flex-wrap gap-3">
          {industries.map((industry) => (
            <span key={industry.name} className="border border-line px-5 py-3 text-[14.5px] text-ink font-medium flex items-center gap-2.5">
              {industry.iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={industry.iconUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
              ) : null}
              {industry.name}
            </span>
          ))}
        </div>
      </Reveal>
      ) : null}

      {/* TESTIMONIALS — background color has two possible sources: the
          dedicated "Section Background Color" on Testimonials' own admin
          page (testimonialsDisplay.sectionBackgroundColor — the one a
          non-technical admin actually finds, since it lives on the page
          about testimonials), which wins when set; otherwise the generic
          per-section Background control from Pages & Content → Home. Either
          way, the heading/eyebrow text color is computed from whatever
          color actually ends up applied instead of being hardcoded
          near-white — that hardcoding is exactly why the heading went
          invisible when a background was changed to something light. */}
      {visible("testimonials") ? (
      (() => {
        const customBg = testimonialsDisplay.sectionBackgroundColor;
        const effectiveBackground = customBg ? "custom" : fx("testimonials").background;
        const effectiveBackgroundColor = customBg || fx("testimonials").backgroundColor;
        const usesFallbackNavy = !customBg && fx("testimonials").background === "none";
        const headingColor = customBg
          ? contrastTextColor(customBg, "#FAF7EF")
          : fx("testimonials").background === "custom"
          ? contrastTextColor(fx("testimonials").backgroundColor, "#FAF7EF")
          : "#FAF7EF";
        return (
          <Reveal
            variant={anim("testimonials")}
            speed={fx("testimonials").speed}
            delay={DELAY_MS[fx("testimonials").delay]}
            hover={fx("testimonials").hover}
            stagger={fx("testimonials").stagger}
            background={effectiveBackground}
            backgroundColor={effectiveBackgroundColor}
            backgroundTextColor={fx("testimonials").backgroundTextColor}
            className={`w-full ${usesFallbackNavy ? "bg-navy" : ""}`}
          >
            <div className="container-page py-24">
              {/* The default look keeps its gold-light eyebrow (a deliberate
                  accent, not just "some readable color"); only a genuinely
                  custom background swaps it for a computed readable color. */}
              <div
                className={`text-[13px] font-semibold tracking-[0.14em] uppercase mb-3.5 ${
                  effectiveBackground === "custom" ? "" : "text-gold-light"
                }`}
                style={effectiveBackground === "custom" ? { color: headingColor } : undefined}
              >
                Client Perspectives
              </div>
              <h2 className="font-serif text-3xl max-w-lg leading-tight mb-12" style={{ color: headingColor }}>
                What our clients say
              </h2>
              <TestimonialsSection testimonials={testimonials} display={testimonialsDisplay} />
            </div>
          </Reveal>
        );
      })()
      ) : null}

      {/* INSIGHTS */}
      {insights.length > 0 && visible("insights") ? (
        <Reveal variant={anim("insights")} speed={fx("insights").speed} delay={DELAY_MS[fx("insights").delay]} hover={fx("insights").hover} stagger={fx("insights").stagger} background={fx("insights").background} backgroundColor={fx("insights").backgroundColor} backgroundTextColor={fx("insights").backgroundTextColor} className="container-page py-24">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-14">
            <div>
              <div className="text-[13px] font-semibold tracking-[0.14em] text-gold uppercase mb-3.5">
                Perspectives
              </div>
              <h2 className="font-serif text-3xl text-ink max-w-lg leading-tight">Latest insights</h2>
            </div>
            <Link
              href={lh(lang, "/insights")}
              className="text-[13.5px] font-semibold text-ink border-b border-ink pb-0.5 whitespace-nowrap"
            >
              View all insights &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8">
            {/* Latest post, featured — insights is already ordered
                most-recent-first (the API orders by publishAt desc), so
                this is always whatever was published or edited last, with
                zero manual picking required in the admin. */}
            {(() => {
              const [latest, ...rest] = insights;
              if (!latest) return null;
              const latestLinkProps = latest.linkedinUrl
                ? { href: latest.linkedinUrl, target: "_blank", rel: "noopener noreferrer nofollow" }
                : { href: lh(lang, `/insights/${latest.slug}`) };
              return (
                <>
                  <Link {...(latestLinkProps as any)} className="group block">
                    {latest.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={latest.coverImageUrl}
                        alt=""
                        style={{ objectPosition: latest.coverImagePosition || "center" }}
                        className="hover-target w-full h-64 object-cover rounded-[var(--radius)]"
                      />
                    ) : null}
                    <div className="flex items-center gap-2 flex-wrap mt-4 mb-1.5">
                      <span className="text-[11px] font-bold tracking-[0.1em] text-white bg-gold uppercase px-2 py-1 rounded-[3px]">
                        Latest
                      </span>
                      {latest.category ? (
                        <span className="text-[11.5px] font-semibold tracking-[0.1em] text-gold uppercase">
                          {latest.category}
                        </span>
                      ) : null}
                      {latest.linkedinUrl ? <LinkedInMark size={16} /> : null}
                    </div>
                    <h3 className="font-serif text-2xl text-ink font-semibold leading-snug group-hover:text-gold">
                      {latest.title}
                    </h3>
                    <p className="text-[14.5px] text-muted mt-2.5 leading-relaxed line-clamp-3 max-w-xl">{latest.excerpt}</p>
                  </Link>

                  <div className="flex flex-col gap-6">
                    {rest.slice(0, 2).map((article) => {
                      const linkProps = article.linkedinUrl
                        ? { href: article.linkedinUrl, target: "_blank", rel: "noopener noreferrer nofollow" }
                        : { href: lh(lang, `/insights/${article.slug}`) };
                      return (
                      <Link key={article.slug} {...(linkProps as any)} className="group flex gap-4 items-start">
                        {article.coverImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={article.coverImageUrl}
                            alt=""
                            style={{ objectPosition: article.coverImagePosition || "center" }}
                            className="w-28 h-20 object-cover rounded-[var(--radius)] flex-shrink-0"
                          />
                        ) : null}
                        <div>
                          {article.category ? (
                            <div className="text-[11px] font-semibold tracking-[0.1em] text-gold uppercase mb-1 flex items-center gap-1.5">
                              {article.category}
                              {article.linkedinUrl ? <LinkedInMark size={13} /> : null}
                            </div>
                          ) : null}
                          <h3 className="font-serif text-[15px] text-ink font-semibold leading-snug group-hover:text-gold">
                            {article.title}
                          </h3>
                        </div>
                      </Link>
                      );
                    })}
                  </div>
                </>
              );
            })()}
          </div>
        </Reveal>
      ) : null}

      {/* LOCATIONS */}
      {visible("locations") ? (
      <Reveal variant={anim("locations")} speed={fx("locations").speed} delay={DELAY_MS[fx("locations").delay]} hover={fx("locations").hover} stagger={fx("locations").stagger} background={fx("locations").background} backgroundColor={fx("locations").backgroundColor} backgroundTextColor={fx("locations").backgroundTextColor} id="locations" className="container-page py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-[13px] font-semibold tracking-[0.14em] text-gold uppercase mb-3.5">
              Locations
            </div>
            <h2 className="font-serif text-3xl text-ink leading-tight mb-6">Present across the Emirates</h2>
            <p className="text-[15.5px] text-muted leading-relaxed max-w-md">
              From our headquarters in Dubai to branch offices in Abu Dhabi and Sharjah, our teams work close to
              where your business operates.
            </p>
            <Link
              href={lh(lang, "/contact")}
              className="inline-block mt-6 text-sm font-semibold text-ink border-b border-ink pb-0.5"
            >
              Find your nearest office &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 card-grid gap-px bg-line border border-line">
            {branches.map((b) => (
              <div key={b.city} className="bg-white p-6">
                <div className="font-serif text-lg font-semibold text-ink">{b.city}</div>
                {b.country ? <div className="text-[13.5px] text-slate-500 mt-1.5">{b.country}</div> : null}
              </div>
            ))}
          </div>
        </div>
      </Reveal>
      ) : null}

      {/* CTA */}
      {visible("cta") ? (
      <Reveal variant={anim("cta")} speed={fx("cta").speed} delay={DELAY_MS[fx("cta").delay]} hover={fx("cta").hover} stagger={fx("cta").stagger} background={fx("cta").background} backgroundColor={fx("cta").backgroundColor} backgroundTextColor={fx("cta").backgroundTextColor} className={`w-full ${fx("cta").background === "none" ? "bg-paper-2" : ""}`}>
        <div className="container-page py-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <h2 className="font-serif text-3xl text-ink leading-tight max-w-lg">
            Speak with an audit partner this week.
          </h2>
          <Link
            href={lh(lang, "/contact")}
            className="bg-gold text-[#1A1204] font-semibold text-[15px] px-8 py-4 rounded-[var(--btn-radius)] whitespace-nowrap hover:bg-gold-light transition-colors"
          >
            Schedule a Consultation
          </Link>
        </div>
      </Reveal>
      ) : null}

      {/* PAGE BUILDER — additional content an admin has added themselves
          (Admin → Page Builder), appended after the fixed sections above. */}
      <PageBlocks blocks={pageBlocks} lang={lang} />
    </>
  );
}
