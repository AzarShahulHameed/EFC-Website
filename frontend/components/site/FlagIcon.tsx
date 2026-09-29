// Renders a real flag image via the `flag-icons` package (imported once,
// globally, in app/layout.tsx) rather than an emoji flag. Emoji flags
// render inconsistently across devices — notably, Windows (pre-Windows 11)
// and some Android keyboards/browsers show the two-letter country code as
// plain text instead of a flag image at all — while `flag-icons` ships
// actual SVG artwork baked into a CSS background, so it looks identical on
// Windows, macOS, iOS, Android, and any browser, at any size.
export default function FlagIcon({ code, className = "" }: { code?: string; className?: string }) {
  if (!code) {
    // Generic globe glyph fallback for a country/branch this session
    // couldn't confidently match to a flag — still communicates "this is a
    // place" rather than leaving a blank gap.
    return (
      <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={`shrink-0 ${className}`}>
        <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M2.5 10h15 M10 2.5c2.2 2 3.3 5 3.3 7.5s-1.1 5.5-3.3 7.5c-2.2-2-3.3-5-3.3-7.5S7.8 4.5 10 2.5Z" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    );
  }
  return (
    <span
      className={`fi fi-${code} shrink-0 rounded-[2px] ${className}`}
      style={{ width: "1.15em", height: "0.85em", backgroundSize: "cover", backgroundPosition: "center" }}
      aria-hidden="true"
    />
  );
}
