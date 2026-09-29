"use client";

import { useState } from "react";
import FieldLabel from "@/components/admin/FieldLabel";
import RichTextField from "@/components/admin/RichTextField";
import AnimationPicker from "@/components/admin/AnimationPicker";
import ImageUploadField from "@/components/admin/ImageUploadField";
import UnsavedChangesBanner from "@/components/admin/UnsavedChangesBanner";
import { sanitizeRichText } from "@/lib/rich-text";
import { heroScrim } from "@/lib/hero-scrim";

const inputCls = "w-full border border-line px-3.5 py-2.5 text-[14px] focus:outline-none focus:border-ink";

type Hero = {
  eyebrow: string;
  headline: string;
  body: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  credentialLine: string;
  imageUrl?: string;
  imagePosition?: string;
  videoUrl?: string;
  animation?: string;
  overlayOpacity?: number;
};

export default function HeroForm({ action, hero }: { action: (formData: FormData) => void; hero: Hero }) {
  const [eyebrow, setEyebrow] = useState(hero.eyebrow);
  const [headline, setHeadline] = useState(hero.headline);
  const [bodyHtml, setBodyHtml] = useState(hero.body ?? "");
  const [primaryLabel, setPrimaryLabel] = useState(hero.primaryCta?.label ?? "");
  const [secondaryLabel, setSecondaryLabel] = useState(hero.secondaryCta?.label ?? "");
  const [imagePreview, setImagePreview] = useState<string | undefined>(hero.imageUrl);
  const [videoPreview, setVideoPreview] = useState<string | undefined>(hero.videoUrl);
  const [showPreview, setShowPreview] = useState(true);
  const [overlayOpacity, setOverlayOpacity] = useState(hero.overlayOpacity ?? 55);

  function onVideoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setVideoPreview(URL.createObjectURL(file));
  }

  return (
    <form action={action} className="bg-white border border-line p-6 max-w-6xl">
      {/* Restores a lost draft after a session timeout etc. — see
          lib/useUnsavedFormDraft.ts and the README's "Unsaved changes
          safety net" section. */}
      <UnsavedChangesBanner />
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[15px] font-bold text-ink">Hero Banner</h2>
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink border border-line px-3 py-1.5 rounded-[var(--radius)] hover:border-ink"
          title={showPreview ? "Hide live preview" : "Show live preview"}
        >
          <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M1 10s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            <circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          {showPreview ? "Hide Preview" : "Show Preview"}
        </button>
      </div>

      <div className={`grid gap-6 ${showPreview ? "grid-cols-1 xl:grid-cols-[1fr_420px]" : "grid-cols-1"}`}>
        <div className="flex flex-col gap-4">
          {hero.videoUrl ? <input type="hidden" name="existingVideoUrl" value={hero.videoUrl} /> : null}

          <div className="grid grid-cols-2 gap-4">
            <ImageUploadField
              id="image"
              label="Hero Image"
              hint="Optional — used as the hero's background image (or the video's poster frame while it loads, if you also add a video below). Uploaded to Cloudinary."
              fileFieldName="image"
              existingUrlFieldName="existingImageUrl"
              currentUrl={hero.imageUrl}
              onFileChange={(file) => setImagePreview(file ? URL.createObjectURL(file) : imagePreview)}
              onRemoveChange={(removed) => setImagePreview(removed ? undefined : hero.imageUrl)}
            />
            <div>
              <FieldLabel htmlFor="imagePosition" hint="Which part of the image stays visible when it's cropped to fit the hero panel.">Image Position</FieldLabel>
              <select id="imagePosition" name="imagePosition" defaultValue={hero.imagePosition || "center"} className={`${inputCls} bg-white`}>
                <option value="top">Top</option>
                <option value="center">Center</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>
          </div>

          <div>
            <FieldLabel htmlFor="video" hint="Optional — a short, looping muted background video for a full-bleed animated hero (like the MNC-standard sites). MP4/WebM, ideally under 15MB. Leave empty to use the image above instead.">Hero Background Video</FieldLabel>
            <input id="video" name="video" type="file" accept="video/*" onChange={onVideoFile} className="w-full text-[13.5px]" />
            {hero.videoUrl ? (
              <label className="flex items-center gap-2 text-[12.5px] text-slate-600 mt-2">
                <input type="checkbox" name="removeVideo" value="1" onChange={(e) => setVideoPreview(e.target.checked ? undefined : hero.videoUrl)} />
                Remove video
              </label>
            ) : null}
          </div>

          <div>
            <FieldLabel htmlFor="eyebrow" hint="Small label above the headline.">Eyebrow</FieldLabel>
            <input id="eyebrow" name="eyebrow" value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} className={inputCls} />
          </div>
          <div>
            <FieldLabel htmlFor="headline" hint="The large heading at the top of the homepage.">Headline</FieldLabel>
            <input id="headline" name="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} className={inputCls} />
          </div>

          <RichTextField
            name="body"
            label="Body Text"
            hint="The paragraph under the headline. Use the toolbar for bold, italic, underline, size and color."
            defaultValueHtml={hero.body}
            onHtmlChange={setBodyHtml}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="primaryCtaLabel" hint="Text on the main gold button.">Primary Button Text</FieldLabel>
              <input id="primaryCtaLabel" name="primaryCtaLabel" value={primaryLabel} onChange={(e) => setPrimaryLabel(e.target.value)} className={inputCls} />
            </div>
            <div>
              <FieldLabel htmlFor="primaryCtaHref" hint="Where the main button links to, e.g. /contact">Primary Button Link</FieldLabel>
              <input id="primaryCtaHref" name="primaryCtaHref" defaultValue={hero.primaryCta?.href} className={inputCls} />
            </div>
            <div>
              <FieldLabel htmlFor="secondaryCtaLabel" hint="Text on the outlined second button.">Secondary Button Text</FieldLabel>
              <input id="secondaryCtaLabel" name="secondaryCtaLabel" value={secondaryLabel} onChange={(e) => setSecondaryLabel(e.target.value)} className={inputCls} />
            </div>
            <div>
              <FieldLabel htmlFor="secondaryCtaHref" hint="Where the second button links to, e.g. /services">Secondary Button Link</FieldLabel>
              <input id="secondaryCtaHref" name="secondaryCtaHref" defaultValue={hero.secondaryCta?.href} className={inputCls} />
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="credentialLine" hint="Small line of credentials shown under the buttons.">Credential Line</FieldLabel>
            <input id="credentialLine" name="credentialLine" defaultValue={hero.credentialLine} className={inputCls} />
          </div>

          <AnimationPicker name="animation" defaultValue={hero.animation || "fade-up"} hint="How the hero's text animates in when the homepage loads." />

          <div>
            <FieldLabel
              htmlFor="overlayOpacity"
              hint="How dark the tint over the photo/video is, so the white text stays readable. Lower this if the video/photo looks dull or muddy; raise it if text gets hard to read."
            >
              Overlay Darkness ({overlayOpacity}%)
            </FieldLabel>
            <input
              id="overlayOpacity"
              name="overlayOpacity"
              type="range"
              min={0}
              max={100}
              step={5}
              value={overlayOpacity}
              onChange={(e) => setOverlayOpacity(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <button type="submit" className="mt-2 bg-gold text-[#1A1204] font-semibold text-[13.5px] px-5 py-2.5 rounded-[var(--radius)] self-start">
            Save Hero
          </button>
        </div>

        {showPreview ? (
          <div className="xl:sticky xl:top-6 self-start">
            <div className="text-[11px] font-semibold tracking-[0.1em] text-slate-400 uppercase mb-2">Live Preview</div>
            <div className="relative w-full h-[260px] rounded-[var(--radius)] overflow-hidden bg-navy border border-line">
              {videoPreview ? (
                <video src={videoPreview} className="absolute inset-0 w-full h-full object-cover" muted autoPlay loop playsInline />
              ) : imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : null}
              <div className="absolute inset-0" style={{ background: heroScrim(overlayOpacity) }} />
              <div className="relative z-10 h-full flex flex-col justify-center px-6">
                <div className="text-[10px] font-semibold tracking-[0.14em] text-gold-light uppercase mb-2">
                  {eyebrow || "Eyebrow text"}
                </div>
                <h1 className="font-serif text-xl leading-tight text-white font-semibold max-w-[280px]">
                  {headline || "Headline text"}
                </h1>
                <div
                  className="text-[11.5px] leading-relaxed text-slate-300 max-w-[260px] mt-3"
                  dangerouslySetInnerHTML={{ __html: sanitizeRichText(bodyHtml) || "Body text preview…" }}
                />
                <div className="flex gap-2 mt-4">
                  {primaryLabel ? (
                    <span className="bg-gold text-[#1A1204] font-semibold text-[11px] px-3.5 py-2 rounded-[var(--btn-radius)]">
                      {primaryLabel}
                    </span>
                  ) : null}
                  {secondaryLabel ? (
                    <span className="border border-white/35 text-white font-semibold text-[11px] px-3.5 py-2 rounded-[var(--btn-radius)]">
                      {secondaryLabel}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <p className="text-[11.5px] text-slate-400 mt-2">
              Approximate — the real hero is full-bleed behind the header and runs the selected entrance animation
              on load. Save to see it exactly as visitors will.
            </p>
          </div>
        ) : null}
      </div>
    </form>
  );
}
