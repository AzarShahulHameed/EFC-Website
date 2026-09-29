"use client";

import { useEffect, useState } from "react";

// A crossfading photo gallery for the About page's "team & offices" section.
// Purely presentational — the list of photos comes from Admin → Pages &
// Content → About → Photo Gallery. Renders nothing if there are no photos,
// so the section disappears entirely until an admin uploads at least one.
export default function PhotoGallery({ photos }: { photos: { url: string; caption?: string }[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (photos.length < 2) return;
    const id = setInterval(() => setActive((a) => (a + 1) % photos.length), 4500);
    return () => clearInterval(id);
  }, [photos.length]);

  if (photos.length === 0) return null;

  return (
    <div className="relative w-full h-[280px] sm:h-[420px] overflow-hidden rounded-[var(--radius)] bg-paper-2 shadow-sm">
      {photos.map((p, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${p.url}-${i}`}
          src={p.url}
          alt={p.caption ?? ""}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-[1400ms] ease-in-out"
          style={{ opacity: i === active ? 1 : 0 }}
        />
      ))}

      {photos[active]?.caption ? (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent px-6 pt-14 pb-5">
          <p className="text-white text-[14px] font-medium tracking-wide">{photos[active].caption}</p>
        </div>
      ) : null}

      {photos.length > 1 ? (
        <div className="absolute bottom-4 right-5 flex gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Show photo ${i + 1}`}
              onClick={() => setActive(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === active ? "bg-white" : "bg-white/40"}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
