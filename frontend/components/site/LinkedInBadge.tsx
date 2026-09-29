// Small LinkedIn mark + "View on LinkedIn" badge, shown on an Insights
// card/detail page when the admin has set a LinkedIn Post URL for that
// article (Admin → Insights → "LinkedIn Post URL") — mirrors the pattern
// already used for the Google review mark (components/site/GoogleReviewBadge.tsx):
// a plain inline SVG (no external icon font/library dependency) plus a
// small labelled pill.

export function LinkedInMark({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <rect width="24" height="24" rx="4" fill="#0A66C2" />
      <path
        fill="#fff"
        d="M7.12 9.4H4.62V19h2.5V9.4ZM5.87 8.24a1.45 1.45 0 1 0 0-2.9 1.45 1.45 0 0 0 0 2.9ZM19.38 19h-2.5v-5.12c0-1.22-.44-2.05-1.53-2.05-.83 0-1.33.56-1.55 1.1-.08.19-.1.46-.1.73V19h-2.5s.03-8.72 0-9.6h2.5v1.36c.33-.51.93-1.24 2.26-1.24 1.65 0 2.89 1.08 2.89 3.4V19Z"
      />
    </svg>
  );
}

export default function LinkedInBadge({ url, className = "" }: { url?: string; className?: string }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-[#0A66C2] hover:underline ${className}`}
    >
      <LinkedInMark size={15} />
      View on LinkedIn
    </a>
  );
}
