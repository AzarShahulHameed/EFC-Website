"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { heroScrim } from "@/lib/hero-scrim";

export type LocationGateTrigger = "once" | "session" | "always";

const STORAGE_KEY = "efc_region";

type LocationEntry = { country: string; externalUrl?: string };
type Trigger = LocationGateTrigger;
type Animation = "fade" | "zoom" | "slide-up" | "slide-down" | "blur" | "flip" | "rotate";
type TextTransition = "none" | "fade" | "slide-up" | "stagger-words";
type ButtonStyle = "sharp" | "rounded" | "pill";

type Props = {
  headline: string;
  subtext: string;
  ctaLabel: string;
  countries: LocationEntry[];
  backgroundImageUrl?: string;
  backgroundVideoUrl?: string;
  overlayOpacity?: number;
  backgroundTint?: string;
  animation?: Animation;
  textTransition?: TextTransition;
  buttonStyle?: ButtonStyle;
  logoUrl?: string;
  logoText?: string;
  trigger?: Trigger;
};

// The storage this gate remembers a visitor's choice in depends on the
// admin's chosen trigger frequency (Admin → Site Settings → Location
// Gate → "When should this appear"). "always" never reads/writes storage
// at all — every page load is a first visit as far as the gate is concerned.
function storageFor(trigger: Trigger): Storage | null {
  if (typeof window === "undefined" || trigger === "always") return null;
  return trigger === "session" ? window.sessionStorage : window.localStorage;
}

// Per-`animation` choice: the hidden (pre-mount / closing) and visible
// (mounted) transform+opacity pair, in the same "hidden state -> visible
// state, transition between them" style as components/site/Reveal.tsx.
const ANIMATION_STYLES: Record<Animation, { hidden: string; visible: string }> = {
  fade: { hidden: "none", visible: "none" },
  zoom: { hidden: "scale(0.92)", visible: "scale(1)" },
  "slide-up": { hidden: "translateY(28px)", visible: "translateY(0)" },
  "slide-down": { hidden: "translateY(-28px)", visible: "translateY(0)" },
  blur: { hidden: "scale(1.03)", visible: "scale(1)" },
  flip: { hidden: "perspective(900px) rotateX(10deg)", visible: "perspective(900px) rotateX(0deg)" },
  rotate: { hidden: "rotate(-2deg) scale(0.97)", visible: "rotate(0deg) scale(1)" },
};
// "blur" additionally animates a CSS filter, which needs its own property
// (can't express blur() inside the `transform` interpolation above).
const ANIMATION_FILTER: Partial<Record<Animation, { hidden: string; visible: string }>> = {
  blur: { hidden: "blur(6px)", visible: "blur(0px)" },
};

const BUTTON_RADIUS: Record<ButtonStyle, string> = {
  sharp: "0px",
  rounded: "8px",
  pill: "999px",
};

