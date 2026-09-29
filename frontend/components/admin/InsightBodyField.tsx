"use client";

import { useState } from "react";
import RichTextField from "@/components/admin/RichTextField";
import { PreviewPortal } from "@/components/admin/PreviewPanel";
import { sanitizeRichText } from "@/lib/rich-text";

// The article Body — as one client piece with a live preview. Renders a
// bare RichTextField, no <form> of its own, so it drops into the existing
// Add/Edit Article forms. Title is passed through only to label the
// preview panel; it's a separate plain input in the parent form.
export default function InsightBodyField({
  defaultValueHtml,
  title,
  label = "Body",
}: {
  defaultValueHtml?: string;
  title?: string;
  label?: string;
}) {
  const [bodyHtml, setBodyHtml] = useState(defaultValueHtml ?? "");

  return (
    <>
      <div className="flex flex-col gap-4">
        <span className="text-[13px] font-bold text-ink -mb-1">Content</span>

        <RichTextField
          name="body"
          label={label}
          hint="Full article text. Use the toolbar for bold, italic, underline, size and color; press Enter for a new paragraph."
          defaultValueHtml={defaultValueHtml}
          rows={10}
          onHtmlChange={setBodyHtml}
        />
      </div>

      <PreviewPortal>
        <div className="bg-white border border-line rounded-[var(--radius)] p-5 max-h-[480px] overflow-y-auto">
          {title ? <div className="font-serif text-[17px] text-ink leading-snug mb-3">{title}</div> : null}
          <div
            className="text-[13.5px] leading-relaxed text-ink [&_p]:mb-3"
            dangerouslySetInnerHTML={{
              __html: sanitizeRichText(bodyHtml) || "<p class='text-slate-400'>Start typing to see a preview…</p>",
            }}
          />
        </div>
      </PreviewPortal>
    </>
  );
}
