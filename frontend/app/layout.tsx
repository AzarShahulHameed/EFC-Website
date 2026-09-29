import type { Metadata } from "next";
import "./globals.css";
import "flag-icons/css/flag-icons.min.css";
import { getTheme, getSiteConfig, getHeaderUtilityBar, SITE_URL } from "@/lib/api";
import { hexToChannels, lightenToChannels, buttonRadius, normalizeCardStyle, contrastTextChannels } from "@/lib/theme-runtime";

// `metadataBase` makes every relative URL used in a page's metadata (an Open
// Graph image, a canonical link) resolve against the real site instead of
// silently staying relative — without it, Next.js warns at build time and
// social previews/search engines can end up with broken image URLs. Every
// page under app/[lang] overrides title/description via buildPageMetadata()
// (lib/api.ts); this is only the fallback for anything that doesn't.
//
// This is `generateMetadata` (not a static `export const metadata`) so it
// can pull the Google Search Console / Bing Webmaster verification codes
// from Admin → Site Settings — those are the one piece of <head> metadata
// that has to be present on every single route (including ones that never
// call buildPageMetadata), so it lives once here rather than being repeated
// on every page.
export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getSiteConfig();
  return {
    metadataBase: new URL(SITE_URL),
    title: "EFC — Audit, Tax & Advisory",
    description:
      "EFC delivers external and internal audit, tax, VAT and corporate advisory across the United Arab Emirates.",
    verification: {
      google: siteConfig.googleVerification || undefined,
      other: siteConfig.bingVerification ? { "msvalidate.01": siteConfig.bingVerification } : undefined,
    },
  };
}

