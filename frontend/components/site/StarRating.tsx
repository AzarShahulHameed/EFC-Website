// A row of 5 stars, filled up to `rating` (rounded to the nearest whole
// star — Google's own review cards don't show half-stars either). Pure
// inline SVG so it renders identically everywhere (no icon font/library
// dependency) and can take any text color via `className`.
export default function StarRating({ rating, size = 14, className = "" }: { rating: number; size?: number; className?: string }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div className={`flex items-center gap-0.5 ${className}`} role="img" aria-label={`${filled} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 20 20"
          fill={i < filled ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={i < filled ? 0 : 1.2}
          aria-hidden="true"
        >
          <path d="M10 1.5l2.59 5.25 5.79.84-4.19 4.09.99 5.77L10 14.77l-5.18 2.68.99-5.77L1.62 7.59l5.79-.84L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}
