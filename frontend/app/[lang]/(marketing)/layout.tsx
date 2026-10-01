import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import PageViewTracker from "@/components/site/PageViewTracker";
import ChatWidget from "@/components/site/ChatWidget";
import FloatingContactButtons from "@/components/site/FloatingContactButtons";
import LocationGate from "@/components/site/LocationGate";
import LaunchGate from "@/components/site/LaunchGate";
import ImageProtectionGuard from "@/components/site/ImageProtectionGuard";
import SmoothScroll from "@/components/site/SmoothScroll";
import { safeJsonLd } from "@/lib/json-ld";
import { dirFor, isLocale, locales, type Locale } from "@/lib/i18n";
import {
  getBranches,
  getBranchCountries,
  getFooterLinksContent,
  getHeaderUtilityBar,
  getLocationGateConfig,
  getLaunchGateConfig,
  isLaunchGateActive,
  getNavLinksOverride,
  getScrollFrameHero,
  getScrollMotion,
  getServices,
  getSiteConfig,
  SCROLL_MOTION_DURATION,
  SITE_URL,
} from "@/lib/api";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export default async function MarketingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;

  // Checked first, and alone — while the launch gate is active, nothing
  // else on this page needs fetching or rendering at all: no header, no
  // footer, no chat widget, no page content. Every visitor sees only the
  // countdown until real server time passes the configured launch moment.
  const launchGate = await getLaunchGateConfig();
  if (isLaunchGateActive(launchGate)) {
    return (
      <div dir={dirFor(lang)} lang={lang}>
        <LaunchGate
          launchAt={launchGate.launchAt}
          crestLetter={launchGate.crestLetter}
          logoUrl={launchGate.logoUrl}
          headline={launchGate.headline}
          subtext={launchGate.subtext}
          backgroundColor={launchGate.backgroundColor}
          accentColor={launchGate.accentColor}
          petalColors={launchGate.petalColors}
          enableBlossom={launchGate.enableBlossom}
        />
      </div>
    );
  }

  const [siteConfig, navLinksOverride, footerLinks, services, locationGate, countries, branches, headerUtilityBar, scrollMotion, scrollFrameHero] = await Promise.all([
    getSiteConfig(lang),
    getNavLinksOverride(lang),
    getFooterLinksContent(lang),
    getServices(lang),
    getLocationGateConfig(lang),
    getBranchCountries(),
    getBranches(),
    getHeaderUtilityBar(),
    getScrollMotion(),
    getScrollFrameHero(),
  ]);

  // The Landing Animation (Admin → Landing Animation) is meant to be its
  // own standalone, full-bleed "landing page" experience — no header, nav,
  // footer, chat widget or floating buttons around it, just the scroll
  // animation itself — and it has its own built-in end-of-scroll location
  // popup (see ScrollFrameHero.tsx), so the separate site-wide Location
  // Gate would otherwise double up with it on the homepage. This only
  // applies on the homepage itself (where that animation actually renders,
  // per app/[lang]/(marketing)/page.tsx) — every other page keeps the
  // normal header/footer/chat/Location Gate exactly as configured.
  const pathname = headers().get("x-pathname") ?? "";
  const isHomepage = pathname === `/${lang}` || pathname === `/${lang}/`;
  const landingAnimationActive = isHomepage && scrollFrameHero.enabled && scrollFrameHero.frames.length > 0;

  // ProfessionalService JSON-LD, present on every marketing page — the
  // baseline structured data that lets Google (and AI answer engines like
  // ChatGPT/Perplexity, which lean on schema.org more than plain text)
  // recognize this as a real, locatable business rather than just a page
  // of text: name, logo, contact details and every branch address in one
  // machine-readable block. Previously there was no site-wide schema at
  // all — only two individual pages (a service's FAQ, a branch's address)
  // had any JSON-LD.
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: siteConfig.name,
    url: SITE_URL,
    ...(siteConfig.logoUrl ? { logo: siteConfig.logoUrl, image: siteConfig.logoUrl } : {}),
    ...(siteConfig.phone ? { telephone: siteConfig.phone } : {}),
    ...(siteConfig.email ? { email: siteConfig.email } : {}),
    sameAs: Object.values(siteConfig.social ?? {}).filter(Boolean),
    address: branches.map((b) => ({
      "@type": "PostalAddress",
      streetAddress: b.address,
      addressLocality: b.city,
      addressCountry: b.country,
    })),
  };

  return (
    <div
      dir={dirFor(lang)}
      lang={lang}
      className={siteConfig.imageProtection?.disableRightClick !== false ? "protect-media" : undefined}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={safeJsonLd(organizationSchema)}
      />
      <ImageProtectionGuard enabled={siteConfig.imageProtection?.disableRightClick !== false} />
      <SmoothScroll
        enabled={scrollMotion.enabled}
        duration={SCROLL_MOTION_DURATION[scrollMotion.intensity]}
        parallaxHero={scrollMotion.parallaxHero}
        cursorGlow={scrollMotion.cursorGlow}
      />
      <PageViewTracker lang={lang} />
      {!landingAnimationActive ? (
        <>
          <ChatWidget lang={lang} />
          <FloatingContactButtons phone={siteConfig.phone} whatsapp={siteConfig.whatsapp} enabled={siteConfig.floatingContactEnabled !== false} />
          {locationGate.enabled && countries.length > 0 ? (
            <LocationGate
              headline={locationGate.headline}
              subtext={locationGate.subtext}
              ctaLabel={locationGate.ctaLabel}
              countries={countries}
              backgroundImageUrl={locationGate.backgroundImageUrl}
              backgroundVideoUrl={locationGate.backgroundVideoUrl}
              overlayOpacity={locationGate.overlayOpacity}
              backgroundTint={locationGate.backgroundTint}
              animation={locationGate.animation}
              textTransition={locationGate.textTransition}
              buttonStyle={locationGate.buttonStyle}
              logoUrl={locationGate.logoUrl}
              logoText={locationGate.logoText}
              trigger={locationGate.trigger}
            />
          ) : null}
          <Header lang={lang} siteConfig={siteConfig} navLinksOverride={navLinksOverride} services={services} branches={branches} utilityBarStyle={headerUtilityBar.style} />
        </>
      ) : null}
      <main>{children}</main>
      {!landingAnimationActive ? <Footer lang={lang} siteConfig={siteConfig} footerLinks={footerLinks} /> : null}
    </div>
  );
}
