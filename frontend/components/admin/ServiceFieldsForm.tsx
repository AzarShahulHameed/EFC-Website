"use client";

import { useState } from "react";
import FieldLabel from "@/components/admin/FieldLabel";
import RichTextField from "@/components/admin/RichTextField";
import UnsavedChangesBanner from "@/components/admin/UnsavedChangesBanner";
import { PreviewPortal } from "@/components/admin/PreviewPanel";
import { sanitizeRichText } from "@/lib/rich-text";

const inputCls = "w-full border border-line px-3.5 py-2.5 text-[14px] focus:outline-none focus:border-ink";

type Defaults = {
  title?: string;
  summary?: string;
  description?: string;
  whatIsIt?: string;
  whoNeedsIt?: string;
  benefits?: string;
  process?: string;
  costFactors?: string;
  timeline?: string;
  imageUrl?: string;
  imagePosition?: string;
};

// The translatable content fields for a Service — title/summary (plain,
// since summary also feeds <meta description> and card previews, which
// must stay plain text) plus description/whatIsIt/whoNeedsIt as rich text
// (font size/color/bold/italic), with a live preview panel mirroring the
// service card + detail page. Renders bare <input>/<textarea> elements, no
// <form> of its own — it's meant to sit inside the parent page's <form
// action=...>, same composition pattern as RichTextField/AnimationPicker,
// so Create vs Edit can keep their own slug/image/FAQ handling around it.
export default function ServiceFieldsForm({ defaults }: { defaults: Defaults }) {
  const [title, setTitle] = useState(defaults.title ?? "");
  const [summary, setSummary] = useState(defaults.summary ?? "");
  const [descriptionHtml, setDescriptionHtml] = useState(defaults.description ?? "");

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Restores a lost draft after a session timeout etc. — see
            lib/useUnsavedFormDraft.ts and the README's "Unsaved changes
            safety net" section. */}
        <UnsavedChangesBanner />
        <span className="text-[13px] font-bold text-ink -mb-1">Content</span>

        <div>
          <FieldLabel htmlFor="title" hint="Shown as the service's heading on the Services page and its card on the homepage.">
            Title
          </FieldLabel>
          <input id="title" name="title" required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
        </div>
        <div>
          <FieldLabel htmlFor="summary" hint="One short sentence — shown on the homepage service card, the Services listing, and search engine results. Kept plain text (no bold/color) since it's also used for those.">
            Summary
          </FieldLabel>
          <input id="summary" name="summary" required value={summary} onChange={(e) => setSummary(e.target.value)} className={inputCls} />
        </div>

        <RichTextField
          name="description"
          label="Description"
          hint="Longer copy shown on the service's own detail page. Use the toolbar for bold, italic, underline, size and color."
          defaultValueHtml={defaults.description}
          rows={4}
          onHtmlChange={setDescriptionHtml}
        />

        <div className="border-t border-slate-100 pt-4 mt-1">
          <h2 className="text-[13.5px] font-bold text-ink mb-3">Answer Engine Sections</h2>
          <p className="text-[12.5px] text-slate-500 mb-4">
            These answer the questions AI answer engines and voice search look for (Google AI Overviews, ChatGPT,
            Copilot, Gemini, Perplexity) — fill in what applies, leave the rest blank.
          </p>

          <div className="flex flex-col gap-4">
            <RichTextField
              name="whatIsIt"
              label="What is it?"
              hint="A plain-language definition of this service — the direct answer to 'What is it?'"
              defaultValueHtml={defaults.whatIsIt}
              rows={2}
            />
            <RichTextField
              name="whoNeedsIt"
              label="Who needs it?"
              hint="Who this service is for — the typical client profile."
              defaultValueHtml={defaults.whoNeedsIt}
              rows={2}
            />
            <div>
              <FieldLabel htmlFor="benefits" hint="One benefit per line — shown as a bullet list.">
                Benefits (one per line)
              </FieldLabel>
              <textarea
                id="benefits"
                name="benefits"
                rows={4}
                defaultValue={defaults.benefits}
                placeholder={"Reduced audit risk\nFaster year-end close\n..."}
                className={inputCls}
              />
            </div>
            <div>
              <FieldLabel htmlFor="process" hint="One step per line, in order — shown as a numbered list.">
                Our process (one step per line)
              </FieldLabel>
              <textarea
                id="process"
                name="process"
                rows={4}
                defaultValue={defaults.process}
                placeholder={"Initial consultation\nScoping & engagement letter\n..."}
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel htmlFor="costFactors" hint="What drives the fee for this service — shown as plain text, not a price list.">
                  Cost factors
                </FieldLabel>
                <textarea id="costFactors" name="costFactors" rows={2} defaultValue={defaults.costFactors} className={inputCls} />
              </div>
              <div>
                <FieldLabel htmlFor="timeline" hint="Typical engagement duration, e.g. '2–4 weeks'.">
                  Timeline
                </FieldLabel>
                <textarea id="timeline" name="timeline" rows={2} defaultValue={defaults.timeline} className={inputCls} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <PreviewPortal>
        <div className="border border-line bg-paper">
          {defaults.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={defaults.imageUrl}
              alt=""
              style={{ objectPosition: defaults.imagePosition || "center" }}
              className="w-full h-28 object-cover"
            />
          ) : null}
          <div className="p-4">
            <div className="font-serif text-[15px] text-ink font-semibold">{title || "Service title"}</div>
            <p className="text-[12.5px] text-muted leading-relaxed mt-1.5">{summary || "One-line summary…"}</p>
            <div
              className="text-[12px] text-muted leading-relaxed mt-3 pt-3 border-t border-line"
              dangerouslySetInnerHTML={{ __html: sanitizeRichText(descriptionHtml) || "Detail page description preview…" }}
            />
          </div>
        </div>
        <p className="text-[11.5px] text-slate-400 mt-2">
          Approximate — the card style above matches the homepage/Services list; the text below the divider is
          how the description looks on the service's own detail page.
        </p>
      </PreviewPortal>
    </>
  );
}
