"use client";

import { useEffect, useRef, useState } from "react";

export type RevealVariant =
  | "none"
  | "fade-up"
  | "fade-in"
  | "slide-left"
  | "slide-right"
  | "zoom-in"
  | "blur-in"
  | "clip-reveal"
  | "flip-3d"
  | "elastic-pop"
  | "rotate-in"
  // "Ultimate advanced" tier — six further variants for a section (most
  // often the landing page) that should feel a step above the rest of the
  // site. Same picker, same component, same CSS-transition mechanics.
  | "swing-in"
  | "roll-in"
  | "skew-in"
  | "bounce-in"
  | "tilt-3d"
  | "glow-in";
export type RevealSpeed = "slow" | "normal" | "fast";
export type RevealHover = "default" | "lift" | "zoom" | "glow" | "underline" | "none";

type Props = {
  children: React.ReactNode;
  /** Stagger this element's animation by N milliseconds after it enters view. */
  delay?: number;
  className?: string;
  id?: string;
  /**
   * Which entrance animation to play. Defaults to "fade-up" (the site's
   * original look). "none" renders content immediately with no transition,
   * for sections an editor has explicitly turned animation off for. This is
   * the same option set the admin dashboard's Animation picker writes, so a
   * `content.animation` value from a ContentBlock can be passed straight
   * through as this prop.
   */
  variant?: RevealVariant;
  /** How fast the entrance animation plays. Defaults to "normal" (0.7s). */
  speed?: RevealSpeed;
  /**
   * When true, each *direct child* of this block animates in one after
   * another (a "stagger") instead of the whole block fading in as one
   * piece — e.g. each card in a services/team/testimonial grid appearing
   * in sequence. Implemented in pure CSS (see globals.css's
   * `.reveal-stagger` rules) so it works without wrapping every individual
   * card in its own <Reveal>, which would mean touching a card-rendering
   * loop on every page that has a grid.
   */
  stagger?: boolean;
  /**
   * Hover effect applied to `.card-grid` cards inside this block (and to
   * `.hover-target` elements generally) — "default" keeps the site's
   * original subtle lift, the others are explicit alternate styles an
   * admin can choose per section. See globals.css's `[data-hover=...]`
   * rules.
   */
  hover?: RevealHover;
  /** Text alignment for this block and any descendant text that doesn't set its own. */
  align?: "left" | "center" | "right";
  /**
   * Section background treatment — an admin-chosen panel style behind this
   * block's content ("none" keeps the page's normal background through).
   * Applied as a padded, rounded panel so a "tint"/"dark"/"gradient"/
   * "custom" section reads as an intentional band rather than a color swap
   * under unrelated content. "custom" uses `backgroundColor` below instead
   * of a fixed preset — pick it when none of the three built-in presets is
   * the right shade for a specific section.
   */
  background?: "none" | "tint" | "dark" | "gradient" | "custom";
  /**
   * The actual color for `background="custom"` (any valid CSS color —
   * hex, rgb(), etc.), and ignored for every other background value.
   * `backgroundTextColor` optionally overrides the panel's text/heading
   * color to keep it readable against a custom color the admin picked
   * (dark text on a light custom color, light text on a dark one) — Reveal
   * has no way to know which a given hex is light or dark on its own.
   */
  backgroundColor?: string;
  backgroundTextColor?: string;
};

const BACKGROUND_CLASS: Record<NonNullable<Props["background"]>, string> = {
  none: "",
  tint: "bg-paper-2 rounded-[var(--radius)] px-6 py-10 sm:px-12 sm:py-14",
  dark: "bg-navy text-white rounded-[var(--radius)] px-6 py-10 sm:px-12 sm:py-14",
  gradient: "bg-gradient-to-br from-navy to-navy-2 text-white rounded-[var(--radius)] px-6 py-10 sm:px-12 sm:py-14",
  custom: "rounded-[var(--radius)] px-6 py-10 sm:px-12 sm:py-14",
};

const HIDDEN_TRANSFORM: Record<RevealVariant, string> = {
  none: "none",
  "fade-up": "translateY(28px)",
  "fade-in": "none",
  "slide-left": "translateX(-40px)",
  "slide-right": "translateX(40px)",
  "zoom-in": "scale(0.94)",
  "blur-in": "scale(1.03)",
  "clip-reveal": "none",
  "flip-3d": "perspective(800px) rotateX(-18deg)",
  "elastic-pop": "scale(0.7)",
  "rotate-in": "rotate(-6deg) scale(0.96)",
  "swing-in": "rotate(-14deg)",
  "roll-in": "translateX(-70px) rotate(-100deg)",
  "skew-in": "skewX(-14deg) translateX(-24px)",
  "bounce-in": "translateY(-46px)",
  "tilt-3d": "perspective(900px) rotateY(28deg) translateX(24px)",
  "glow-in": "scale(0.97)",
};

