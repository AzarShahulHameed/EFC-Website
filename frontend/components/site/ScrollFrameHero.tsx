"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { lh, type Locale } from "@/lib/i18n";
import type { ScrollFrameHero as ScrollFrameHeroSettings } from "@/lib/api";
import type { Branch } from "@/lib/content";

const SCROLL_LENGTH_VH: Record<ScrollFrameHeroSettings["scrollLength"], number> = {
  short: 220,
  medium: 320,
  long: 460,
};

/**
 * Scroll-driven frame-sequence hero (Admin → Landing Animation): a
 * `position: sticky` canvas pinned to the viewport for the height of a tall
 * wrapping section, whose visible frame is driven by scroll PROGRESS rather
 * than time — scrolling down plays the sequence forward, scrolling back up
 * plays it in reverse, exactly like it would on a native video scrubber.
 * This is the same technique behind Apple's product pages, just built from
 * a plain admin-uploaded image sequence instead of a bespoke video pipeline.
 *
 * Once the visitor scrolls to the final frame, a location-selection popup
 * appears as a fixed overlay with a real `backdrop-filter: blur` over the
 * frozen last frame — picking a branch (or the popup's own admin-set CTA)
 * navigates on, the same destination logic as the existing Location Gate.
 */
export default function ScrollFrameHero({
  lang,
  hero,
  branches,
}: {
  lang: Locale;
  hero: ScrollFrameHeroSettings;
  branches: Branch[];
}) {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const currentIndexRef = useRef(-1);
  const [loadedCount, setLoadedCount] = useState(0);
  const [popupOpen, setPopupOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(branches[0]?.city ?? null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const popupShownRef = useRef(false);

  const frameCount = hero.frames.length;

  useEffect(() => {
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Preload every frame up front — there are at most a few dozen, already
  // compressed at upload time, so this is light enough to just wait for in
  // full rather than juggling partial-load frame clamping.
  useEffect(() => {
    if (frameCount === 0) return;
    let cancelled = false;
    let loaded = 0;
    const imgs = hero.frames.map((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        if (cancelled) return;
        loaded += 1;
        setLoadedCount(loaded);
      };
      return img;
    });
    imagesRef.current = imgs;
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameCount]);

  function drawFrame(index: number) {
    const canvas = canvasRef.current;
    const img = imagesRef.current[index];
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;
    if (currentIndexRef.current === index) return;
    currentIndexRef.current = index;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
    }
    // `object-fit: cover`-equivalent math for a canvas: scale the image up
    // to fully cover the canvas box, then crop whichever axis overflows.
    const canvasRatio = cw / ch;
    const imgRatio = img.naturalWidth / img.naturalHeight;
    let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
    if (imgRatio > canvasRatio) {
      sw = img.naturalHeight * canvasRatio;
      sx = (img.naturalWidth - sw) / 2;
    } else {
      sh = img.naturalWidth / canvasRatio;
      sy = (img.naturalHeight - sh) / 2;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, cw, ch);
  }

  useEffect(() => {
    if (loadedCount < frameCount || frameCount === 0 || reducedMotion) return;
    drawFrame(0);

    let ticking = false;
    function onScrollOrResize() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const wrap = wrapRef.current;
        if (!wrap) return;
        const rect = wrap.getBoundingClientRect();
        const total = wrap.offsetHeight - window.innerHeight;
        const progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
        const index = Math.round(progress * (frameCount - 1));
        drawFrame(index);
        if (progress >= 0.995 && !popupShownRef.current) {
          popupShownRef.current = true;
          setPopupOpen(true);
        } else if (progress < 0.995 && popupShownRef.current) {
          // Scrolled back up out of the final frame — let the popup
          // re-trigger if they scroll down to the end again, rather than
          // being permanently one-shot for the rest of the visit.
          popupShownRef.current = false;
          setPopupOpen(false);
        }
      });
    }
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    onScrollOrResize();
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedCount, frameCount, reducedMotion]);

  function choose() {
    if (!selected) return;
    const branch = branches.find((b) => b.city === selected);
    if (branch?.externalUrl) {
      window.location.href = branch.externalUrl;
      return;
    }
    if (branch?.slug) {
      router.push(lh(lang, `/${branch.slug}`));
    } else {
      setPopupOpen(false);
    }
  }

  if (frameCount === 0) return null;

  // Reduced-motion / accessibility fallback: skip the scroll-scrub
  // mechanic entirely (a visitor who's asked their OS to minimize motion
  // shouldn't get a screen-length forced scroll animation) and show the
  // final frame as a plain static hero with a manual way into the same
  // location popup.
  if (reducedMotion) {
    return (
      <section className="relative w-full h-[86vh] min-h-[560px] max-h-[820px] overflow-hidden bg-navy">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={hero.frames[hero.frames.length - 1]} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 flex items-end justify-center pb-16">
          <button
            type="button"
            onClick={() => setPopupOpen(true)}
            className="bg-gold text-[#1A1204] font-semibold text-[14.5px] px-8 py-3.5 rounded-[var(--btn-radius)]"
          >
            {hero.popupCtaLabel}
          </button>
        </div>
        {popupOpen ? (
          <LocationPopup hero={hero} branches={branches} selected={selected} setSelected={setSelected} choose={choose} onClose={() => setPopupOpen(false)} />
        ) : null}
      </section>
    );
  }

  return (
    <div ref={wrapRef} className="relative w-full" style={{ height: `${SCROLL_LENGTH_VH[hero.scrollLength]}vh` }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-navy">
        <canvas ref={canvasRef} className="w-full h-full block" />
        {loadedCount < frameCount ? (
          <div className="absolute inset-0 flex items-center justify-center bg-navy">
            <div className="w-8 h-8 border-2 border-white/25 border-t-white rounded-full animate-spin" aria-hidden="true" />
          </div>
        ) : (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 text-[12px] tracking-[0.14em] uppercase flex flex-col items-center gap-2 pointer-events-none transition-opacity" style={{ opacity: popupOpen ? 0 : 1 }}>
            <span>Scroll</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="animate-bounce">
              <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        {popupOpen ? (
          <LocationPopup hero={hero} branches={branches} selected={selected} setSelected={setSelected} choose={choose} onClose={() => setPopupOpen(false)} />
        ) : null}
      </div>
    </div>
  );
}

function LocationPopup({
  hero,
  branches,
  selected,
  setSelected,
  choose,
  onClose,
}: {
  hero: ScrollFrameHeroSettings;
  branches: Branch[];
  selected: string | null;
  setSelected: (city: string) => void;
  choose: () => void;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    // `backdrop-filter: blur` (not an opaque overlay) so this genuinely
    // blurs the frozen final frame behind it rather than hiding it, per
    // the brief. `fixed inset-0` keeps it on screen (and further scrolling
    // inert-feeling) until a location is chosen, rather than releasing back
    // to normal scroll the instant the sticky section's pin ends.
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center px-6"
      style={{
        backgroundColor: "rgba(7, 14, 28, 0.45)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.45s ease",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={hero.popupHeadline}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-6 right-6 text-white/70 hover:text-white text-2xl leading-none"
      >
        &times;
      </button>
      <div
        className="w-full max-w-md text-center"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.5s ease 0.08s, transform 0.5s ease 0.08s",
        }}
      >
        <h2 className="font-serif text-2xl text-white font-semibold mb-3">{hero.popupHeadline}</h2>
        <p className="text-[14px] text-slate-300 mb-8 leading-relaxed">{hero.popupSubtext}</p>
        <div className="flex flex-col gap-2.5 mb-8 max-h-64 overflow-y-auto">
          {branches.map((b) => (
            <button
              key={b.city}
              type="button"
              onClick={() => setSelected(b.city)}
              className={`text-[14.5px] font-medium px-5 py-3.5 border transition-colors text-left flex items-center justify-between gap-3 ${
                selected === b.city ? "border-gold bg-gold/10 text-white" : "border-white/15 text-slate-300 hover:border-white/35"
              }`}
            >
              <span>{b.city}</span>
              {b.externalUrl ? (
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
          className="bg-gold text-[#1A1204] font-semibold text-[14.5px] px-8 py-3.5 disabled:opacity-40 transition-opacity"
        >
          {hero.popupCtaLabel}
        </button>
      </div>
    </div>
  );
}
