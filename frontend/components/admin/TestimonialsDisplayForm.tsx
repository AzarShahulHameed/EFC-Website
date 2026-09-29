"use client";

import { useState } from "react";
import FieldLabel from "@/components/admin/FieldLabel";
import { PreviewPortal } from "@/components/admin/PreviewPanel";
import TestimonialsSection from "@/components/site/TestimonialsSection";
import ColorField from "@/components/admin/ColorField";

const selectCls = "w-full border border-line px-3.5 py-2.5 text-[14px] bg-white focus:outline-none focus:border-ink disabled:opacity-50 disabled:cursor-not-allowed";

type Testimonial = { quote: string; name: string; role: string; photoUrl?: string; rating?: number };

// Layout / Card Size / Auto-Advance Speed / Pause-on-Hover for the
// testimonials section, plus which pages beyond the homepage also show it
// — the same pattern as ClientLogosDisplayForm, with a live preview
// against the real saved testimonials so a "carousel" choice actually
// shows the rotation, not just a static mock-up.
export default function TestimonialsDisplayForm({
  testimonials,
  defaultLayout,
  defaultCardSize,
  defaultAutoAdvanceSpeed,
  defaultPauseOnHover,
  defaultShowOnServicesPage,
  defaultShowOnServiceDetailPage,
  defaultShowOnSubServicePage,
  defaultGoogleReviewUrl,
  defaultGoogleRating,
  defaultGoogleReviewCount,
  defaultShowGoogleBadge,
  defaultShowOnContactPage,
  defaultSectionBackgroundColor,
}: {
  testimonials: Testimonial[];
  defaultLayout: "grid" | "carousel" | "single";
  defaultCardSize: "sm" | "md" | "lg";
  defaultAutoAdvanceSpeed: "slow" | "normal" | "fast";
  defaultPauseOnHover: boolean;
  defaultShowOnServicesPage: boolean;
  defaultShowOnServiceDetailPage: boolean;
  defaultShowOnSubServicePage: boolean;
  defaultGoogleReviewUrl?: string;
  defaultGoogleRating?: number;
  defaultGoogleReviewCount?: number;
  defaultShowGoogleBadge: boolean;
  defaultShowOnContactPage: boolean;
  defaultSectionBackgroundColor?: string;
}) {
  const [layout, setLayout] = useState(defaultLayout);
  const [cardSize, setCardSize] = useState(defaultCardSize);
  const [autoAdvanceSpeed, setAutoAdvanceSpeed] = useState(defaultAutoAdvanceSpeed);
  const [pauseOnHover, setPauseOnHover] = useState(defaultPauseOnHover);
  const [googleReviewUrl, setGoogleReviewUrl] = useState(defaultGoogleReviewUrl ?? "");
  const [googleRating, setGoogleRating] = useState(defaultGoogleRating?.toString() ?? "");
  const [googleReviewCount, setGoogleReviewCount] = useState(defaultGoogleReviewCount?.toString() ?? "");
  const [showGoogleBadge, setShowGoogleBadge] = useState(defaultShowGoogleBadge);

  return (
    <>
      <div className="flex flex-col gap-4">
        <span className="text-[13px] font-bold text-ink -mb-1">Settings</span>

        <div>
          <FieldLabel htmlFor="layout" hint="Grid shows every testimonial at once, in columns — fine with a handful. Carousel rotates through groups of three, one group at a time, sliding horizontally. Single shows one testimonial at a time with a gentle crossfade + slide-up animation between them — a distinct, one-by-one feel rather than a group carousel or a continuously-scrolling strip.">
            Layout
          </FieldLabel>
          <select id="layout" name="layout" value={layout} onChange={(e) => setLayout(e.target.value as "grid" | "carousel" | "single")} className={selectCls}>
            <option value="grid">Grid (all at once)</option>
            <option value="carousel">Carousel (groups of 3, auto-rotating)</option>
            <option value="single">Single, one by one (auto-rotating)</option>
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="cardSize" hint="Text size and padding of each testimonial card.">Card Size</FieldLabel>
          <select id="cardSize" name="cardSize" value={cardSize} onChange={(e) => setCardSize(e.target.value as "sm" | "md" | "lg")} className={selectCls}>
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="autoAdvanceSpeed" hint={layout === "grid" ? "Only applies in Carousel/Single layout." : "How often it advances to the next testimonial."}>
            Auto-Advance Speed
          </FieldLabel>
          <select
            id="autoAdvanceSpeed"
            name="autoAdvanceSpeed"
            value={autoAdvanceSpeed}
            onChange={(e) => setAutoAdvanceSpeed(e.target.value as "slow" | "normal" | "fast")}
            disabled={layout === "grid"}
            className={selectCls}
          >
            <option value="slow">Slow</option>
            <option value="normal">Normal</option>
            <option value="fast">Fast</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-[13.5px] text-ink">
          <input
            type="checkbox"
            name="pauseOnHover"
            value="1"
            checked={pauseOnHover}
            onChange={(e) => setPauseOnHover(e.target.checked)}
            disabled={layout === "grid"}
            className="w-4 h-4 disabled:opacity-50"
          />
          Pause rotation while a visitor hovers over it
        </label>

        <div className="border-t border-line pt-4 mt-1">
          <FieldLabel
            htmlFor="sectionBackgroundColor"
            hint="Background of the homepage's own testimonials section (the one with the 'Client Perspectives' eyebrow) — not the shared band on the Services/detail pages, which has its own color under Client Logos. Leave blank to keep the original navy. The heading text color adjusts automatically to stay readable against whatever you pick."
          >
            Section Background Color (Home Page)
          </FieldLabel>
          <ColorField
            id="sectionBackgroundColor"
            name="sectionBackgroundColor"
            defaultValue={defaultSectionBackgroundColor ?? ""}
            allowEmpty
            emptyPlaceholderColor="#0A1B33"
          />
        </div>

        <div className="border-t border-line pt-4 mt-1">
          <span className="text-[13px] font-bold text-ink block mb-2.5">Also show on</span>
          <p className="text-[12.5px] text-slate-500 mb-3">
            The homepage&apos;s own showing is controlled separately, from its own Section Visibility settings.
          </p>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-[13.5px] text-ink">
              <input type="checkbox" name="showOnServicesPage" value="1" defaultChecked={defaultShowOnServicesPage} className="w-4 h-4" />
              Services list page
            </label>
            <label className="flex items-center gap-2 text-[13.5px] text-ink">
              <input type="checkbox" name="showOnServiceDetailPage" value="1" defaultChecked={defaultShowOnServiceDetailPage} className="w-4 h-4" />
              Every service&apos;s detail page
            </label>
            <label className="flex items-center gap-2 text-[13.5px] text-ink">
              <input type="checkbox" name="showOnSubServicePage" value="1" defaultChecked={defaultShowOnSubServicePage} className="w-4 h-4" />
              Every sub-service page
            </label>
          </div>
        </div>

        <div className="border-t border-line pt-4 mt-1">
          <span className="text-[13px] font-bold text-ink block mb-2.5">Google Reviews</span>
          <p className="text-[12.5px] text-slate-500 mb-3">
            Every testimonial card already shows a 5-star row and a small Google mark. Add your real Google review
            link here to make each card clickable through to it, and to power the standalone rating badge below.
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <FieldLabel htmlFor="googleReviewUrl" hint="Your Google Business Profile's review link (Google Maps → your listing → Reviews → Share → Write a review, or the same link visitors use to leave one).">
                Google review link
              </FieldLabel>
              <input
                id="googleReviewUrl"
                name="googleReviewUrl"
                type="url"
                value={googleReviewUrl}
                onChange={(e) => setGoogleReviewUrl(e.target.value)}
                placeholder="https://g.page/r/.../review"
                className="w-full border border-line px-3.5 py-2.5 text-[14px] focus:outline-none focus:border-ink"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel htmlFor="googleRating" hint="Your overall Google rating, e.g. 4.9.">Overall rating</FieldLabel>
                <input
                  id="googleRating"
                  name="googleRating"
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={googleRating}
                  onChange={(e) => setGoogleRating(e.target.value)}
                  className="w-full border border-line px-3.5 py-2.5 text-[14px] focus:outline-none focus:border-ink"
                />
              </div>
              <div>
                <FieldLabel htmlFor="googleReviewCount" hint="Total number of Google reviews.">Review count</FieldLabel>
                <input
                  id="googleReviewCount"
                  name="googleReviewCount"
                  type="number"
                  min="0"
                  value={googleReviewCount}
                  onChange={(e) => setGoogleReviewCount(e.target.value)}
                  className="w-full border border-line px-3.5 py-2.5 text-[14px] focus:outline-none focus:border-ink"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 text-[13.5px] text-ink">
              <input
                type="checkbox"
                name="showGoogleBadge"
                value="1"
                checked={showGoogleBadge}
                onChange={(e) => setShowGoogleBadge(e.target.checked)}
                className="w-4 h-4"
              />
              Show the rating badge above the testimonial cards wherever they run
            </label>
            <label className="flex items-center gap-2 text-[13.5px] text-ink">
              <input type="checkbox" name="showOnContactPage" value="1" defaultChecked={defaultShowOnContactPage} className="w-4 h-4" />
              Also show the rating badge on the Contact page
            </label>
          </div>
        </div>
      </div>

      <PreviewPortal>
        <div className="bg-navy rounded-[var(--radius)] p-6">
          {testimonials.length === 0 ? (
            <div className="text-[12px] text-slate-500 text-center py-6">Add testimonials below to see them here.</div>
          ) : (
            <TestimonialsSection
              testimonials={testimonials}
              display={{
                layout,
                cardSize,
                autoAdvanceSpeed,
                pauseOnHover,
                showOnServicesPage: false,
                showOnServiceDetailPage: false,
                showOnSubServicePage: false,
                googleReviewUrl: googleReviewUrl || undefined,
                googleRating: googleRating ? Number(googleRating) : undefined,
                googleReviewCount: googleReviewCount ? Number(googleReviewCount) : undefined,
                showGoogleBadge,
                showOnContactPage: false,
              }}
            />
          )}
        </div>
      </PreviewPortal>
    </>
  );
}
