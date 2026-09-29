"use client";

import { useEffect, useState } from "react";
import { sanitizeRichText } from "@/lib/rich-text";
import type { TestimonialsDisplay } from "@/lib/api";
import StarRating from "./StarRating";
import GoogleReviewBadge, { GoogleMark } from "./GoogleReviewBadge";

const AUTO_MS: Record<TestimonialsDisplay["autoAdvanceSpeed"], number> = { slow: 8000, normal: 5000, fast: 3000 };
const CARD_TEXT_SIZE: Record<TestimonialsDisplay["cardSize"], string> = { sm: "text-[13.5px]", md: "text-[15px]", lg: "text-[16.5px]" };
const CARD_PADDING: Record<TestimonialsDisplay["cardSize"], string> = { sm: "p-6", md: "p-8", lg: "p-10" };

type Testimonial = { quote: string; name: string; role: string; photoUrl?: string; rating?: number };

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// The testimonials block — a "use client" component (unlike ClientLogosStrip)
// because "carousel" mode needs a timer and hover state, not just a CSS
// transition. Extracted from the homepage so the same block, with the same
// admin settings (Admin → Testimonials → Display Settings), can also render
// on the Services list, a service detail page, and a sub-service page.
export default function TestimonialsSection({ testimonials, display }: { testimonials: Testimonial[]; display: TestimonialsDisplay }) {
  const pages = chunk(testimonials, 3);
  const [page, setPage] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (display.layout !== "carousel" || pages.length <= 1 || paused) return;
    const id = setInterval(() => setPage((p) => (p + 1) % pages.length), AUTO_MS[display.autoAdvanceSpeed]);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [display.layout, display.autoAdvanceSpeed, pages.length, paused]);

  // "Single" layout: one testimonial visible at a time, auto-advancing with
  // its own crossfade + slide-up transition — a distinct "one by one" feel,
  // not a continuously-scrolling marquee (that's ClientLogosStrip's
  // "scroll" motion) and not a multi-card carousel page. `entering` toggles
  // per-advance so the same card index can replay its transition every time
  // (a plain CSS class keyed only by index wouldn't retrigger since React
  // wouldn't see the className change between identical advances).
  const [singleIndex, setSingleIndex] = useState(0);
  const [singleEntering, setSingleEntering] = useState(true);
  useEffect(() => {
    if (display.layout !== "single" || testimonials.length <= 1 || paused) return;
    const id = setInterval(() => {
      setSingleEntering(false);
      window.setTimeout(() => {
        setSingleIndex((i) => (i + 1) % testimonials.length);
        setSingleEntering(true);
      }, 260);
    }, AUTO_MS[display.autoAdvanceSpeed]);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [display.layout, display.autoAdvanceSpeed, testimonials.length, paused]);

  if (testimonials.length === 0) return null;

  const textSize = CARD_TEXT_SIZE[display.cardSize];
  const padding = CARD_PADDING[display.cardSize];

  // Styled to read as a Google review — star row up front, a small "G"
  // mark bottom-right, and (when a Google review URL is configured in
  // Admin → Testimonials → Display Settings) the whole card links out to
  // it, same as clicking straight through from a real Google Business
  // listing.
  const Card = ({ t, i }: { t: Testimonial; i: number }) => {
    // Some saved photo URLs turn out broken (deleted from Cloudinary,
    // pasted wrong, an old expired link) — without this, a failed <img>
    // just shows the browser's broken-image icon, which reads to a visitor
    // as "no photo at all". Falling back to the initials avatar on error
    // keeps the card looking intentional either way.
    const [photoFailed, setPhotoFailed] = useState(false);
    const showPhoto = !!t.photoUrl && !photoFailed;
    const body = (
      <>
        <div className="flex items-center justify-between mb-4">
          <StarRating rating={t.rating ?? 5} size={16} className="text-[#FBBC05]" />
          <GoogleMark size={18} />
        </div>
        <div
          className={`${textSize} leading-relaxed text-slate-200`}
          dangerouslySetInnerHTML={{ __html: `&ldquo;${sanitizeRichText(t.quote)}&rdquo;` }}
        />
        <div className="mt-6 flex items-center gap-3">
          {showPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={t.photoUrl}
              alt={t.name}
              width={44}
              height={44}
              onError={() => setPhotoFailed(true)}
              // Was 36px (w-9/h-9) with no border — against a dark card, a
              // small borderless circle is easy to miss even when it *is*
              // loading correctly, which is exactly what got reported as
              // "not visible" for a photo that may well have been there.
              // A visible ring plus a bit more size makes a real photo
              // unmistakable, on top of the onError→initials fallback for
              // when the saved URL is genuinely broken.
              className="w-11 h-11 rounded-full object-cover flex-shrink-0 ring-2 ring-white/20"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-white/10 ring-2 ring-white/20 flex items-center justify-center text-[14px] font-semibold text-white flex-shrink-0">
              {t.name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
          <div>
            <div className="text-sm font-semibold text-[#FAF7EF]">{t.name}</div>
            <div className="text-[13px] text-slate-400 mt-0.5">{t.role}</div>
          </div>
        </div>
      </>
    );
    const cardCls = `bg-navy-light rounded-[var(--radius)] ${padding}`;
    if (display.googleReviewUrl) {
      return (
        <a
          key={i}
          href={display.googleReviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${cardCls} block hover-target transition-shadow hover:shadow-lg`}
          data-hover="lift"
        >
          {body}
        </a>
      );
    }
    return (
      <div key={i} className={cardCls}>
        {body}
      </div>
    );
  };

  // The standalone rating/review-count badge, shown above the cards when
  // turned on (Admin → Testimonials → Display Settings → "Show Google
  // rating badge") — see GoogleReviewBadge.tsx, the same component the
  // Contact page uses on its own, independent toggle.
  const badge =
    display.showGoogleBadge && display.googleReviewUrl ? (
      <div className="mb-7 flex justify-center">
        <GoogleReviewBadge url={display.googleReviewUrl} rating={display.googleRating} reviewCount={display.googleReviewCount} />
      </div>
    ) : null;

  if (display.layout === "single") {
    const t = testimonials[singleIndex];
    return (
      <>
        {badge}
        <div
          className="max-w-2xl mx-auto"
          onMouseEnter={() => display.pauseOnHover && setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div
            className="transition-all duration-300 ease-out"
            style={{
              opacity: singleEntering ? 1 : 0,
              transform: singleEntering ? "translateY(0)" : "translateY(14px)",
            }}
          >
            <Card t={t} i={singleIndex} />
          </div>
          {testimonials.length > 1 ? (
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Show testimonial ${i + 1}`}
                  onClick={() => {
                    setSingleEntering(false);
                    window.setTimeout(() => {
                      setSingleIndex(i);
                      setSingleEntering(true);
                    }, 200);
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${i === singleIndex ? "bg-gold" : "bg-white/20"}`}
                />
              ))}
            </div>
          ) : null}
        </div>
      </>
    );
  }

  if (display.layout === "grid" || pages.length <= 1) {
    return (
      <>
        {badge}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {testimonials.map((t, i) => (
            <Card key={i} t={t} i={i} />
          ))}
        </div>
      </>
    );
  }

  // Carousel mode: pages of up to 3 cards, sliding horizontally, one page
  // visible at a time — the "transition one after another after a certain
  // time span, horizontally" behavior, plus a manual dot-nav and (per the
  // admin toggle) a pause while the visitor's cursor is over it.
  return (
    <>
      {badge}
      <div
        className="overflow-hidden"
        onMouseEnter={() => display.pauseOnHover && setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ transform: `translateX(-${page * 100}%)` }}
        >
          {pages.map((group, gi) => (
            <div key={gi} className="grid grid-cols-1 md:grid-cols-3 gap-7 w-full flex-shrink-0 px-0.5">
              {group.map((t, i) => (
                <Card key={i} t={t} i={i} />
              ))}
            </div>
          ))}
        </div>
        {pages.length > 1 ? (
          <div className="flex justify-center gap-2 mt-8">
            {pages.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Show testimonials group ${i + 1}`}
                onClick={() => setPage(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === page ? "bg-gold" : "bg-white/20"}`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}
