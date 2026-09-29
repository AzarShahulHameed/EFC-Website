"use client";

import { useState } from "react";
import FieldLabel from "@/components/admin/FieldLabel";
import RichTextField from "@/components/admin/RichTextField";
import UnsavedChangesBanner from "@/components/admin/UnsavedChangesBanner";
import { PreviewPortal } from "@/components/admin/PreviewPanel";
import { sanitizeRichText } from "@/lib/rich-text";

const inputCls = "w-full border border-line px-3.5 py-2.5 text-[14px] focus:outline-none focus:border-ink";

// Name / Position / Bio — the fields that actually show up on the Team
// page card — as one client piece with a live preview, so typing updates
// the card mock instantly. Photo, qualification, branch and languages stay
// as ordinary inputs in the parent form (their preview uses the saved
// value, same trade-off ServiceFieldsForm makes for its image). Renders
// bare inputs, no <form> of its own, so it drops into the existing
// Add/Edit Team Member forms.
export default function TeamBioField({
  defaultName,
  defaultPosition,
  qualification,
  photoUrl,
  photoPosition,
  defaultValueHtml,
  nameLabel = "Full Name",
  positionLabel = "Position",
}: {
  defaultName?: string;
  defaultPosition?: string;
  qualification?: string;
  photoUrl?: string;
  photoPosition?: string;
  defaultValueHtml?: string;
  nameLabel?: string;
  positionLabel?: string;
}) {
  const [name, setName] = useState(defaultName ?? "");
  const [position, setPosition] = useState(defaultPosition ?? "");
  const [bioHtml, setBioHtml] = useState(defaultValueHtml ?? "");
  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Restores a lost draft after a session timeout etc. — see
            lib/useUnsavedFormDraft.ts and the README's "Unsaved changes
            safety net" section. */}
        <UnsavedChangesBanner />
        <span className="text-[13px] font-bold text-ink -mb-1">Content</span>

        <div>
          <FieldLabel htmlFor="name" hint="Full name as shown on the public Team and Find an Expert pages.">{nameLabel}</FieldLabel>
          <input id="name" name="name" required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </div>
        <div>
          <FieldLabel htmlFor="position" hint="Job title, shown under the name.">{positionLabel}</FieldLabel>
          <input id="position" name="position" required value={position} onChange={(e) => setPosition(e.target.value)} className={inputCls} />
        </div>

        <RichTextField
          name="bio"
          label="Bio"
          hint="Shown on the Team page under the position. Use the toolbar for bold, italic, underline, size and color."
          defaultValueHtml={defaultValueHtml}
          rows={4}
          onHtmlChange={setBioHtml}
        />
      </div>

      <PreviewPortal>
        <div className="border border-line bg-white p-4">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt=""
              style={{ objectPosition: photoPosition || "center" }}
              className="w-14 h-14 rounded-full object-cover mb-3"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-slate-100 mb-3" />
          )}
          <div className="text-[13.5px] font-semibold text-ink">{name || "Full name"}</div>
          <div className="text-[12px] text-gold mt-0.5">{position || "Position"}</div>
          <div
            className="text-[12px] text-muted leading-relaxed mt-2.5"
            dangerouslySetInnerHTML={{ __html: sanitizeRichText(bioHtml) || "Bio preview…" }}
          />
          {qualification ? <div className="text-[11px] text-slate-500 mt-2.5">{qualification}</div> : null}
        </div>
      </PreviewPortal>
    </>
  );
}