// Fallbacks match the defaults in app/globals.css's :root block.
const FALLBACK = {
  navy: "10 27 51",
  navyLight: "18 35 63",
  navy2: "22 41 74",
  gold: "176 141 63",
  goldLight: "201 163 84",
  paper: "251 250 247",
  ink: "16 32 58",
  muted: "92 106 124",
  headerFg: "250 247 239",
  headerFgMuted: "170 181 198",
  footerFg: "250 247 239",
  footerFgMuted: "170 181 198",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // `lang`/`dir` here are a static default. The actual locale for marketing
  // pages is set on a wrapper <div> in app/[lang]/(marketing)/layout.tsx
  // (Next.js only allows one root layout, and /admin sits outside [lang]
  // and isn't localized, so <html> itself can't be made dynamic here).
  const [theme, siteConfig, headerUtilityBar] = await Promise.all([
    getTheme(),
    getSiteConfig(),
    getHeaderUtilityBar(),
  ]);

  // Server-side estimate of the sticky header's own height, so
  // `--site-header-h` (what the Responsible Person sticky sidebar on a
  // service/sub-service page offsets itself by — see Header.tsx's
  // ResizeObserver comment) is correct from the very first paint, not just
  // once client JS has mounted and measured the real header. Previously
  // this variable only existed once React hydrated, which is normally fast
  // enough not to matter — but it meant the very first paint (and anyone
  // whose JS is slow to run, or who screenshots/scrolls immediately) briefly
  // used the `7rem` fallback baked into the `calc()`, which is too short
  // whenever Logo Sizing's header height is set above its own default. This
  // is deliberately a same-specificity `:root{}` rule (not a client-set
  // inline style), so Header.tsx's ResizeObserver — which sets this same
  // property as an inline style on <html>, always higher specificity than a
  // stylesheet rule — cleanly takes over the instant it mounts, with no
  // conflict. A slight overestimate here is harmless (a few extra px of gap
  // for one frame); an underestimate is the actual bug this exists to
  // prevent, so the padding built into the two heights below is deliberate.
  const logoH = siteConfig.logoSizing?.headerHeight || 48;
  const utilityBarH = headerUtilityBar.style === "minimal" ? 34 : 46;
  const mainRowH = logoH + 44; // header's main row: py-5 (40px) + safety margin
  const estimatedHeaderH = utilityBarH + mainRowH;

  const navy = hexToChannels(theme.primaryColor, FALLBACK.navy);
  const navyLight = lightenToChannels(theme.primaryColor, 0.15, FALLBACK.navyLight);
  const navy2 = lightenToChannels(theme.primaryColor, 0.08, FALLBACK.navy2);
  const gold = hexToChannels(theme.accentColor, FALLBACK.gold);
  const goldLight = lightenToChannels(theme.accentColor, 0.15, FALLBACK.goldLight);
  const paper = hexToChannels(theme.backgroundColor, FALLBACK.paper);

  // Header/footer background: each falls back to the general Primary Color
  // when left blank in the Theme Builder, so an admin who never touches
  // these two new fields sees no change at all — only setting one of them
  // makes that section independent of the other, fixing "changing the
  // header theme also changes the footer."
  const headerColorHex = theme.headerColor || theme.primaryColor;
  const footerColorHex = theme.footerColor || theme.primaryColor;
  const header = hexToChannels(headerColorHex, navy);
  const footer = hexToChannels(footerColorHex, navy);
  // Lighter shade of the header/footer's own color, for a nested panel
  // (the location/language dropdowns, mobile drawer border) to read as
  // "part of the header" instead of a jarring `navy-light` mismatch when
  // the header/footer color diverges from the general Primary Color.
  const headerLight = lightenToChannels(headerColorHex, 0.12, navyLight);
  const footerLight = lightenToChannels(footerColorHex, 0.12, navyLight);
  // Auto-contrast text for whatever color ends up in the header/footer —
  // see contrastTextChannels' own comment for why this exists.
  const headerFg = contrastTextChannels(headerColorHex, FALLBACK.headerFg);
  const headerFgMuted = contrastTextChannels(headerColorHex, FALLBACK.headerFgMuted, true);
  const footerFg = contrastTextChannels(footerColorHex, FALLBACK.footerFg);
  const footerFgMuted = contrastTextChannels(footerColorHex, FALLBACK.footerFgMuted, true);

  // Site-wide heading/body text color — Theme Builder → Typography. Blank
  // keeps today's defaults (the same near-black ink / slate muted the site
  // always used), so this is purely additive for anyone who wants to
  // recolor body copy without touching every page.
  const ink = hexToChannels(theme.typography?.headingColor, FALLBACK.ink);
  const muted = hexToChannels(theme.typography?.bodyColor, FALLBACK.muted);

  const headingFont: string = theme.typography?.headingFont || "Spectral";
  const bodyFont: string = theme.typography?.bodyFont || "Public Sans";
  const radius: string = theme.borderRadius || "2px";

  // buttonStyle/cardStyle from the Theme Builder — previously saved to the
  // API but never consumed by the frontend. --btn-radius drives every CTA
  // button's corner style (see the `rounded-[var(--btn-radius)]` usages in
  // Header.tsx and the marketing pages); cardStyle is applied via a
  // `data-card-style` attribute that globals.css's `.card-grid` rules key
  // off of, since cards are shared grid containers rather than one component.
  const btnRadius = buttonRadius(theme.buttonStyle, radius);
  const cardStyle = normalizeCardStyle(theme.cardStyle);

  // Loads whatever font families the Theme Builder is set to from Google
  // Fonts. If an admin enters a font Google Fonts doesn't have, the
  // request 404s harmlessly and the browser falls back to the generic
  // serif/sans-serif in the --font-heading/--font-body stacks below.
  const fontsHref = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    headingFont,
  )}:wght@400;500;600;700&family=${encodeURIComponent(bodyFont)}:wght@400;500;600;700&display=swap`;

  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href={fontsHref} />
        <style
          // Runtime theme tokens from GET /theme, applied as CSS variables —
          // this is what makes /admin/theme actually change the live site
          // instead of only changing what the API returns.
          dangerouslySetInnerHTML={{
            __html: `:root{
              --color-navy: ${navy};
              --color-navy-light: ${navyLight};
              --color-navy-2: ${navy2};
              --color-gold: ${gold};
              --color-gold-light: ${goldLight};
              --color-paper: ${paper};
              --color-header: ${header};
              --color-header-light: ${headerLight};
              --color-header-fg: ${headerFg};
              --color-header-fg-muted: ${headerFgMuted};
              --color-footer: ${footer};
              --color-footer-light: ${footerLight};
              --color-footer-fg: ${footerFg};
              --color-footer-fg-muted: ${footerFgMuted};
              --color-ink: ${ink};
              --color-muted: ${muted};
              --font-heading: '${headingFont}', Georgia, serif;
              --font-body: '${bodyFont}', system-ui, sans-serif;
              --radius: ${radius};
              --btn-radius: ${btnRadius};
              --site-header-h: ${estimatedHeaderH}px;
            }`,
          }}
        />
      </head>
      <body className="font-sans bg-paper text-ink antialiased" data-card-style={cardStyle}>
        {children}
      </body>
    </html>
  );
}
