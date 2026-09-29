"use client";

import { useState } from "react";
import FieldLabel from "@/components/admin/FieldLabel";
import { PreviewPortal } from "@/components/admin/PreviewPanel";
import FreezoneCarousel from "@/components/site/FreezoneCarousel";
import type { FreezoneApproval } from "@/lib/api";

const inputCls = "w-full border border-line px-3.5 py-2.5 text-[14px] focus:outline-none focus:border-ink";

// How the freezone/partnership banner rotates: whether it shows at all,
// how many seconds between slides, and whether hovering pauses it — with a
// live preview against the real active approvals, so a two-or-more-entry
// account can actually see the rotation before saving.
export default function FreezoneDisplayForm({
  approvals,
  defaultEnabled,
  defaultAutoRotateSeconds,
  defaultPauseOnHover,
}: {
  approvals: FreezoneApproval[];
  defaultEnabled: boolean;
  defaultAutoRotateSeconds: number;
  defaultPauseOnHover: boolean;
}) {
  const [enabled, setEnabled] = useState(defaultEnabled);
  const [autoRotateSeconds, setAutoRotateSeconds] = useState(defaultAutoRotateSeconds);
  const [pauseOnHover, setPauseOnHover] = useState(defaultPauseOnHover);

  return (
    <>
      <div className="flex flex-col gap-4">
        <span className="text-[13px] font-bold text-ink -mb-1">Settings</span>

        <label className="flex items-center gap-2.5 text-[13.5px] font-medium text-ink">
          <input type="checkbox" name="enabled" value="1" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="w-4 h-4" />
          Show this banner on the homepage
        </label>

        <div>
          <FieldLabel htmlFor="autoRotateSeconds" hint="With more than one active approval, how many seconds each slide stays before advancing to the next.">
            Rotate Every (seconds)
          </FieldLabel>
          <input
            id="autoRotateSeconds"
            name="autoRotateSeconds"
            type="number"
            min={2}
            max={60}
            value={autoRotateSeconds}
            onChange={(e) => setAutoRotateSeconds(Number(e.target.value) || 7)}
            className={`${inputCls} max-w-[10rem]`}
          />
        </div>
        <label className="flex items-center gap-2 text-[13.5px] text-ink">
          <input
            type="checkbox"
            name="pauseOnHover"
            value="1"
            checked={pauseOnHover}
            onChange={(e) => setPauseOnHover(e.target.checked)}
            className="w-4 h-4"
          />
          Pause rotation while a visitor hovers over it
        </label>
      </div>

      <PreviewPortal>
        <div className="bg-paper-2 rounded-[var(--radius)]">
          {approvals.length === 0 ? (
            <div className="text-[12px] text-slate-500 text-center py-10">Add an approval below to see it here.</div>
          ) : (
            <FreezoneCarousel
              approvals={approvals}
              display={{ enabled: true, autoRotateSeconds, pauseOnHover }}
              lang="en"
            />
          )}
        </div>
      </PreviewPortal>
    </>
  );
}
