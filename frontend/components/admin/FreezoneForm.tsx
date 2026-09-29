"use client";

import { useState } from "react";
import FieldLabel from "@/components/admin/FieldLabel";
import ImageUploadField from "@/components/admin/ImageUploadField";

const inputCls = "w-full border border-line px-3.5 py-2.5 text-[14px] focus:outline-none focus:border-ink";

type Freezone = {
  enabled: boolean;
  badge: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl?: string;
  imagePosition?: string;
  videoUrl?: string;
  mediaPosition?: string;
};

// Admin controls for the homepage's optional "Approved Freezone" banner —
// a single, more prominent call-out (its own photo/video, headline and
// link) separate from the small Trust Strip badges. Visibility, and which
// direction it scroll-reveals in, are controlled below by the Section
// Animations form (keyed "freezone"), same mechanism as every other
// homepage section.
export default function FreezoneForm({
  action,
  freezone,
}: {
  action: (formData: FormData) => void;
  freezone: Freezone;
}) {
  const [videoPreview, setVideoPreview] = useState<string | undefined>(freezone.videoUrl);

  function onVideoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setVideoPreview(URL.createObjectURL(file));
  }

  return (
    <form action={action} encType="multipart/form-data" className="bg-white border border-line p-6 max-w-3xl flex flex-col gap-4">
      <div>
        <h2 className="text-[15px] font-bold text-ink mb-1">Approved Freezone Banner</h2>
        <p className="text-[12.5px] text-slate-400">
          A larger, optional homepage call-out — e.g. announcing a freezone license or approval — with its own
          photo/video, headline and link. Separate from the small Trust Strip badges above.
        </p>
      </div>

      <label className="flex items-center gap-2.5 text-[13.5px] font-medium text-ink">
        <input type="checkbox" name="enabled" value="1" defaultChecked={freezone.enabled} className="w-4 h-4" />
        Show this banner on the homepage
      </label>

      {freezone.videoUrl ? <input type="hidden" name="existingVideoUrl" value={freezone.videoUrl} /> : null}

      <div>
        <FieldLabel htmlFor="fz-badge" hint="Small label above the headline, e.g. 'Freezone Approved'.">Badge Text</FieldLabel>
        <input id="fz-badge" name="badge" defaultValue={freezone.badge} className={inputCls} />
      </div>
      <div>
        <FieldLabel htmlFor="fz-headline" hint="e.g. 'Approved to operate within [Freezone Name]'.">Headline</FieldLabel>
        <input id="fz-headline" name="headline" defaultValue={freezone.headline} className={inputCls} />
      </div>
      <div>
        <FieldLabel htmlFor="fz-body" hint="A sentence or two of supporting detail.">Body Text</FieldLabel>
        <textarea id="fz-body" name="body" rows={3} defaultValue={freezone.body} className={inputCls} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="fz-cta-label" hint="Text on the button, e.g. 'Learn more'.">Link Text</FieldLabel>
          <input id="fz-cta-label" name="ctaLabel" defaultValue={freezone.ctaLabel} className={inputCls} />
        </div>
        <div>
          <FieldLabel htmlFor="fz-cta-href" hint="Where the link goes — a page on this site (e.g. /about) or a full https:// URL.">Link URL</FieldLabel>
          <input id="fz-cta-href" name="ctaHref" defaultValue={freezone.ctaHref} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <ImageUploadField
          id="fz-image"
          label="Photo"
          hint="Optional photo (e.g. the license/certificate, or the freezone premises). Uploaded to Cloudinary."
          fileFieldName="image"
          existingUrlFieldName="existingImageUrl"
          currentUrl={freezone.imageUrl}
        />
        <div>
          <FieldLabel htmlFor="fz-imagePosition" hint="Which part of the photo stays visible when cropped.">Photo Position</FieldLabel>
          <select id="fz-imagePosition" name="imagePosition" defaultValue={freezone.imagePosition || "center"} className={`${inputCls} bg-white`}>
            <option value="top">Top</option>
            <option value="center">Center</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="fz-video" hint="Optional — a short looping muted video, shown instead of the photo above.">Video</FieldLabel>
        <input id="fz-video" name="video" type="file" accept="video/*" onChange={onVideoFile} className="w-full text-[13.5px]" />
        {freezone.videoUrl ? (
          <label className="flex items-center gap-2 text-[12.5px] text-slate-600 mt-2">
            <input type="checkbox" name="removeVideo" value="1" onChange={(e) => setVideoPreview(e.target.checked ? undefined : freezone.videoUrl)} />
            Remove video
          </label>
        ) : null}
        {videoPreview ? (
          <video src={videoPreview} className="mt-2 w-48 h-28 object-cover rounded-[var(--radius)] border border-line" muted autoPlay loop playsInline />
        ) : null}
      </div>

      <div>
        <FieldLabel htmlFor="fz-mediaPosition" hint="Which side of the banner the photo/video sits on.">Media Position</FieldLabel>
        <select id="fz-mediaPosition" name="mediaPosition" defaultValue={freezone.mediaPosition || "right"} className={`${inputCls} bg-white max-w-xs`}>
          <option value="right">Right</option>
          <option value="left">Left</option>
        </select>
      </div>

      <button type="submit" className="mt-1 bg-gold text-[#1A1204] font-semibold text-[13.5px] px-5 py-2.5 rounded-[var(--radius)] self-start">
        Save Freezone Banner
      </button>
    </form>
  );
}
