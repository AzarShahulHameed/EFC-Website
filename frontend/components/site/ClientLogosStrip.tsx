import type { ClientLogosDisplay } from "@/lib/api";

const SIZE_CLASS: Record<ClientLogosDisplay["size"], string> = { sm: "h-6", md: "h-8", lg: "h-11" };
// Multiplies the base auto-computed scroll duration — a longer duration is
// a *slower* scroll, so "fast" gets the smallest multiplier.
const SPEED_MULTIPLIER: Record<ClientLogosDisplay["speed"], number> = { slow: 1.6, normal: 1, fast: 0.6 };

type Logo = { name: string; imageUrl: string };

// The "Trusted By" logo strip — a plain server-renderable component (no
// "use client" needed; the scroll itself is a CSS animation, and
// pause-on-hover is a CSS `:hover` rule, so no JS is required at runtime).
// Extracted from the homepage so the same strip, with the same admin
// settings, can also render on the Services list, a service detail page,
// and a sub-service detail page (Admin → Client Logos → Display Settings
// → "Also show on").
export default function ClientLogosStrip({
  logos,
  display,
  label = "Trusted By",
  tone = "light",
  className = "",
}: {
  logos: Logo[];
  display: ClientLogosDisplay;
  label?: string;
  // "dark": for placing this strip on a dark section background (e.g.
  // directly above the testimonials band on a service/sub-service detail
  // page) — lightens the label color and, for non-grayscale logos, drops
  // the hover-to-color dip that assumes a light backdrop. Doesn't touch
  // the logos' own images, just the strip's own chrome.
  tone?: "light" | "dark";
  className?: string;
}) {
  if (logos.length === 0) return null;
  const sizeClass = SIZE_CLASS[display.size];
  // `brightness-0 invert` (the previous dark-mode grayscale treatment) crushes
  // every pixel to black and then flips it to white — for a real client logo
  // (which is almost never a bare transparent silhouette; it usually has its
  // own opaque white/colored background, subtle gradients, or a multi-color
  // mark) that renders as a plain solid rectangle instead of a recognizable
  // logo, which is exactly the "gray blocks" bug this was causing on any
  // dark section. Grayscale still works fine on a *light* background because
  // there's no destructive brightness/invert step there.
  const toneClass = display.grayscale && tone === "light" ? "grayscale opacity-70 hover:grayscale-0 hover:opacity-100" : "";
  const labelClass = tone === "dark" ? "text-slate-400" : "text-slate-500";
  // On a dark section, instead of filtering the logo image itself (which
  // can't be done safely without knowing each logo's own background/
  // transparency), give it a small white card to sit on — this guarantees
  // every logo stays visible and true to its real colors regardless of the
  // section's background color, without ever touching the image itself.
  const logoWrapClass =
    tone === "dark" ? "bg-white rounded-md px-4 py-2.5 opacity-90 hover:opacity-100 transition-opacity" : "";

  return (
    // pt-14: this strip is reused right below other sections that only
    // carry their own *bottom* padding (e.g. the "Regulated & Recognised
    // By" trust grid on the homepage), so without its own top padding the
    // "Trusted By" label ended up sitting almost flush against whatever
    // came before it. This top padding is what actually separates the two,
    // regardless of what precedes this component.
    <div className={`container-page pt-14 pb-18 ${className}`}>
      <div className={`text-center text-[12.5px] tracking-[0.14em] ${labelClass} uppercase mb-6`}>{label}</div>
      {display.motion === "scroll" && logos.length > 1 ? (
        // Continuously auto-scrolling carousel. With very few logos, one
        // copy of the list wouldn't fill the track width, so it's repeated
        // enough times to comfortably cover it before being doubled again
        // for the seamless loop (see globals.css's logos-marquee-scroll).
        <div
          className={`overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] ${
            display.pauseOnHover ? "logos-marquee" : "logos-marquee-nohover"
          }`}
        >
          <div
            className="logos-marquee-track flex items-center gap-x-12 w-max"
            style={{ animationDuration: `${Math.max(logos.length * 4, 16) * SPEED_MULTIPLIER[display.speed]}s` }}
          >
            {(() => {
              const reps = Math.max(Math.ceil(8 / logos.length), 1);
              const filled = Array.from({ length: reps }, () => logos).flat();
              return [...filled, ...filled].map((logo, i) => (
                <div key={`${logo.name}-${i}`} className={`shrink-0 ${logoWrapClass}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logo.imageUrl}
                    alt={logo.name}
                    aria-hidden={i >= filled.length}
                    className={`object-contain transition-[filter,opacity] duration-300 ${sizeClass} ${toneClass}`}
                  />
                </div>
              ));
            })()}
          </div>
        </div>
      ) : (
        <div
          className={`flex flex-wrap items-center gap-x-12 gap-y-6 ${
            display.alignment === "left" ? "justify-start" : display.alignment === "spread" ? "justify-between" : "justify-center"
          }`}
        >
          {logos.map((logo) => (
            <div key={logo.name} className={logoWrapClass}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logo.imageUrl} alt={logo.name} className={`object-contain transition-[filter,opacity] duration-300 ${sizeClass} ${toneClass}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
