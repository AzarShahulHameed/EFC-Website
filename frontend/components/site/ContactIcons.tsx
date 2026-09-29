// Small LinkedIn / Email / Phone icon-button row, shared by the Team page,
// Find an Expert page, and a Service's Responsible Person card — anywhere a
// person's contact details are shown. Renders nothing for a field that
// isn't set, and nothing at all if none of the three are set.
export default function ContactIcons({
  name,
  linkedinUrl,
  email,
  phone,
  size = "sm",
}: {
  name: string;
  linkedinUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  size?: "sm" | "md";
}) {
  if (!linkedinUrl && !email && !phone) return null;
  const dim = size === "sm" ? "w-6 h-6" : "w-8 h-8";
  const icon = size === "sm" ? 12 : 15;

  return (
    <div className="flex items-center gap-2">
      {linkedinUrl ? (
        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${name} on LinkedIn`}
          className={`${dim} rounded-full border border-line flex items-center justify-center text-ink hover:bg-ink hover:text-white transition-colors shrink-0`}
        >
          <svg width={icon} height={icon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9h4v12H3zM9 9h3.8v1.64h.05c.53-.96 1.83-1.98 3.77-1.98 4.03 0 4.78 2.5 4.78 5.76V21h-4v-5.6c0-1.34-.03-3.06-1.94-3.06-1.94 0-2.24 1.44-2.24 2.96V21H9z" />
          </svg>
        </a>
      ) : null}
      {email ? (
        <a
          href={`mailto:${email}`}
          aria-label={`Email ${name}`}
          className={`${dim} rounded-full border border-line flex items-center justify-center text-ink hover:bg-ink hover:text-white transition-colors shrink-0`}
        >
          <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <rect x="2.5" y="4.5" width="19" height="15" rx="2" />
            <path d="M3.5 6l8.5 7 8.5-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      ) : null}
      {phone ? (
        <a
          href={`tel:${phone.replace(/[^+\d]/g, "")}`}
          aria-label={`Call ${name}`}
          className={`${dim} rounded-full border border-line flex items-center justify-center text-ink hover:bg-ink hover:text-white transition-colors shrink-0`}
        >
          <svg width={icon} height={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M4 4.5h4l1.5 5-2.3 1.7a12 12 0 006.6 6.6l1.7-2.3 5 1.5v4c0 .8-.7 1.5-1.6 1.4C10 21.6 2.4 14 1.6 5.1 1.5 4.2 3.2 4.5 4 4.5z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      ) : null}
    </div>
  );
}
