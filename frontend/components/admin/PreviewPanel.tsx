"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// A live preview (the "Card Preview" a form shows while you type) used to
// be nested *inside* each edit form's own bordered box — which meant it
// had to squeeze into that box's max-width, on top of the form fields
// themselves, so both ended up cramped even though the page had real
// unused space to the right. This splits the two apart with a portal: the
// preview-owning field component (TeamBioField, ServiceFieldsForm, etc.)
// keeps its own live state exactly as before, but renders its preview
// markup into <PreviewSlot/> — a placeholder the *page* puts outside the
// form, in its own wide column — instead of inline where it's defined.
//
// Usage:
//   Page (server component):
//     <div className="grid xl:grid-cols-[1fr_380px] gap-8 items-start">
//       <form>...<SomeFieldsForm .../>...</form>
//       <div className="hidden xl:block sticky top-8">
//         <div className="text-[11px] ...">Live Preview</div>
//         <PreviewSlot />
//       </div>
//     </div>
//   Field component (client component):
//     <PreviewPortal><div className="border ...">...actual preview...</div></PreviewPortal>
export const PREVIEW_SLOT_ID = "admin-preview-slot";

export function PreviewSlot({ className }: { className?: string }) {
  return <div id={PREVIEW_SLOT_ID} className={className} />;
}

// Wraps an edit form with a second, real-width column for its live
// preview — used by every "Add/Edit X" screen that has a PreviewPortal
// somewhere inside its fields (Team, Services, Testimonials, Insights,
// Client Logos). Below the `xl` breakpoint there's no room for a second
// column, so the preview slot is simply hidden there rather than squeezed
// — the form itself is still fully usable, just without the live mock.
export function EditorLayout({ children, label = "Live Preview" }: { children: React.ReactNode; label?: string }) {
  return (
    // The preview column used to be a fixed 380px, hidden entirely below
    // `xl` — on anything narrower than a very wide monitor it either
    // disappeared, or (at exactly `xl`) sat in a cramped box with a
    // visibly empty strip of page to its right, since 380px is much
    // narrower than the space actually available once the form column
    // gets its own `minmax(0,1fr)`. `minmax(420px,34vw)` lets it use a
    // real share of the screen instead of a hardcoded pixel box, and it
    // now appears from `lg` upward rather than only on the very widest
    // screens.
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(420px,34vw)] gap-8 items-start">
      <div className="min-w-0">{children}</div>
      <div className="hidden lg:block sticky top-8">
        <div className="text-[10.5px] font-semibold tracking-[0.1em] text-slate-400 uppercase mb-2">{label}</div>
        <PreviewSlot className="block" />
      </div>
    </div>
  );
}

export function PreviewPortal({ children }: { children: React.ReactNode }) {
  // The portal target only exists in the DOM after the client has
  // hydrated, so the very first render (and any server render) has
  // nothing to portal into yet — falling back to null until then avoids a
  // hydration mismatch, and the preview appears a frame later once
  // useEffect finds the slot.
  const [node, setNode] = useState<Element | null>(null);

  useEffect(() => {
    setNode(document.getElementById(PREVIEW_SLOT_ID));
  }, []);

  if (!node) return null;
  return createPortal(children, node);
}
