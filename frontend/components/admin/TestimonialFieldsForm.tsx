"use client";

import { useState } from "react";
import FieldLabel from "@/components/admin/FieldLabel";
import RichTextField from "@/components/admin/RichTextField";
import { PreviewPortal } from "@/components/admin/PreviewPanel";
import { sanitizeRichText } from "@/lib/rich-text";

const inputCls = "w-full border border-line px-3.5 py-2.5 text-[14px] focus:outline-none focus:border-ink";

// Client Name / Title / Quote — the fields shown on the homepage
// testimonial card — as one client piece with a live preview. Renders bare
// inputs, no <form> of its own, so it drops into the existing Add/Edit
// Testimonial forms.
export default function TestimonialFieldsForm({
  defaultClientName,
  defaultClientTitle,
  defaultValueHtml,
  quoteLabel = "Quote",
}: {
  defaultClientName?: string;
  defaultClientTitle?: string;
  defaultValueHtml?: string;
  quoteLabel?: string;
}) {
  const [clientName, setClientName] = useState(defaultClientName ?? "");
  const [clientTitle, setClientTitle] = useState(defaultClientTitle ?? "");
  const [quoteHtml, setQuoteHtml] = useState(defaultValueHtml ?? "");

  return (
    <>
      <div className="flex flex-col gap-4">
        <span className="text-[13px] font-bold text-ink -mb-1">Content</span>

        <div>
          <FieldLabel htmlFor="clientName" hint="Shown in bold above the quote.">Client Name</FieldLabel>
          <input id="clientName" name="clientName" required value={clientName} onChange={(e) => setClientName(e.target.value)} className={inputCls} />
        </div>
        <div>
          <FieldLabel htmlFor="clientTitle" hint="e.g. 'CFO, Acme Holdings' — shown under the name.">Client Title / Company</FieldLabel>
          <input id="clientTitle" name="clientTitle" value={clientTitle} onChange={(e) => setClientTitle(e.target.value)} className={inputCls} />
        </div>

        <RichTextField
          name="quote"
          label={quoteLabel}
          hint="Keep it to 1–3 sentences — long quotes get truncated on the homepage card. Use the toolbar for bold, italic, underline, size and color."
          defaultValueHtml={defaultValueHtml}
          rows={3}
          onHtmlChange={setQuoteHtml}
        />
      </div>

      <PreviewPortal>
        <div className="bg-navy-light rounded-[var(--radius)] p-6">
          <div
            className="text-[13px] leading-relaxed text-slate-200"
            dangerouslySetInnerHTML={{ __html: `&ldquo;${sanitizeRichText(quoteHtml) || "Quote preview…"}&rdquo;` }}
          />
          <div className="mt-4 text-[12.5px] font-semibold text-[#FAF7EF]">{clientName || "Client name"}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{clientTitle || "Title / Company"}</div>
        </div>
      </PreviewPortal>
    </>
  );
}