// Extra, variant-specific properties beyond opacity/transform — `filter`
// for a genuine blur-to-sharp (or glow-to-normal) reveal, `clipPath` for a
// directional wipe. Only variants listed here use these; every other
// variant leaves them undefined so they don't add an unnecessary
// transition property. Filter is a {hidden, visible} pair since "glow-in"
// needs a non-default resting value ("blur-in" simply resolves to
// "blur(0px)" when visible, same as before).
const HIDDEN_FILTER: Partial<Record<RevealVariant, { hidden: string; visible: string }>> = {
  "blur-in": { hidden: "blur(14px)", visible: "blur(0px)" },
  "glow-in": { hidden: "brightness(1.9) saturate(0.2)", visible: "brightness(1) saturate(1)" },
};
const HIDDEN_CLIP: Partial<Record<RevealVariant, string>> = {
  "clip-reveal": "inset(0 100% 0 0)",
};
// A couple of variants want a bouncy overshoot easing rather than the
// site's default cubic-bezier; every other variant keeps the shared one.
const TRANSFORM_EASING: Partial<Record<RevealVariant, string>> = {
  "elastic-pop": "cubic-bezier(0.34, 1.56, 0.64, 1)",
  "bounce-in": "cubic-bezier(0.34, 1.56, 0.64, 1)",
  "swing-in": "cubic-bezier(0.34, 1.56, 0.64, 1)",
};

const SPEED_MS: Record<RevealSpeed, number> = {
  slow: 1100,
  normal: 700,
  fast: 400,
};

// Fades/lifts/slides/zooms children into place the first time they scroll
// into the viewport. Pure CSS transition driven by one class toggle — no
// animation library needed. Respects prefers-reduced-motion, and if
// IntersectionObserver isn't available for some reason, content simply
// renders visible immediately (this is a progressive enhancement, never a
// gate on content).
export default function Reveal({
  children,
  delay = 0,
  className = "",
  id,
  variant = "fade-up",
  speed = "normal",
  stagger = false,
  hover = "default",
  align,
  background = "none",
  backgroundColor,
  backgroundTextColor,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(variant === "none");
  const durationMs = SPEED_MS[speed] ?? SPEED_MS.normal;
  const bgClass = BACKGROUND_CLASS[background] ?? "";
  const customStyle: React.CSSProperties =
    background === "custom"
      ? { backgroundColor: backgroundColor || "transparent", ...(backgroundTextColor ? { color: backgroundTextColor } : {}) }
      : {};

  useEffect(() => {
    if (variant === "none") return;
    const node = ref.current;
    if (!node) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            window.setTimeout(() => setVisible(true), delay);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [delay, variant]);

  const hoverAttr = hover && hover !== "default" ? hover : undefined;

  if (variant === "none") {
    return (
      <div
        ref={ref}
        id={id}
        className={`${bgClass} ${className}`}
        data-hover={hoverAttr}
        style={{ ...customStyle, ...(align ? { textAlign: align } : {}) }}
      >
        {children}
      </div>
    );
  }

  // Stagger mode hands the actual animating over to CSS (see globals.css's
  // `.reveal-stagger` rules, which key off `data-variant` + nth-child
  // delays) so each direct child animates in sequence rather than the
  // block fading in as one piece.
  if (stagger) {
    return (
      <div
        ref={ref}
        id={id}
        className={`reveal-stagger ${visible ? "is-visible" : ""} ${bgClass} ${className}`}
        data-variant={variant}
        data-hover={hoverAttr}
        style={{ ["--reveal-duration" as string]: `${durationMs}ms`, ...customStyle, ...(align ? { textAlign: align } : {}) }}
      >
        {children}
      </div>
    );
  }

  const filterPair = HIDDEN_FILTER[variant];
  const clipValue = HIDDEN_CLIP[variant];
  const easing = TRANSFORM_EASING[variant] ?? "cubic-bezier(0.16, 1, 0.3, 1)";
  const transitionParts = [`opacity ${durationMs}ms ease`, `transform ${durationMs}ms ${easing}`];
  if (filterPair) transitionParts.push(`filter ${durationMs}ms ease`);
  if (clipValue) transitionParts.push(`clip-path ${durationMs}ms ${easing}`);

  return (
    <div
      ref={ref}
      id={id}
      className={`${bgClass} ${className}`}
      data-hover={hoverAttr}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : HIDDEN_TRANSFORM[variant],
        ...(filterPair ? { filter: visible ? filterPair.visible : filterPair.hidden } : {}),
        ...(clipValue ? { clipPath: visible ? "inset(0 0 0 0)" : clipValue } : {}),
        transition: transitionParts.join(", "),
        ...customStyle,
        ...(align ? { textAlign: align } : {}),
      }}
    >
      {children}
    </div>
  );
}
