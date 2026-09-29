"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { lh, type Locale } from "@/lib/i18n";
import type { FreezoneApproval, FreezoneDisplay } from "@/lib/api";

const AUTO_MS_PER_SECOND = 1000;

// One slide per approval — badge/headline/body/CTA on one side, a
// photo-or-video panel on the other, exactly the markup the homepage used
// to render for its single freezone entry. When there's more than one
// active approval, they auto-rotate horizontally (like the testimonials
// carousel), respecting the admin's chosen interval and pause-on-hover —
// "we are approved in multiple not one... transition one another after the
// certain time span horizontally like how the mnc all have that."
export default function FreezoneCarousel({
  approvals,
  display,
  lang,
}: {
  approvals: FreezoneApproval[];
  display: FreezoneDisplay;
  lang: Locale;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (approvals.length <= 1 || paused) return;
    const ms = Math.max(2, display.autoRotateSeconds) * AUTO_MS_PER_SECOND;
    const id = setInterval(() => setIndex((i) => (i + 1) % approvals.length), ms);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approvals.length, display.autoRotateSeconds, paused]);

  if (approvals.length === 0) return null;

  const Slide = ({ freezone }: { freezone: FreezoneApproval }) => {
    const isExternal = /^https?:\/\//i.test(freezone.ctaHref || "");
    const freezoneHref = isExternal ? freezone.ctaHref : lh(lang, freezone.ctaHref || "/about");
    return (
      <div className="w-full flex-shrink-0 px-0.5">
        <div
          className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
            freezone.mediaPosition === "left" ? "lg:[&>*:first-child]:order-2" : ""
          }`}
        >
          <div>
            {freezone.badge ? (
              <div className="text-[13px] font-semibold tracking-[0.14em] text-gold uppercase mb-3.5">
                {freezone.badge}
              </div>
            ) : null}
            {freezone.headline ? (
              <h2 className="font-serif text-3xl text-ink leading-tight mb-5 max-w-lg">{freezone.headline}</h2>
            ) : null}
            {freezone.body ? (
              <p className="text-[15.5px] text-muted leading-relaxed max-w-md">{freezone.body}</p>
            ) : null}
            {freezone.ctaLabel ? (
              <Link
                href={freezoneHref}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                className="inline-block mt-7 bg-gold text-[#1A1204] font-semibold text-[14.5px] px-7 py-3.5 rounded-[var(--btn-radius)] hover:bg-gold-light transition-colors"
              >
                {freezone.ctaLabel}
              </Link>
            ) : null}
          </div>
          <div className="relative w-full h-64 sm:h-80 rounded-[var(--radius)] overflow-hidden bg-navy">
            {freezone.videoUrl ? (
              <video
                src={freezone.videoUrl}
                poster={freezone.imageUrl || undefined}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : freezone.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={freezone.imageUrl}
                alt=""
                style={{ objectPosition: freezone.imagePosition || "center" }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div
                className="absolute inset-0 opacity-70"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 25% 25%, rgba(201,163,84,0.25), transparent 55%), radial-gradient(circle at 80% 80%, rgba(46,90,140,0.35), transparent 55%)",
                }}
                aria-hidden="true"
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  if (approvals.length === 1) {
    return (
      <div className="container-page py-20">
        <Slide freezone={approvals[0]} />
      </div>
    );
  }

  return (
    <div
      className="container-page py-20 overflow-hidden"
      onMouseEnter={() => display.pauseOnHover && setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {approvals.map((a) => (
          <Slide key={a.id} freezone={a} />
        ))}
      </div>
      <div className="flex justify-center gap-2 mt-8">
        {approvals.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Show approval ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`w-2 h-2 rounded-full transition-colors ${i === index ? "bg-gold" : "bg-ink/15"}`}
          />
        ))}
      </div>
    </div>
  );
}
