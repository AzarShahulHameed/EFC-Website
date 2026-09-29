"use client";

import { useState } from "react";
import FieldLabel from "@/components/admin/FieldLabel";
import { PreviewPortal } from "@/components/admin/PreviewPanel";
import ColorField from "@/components/admin/ColorField";

const selectCls = "w-full border border-line px-3.5 py-2.5 text-[14px] bg-white focus:outline-none focus:border-ink disabled:opacity-50 disabled:cursor-not-allowed";

// Alignment / Size / Grayscale / Motion for the homepage "Trusted By" strip
// — as one client piece with a live preview against real uploaded logos.
// Renders bare fields, no <form> of its own, so it drops into the existing
// Display Settings form.
export default function ClientLogosDisplayForm({
  logos,
  defaultAlignment,
  defaultSize,
  defaultGrayscale,
  defaultMotion,
  defaultSpeed,
  defaultPauseOnHover,
  defaultShowOnServicesPage,
  defaultShowOnServiceDetailPage,
  defaultShowOnSubServicePage,
  defaultBandColor,
}: {
  logos: { name: string; imageUrl: string }[];
  defaultAlignment: "left" | "center" | "spread";
  defaultSize: "sm" | "md" | "lg";
  defaultGrayscale: boolean;
  defaultMotion: "scroll" | "static";
  defaultSpeed: "slow" | "normal" | "fast";
  defaultPauseOnHover: boolean;
  defaultShowOnServicesPage: boolean;
  defaultShowOnServiceDetailPage: boolean;
  defaultShowOnSubServicePage: boolean;
  defaultBandColor?: string;
}) {
  const [alignment, setAlignment] = useState(defaultAlignment);
  const [size, setSize] = useState(defaultSize);
  const [grayscale, setGrayscale] = useState(defaultGrayscale);
  const [motion, setMotion] = useState(defaultMotion);
  const [speed, setSpeed] = useState(defaultSpeed);
  const [pauseOnHover, setPauseOnHover] = useState(defaultPauseOnHover);

  const sizeCls = { sm: "h-6", md: "h-8", lg: "h-11" }[size];
  const isMarquee = motion === "scroll" && logos.length > 1;
  const previewReps = Math.max(Math.ceil(8 / Math.max(logos.length, 1)), 1);
  const previewFilled = Array.from({ length: previewReps }, () => logos).flat();
  const speedMultiplier = { slow: 1.6, normal: 1, fast: 0.6 }[speed];

  return (
    <>
      <div className="flex flex-col gap-4">
        <span className="text-[13px] font-bold text-ink -mb-1">Settings</span>

        <div>
          <FieldLabel htmlFor="motion" hint="Auto-Scrolling works with any number of logos — with only a couple, they're repeated to fill the row before it loops. Static Row lays every logo out once, using Alignment below.">
            Motion
          </FieldLabel>
          <select
            id="motion"
            name="motion"
            value={motion}
            onChange={(e) => setMotion(e.target.value as "scroll" | "static")}
            className={selectCls}
          >
            <option value="scroll">Auto-Scrolling Carousel</option>
            <option value="static">Static Row</option>
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="alignment" hint={motion === "scroll" ? "Only applies in Static Row mode." : "How the logo row is laid out on the homepage. Spread stretches a couple of logos across the full width instead of clustering them in the middle."}>
            Alignment
          </FieldLabel>
          <select
            id="alignment"
            name="alignment"
            value={alignment}
            onChange={(e) => setAlignment(e.target.value as "left" | "center" | "spread")}
            disabled={motion === "scroll"}
            className={selectCls}
          >
            <option value="center">Center</option>
            <option value="left">Left</option>
            <option value="spread">Spread (edge to edge)</option>
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="size" hint="Height of each logo.">Logo Size</FieldLabel>
          <select id="size" name="size" value={size} onChange={(e) => setSize(e.target.value as "sm" | "md" | "lg")} className={selectCls}>
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-[13.5px] text-ink">
          <input type="checkbox" name="grayscale" value="1" checked={grayscale} onChange={(e) => setGrayscale(e.target.checked)} className="w-4 h-4" />
          Show logos in grayscale (color on hover)
        </label>

        <div>
          <FieldLabel htmlFor="speed" hint={motion === "static" ? "Only applies in Auto-Scrolling Carousel mode." : "How fast the logos scroll across."}>
            Scroll Speed
          </FieldLabel>
          <select
            id="speed"
            name="speed"
            value={speed}
            onChange={(e) => setSpeed(e.target.value as "slow" | "normal" | "fast")}
            disabled={motion === "static"}
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
            disabled={motion === "static"}
            className="w-4 h-4 disabled:opacity-50"
          />
          Pause scrolling while a visitor hovers over it
        </label>

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
          <FieldLabel
            htmlFor="bandColor"
            hint="Background color of the shared dark band this strip and the testimonials sit in on the Services list, service detail, and sub-service detail pages. Leave blank to keep the default navy — this doesn't affect the homepage."
          >
            Section Background Color (Services / Detail Pages)
          </FieldLabel>
          <ColorField id="bandColor" name="bandColor" defaultValue={defaultBandColor ?? ""} allowEmpty emptyPlaceholderColor="#0A1B33" />
        </div>
      </div>

      <PreviewPortal>
        <div className="bg-navy rounded-[var(--radius)] p-6">
          <div className="text-center text-[10.5px] tracking-[0.14em] text-slate-400 uppercase mb-4">Trusted By</div>
          {logos.length === 0 ? (
            <div className="text-[12px] text-slate-500 text-center py-6">Upload logos below to see them here.</div>
          ) : isMarquee ? (
            <div className={pauseOnHover ? "logos-marquee overflow-hidden" : "logos-marquee-nohover overflow-hidden"}>
              <div
                className="logos-marquee-track flex items-center gap-x-8 w-max"
                style={{ animationDuration: `${Math.max(logos.length * 4, 16) * speedMultiplier}s` }}
              >
                {[...previewFilled, ...previewFilled].map((l, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={l.imageUrl}
                    alt=""
                    className={`object-contain shrink-0 ${sizeCls} ${grayscale ? "grayscale opacity-70" : ""}`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div
              className={`flex flex-wrap items-center gap-x-8 gap-y-4 ${
                alignment === "left" ? "justify-start" : alignment === "spread" ? "justify-between" : "justify-center"
              }`}
            >
              {logos.map((l, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={l.imageUrl}
                  alt=""
                  className={`object-contain ${sizeCls} ${grayscale ? "grayscale opacity-70" : ""}`}
                />
              ))}
            </div>
          )}
        </div>
        {motion === "scroll" && logos.length === 1 ? (
          <p className="text-[11.5px] text-slate-400 mt-2">
            With a single logo the carousel just shows it centered — add more for it to actually scroll.
          </p>
        ) : null}
      </PreviewPortal>
    </>
  );
}
