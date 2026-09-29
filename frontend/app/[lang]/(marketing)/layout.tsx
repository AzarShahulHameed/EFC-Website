import { notFound } from "next/navigation";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import PageViewTracker from "@/components/site/PageViewTracker";
import ChatWidget from "@/components/site/ChatWidget";
import FloatingContactButtons from "@/components/site/FloatingContactButtons";
import LocationGate from "@/components/site/LocationGate";
import ImageProtectionGuard from "@/components/site/ImageProtectionGuard";
import SmoothScroll from "@/components/site/SmoothScroll";
import { locationGateBootScript } from "@/lib/location-gate-boot-script";
import { safeJsonLd } from "@/lib/json-ld";
import { dirFor, isLocale, locales, type Locale } from "@/lib/i18n";
import {
  getBranches,
  getBranchCountries,
  getFooterLinksContent,
  getHeaderUtilityBar,
  getLocationGateConfig,
  getNavLinksOverride,
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

  const [siteConfig, navLinksOverride, footerLinks, services, locationGate, countries, branches, headerUtilityBar, scrollMotion] = await Promise.all([
    getSiteConfig(lang),
    getNavLinksOverride(lang),
    getFooterLinksContent(lang),
    getServices(lang),
    getLocationGateConfig(lang),
    getBranchCountries(),
    getBranches(),
    getHeaderUtilityBar(),
    getScrollMotion(),
  ]);

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
      <ChatWidget lang={lang} />
      <FloatingContactButtons phone={siteConfig.phone} whatsapp={siteConfig.whatsapp} enabled={siteConfig.floatingContactEnabled !== false} />
      {locationGate.enabled && countries.length > 0 ? (
        <>
          {/* Runs before hydration so the gate never flashes over the homepage. */}
          <script dangerouslySetInnerHTML={{ __html: locationGateBootScript(locationGate.trigger) }} />
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
        </>
      ) : null}
      <Header lang={lang} siteConfig={siteConfig} navLinksOverride={navLinksOverride} services={services} branches={branches} utilityBarStyle={headerUtilityBar.style} />
      <main>{children}</main>
      <Footer lang={lang} siteConfig={siteConfig} footerLinks={footerLinks} />
    </div>
  );
}
