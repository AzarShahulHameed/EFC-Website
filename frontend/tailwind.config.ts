import type { Config } from "tailwindcss";

// Colors that the Theme Builder (/admin/theme) controls are bound to CSS
// custom properties instead of fixed hex values. The variables are set at
// runtime in app/layout.tsx from `GET /theme`'s tokens, so every existing
// `bg-navy`, `text-gold`, etc. class site-wide picks up the live value —
// no component needs to change. Colors with no Theme Builder field
// (paper-2, ink, muted, line) stay static.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "rgb(var(--color-navy) / <alpha-value>)",
        "navy-light": "rgb(var(--color-navy-light) / <alpha-value>)",
        "navy-2": "rgb(var(--color-navy-2) / <alpha-value>)",
        gold: "rgb(var(--color-gold) / <alpha-value>)",
        "gold-light": "rgb(var(--color-gold-light) / <alpha-value>)",
        paper: "rgb(var(--color-paper) / <alpha-value>)",
        // Header/footer now have their own independent background color
        // (Theme Builder → Header Color / Footer Color, each falling back
        // to the general Primary Color when left blank) instead of both
        // being permanently tied to `navy` — see app/layout.tsx for how
        // these are derived, and Header.tsx/Footer.tsx for where `bg-navy`
        // used to be hardcoded on both. The `-fg`/`-fg-muted` pair is the
        // auto-contrast text color computed from that same background
        // (lib/theme-runtime.ts's contrastTextChannels), so text on the
        // header/footer stays legible no matter what color is picked.
        header: "rgb(var(--color-header) / <alpha-value>)",
        "header-light": "rgb(var(--color-header-light) / <alpha-value>)",
        "header-fg": "rgb(var(--color-header-fg) / <alpha-value>)",
        "header-fg-muted": "rgb(var(--color-header-fg-muted) / <alpha-value>)",
        footer: "rgb(var(--color-footer) / <alpha-value>)",
        "footer-light": "rgb(var(--color-footer-light) / <alpha-value>)",
        "footer-fg": "rgb(var(--color-footer-fg) / <alpha-value>)",
        "footer-fg-muted": "rgb(var(--color-footer-fg-muted) / <alpha-value>)",
        // Heading/body text color are now Theme Builder fields too
        // (typography.headingColor/bodyColor) — `ink`/`muted` used to be
        // fixed hex values, so every existing `text-ink`/`text-muted`
        // class site-wide now picks up the live admin-set color with no
        // component changes needed, the same pattern navy/gold/paper
        // already used.
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        "paper-2": "#F3F0E6",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        line: "#E3DFD3",
      },
      fontFamily: {
        serif: ["var(--font-heading)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "-apple-system", "sans-serif"],
      },
      maxWidth: {
        container: "1280px",
      },
    },
  },
  plugins: [],
};

export default config;
