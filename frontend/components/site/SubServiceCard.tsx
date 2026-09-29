import Link from "next/link";

type Props = {
  name: string;
  description?: string;
  imageUrl?: string;
  imagePosition?: string;
  /** The sub-service's own full page, when it has a slug (auto-generated
   * from its name on save — see createSubServiceAction/updateSubServiceAction
   * — so this is populated for every sub-service in practice). */
  href?: string;
};

// The compact "What this includes" card on a Service's detail page — just a
// thumbnail, name and one-line teaser. "Learn More" used to expand the full
// body/photo/video inline on this same page, which meant a visitor could
// end up reading an entire second service's worth of content crammed under
// a service they came to look at. It now does what the label promises: it
// takes the visitor to that sub-service's own dedicated page (same shape as
// a full Service page — see [slug]/[subSlug]/page.tsx), instead of
// expanding in place.
export default function SubServiceCard({ name, description, imageUrl, imagePosition, href }: Props) {
  return (
    <div className="bg-white border border-line overflow-hidden transition-all hover-target" data-hover="lift">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={name}
          style={{ objectPosition: imagePosition || "center" }}
          className="w-full h-36 object-cover"
        />
      ) : null}
      <div className="p-6">
        <h3 className="text-[15px] font-semibold text-ink">{name}</h3>
        {description ? <p className="text-[13.5px] text-muted leading-relaxed mt-2">{description}</p> : null}

        {href ? (
          <Link
            href={href}
            className="inline-block text-[12.5px] font-semibold text-ink border-b border-ink pb-0.5 mt-3"
          >
            Learn More &rarr;
          </Link>
        ) : (
          <p className="text-[12.5px] text-slate-400 mt-3">Full details coming soon.</p>
        )}
      </div>
    </div>
  );
}
