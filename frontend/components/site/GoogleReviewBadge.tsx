import StarRating from "./StarRating";

// The small multicolor "G" mark — used both standalone (this badge) and
// inline on each testimonial card in TestimonialsSection, so it's kept as
// its own component rather than duplicated inline SVG in two places.
export function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18A13.96 13.96 0 0110.94 24c0-1.45.25-2.86.69-4.18v-5.7H4.34A21.96 21.96 0 002 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  );
}

// Standalone "we're on Google" summary badge — the rating + review count
// most people recognize from a Google Business Profile, linking straight
// out to the firm's real review page. Shown wherever the testimonials
// section itself runs (Admin → Testimonials → Display Settings → "Show
// Google rating badge") and, separately, on the Contact page (its own
// toggle there) even on a page with no testimonial cards at all.
export default function GoogleReviewBadge({
  url,
  rating,
  reviewCount,
  className = "",
}: {
  url?: string;
  rating?: number;
  reviewCount?: number;
  className?: string;
}) {
  if (!url) return null;
  const content = (
    <>
      <GoogleMark size={22} />
      <div className="flex flex-col leading-tight">
        <div className="flex items-center gap-1.5">
          {typeof rating === "number" ? <span className="text-[14px] font-bold text-ink">{rating.toFixed(1)}</span> : null}
          <StarRating rating={rating ?? 5} size={13} className="text-[#FBBC05]" />
        </div>
        <span className="text-[11.5px] text-slate-500">
          {typeof reviewCount === "number" ? `${reviewCount.toLocaleString()} Google reviews` : "Read our Google reviews"}
        </span>
      </div>
    </>
  );
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-3 bg-white border border-line px-4 py-3 rounded-[var(--radius)] hover-target transition-shadow hover:shadow-md ${className}`}
      data-hover="lift"
    >
      {content}
    </a>
  );
}
