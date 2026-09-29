"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { languageNames, languageCountry, lh, locales, uiStrings, type Locale } from "@/lib/i18n";
import { countryCodeFromName } from "@/lib/countries";
import FlagIcon from "./FlagIcon";
import type { SiteConfig, HeaderUtilityBarStyle } from "@/lib/api";
import type { Branch, Service } from "@/lib/content";

export default function Header({
  lang,
  siteConfig,
  navLinksOverride,
  services,
  branches,
  utilityBarStyle = "bar",
}: {
  lang: Locale;
  siteConfig: SiteConfig;
  navLinksOverride: { label: string; href: string }[] | null;
  services: Service[];
  branches: Branch[];
  // Admin → Header & Footer → "Utility Bar Style" — purely presentational
  // treatment of the locations/language row; defaults to the original
  // full-width "bar" look for callers that don't pass it.
  utilityBarStyle?: HeaderUtilityBarStyle;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const t = uiStrings[lang];
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const locationRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const headerRootRef = useRef<HTMLDivElement>(null);

  // Close the mobile drawer automatically on navigation, so the drawer
  // never stays open over a page the visitor already moved to.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Publishes the header's real, current rendered height as a CSS variable
  // on <html> — every page that needs to sit (or, like the Responsible
  // Person sticky sidebar, stay *pinned*) below this sticky header used to
  // assume a fixed height (a hardcoded `top-24`), which silently went stale
  // the moment the header's own height became admin-configurable (Logo
  // Sizing's "Header Logo Height", the Utility Bar Style options, a longer
  // company name wrapping, a different language's nav labels, etc.) — a
  // sticky element pinned at an offset shorter than the header's actual
  // height ends up scrolling *underneath* the header instead of staying
  // visible below it. A ResizeObserver keeps this correct continuously,
  // not just on first render, since the header's own height can change
  // after mount (e.g. the mobile drawer opening, a slow-loading logo image
  // changing its box, or a window resize crossing the `lg:` breakpoint).
  useEffect(() => {
    const node = headerRootRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const setVar = () => document.documentElement.style.setProperty("--site-header-h", `${node.offsetHeight}px`);
    setVar();
    const observer = new ResizeObserver(setVar);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // The location/language pickers below are hand-built dropdowns (not a
  // native <select>) precisely so the open panel can be styled to match
  // the dark header — a native <select>'s option list is drawn by the
  // browser/OS and always comes out white, which looked out of place
  // against the navy utility bar. Close on an outside click since these
  // open on click, not hover.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) setLocationOpen(false);
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Swap only the leading locale segment so the visitor stays on the
  // equivalent page in the new language (e.g. /ar/services -> /fr/services).
  function hrefForLocale(target: Locale) {
    const rest = pathname.replace(/^\/(en|ar|de)/, "") || "/";
    return lh(target, rest);
  }

  // Which nav link (if any) matches the page currently being viewed, so it
  // can get a visual "you are here" indicator — previously every link
  // looked the same regardless of which page was open, giving no sense of
  // location in the site. A hash link (e.g. "/#industries", an in-page
  // anchor on the homepage) never "matches" a pathname, so it's excluded
  // rather than always/never highlighting. "/services" also matches any
  // page under it (a service or sub-service detail page) so the Services
  // link stays highlighted while browsing inside that section.
  function isActiveLink(href: string): boolean {
    if (href.startsWith("/#")) return false;
    const rest = pathname.replace(/^\/(en|ar|de)/, "") || "/";
    if (href === "/") return rest === "/";
    return rest === href || rest.startsWith(`${href}/`);
  }
  const activeNavLinkClass = "text-header-fg border-b-2 border-gold pb-1.5";

  // Admin-configured nav (from /admin/header-footer) wins when present;
  // otherwise fall back to the built-in, already-translated labels.
  const navLinks =
    navLinksOverride ??
    [
      { label: t.services, href: "/services" },
      { label: t.industries, href: "/#industries" },
      { label: t.about, href: "/about" },
      { label: t.insights, href: "/insights" },
      { label: t.careers, href: "/careers" },
      { label: t.contact, href: "/contact" },
    ];

  // The Services entry gets the mega-menu treatment — matched by href
  // rather than by label so a renamed "Services" link still gets the
  // dropdown. It used to always be pulled out and rendered first,
  // ignoring whatever order was set in Admin → Header & Footer (so
  // reordering the nav there — e.g. moving About before Services — had
  // no visible effect). It's now rendered in place within `navLinks`,
  // so admin ordering is respected; `servicesLink` is only kept around
  // for the reference-equality check below.
  const servicesLink = navLinks.find((l) => l.href === "/services");

  // Utility bar style variants (Admin → Header & Footer → "Utility Bar
  // Style"). "bar" is the original always-on look; "minimal" drops the
  // separate band entirely so the pickers sit right on the main header's
  // own background with no divider; "pill" keeps the band but turns each
  // picker into its own small rounded, bordered chip instead of plain
  // inline text.
  // Deliberately `footer`/`footer-fg*` tokens here, not `header`/`header-fg*`
  // — the utility bar (locations/language) now follows Theme Builder's
  // Footer Color independently of the main header row directly below it,
  // per explicit request, rather than always matching the header.
  const utilityBarWrapClass =
    utilityBarStyle === "minimal" ? "w-full bg-footer pt-2 pb-0" : "w-full bg-footer py-2.5";
  const utilityPickerClass =
    utilityBarStyle === "pill"
      ? "flex items-center gap-1.5 text-[13px] text-footer-fg-muted hover:text-footer-fg focus:outline-none bg-footer-light border border-black/10 rounded-full px-3 py-1.5"
      : "flex items-center gap-1.5 text-[13px] text-footer-fg-muted py-0.5 hover:text-footer-fg focus:outline-none";
  const utilityLangPickerClass =
    utilityBarStyle === "pill"
      ? "flex items-center gap-1.5 text-xs font-semibold tracking-wide text-footer-fg-muted hover:text-footer-fg focus:outline-none bg-footer-light border border-black/10 rounded-full px-3 py-1.5"
      : "flex items-center gap-1.5 text-xs font-semibold tracking-wide text-footer-fg-muted py-1 hover:text-footer-fg focus:outline-none";

  return (
    // The whole header — utility bar (locations/language) AND the main nav
    // row below it — stays fixed in place while the page scrolls, rather
    // than just the main nav row sticking once the utility bar has already
    // scrolled out of view. `sticky` (not `fixed`) so this only pins once
    // scrolled to the top of the viewport, without needing a manual
    // top-padding hack on every page to avoid content starting underneath it.
    <div ref={headerRootRef} className="sticky top-0 z-50">
      {/* Utility bar */}
      <div className={utilityBarWrapClass}>
        <div className="container-page flex items-center justify-between">
          {branches.length > 0 ? (
            <div className="relative" ref={locationRef}>
              <button
                type="button"
                aria-label="Our locations"
                aria-expanded={locationOpen}
                onClick={() => setLocationOpen((v) => !v)}
                className={utilityPickerClass}
              >
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="shrink-0">
                  <path d="M10 18s6-5.2 6-10a6 6 0 10-12 0c0 4.8 6 10 6 10Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  <circle cx="10" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.4" />
                </svg>
                <span className="hidden sm:inline">Our Locations</span>
                <svg width="9" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </button>
              {locationOpen ? (
                <div className="absolute left-0 top-full mt-2 w-56 bg-footer-light border border-black/10 rounded-[var(--radius)] shadow-xl py-1.5 z-50">
                  {branches.map((b) =>
                    b.slug || b.externalUrl ? (
                      <button
                        key={b.slug || b.city}
                        type="button"
                        onClick={() => {
                          setLocationOpen(false);
                          // A branch with its own website (Admin → Branches →
                          // Edit → External Website URL) sends the visitor
                          // there instead of to a page on this site — the
                          // same rule the pre-homepage Location Gate follows,
                          // now applied here too so the two pickers agree.
                          if (b.externalUrl) {
                            window.location.href = b.externalUrl;
                          } else if (b.slug) {
                            router.push(lh(lang, `/${b.slug}`));
                          }
                        }}
                        className="w-full text-left px-4 py-2 text-[13.5px] text-footer-fg-muted hover:bg-black/10 hover:text-footer-fg transition-colors flex items-center justify-between gap-3"
                      >
                        <span className="flex items-center gap-2">
                          <FlagIcon code={countryCodeFromName(b.country)} />
                          {b.city}
                        </span>
                        {b.externalUrl ? <span className="text-[10px] text-footer-fg-muted uppercase tracking-wide shrink-0">&rarr;</span> : null}
                      </button>
                    ) : null,
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <span />
          )}

          <div className="relative" ref={langRef}>
            <button
              type="button"
              aria-label="Language"
              aria-expanded={langOpen}
              onClick={() => setLangOpen((v) => !v)}
              className={utilityLangPickerClass}
            >
              <FlagIcon code={languageCountry[lang].code} />
              {languageNames[lang]}
              <svg width="9" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
            {langOpen ? (
              <div className="absolute right-0 top-full mt-2 w-52 bg-footer-light border border-black/10 rounded-[var(--radius)] shadow-xl py-1.5 z-50">
                {locales.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => {
                      setLangOpen(false);
                      router.push(hrefForLocale(l));
                    }}
                    className={`w-full text-left px-4 py-2 text-[13.5px] transition-colors flex items-center gap-2.5 ${
                      l === lang ? "text-gold-light font-semibold" : "text-footer-fg-muted hover:bg-black/10 hover:text-footer-fg"
                    }`}
                  >
                    <FlagIcon code={languageCountry[l].code} />
                    <span className="flex flex-col leading-tight">
                      <span>{languageNames[l]}</span>
                      <span className="text-[10.5px] opacity-70 font-normal">{languageCountry[l].country}</span>
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="w-full bg-header border-t border-[#1A2E4E]">
        <div className="container-page py-5 flex items-center justify-between">
          <Link href={lh(lang, "/")} className="flex items-center gap-3 min-w-0">
            {siteConfig.logoUrlDark || siteConfig.logoUrl ? (
              // `object-contain` + a fixed box (rather than just `h-8
              // w-auto`) stops a non-square upload from being squashed or
              // overflowing sideways into the nav next to it.
              // `logoUrlDark` (Admin → Site Settings → "Logo (for dark
              // backgrounds)") is used here in preference to the plain
              // `logoUrl` since the header/footer usually sit on a dark
              // background — a logo exported for a light background can be
              // effectively invisible here otherwise; falls back to the
              // one logo when no dark-background variant has been uploaded.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={siteConfig.logoUrlDark || siteConfig.logoUrl}
                alt={siteConfig.name}
                // Admin → Site Settings → Logo Sizing → "Header Logo Height"
                // — was a fixed 36px (h-9) with no way to change it. Max-width
                // scales with the height so a wide logo still can't overrun
                // the nav next to it, but a taller logo also gets more room.
                style={{ height: siteConfig.logoSizing.headerHeight, maxWidth: siteConfig.logoSizing.headerHeight * 4 }}
                className="w-auto object-contain flex-shrink-0"
              />
            ) : (
              <svg width="28" height="28" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="flex-shrink-0">
                <path d="M15 2L27 8V15C27 21.5 21.8 26.8 15 28C8.2 26.8 3 21.5 3 15V8L15 2Z" stroke="#B08D3F" strokeWidth="1.6" />
                <path d="M9.5 15.3L13 18.8L20.5 11.2" stroke="#B08D3F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <span className="font-serif text-xl font-semibold text-header-fg truncate">{siteConfig.name}</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-[14.5px] font-medium text-header-fg-muted">
            {navLinks.map((link) =>
              link === servicesLink ? (
                <div
                  key={link.href}
                  className="relative"
                  onMouseEnter={() => setServicesOpen(true)}
                  onMouseLeave={() => setServicesOpen(false)}
                >
                  <Link
                    href={lh(lang, link.href)}
                    className={`flex items-center gap-1.5 hover:text-header-fg ${isActiveLink(link.href) ? activeNavLinkClass : ""}`}
                    aria-expanded={servicesOpen}
                  >
                    {link.label}
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
                      <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </Link>

                  {servicesOpen && services.length > 0 ? (
                    // Wider (3 columns instead of 2) and capped shorter —
                    // trading width for height so a full service list with
                    // several sub-services each mostly fits without an
                    // internal scrollbar, instead of a taller, narrower
                    // panel that always needed one. `max-w-[calc(100vw-2rem)]`
                    // keeps it from overflowing the viewport on a narrower
                    // desktop window even though it's wider than before.
                    <div className="absolute left-1/2 -translate-x-1/2 top-full pt-4 w-[1040px] max-w-[calc(100vw-2rem)]">
                      <div className="bg-white border border-line shadow-xl rounded-[var(--radius)] p-7 grid grid-cols-3 gap-x-8 gap-y-6 max-h-[65vh] overflow-y-auto">
                        {services.slice(0, 9).map((service) => (
                          <div key={service.slug}>
                            <Link href={lh(lang, `/services/${service.slug}`)} className="group">
                              <div className="text-[14.5px] font-semibold text-ink group-hover:text-gold">
                                {service.title}
                              </div>
                            </Link>
                            {/* Each sub-service is its own clickable link straight to
                                its own page — not just a name listed under its parent
                                — when it has one; a sub-service with no slug yet (see
                                Admin → Services → Edit) falls back to plain text so
                                nothing links to a 404. */}
                            {service.subServices && service.subServices.length > 0 ? (
                              <ul className="mt-1.5 flex flex-col gap-1">
                                {[...service.subServices]
                                  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                                  .slice(0, 5)
                                  .map((ss: { id: string; name: string; slug?: string }) =>
                                    ss.slug ? (
                                      <li key={ss.id}>
                                        <Link
                                          href={lh(lang, `/services/${service.slug}/${ss.slug}`)}
                                          className="text-[12.5px] text-muted hover:text-ink hover:underline underline-offset-2"
                                        >
                                          {ss.name}
                                        </Link>
                                      </li>
                                    ) : (
                                      <li key={ss.id} className="text-[12.5px] text-slate-400">
                                        {ss.name}
                                      </li>
                                    ),
                                  )}
                              </ul>
                            ) : null}
                          </div>
                        ))}
                        <div className="col-span-3 pt-4 border-t border-line">
                          <Link
                            href={lh(lang, "/services")}
                            className="text-[13.5px] font-semibold text-ink border-b border-ink pb-0.5"
                          >
                            View all services &rarr;
                          </Link>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={lh(lang, link.href)}
                  className={`hover:text-header-fg ${isActiveLink(link.href) ? activeNavLinkClass : ""}`}
                >
                  {link.label}
                </Link>
              ),
            )}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href={lh(lang, "/contact")}
              className="hidden sm:inline-block bg-gold text-[#1A1204] font-semibold text-sm px-5 py-3 rounded-[var(--btn-radius)] hover:bg-gold-light transition-colors"
            >
              {t.bookConsultation}
            </Link>

            {/* Mobile menu toggle — the desktop nav is hidden below `lg`, so
                without this there was previously no way at all to reach
                Services/About/Insights/etc. on a phone or tablet. */}
            <button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden text-header-fg p-2 -mr-2"
            >
              {mobileOpen ? (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <path d="M4 4L18 18M18 4L4 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
                  <path d="M3 6H19M3 11H19M3 16H19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen ? (
          <div className="lg:hidden border-t border-[#1A2E4E] bg-header">
            <nav className="container-page py-5 flex flex-col gap-1 text-[15px] font-medium text-header-fg-muted">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={lh(lang, link.href)}
                  className={`py-3 border-b border-[#1E3050] hover:text-header-fg pl-3 -ml-3 ${
                    isActiveLink(link.href) ? "text-header-fg font-semibold border-l-2 border-l-gold" : ""
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={lh(lang, "/contact")}
                className="mt-4 bg-gold text-[#1A1204] font-semibold text-sm px-5 py-3 rounded-[var(--btn-radius)] text-center"
              >
                {t.bookConsultation}
              </Link>
            </nav>
          </div>
        ) : null}
      </header>
    </div>
  );
}
