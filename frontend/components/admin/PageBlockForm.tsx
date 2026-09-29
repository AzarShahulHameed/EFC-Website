"use client";

import { useState } from "react";
import FieldLabel from "@/components/admin/FieldLabel";
import RichTextField from "@/components/admin/RichTextField";
import AnimationPicker from "@/components/admin/AnimationPicker";
import ImageUploadField from "@/components/admin/ImageUploadField";
import DraggableImageRowsField from "@/components/admin/DraggableImageRowsField";

const inputCls = "w-full border border-line px-3.5 py-2.5 text-[14px] focus:outline-none focus:border-ink";

export const BLOCK_TYPES: { value: string; label: string; hint: string }[] = [
  { value: "richText", label: "Rich Text", hint: "A block of formatted text — headings, bold/italic, links." },
  { value: "image", label: "Photo", hint: "A single photo, optionally linking somewhere when clicked." },
  { value: "video", label: "Video", hint: "A single video with playback controls." },
  { value: "imageText", label: "Photo + Text", hint: "A headline/body next to a photo or video, either side." },
  { value: "cta", label: "Call-to-Action Banner", hint: "A headline and button, e.g. 'Talk to us today'." },
  { value: "quote", label: "Quote", hint: "A large pull-quote with an attribution line." },
  { value: "gallery", label: "Photo Gallery", hint: "A grid of up to 8 photos." },
  { value: "spacer", label: "Spacer", hint: "Empty vertical space, to separate two blocks." },
  {
    value: "faq",
    label: "FAQ (SEO/AEO)",
    hint: "A list of questions and answers — shown as an accordion, and marked up so search engines and AI answer engines (ChatGPT, Google AI Overviews, etc.) can quote it directly.",
  },
];

type FaqItem = { question: string; answer: string };