// Deliberately does NOT appear at page load. It stays completely out of the
// DOM (this component renders nothing) until the visitor scrolls to the
// very bottom of the page — only then does it mount and fade in, so someone
// just arriving to read the homepage is never interrupted; the gate greets
// them once they've reached the end of the content instead. It still only
// does this at all if the admin's trigger setting (Admin → Site Settings →
// Location Gate → "When should this appear") says this visitor hasn't
// already made a choice — "once"/"session" check storage, "always" never
// does. This component also handles the interaction: picking a country,
// remembering it, animating itself in/out, and closing — or, for a country
// whose branch has an External Website URL set (Admin → Branches → Edit),
// sending the visitor straight there instead.
export default function LocationGate({
  headline,
  subtext,
  ctaLabel,
  countries,
  backgroundImageUrl,
  backgroundVideoUrl,
  overlayOpacity = 65,
  backgroundTint = "#070E1C",
  animation = "fade",
  textTransition = "fade",
  buttonStyle = "sharp",
  logoUrl,
  logoText = "EFC",
  trigger = "once",
}: Props) {
  const [selected, setSelected] = useState<string | null>(countries[0]?.country ?? null);
  const [closing, setClosing] = useState(false);
  const [visible, setVisible] = useState(false);
  // Whether this visitor is even due to see the gate this visit, per the
  // admin's trigger setting — checked once, client-side, since storage
  // isn't available during server rendering.
  const [eligible, setEligible] = useState(false);
  // Whether the gate has actually mounted yet. Stays false (nothing
  // rendered at all) until the scroll-position check below flips it once.
  const [open, setOpen] = useState(false);
  const openedRef = useRef(false);

  useEffect(() => {
    try {
      if (trigger === "always") {
        setEligible(true);
        return;
      }
      setEligible(!storageFor(trigger)?.getItem(STORAGE_KEY));
    } catch {
      // Storage unavailable (private browsing, etc.) — fail open rather
      // than silently never showing the gate at all.
      setEligible(true);
    }
  }, [trigger]);

  // Opens the gate the moment the visitor scrolls within a hair of the
  // bottom of the page — not a moment sooner. Checked once immediately too,
  // so a page short enough to already BE at the bottom (little content, or
  // a tall viewport) still opens it instead of waiting for a scroll that
  // will never come.
  useEffect(() => {
    if (!eligible || openedRef.current) return;
    function checkScrollPosition() {
      const scrolledTo = window.innerHeight + window.scrollY;
      const fullHeight = document.documentElement.scrollHeight;
      if (scrolledTo >= fullHeight - 24) {
        openedRef.current = true;
        setOpen(true);
      }
    }
    checkScrollPosition();
    window.addEventListener("scroll", checkScrollPosition, { passive: true });
    window.addEventListener("resize", checkScrollPosition);
    return () => {
      window.removeEventListener("scroll", checkScrollPosition);
      window.removeEventListener("resize", checkScrollPosition);
    };
  }, [eligible]);

  // Once open: lock page scroll behind the gate (there's nothing further to
  // scroll to anyway) and, a couple of frames later, flip to the "visible"
  // transform/opacity so the browser actually paints the hidden state
  // first — without that delay the very first render already matches the
  // end state and no entrance transition plays.
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    return () => {
      cancelAnimationFrame(raf);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function choose() {
    if (!selected) return;
    const entry = countries.find((c) => c.country === selected);
    if (entry?.externalUrl) {
      // This location runs its own separate site — send the visitor there
      // rather than tailoring this site to them. Don't remember the choice
      // locally: they're leaving, so there's nothing here to remember it for.
      window.location.href = entry.externalUrl;
      return;
    }
    try {
      storageFor(trigger)?.setItem(STORAGE_KEY, selected);
    } catch {
      // Storage unavailable (private browsing, etc.) — fall back to just
      // closing the gate for this visit rather than blocking the site.
    }
    setVisible(false);
    setClosing(true);
    // Unmount only after the fade-out transition (longest delay+duration
    // below is 0.68s) has actually finished playing.
    setTimeout(() => setOpen(false), 700);
  }

  const headlineWords = useMemo(() => headline.split(/\s+/).filter(Boolean), [headline]);

  if (countries.length === 0 || !open) return null;

  const { hidden, visible: visibleTransform } = ANIMATION_STYLES[animation];
  const filterPair = ANIMATION_FILTER[animation];
  const radius = BUTTON_RADIUS[buttonStyle];
  const contentOpacity = closing || !visible ? 0 : 1;

  return (
    // The backdrop itself is a plain, always-fully-opaque solid color —
    // deliberately NOT part of the fade/zoom/etc. transition below. It
    // used to be the same element that animated opacity 0→1, which meant
    // the homepage behind it was genuinely visible, blended through, for
    // the whole ~0.45s transition — reported as the gate "looking dull".
    // Now only the decorative background art and the content card
    // animate; the backdrop color is solid from the very first frame.
    <div
      className="location-gate fixed inset-0 z-[999] items-center justify-center overflow-hidden"
      style={{ backgroundColor: backgroundTint, pointerEvents: closing ? "none" : "auto" }}
      role="dialog"
      aria-modal="true"
      aria-label={headline}
    >
      <div
        className="absolute inset-0"
        style={{
          opacity: contentOpacity,
          transform: visible ? visibleTransform : hidden,
          filter: filterPair ? (visible ? filterPair.visible : filterPair.hidden) : undefined,
          transition: "opacity 0.5s ease, transform 0.5s ease, filter 0.5s ease",
        }}
      >
        {backgroundVideoUrl ? (
          <video
            src={backgroundVideoUrl}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden="true"
          />
        ) : backgroundImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={backgroundImageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" aria-hidden="true" />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(circle at 18% 15%, rgba(201,163,84,0.32), transparent 55%), radial-gradient(circle at 85% 20%, rgba(90,140,201,0.22), transparent 50%), radial-gradient(circle at 50% 100%, rgba(176,141,63,0.28), transparent 60%)",
            }}
            aria-hidden="true"
          />
        )}
        {/* Same vignette-scrim technique as the Hero (lib/hero-scrim.ts),
            reused here so a bright uploaded photo/video gets the same
            premium, readable treatment instead of a flat/dull tint. */}
        <div className="absolute inset-0" style={{ background: heroScrim(overlayOpacity) }} aria-hidden="true" />
      </div>

      <div
        className="relative w-full h-full flex items-center justify-center"
        style={{
          opacity: contentOpacity,
          transform: visible ? visibleTransform : hidden,
          transition: "opacity 0.5s ease 0.05s, transform 0.5s ease 0.05s",
        }}
      >
        <div className="w-full max-w-md px-8 py-10 text-center">
          <div className="mb-7 flex justify-center">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt={logoText} className="h-11 max-w-[160px] object-contain" />
            ) : (
              <div className="w-11 h-11 border border-[#C9A354] flex items-center justify-center">
                <span className="font-serif text-[#C9A354] font-semibold text-[13px]">{logoText}</span>
              </div>
            )}
          </div>

          {textTransition === "stagger-words" ? (
            <h1 className="font-serif text-2xl text-white font-semibold mb-3 flex flex-wrap justify-center gap-x-2">
              {headlineWords.map((word, i) => (
                <span
                  key={`${word}-${i}`}
                  style={{
                    display: "inline-block",
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateY(0)" : "translateY(10px)",
                    transition: `opacity 0.4s ease ${0.12 + i * 0.06}s, transform 0.4s ease ${0.12 + i * 0.06}s`,
                  }}
                >
                  {word}
                </span>
              ))}
            </h1>
          ) : (
            <h1
              className="font-serif text-2xl text-white font-semibold mb-3"
              style={
                textTransition === "none"
                  ? undefined
                  : {
                      opacity: visible ? 1 : 0,
                      transform: textTransition === "slide-up" && !visible ? "translateY(10px)" : "translateY(0)",
                      transition: "opacity 0.5s ease 0.1s, transform 0.5s ease 0.1s",
                    }
              }
            >
              {headline}
            </h1>
          )}

          <p
            className="text-[14px] text-slate-300 mb-8 leading-relaxed"
            style={
              textTransition === "none"
                ? undefined
                : {
                    opacity: visible ? 1 : 0,
                    transform: textTransition === "slide-up" && !visible ? "translateY(10px)" : "translateY(0)",
                    transition: "opacity 0.5s ease 0.18s, transform 0.5s ease 0.18s",
                  }
            }
          >
            {subtext}
          </p>

          <div className="flex flex-col gap-2.5 mb-8 max-h-64 overflow-y-auto">
            {countries.map(({ country, externalUrl }) => (
              <button
                key={country}
                type="button"
                onClick={() => setSelected(country)}
                style={{ borderRadius: radius }}
                className={`text-[14.5px] font-medium px-5 py-3.5 border transition-colors text-left flex items-center justify-between gap-3 ${
                  selected === country
                    ? "border-[#C9A354] bg-[#C9A354]/10 text-white"
                    : "border-white/15 text-slate-300 hover:border-white/35"
                }`}
              >
                <span>{country}</span>
                {externalUrl ? (
                  <span className="text-slate-400 shrink-0" aria-hidden="true">
                    &rarr;
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={choose}
            disabled={!selected}
            style={{ borderRadius: radius }}
            className="bg-gold text-[#1A1204] font-semibold text-[14.5px] px-8 py-3.5 disabled:opacity-40 transition-opacity"
          >
            {countries.find((c) => c.country === selected)?.externalUrl ? "Continue to that site" : ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
