"use client";

import { useEffect, useRef, useState } from "react";
import { dirFor, type Locale } from "@/lib/i18n";

// A horizontal milestones timeline with a small illustrated character that
// strolls from one milestone to the next along the spine line, and reveals
// each milestone's "what was achieved" card only once it actually arrives
// there — the character (all three of its walk-cycle frames), how fast it
// walks, how big it renders, and whether cards reveal on arrival or all
// show up front are every one of them read from `animation`, which comes
// straight from Admin → Pages & Content → About → Milestones Animation.
// Nothing about the character — which image, how slow it walks — is
// hardcoded here.
//
// How the walk is faked: this isn't a sprite sheet or a video, just three
// plain photos/illustrations (one standing/idle pose, two mid-stride
// poses). While the character is actually travelling between two
// milestones, the two walking-pose images swap back and forth every
// couple hundred milliseconds AND a separate, slower CSS animation slides
// the whole thing sideways along the spine — that combination is what
// reads as walking. The instant it arrives at a milestone it switches back
// to the standing/idle pose and holds still — including at every
// intermediate stop, not only the very last one — rather than continuing
// to "march in place" while paused.
export type MilestoneAnimationSettings = {
  idleImageUrl: string;
  walk1ImageUrl: string;
  walk2ImageUrl: string;
  speed: "slow" | "medium" | "fast";
  size: "small" | "medium" | "large";
  revealOnArrival: boolean;
};

// Character images are ~2:3 portrait crops (see public/images/milestone-character);
// these are on-screen heights, width follows from that ratio.
const SIZE_PX: Record<MilestoneAnimationSettings["size"], number> = {
  small: 54,
  medium: 78,
  large: 104,
};

// Extra headroom, in px, above the character's own height — the row that
// holds the character + spine line + milestone dots needs to be taller
// than the character itself (with the character's own top flush against
// the row's own top), or the character gets clipped by the horizontal
// scroll wrapper around it (setting `overflow-x` on an element makes the
// browser treat `overflow-y` as "auto" too, per the CSS spec, even though
// only the x-axis was asked for — and "auto" clips anything that pokes
// out of the box, unlike "visible"). Keeping the character's own box
// entirely inside the row's own box, feet flush on the spine line, avoids
// that clipping outright instead of fighting it.
const ROW_PADDING_PX = 16;

// Total walk duration, in seconds, as a function of how many milestones
// there are — more stops naturally means a longer trip. "Slow" is the
// requested default: an unhurried, human walking pace, not a dash between
// dots.
const DURATION_PER_STOP: Record<MilestoneAnimationSettings["speed"], number> = {
  slow: 3.2,
  medium: 1.8,
  fast: 1,
};
const DURATION_BOUNDS: Record<MilestoneAnimationSettings["speed"], [number, number]> = {
  slow: [7, 22],
  medium: [4, 13],
  fast: [2, 8],
};

// How often the two walking-pose images swap to fake a stride, in ms —
// slower overall speed gets a slower, more natural leg-swap rate too.
const FRAME_SWAP_MS: Record<MilestoneAnimationSettings["speed"], number> = {
  slow: 560,
  medium: 420,
  fast: 300,
};

// The stop-and-go itinerary as CSS-keyframe-percent "stops": for each
// milestone i, an "arrive" point and a (later) "leave" point at the same
// left%, with the gaps between one stop's "leave" and the next stop's
// "arrive" being travel. Shared by the keyframes string, the card-reveal
// schedule, and the walk/idle-pose schedule, so all three agree exactly
// on when the character is standing still versus actually moving.
function buildItinerary(n: number, posPercent: (i: number) => number) {
  const HOLD_PCT = n <= 1 ? 100 : Math.min(70 / n, 14);
  const stops: { t: number; left: number }[] = [];
  if (n <= 1) {
    stops.push({ t: 0, left: posPercent(0) }, { t: 100, left: posPercent(0) });
  } else {
    const totalHold = HOLD_PCT * n;
    const travelEach = Math.max((100 - totalHold) / (n - 1), 0);
    let t = 0;
    for (let i = 0; i < n; i++) {
      stops.push({ t, left: posPercent(i) });
      t += HOLD_PCT;
      stops.push({ t: Math.min(t, 100), left: posPercent(i) });
      if (i < n - 1) t += travelEach;
    }
  }
  // Arrival % for each milestone (the first entry of its pair) — used to
  // time that milestone's card reveal.
  const arrivalPct = stops.filter((_, idx) => idx % 2 === 0).map((s) => s.t);
  // Travel windows — [leave% of stop i, arrive% of stop i+1] — the only
  // spans where the walking-pose frames should swap.
  const travelWindows: { startPct: number; endPct: number }[] = [];
  for (let i = 0; i < n - 1; i++) {
    travelWindows.push({ startPct: stops[2 * i + 1].t, endPct: stops[2 * i + 2].t });
  }
  return { stops, arrivalPct, travelWindows };
}