// A small, self-contained repeatable-rows field for FAQ question/answer
// pairs — deliberately simpler than DraggableImageRowsField (no drag
// handle, no image upload): order rarely matters for an FAQ list the way
// it does for a photo gallery, so plain Up/Down + Remove buttons keep this
// lightweight. Submits as indexed fields (faq_question_0, faq_answer_0, …)
// which the server action re-assembles — same indexed-field convention the
// rest of this form's array-shaped fields already use.
function FaqItemsField({ initialItems }: { initialItems: FaqItem[] }) {
  const [items, setItems] = useState<FaqItem[]>(initialItems.length > 0 ? initialItems : [{ question: "", answer: "" }]);

  function update(i: number, key: keyof FaqItem, value: string) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [key]: value } : it)));
  }
  function move(i: number, dir: -1 | 1) {
    setItems((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }
  function remove(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="faqCount" value={items.length} />
      {items.map((item, i) => (
        <div key={i} className="border border-line p-4 flex flex-col gap-2.5 bg-paper-2">
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Question {i + 1}</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="text-[12px] text-slate-400 hover:text-ink disabled:opacity-30 px-1.5">
                &uarr;
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="text-[12px] text-slate-400 hover:text-ink disabled:opacity-30 px-1.5">
                &darr;
              </button>
              <button type="button" onClick={() => remove(i)} className="text-[12px] text-red-500 hover:text-red-700 px-1.5">
                &times; Remove
              </button>
            </div>
          </div>
          <input
            name={`faq_question_${i}`}
            placeholder="Question, e.g. 'How long does an FTA audit take?'"
            defaultValue={item.question}
            onChange={(e) => update(i, "question", e.target.value)}
            className={inputCls}
          />
          <textarea
            name={`faq_answer_${i}`}
            placeholder="Answer — written as a clear, complete, standalone sentence (this is what gets quoted verbatim by search/AI tools)."
            rows={2}
            defaultValue={item.answer}
            onChange={(e) => update(i, "answer", e.target.value)}
            className={inputCls}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={() => setItems((prev) => [...prev, { question: "", answer: "" }])}
        className="self-start text-[13px] font-semibold text-ink border-b border-ink"
      >
        + Add a question
      </button>
    </div>
  );
}

type Block = {
  id: string;
  page: string;
  type: string;
  content: Record<string, any>;
  animation?: string;
  isActive?: boolean;
};

export default function PageBlockForm({
  action,
  page,
  block,
  mode,
  onCancel,
}: {
  action: (formData: FormData) => void;
  page: string;
  block?: Block;
  mode: "create" | "edit";
  onCancel?: () => void;
}) {
  const [type, setType] = useState(block?.type || "richText");
  const c = block?.content || {};

  return (
    <form action={action} encType="multipart/form-data" className="bg-white border border-line p-6 flex flex-col gap-4">
      <input type="hidden" name="page" value={page} />
      <input type="hidden" name="type" value={type} />

      {mode === "create" ? (
        <div>
          <FieldLabel htmlFor="pb-type" hint="What kind of content to add.">Block Type</FieldLabel>
          <select id="pb-type" value={type} onChange={(e) => setType(e.target.value)} className={`${inputCls} bg-white max-w-sm`}>
            {BLOCK_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <p className="text-[12px] text-slate-400 mt-1.5">{BLOCK_TYPES.find((t) => t.value === type)?.hint}</p>
        </div>
      ) : null}

      {type === "richText" ? (
        <RichTextField name="html" label="Content" defaultValueHtml={c.html} rows={5} />
      ) : null}

      {type === "image" ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <ImageUploadField
              id="pb-image"
              label="Photo"
              hint="Uploaded to Cloudinary."
              fileFieldName="image"
              existingUrlFieldName="existingUrl"
              currentUrl={c.url}
            />
            <div>
              <FieldLabel htmlFor="pb-position" hint="Which part of the photo stays visible when cropped.">Position</FieldLabel>
              <select id="pb-position" name="position" defaultValue={c.position || "center"} className={`${inputCls} bg-white`}>
                <option value="top">Top</option>
                <option value="center">Center</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="pb-caption" hint="Optional line shown under the photo.">Caption</FieldLabel>
            <input id="pb-caption" name="caption" defaultValue={c.caption} className={inputCls} />
          </div>
          <div>
            <FieldLabel htmlFor="pb-link" hint="Optional — where clicking the photo goes. A page on this site or a full https:// URL.">Link (optional)</FieldLabel>
            <input id="pb-link" name="link" defaultValue={c.link} className={inputCls} />
          </div>
        </>
      ) : null}

      {type === "video" ? (
        <>
          {c.url ? <input type="hidden" name="existingUrl" value={c.url} /> : null}
          <div>
            <FieldLabel htmlFor="pb-video" hint="Uploaded to Cloudinary. Shown with playback controls (not autoplaying background video).">Video</FieldLabel>
            <input id="pb-video" name="video" type="file" accept="video/*" className="w-full text-[13.5px]" />
          </div>
          <ImageUploadField
            id="pb-poster"
            label="Poster Image"
            hint="Optional — the still image shown before the video plays."
            fileFieldName="poster"
            existingUrlFieldName="existingPosterUrl"
            currentUrl={c.posterUrl}
          />
        </>
      ) : null}

      {type === "imageText" ? (
        <>
          {c.videoUrl ? <input type="hidden" name="existingVideoUrl" value={c.videoUrl} /> : null}
          <div>
            <FieldLabel htmlFor="pb-eyebrow" hint="Small label above the headline.">Eyebrow (optional)</FieldLabel>
            <input id="pb-eyebrow" name="eyebrow" defaultValue={c.eyebrow} className={inputCls} />
          </div>
          <div>
            <FieldLabel htmlFor="pb-headline" hint="The heading for this block.">Headline</FieldLabel>
            <input id="pb-headline" name="headline" defaultValue={c.headline} className={inputCls} />
          </div>
          <RichTextField name="body" label="Body Text" defaultValueHtml={c.body} rows={4} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="pb-linkLabel" hint="Text on the link, e.g. 'Learn more'.">Link Text (optional)</FieldLabel>
              <input id="pb-linkLabel" name="linkLabel" defaultValue={c.linkLabel} className={inputCls} />
            </div>
            <div>
              <FieldLabel htmlFor="pb-link" hint="A page on this site or a full https:// URL.">Link URL</FieldLabel>
              <input id="pb-link" name="link" defaultValue={c.link} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <ImageUploadField
              id="pb-image"
              label="Photo"
              hint="Uploaded to Cloudinary. Ignored if a video is also uploaded below."
              fileFieldName="image"
              existingUrlFieldName="existingImageUrl"
              currentUrl={c.imageUrl}
            />
            <div>
              <FieldLabel htmlFor="pb-video" hint="Optional — takes priority over the photo.">Video (optional)</FieldLabel>
              <input id="pb-video" name="video" type="file" accept="video/*" className="w-full text-[13.5px]" />
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="pb-mediaPosition" hint="Which side the photo/video sits on.">Media Position</FieldLabel>
            <select id="pb-mediaPosition" name="mediaPosition" defaultValue={c.mediaPosition || "right"} className={`${inputCls} bg-white max-w-xs`}>
              <option value="right">Right</option>
              <option value="left">Left</option>
            </select>
          </div>
        </>
      ) : null}

      {type === "cta" ? (
        <>
          <div>
            <FieldLabel htmlFor="pb-headline" hint="e.g. 'Speak with a partner this week.'">Headline</FieldLabel>
            <input id="pb-headline" name="headline" defaultValue={c.headline} className={inputCls} />
          </div>
          <div>
            <FieldLabel htmlFor="pb-body" hint="Optional supporting line.">Body Text (optional)</FieldLabel>
            <textarea id="pb-body" name="body" rows={2} defaultValue={c.body} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="pb-ctaLabel" hint="Text on the button.">Button Text</FieldLabel>
              <input id="pb-ctaLabel" name="ctaLabel" defaultValue={c.ctaLabel} className={inputCls} />
            </div>
            <div>
              <FieldLabel htmlFor="pb-link" hint="A page on this site or a full https:// URL.">Button Link</FieldLabel>
              <input id="pb-link" name="link" defaultValue={c.link} className={inputCls} />
            </div>
          </div>
        </>
      ) : null}

      {type === "quote" ? (
        <>
          <div>
            <FieldLabel htmlFor="pb-quote" hint="The quote text itself (quotation marks added automatically).">Quote</FieldLabel>
            <textarea id="pb-quote" name="quote" rows={3} defaultValue={c.quote} className={inputCls} />
          </div>
          <div>
            <FieldLabel htmlFor="pb-attribution" hint="Who said it, e.g. 'Managing Partner, EFC'.">Attribution (optional)</FieldLabel>
            <input id="pb-attribution" name="attribution" defaultValue={c.attribution} className={inputCls} />
          </div>
        </>
      ) : null}

      {type === "gallery" ? (
        <div className="flex flex-col gap-3">
          <p className="text-[12.5px] text-slate-400">
            Up to 8 photos. Drag the grip to reorder, or use &times; to remove one.
          </p>
          <DraggableImageRowsField
            prefix="gallery"
            max={8}
            initialRows={Array.isArray(c.images) ? c.images : []}
            emptyRow={{ url: "", caption: "" }}
            imageField="url"
            imageFileFieldSuffix="image"
            imageLabel="Photo"
            addLabel="Add a photo"
            renderFields={(img, name) => (
              <input name={name("caption")} placeholder="Caption (optional)" defaultValue={img.caption} className={inputCls} />
            )}
          />
        </div>
      ) : null}

      {type === "faq" ? (
        <>
          <div>
            <FieldLabel htmlFor="pb-headline" hint="Optional heading shown above the questions, e.g. 'Frequently Asked Questions'.">Headline (optional)</FieldLabel>
            <input id="pb-headline" name="headline" defaultValue={c.headline} className={inputCls} />
          </div>
          <FaqItemsField initialItems={Array.isArray(c.items) ? c.items : []} />
        </>
      ) : null}

      {type === "spacer" ? (
        <div>
          <FieldLabel htmlFor="pb-height" hint="How tall the empty gap is, in pixels.">Height (px)</FieldLabel>
          <input id="pb-height" name="height" type="number" min={8} max={400} defaultValue={c.height ?? 48} className={`${inputCls} max-w-xs`} />
        </div>
      ) : null}

      <AnimationPicker name="animation" defaultValue={block?.animation || "fade-up"} hint="How this block animates into view as visitors scroll to it." />

      {mode === "edit" ? (
        <label className="flex items-center gap-2.5 text-[13.5px] font-medium text-ink">
          <input type="checkbox" name="isActive" value="1" defaultChecked={block?.isActive !== false} className="w-4 h-4" />
          Visible on the live site
        </label>
      ) : null}

      <div className="flex items-center gap-3">
        <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[13.5px] px-5 py-2.5 rounded-[var(--radius)]">
          {mode === "create" ? "Add Block" : "Save Changes"}
        </button>
        {onCancel ? (
          <button type="button" onClick={onCancel} className="text-[13.5px] font-semibold text-slate-500 px-3 py-2.5">
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
