// Converts "#0A1B33" -> "10 27 51" (space-separated R G B), the format
// Tailwind's `rgb(var(--x) / <alpha-value>)` pattern expects. Falls back
// to `fallback` (already in "R G B" form) on anything unparseable, so a
// bad value typed into the Theme Builder can't break every page.
export function hexToChannels(hex: string | undefined, fallback: string): string {
  if (!hex) return fallback;
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return fallback;
  const int = parseInt(match[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `${r} ${g} ${b}`;
}

// Lightens a hex color toward white by `amount` (0–1), returned as "R G B".
// Used to derive the *-light / *-2 shades from a single admin-entered base
// color, since the Theme Builder only exposes one field per color family.
export function lightenToChannels(hex: string | undefined, amount: number, fallback: string): string {
  if (!hex) return fallback;
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return fallback;
  const int = parseInt(match[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount);
  return `${mix(r)} ${mix(g)} ${mix(b)}`;
}

// The Theme Builder's "Button Style" field. "rounded" reuses whatever the
// admin set as the general border-radius; "sharp" and "pill" are concrete
// overrides so the choice is visibly different from "rounded" regardless
// of the border-radius value.
export function buttonRadius(buttonStyle: string | undefined, generalRadius: string): string {
  if (buttonStyle === "sharp") return "0px";
  if (buttonStyle === "pill") return "9999px";
  return generalRadius; // "rounded" (default)
}

// Relative luminance (simplified sRGB, WCAG-style) of a hex color, from 0
// (black) to 1 (white) — the basis for auto-contrast text below.
function relativeLuminance(hex: string): number {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return 0;
  const int = parseInt(match[1], 16);
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const r = channel((int >> 16) & 255);
  const g = channel((int >> 8) & 255);
  const b = channel(int & 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Picks readable near-black or near-white text "R G B" channels for a given
// background hex. This is the fix for "after I change the theme, some text
// in lighter is not visible": previously the header/footer's text colors
// were hardcoded light grays/creams that only looked right because the
// header/footer background was *always* the same dark navy. Now that the
// header and footer each have their own admin-editable background color
// (see headerColor/footerColor in theme.service.ts), the text has to react
// to whatever color actually ends up there instead of assuming dark —
// components/site/Header.tsx and Footer.tsx read the resulting
// --color-header-fg/--color-footer-fg CSS variables instead of a fixed
// class. `soft` returns a secondary/muted-but-still-legible variant for
// less prominent text (icons, secondary labels) rather than full
// black/white everywhere, which would look flat.
export function contrastTextChannels(hex: string | undefined, fallback: string, soft = false): string {
  if (!hex) return fallback;
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return fallback;
  const isLight = relativeLuminance(hex) > 0.5;
  if (soft) return isLight ? "92 106 124" : "170 181 198";
  return isLight ? "16 32 58" : "250 247 239";
}

// Same idea as contrastTextChannels, but returns a ready-to-use CSS color
// (`rgb(r g b)`) instead of bare channels — for the common case of coloring
// text against an admin-picked custom section background directly via
// inline `style`, rather than a Tailwind class/CSS variable. Used wherever
// a heading/label was previously a hardcoded light or dark color that
// silently assumed its section's background would always be dark (or
// always light) — once that background became admin-configurable, the
// hardcoded text color needs to react to whatever was actually picked.
export function contrastTextColor(hex: string | undefined, fallbackHex: string): string {
  if (!hex) return fallbackHex;
  const channels = contrastTextChannels(hex, "");
  return channels ? `rgb(${channels.replace(/\s+/g, " ")})` : fallbackHex;
}

// The Theme Builder's "Card Style" field, applied via a `data-card-style`
// attribute on <body> (see globals.css's `.card-grid` rules) rather than
// per-element classes, since cards are built from shared grid containers
// across many pages.
export function normalizeCardStyle(cardStyle: string | undefined): "bordered" | "shadowed" | "flat" {
  if (cardStyle === "shadowed" || cardStyle === "flat") return cardStyle;
  return "bordered";
}
