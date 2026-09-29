"use client";

import { useState } from "react";

// Shows a clamped preview of a team member's bio with a "Read full bio"
// trigger that opens the complete text in a fixed, viewport-centered
// modal — not an absolutely-positioned panel nested inside the card grid.
//
// The previous approach expanded the bio in place on :hover, positioned
// `absolute` inside the card. That could visually collide with the row
// below it (the expanded panel's height wasn't bounded by the grid, and
// z-index stacking between grid siblings is fragile — a hovered card's
// popup could end up rendered behind, or occluded by, the next row's
// card). A fixed, centered modal has no such problem: it's outside the
// grid's stacking context entirely, so there's nothing below it to fight
// with. It's also usable on touch devices, which hover never was.
export default function BioReveal({ bio, name }: { bio: string; name: string }) {
  const [open, setOpen] = useState(false);
  const isLong = bio.length > 220;

  return (
    <>
      <div className="relative mt-3">
        <div
          className="text-[13.5px] text-muted leading-relaxed line-clamp-4"
          dangerouslySetInnerHTML={{ __html: bio }}
        />
        {isLong ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-[12.5px] font-semibold text-ink underline underline-offset-2 mt-2"
          >
            Read full bio
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-5 bg-black/40"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${name}'s full bio`}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-[var(--radius)] shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-7 relative"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute top-4 right-4 text-slate-400 hover:text-ink text-xl leading-none"
            >
              &times;
            </button>
            <h3 className="text-[16px] font-semibold text-ink mb-3 pr-6">{name}</h3>
            <div
              className="text-[14px] text-muted leading-relaxed"
              dangerouslySetInnerHTML={{ __html: bio }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
