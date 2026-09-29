"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";

type Props = {
  enabled: boolean;
  /** Lenis' own `duration` in seconds — see SCROLL_MOTION_DURATION in lib/api.ts. */
  duration: number;
  parallaxHero: boolean;
  cursorGlow: boolean;
};

// Site-wide scroll & motion polish (Admin → Scroll & Motion). Renders
// nothing of its own beyond the optional cursor-glow overlay — its job is
// entirely side effects:
//
// 1. Smooth/eased ("inertial") scrolling via Lenis, replacing the browser's
//    default instant jump-scroll, when `enabled`.
// 2. A `--scroll-y` CSS custom property on <html>, updated every frame with
//    the current scroll position in pixels, which globals.css's
//    `.parallax-bg` rule reads to drift hero media slightly as the visitor
//    scrolls (`parallaxHero`).
// 3. A soft radial-gradient light that follows the pointer, shown only over
//    `[data-cursor-glow-surface]` sections (dark bands), for a touch of
//    ambient life (`cursorGlow`).
//
// Always respects prefers-reduced-motion by disabling both the eased scroll
// and the parallax/cursor effects outright — this is a "feel" upgrade, not
// something that should fight an accessibility preference. If Lenis fails
// to load for any reason, the page simply falls back to native scroll.
export default function SmoothScroll({ enabled, duration, parallaxHero, cursorGlow }: Props) {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const doParallax = parallaxHero && !prefersReducedMotion;
    const doCursorGlow = cursorGlow && !prefersReducedMotion;
    const doSmoothScroll = enabled && !prefersReducedMotion;

    root.setAttribute("data-parallax-enabled", doParallax ? "1" : "0");
    root.setAttribute("data-cursor-glow-enabled", doCursorGlow ? "1" : "0");

    let lenis: Lenis | null = null;
    let rafId: number | null = null;

    const tickParallaxOnly = () => {
      root.style.setProperty("--scroll-y", `${window.scrollY}`);
      rafId = requestAnimationFrame(tickParallaxOnly);
    };

    if (doSmoothScroll) {
      lenis = new Lenis({
        duration,
        easing: (t: number) => 1 - Math.pow(1 - t, 3), // ease-out cubic
        smoothWheel: true,
      });
      const raf = (time: number) => {
        lenis?.raf(time);
        if (doParallax) root.style.setProperty("--scroll-y", `${window.scrollY}`);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);
    } else if (doParallax) {
      // Parallax can be on even when the eased-scroll toggle itself is off.
      rafId = requestAnimationFrame(tickParallaxOnly);
    }

    let onMove: ((e: PointerEvent) => void) | null = null;
    if (doCursorGlow && glowRef.current) {
      const glow = glowRef.current;
      onMove = (e: PointerEvent) => {
        const target = e.target as HTMLElement | null;
        const surface = target?.closest("[data-cursor-glow-surface]");
        if (!surface) {
          glow.style.opacity = "0";
          return;
        }
        const rect = surface.getBoundingClientRect();
        glow.style.left = `${e.clientX - rect.left}px`;
        glow.style.top = `${e.clientY - rect.top}px`;
        glow.style.opacity = "1";
        // Reparent so the glow is positioned relative to whichever dark
        // section the pointer is currently over.
        if (glow.parentElement !== surface) surface.appendChild(glow);
      };
      window.addEventListener("pointermove", onMove, { passive: true });
    }

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      lenis?.destroy();
      if (onMove) window.removeEventListener("pointermove", onMove);
    };
  }, [enabled, duration, parallaxHero, cursorGlow]);

  if (!cursorGlow) return null;
  return (
    <div
      ref={glowRef}
      aria-hidden="true"
      className="pointer-events-none absolute w-[420px] h-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-opacity duration-300 z-0"
      style={{
        background: "radial-gradient(circle, rgba(201,163,84,0.16) 0%, rgba(201,163,84,0) 70%)",
      }}
    />
  );
}
