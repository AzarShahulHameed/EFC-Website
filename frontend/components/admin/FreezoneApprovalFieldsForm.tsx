"use client";

import { useState } from "react";
import FieldLabel from "@/components/admin/FieldLabel";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { PreviewPortal } from "@/components/admin/PreviewPanel";
import FreezoneCarousel from "@/components/site/FreezoneCarousel";

const inputCls = "w-full border border-line px-3.5 py-2.5 text-[14px] focus:outline-none focus:border-ink";

type Defaults = {
  badge?: string;
  headline?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  imageUrl?: string;
  imagePosition?: string;
  videoUrl?: string;
  mediaPosition?: string;
};

// Badge / headline / body / CTA / photo-or-video / media position — one
// approval's content, as bare inputs (no <form> of its own) with a live
// preview rendered through the real FreezoneCarousel component, so what the
// admin sees here is exactly what ships on the homepage. Drops into both
// the "Add Approval" and "Edit Approval" forms.
export default function FreezoneApprovalFieldsForm({ defaults = {} }: { defaults?: Defaults }) {
  const [badge, setBadge] = useState(defaults.badge ?? "Freezone Approved");
  const [headline, setHeadline] = useState(defaults.headline ?? "");
  const [body, setBody] = useState(defaults.body ?? "");
  const [ctaLabel, setCtaLabel] = useState(defaults.ctaLabel ?? "Learn more");
  const [ctaHref, setCtaHref] = useState(defaults.ctaHref ?? "/about");
  const [imagePosition, setImagePosition] = useState(defaults.imagePosition ?? "center");
  const [mediaPosition, setMediaPosition] = useState<"left" | "right">(
    defaults.mediaPosition === "left" ? "left" : "right",
  );
  const [imagePreview, setImagePreview] = useState<string | undefined>(defaults.imageUrl);
  const [videoPreview, setVideoPreview] = useState<string | undefined>(defaults.videoUrl);
  const [videoRemoved, setVideoRemoved] = useState(false);

  function onVideoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setVideoPreview(URL.createObjectURL(file));
      setVideoRemoved(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        <span className="text-[13px] font-bold text-ink -mb-1">Content</span>

        {defaults.videoUrl ? <input type="hidden" name="existingVideoUrl" value={defaults.videoUrl} /> : null}

        <div>
          <FieldLabel htmlFor="badge" hint="Small label above the headline, e.g. 'Freezone Approved' or 'Strategic Partnership'.">
            Badge Text
          </FieldLabel>
          <input id="badge" name="badge" value={badge} onChange={(e) => setBadge(e.target.value)} className={inputCls} />
        </div>
        <div>
          <FieldLabel htmlFor="headline" hint="e.g. 'Approved to operate within DMCC'.">Headline</FieldLabel>
          <input id="headline" name="headline" required value={headline} onChange={(e) => setHeadline(e.target.value)} className={inputCls} />
        </div>
        <div>
          <FieldLabel htmlFor="body" hint="A sentence or two of supporting detail.">Body Text</FieldLabel>
          <textarea id="body" name="body" rows={3} value={body} onChange={(e) => setBody(e.target.value)} className={inputCls} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="ctaLabel" hint="Text on the button, e.g. 'Learn more'.">Link Text</FieldLabel>
            <input id="ctaLabel" name="ctaLabel" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} className={inputCls} />
          </div>
          <div>
            <FieldLabel htmlFor="ctaHref" hint="A page on this site (e.g. /about) or a full https:// URL.">Link URL</FieldLabel>
            <input id="ctaHref" name="ctaHref" value={ctaHref} onChange={(e) => setCtaHref(e.target.value)} className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ImageUploadField
            id="image"
            label="Photo"
            hint="Optional photo (certificate, premises, partner logo panel). Uploaded to Cloudinary."
            fileFieldName="image"
            existingUrlFieldName="existingImageUrl"
            currentUrl={defaults.imageUrl}
            onFileChange={(file) => setImagePreview(file ? URL.createObjectURL(file) : imagePreview)}
            onRemoveChange={(removed) => setImagePreview(removed ? undefined : defaults.imageUrl)}
          />
          <div>
            <FieldLabel htmlFor="imagePosition" hint="Which part of the photo stays visible when cropped.">Photo Position</FieldLabel>
            <select id="imagePosition" name="imagePosition" value={imagePosition} onChange={(e) => setImagePosition(e.target.value)} className={`${inputCls} bg-white`}>
              <option value="top">Top</option>
              <option value="center">Center</option>
              <option value="bottom">Bottom</option>
            </select>
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="video" hint="Optional — a short looping muted video, shown instead of the photo above.">Video</FieldLabel>
          <input id="video" name="video" type="file" accept="video/*" onChange={onVideoFile} className="w-full text-[13.5px]" />
          {defaults.videoUrl ? (
            <label className="flex items-center gap-2 text-[12.5px] text-slate-600 mt-2">
              <input
                type="checkbox"
                name="removeVideo"
                value="1"
                checked={videoRemoved}
                onChange={(e) => {
                  setVideoRemoved(e.target.checked);
                  setVideoPreview(e.target.checked ? undefined : defaults.videoUrl);
                }}
              />
              Remove video
            </label>
          ) : null}
        </div>

        <div>
          <FieldLabel htmlFor="mediaPosition" hint="Which side of the banner the photo/video sits on.">Media Position</FieldLabel>
          <select
            id="mediaPosition"
            name="mediaPosition"
            value={mediaPosition}
            onChange={(e) => setMediaPosition(e.target.value === "left" ? "left" : "right")}
            className={`${inputCls} bg-white max-w-xs`}
          >
            <option value="right">Right</option>
            <option value="left">Left</option>
          </select>
        </div>
      </div>

      <PreviewPortal>
        <div className="bg-paper-2 rounded-[var(--radius)]">
          <FreezoneCarousel
            approvals={[
              {
                id: "preview",
                badge,
                headline: headline || "Headline preview",
                body: body || "Body text preview.",
                ctaLabel,
                ctaHref,
                imageUrl: videoPreview ? undefined : imagePreview,
                imagePosition,
                videoUrl: videoRemoved ? undefined : videoPreview,
                mediaPosition,
                order: 0,
                isActive: true,
              },
            ]}
            display={{ enabled: true, autoRotateSeconds: 7, pauseOnHover: true }}
            lang="en"
          />
        </div>
      </PreviewPortal>
    </>
  );
}
