// A real, interactive Google Map for a branch office — satellite toggle,
// zoom controls, and the Street View "pegman" icon, matching what an
// embedded Google Map normally offers. Deliberately uses the *keyless*
// `maps.google.com/maps?...&output=embed` iframe form rather than the
// official Google Maps Embed API: the official API requires a Google Cloud
// project with billing enabled and an API key threaded through the admin
// dashboard and both `.env` files, which is unnecessary cost/setup for a
// map that only needs to show "here's our office" — the keyless form is
// free, needs no key or billing, and renders the same interactive map.
//
// Fully admin-configurable with zero new admin fields: the query is built
// straight from the branch's own Address + City (Admin → Branches → Edit),
// which an admin already edits for every other purpose (the office card,
// the "LocalBusiness" structured data, etc.) — so correcting the address
// there automatically re-points this map too, with nothing else to keep in
// sync.
export default function BranchMapEmbed({
  address,
  city,
  className = "",
  heightClass = "h-64",
}: {
  address: string;
  city: string;
  className?: string;
  heightClass?: string;
}) {
  const query = encodeURIComponent(`${address}, ${city}`);
  return (
    <div className={`${heightClass} w-full overflow-hidden ${className}`}>
      <iframe
        src={`https://maps.google.com/maps?q=${query}&output=embed`}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title={`Map showing directions to the ${city} office`}
        className="w-full h-full grayscale-0"
      />
    </div>
  );
}