export default function MilestoneTimeline({
  timeline,
  animation,
  lang,
}: {
  timeline: { year: string; event: string }[];
  animation: MilestoneAnimationSettings;
  lang: Locale;
}) {
  const n = timeline.length;
  const isRtl = dirFor(lang) === "rtl";
  const ref = useRef<HTMLDivElement>(null);
  const [walking, setWalking] = useState(false);
  const [restAtEnd, setRestAtEnd] = useState(false);
  const [frame, setFrame] = useState<1 | 2>(1);
  // True only while the character is actually travelling between two
  // milestones — false the instant it arrives, including at every
  // intermediate stop, not just the final one.
  const [moving, setMoving] = useState(false);
  // Which milestone cards have "arrived" and should be visible. When
  // revealOnArrival is off, every card is visible from the start.
  const [revealed, setRevealed] = useState<Set<number>>(() => (animation.revealOnArrival ? new Set() : new Set()));

  const revealAll = !animation.revealOnArrival;

  useEffect(() => {
    const node = ref.current;
    if (!node || n === 0) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || typeof IntersectionObserver === "undefined") {
      // No walk animation — the character just stands at the final
      // milestone, as if the journey's already complete, and every card
      // is shown immediately rather than staying hidden forever.
      setRestAtEnd(true);
      setRevealed(new Set(Array.from({ length: n }, (_, i) => i)));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setWalking(true);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.25, rootMargin: "0px 0px -80px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [n]);

  // Every milestone sits at the horizontal center of its own equal-width
  // column: column i spans [i/n, (i+1)/n] of the row's width, so its
  // center is at (i + 0.5) / n. Guarded against n === 0 (nothing to
  // divide by) so this stays safe to call before the early return below —
  // hooks further down must run on every render regardless of n, so the
  // "nothing to show" bail-out has to come after them, not before.
  const posPercent = (i: number) => (n === 0 ? 0 : ((i + 0.5) / n) * 100);
  // The grid the dots/cards live in is auto-mirrored by the browser under
  // `dir="rtl"`, so milestone 0 ends up rendered on the right in Arabic
  // even though `posPercent` still returns its plain left-to-right
  // percentage. The walking character isn't laid out in that grid — its
  // `left` keyframes are generated numbers, which the browser has no way
  // to mirror on its own — so every physical position fed to it has to be
  // flipped by hand here to match where the grid actually put things.
  const displayPercent = (i: number) => (isRtl ? 100 - posPercent(i) : posPercent(i));

  const keyframeName = `milestone-walk-${n}-${animation.speed}`;
  const [minDur, maxDur] = DURATION_BOUNDS[animation.speed];
  const durationSeconds = Math.min(Math.max(n * DURATION_PER_STOP[animation.speed], minDur), maxDur);
  const { stops, arrivalPct, travelWindows } = buildItinerary(n, displayPercent);
  const keyframesCss = `@keyframes ${keyframeName} { ${stops
    .map((s) => `${s.t.toFixed(2)}% { left: ${s.left.toFixed(3)}%; }`)
    .join(" ")} }`;

  // Schedule each card's reveal for the moment the character's walk
  // animation actually reaches that milestone, rather than showing every
  // "what's been achieved" card up front.
  useScheduledFlags({ walking, active: !revealAll, n, windows: arrivalPct.map((pct) => ({ startPct: pct, endPct: pct })), durationSeconds, onEnter: (i) => setRevealed((prev) => (prev.has(i) ? prev : new Set(prev).add(i))) });

  // Only swap between the two walking-pose frames — and only run the swap
  // timer at all — while genuinely inside a travel window; idle (standing
  // still, in the idle pose) the rest of the time, at every stop along the
  // way, not only the last one.
  useScheduledMoving({ walking, n, travelWindows, durationSeconds, setMoving });
  useEffect(() => {
    if (!moving) return;
    const ms = FRAME_SWAP_MS[animation.speed];
    const id = window.setInterval(() => setFrame((f) => (f === 1 ? 2 : 1)), ms);
    return () => window.clearInterval(id);
  }, [moving, animation.speed]);

  // Nothing to show — bailing out here (after every hook above has run,
  // never before) keeps this component's hook calls unconditional on
  // every render, which React requires.
  if (n === 0) return null;

  const px = SIZE_PX[animation.size];
  const rowHeight = px + ROW_PADDING_PX;
  const currentImg = moving ? (frame === 1 ? animation.walk1ImageUrl : animation.walk2ImageUrl) : animation.idleImageUrl;

  return (
    <div ref={ref} className="relative">
      {/* Generated per render — safe to inline: the only variable content
          is numbers derived from `timeline.length` and the admin-chosen
          speed enum, never free-text admin/user content. */}
      <style dangerouslySetInnerHTML={{ __html: keyframesCss }} />

      {/* Horizontal on every screen size, as requested — scrolls sideways
          rather than collapsing to a vertical stack once there are more
          milestones (or less room) than fit comfortably. */}
      <div className="overflow-x-auto pb-2 -mx-1 px-1">
        <div style={{ minWidth: `${Math.max(n * 170, 480)}px` }}>
          <div className="relative" style={{ height: `${rowHeight}px` }}>
            {/* The spine line sits at exactly `px` from the row's own top
                — precisely where the character's feet land (its box is
                top:0, height:px, feet drawn at the bottom edge via
                object-bottom) — so the character always walks right on
                the line instead of floating above or beside it. */}
            <div className="absolute left-0 right-0 h-px bg-line" style={{ top: `${px}px` }} aria-hidden="true" />

            <div
              className="absolute top-0 pointer-events-none z-10"
              style={{
                left: restAtEnd ? `${displayPercent(n - 1)}%` : `${displayPercent(0)}%`,
                width: `${Math.round(px * 0.67)}px`,
                height: `${px}px`,
                transform: "translateX(-50%)",
                animation: walking ? `${keyframeName} ${durationSeconds}s linear forwards` : undefined,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentImg}
                alt=""
                aria-hidden="true"
                className="w-full h-full object-contain object-bottom select-none"
                draggable={false}
              />
            </div>

            <div
              className="absolute left-0 right-0 grid"
              style={{ top: `${px}px`, transform: "translateY(-50%)", gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
            >
              {timeline.map((_, i) => (
                <div key={i} className="flex items-center justify-center">
                  <span className="w-3.5 h-3.5 rounded-full bg-gold ring-4 ring-white shadow-sm" aria-hidden="true" />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
            {timeline.map((t, i) => {
              const isRevealed = revealAll || revealed.has(i);
              return (
                <div
                  key={`${t.year}-${i}`}
                  className="hover-target bg-white border border-line rounded-[var(--radius)] shadow-sm px-4 py-4 text-center mx-1 transition-all duration-500 ease-out"
                  style={{
                    opacity: isRevealed ? 1 : 0,
                    transform: isRevealed ? "translateY(0)" : "translateY(10px)",
                  }}
                >
                  <div className="font-serif text-xl font-semibold text-gold mb-1">{t.year}</div>
                  <div className="text-[13px] text-ink leading-relaxed">{t.event}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Schedules a setTimeout per window's start% that fires `onEnter(index)` —
// used for the card-reveal schedule (each "window" is a single arrival
// instant, startPct === endPct). Kept as its own hook purely to keep the
// component body above readable; it has no meaning outside
// MilestoneTimeline.
function useScheduledFlags({
  walking,
  active,
  n,
  windows,
  durationSeconds,
  onEnter,
}: {
  walking: boolean;
  active: boolean;
  n: number;
  windows: { startPct: number; endPct: number }[];
  durationSeconds: number;
  onEnter: (index: number) => void;
}) {
  useEffect(() => {
    if (!walking || !active) return;
    const timers = windows.map((w, i) => window.setTimeout(() => onEnter(i), (w.startPct / 100) * durationSeconds * 1000));
    return () => timers.forEach((id) => window.clearTimeout(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walking, active, n]);
}

// Schedules setMoving(true)/(false) pairs around each travel window, so
// the walking-pose frame swap (and the "moving" state generally) is only
// ever active while the character is genuinely travelling between two
// milestones — idle everywhere else, including every intermediate stop.
function useScheduledMoving({
  walking,
  n,
  travelWindows,
  durationSeconds,
  setMoving,
}: {
  walking: boolean;
  n: number;
  travelWindows: { startPct: number; endPct: number }[];
  durationSeconds: number;
  setMoving: (v: boolean) => void;
}) {
  useEffect(() => {
    if (!walking) {
      setMoving(false);
      return;
    }
    const timers: number[] = [];
    for (const w of travelWindows) {
      timers.push(window.setTimeout(() => setMoving(true), (w.startPct / 100) * durationSeconds * 1000));
      timers.push(window.setTimeout(() => setMoving(false), (w.endPct / 100) * durationSeconds * 1000));
    }
    return () => timers.forEach((id) => window.clearTimeout(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walking, n]);
}
