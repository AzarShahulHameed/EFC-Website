import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";
import { getScrollFrameHero } from "@/lib/api";
import {
  uploadScrollFrameHeroZipAction,
  updateScrollFrameHeroSettingsAction,
  clearScrollFrameHeroFramesAction,
} from "@/lib/admin-actions";
import FieldLabel from "@/components/admin/FieldLabel";

export default async function AdminLandingAnimationPage({
  searchParams,
}: {
  searchParams: { error?: string; saved?: string };
}) {
  const meRes = await adminFetch("/auth/me");
  if (meRes.status === 401) redirect("/admin/login");

  const hero = await getScrollFrameHero();

  return (
    <div className="px-9 py-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-ink mb-1">Landing Animation</h1>
      <p className="text-[13.5px] text-slate-500 mb-7">
        A scroll-driven frame-by-frame animation for the homepage hero — the visitor scrolls, the animation scrubs
        through your uploaded frames in sync (the same technique behind Apple's product pages), and once they reach
        the final frame, the location-selection popup appears over a blurred freeze-frame. Leave this off to keep the
        homepage's normal video/image hero.
      </p>

      {searchParams.error ? (
        <div className="bg-red-50 border border-red-200 px-5 py-3 mb-6 text-[13.5px] text-red-800">{searchParams.error}</div>
      ) : null}
      {searchParams.saved ? (
        <div className="bg-emerald-50 border border-emerald-200 px-5 py-3 mb-6 text-[13.5px] text-emerald-800">
          {searchParams.saved === "1" ? "Saved." : searchParams.saved.replace(/\+/g, " ") + "."}
        </div>
      ) : null}

      <div className="bg-white border border-line p-6 mb-6">
        <h2 className="text-[15px] font-bold text-ink mb-1">1. Upload frames</h2>
        <p className="text-[13px] text-slate-500 mb-4">
          Export your animation as a sequence of individual frame images (JPG, PNG or WEBP — most video/animation
          tools can export "image sequence"), then compress them all into a single .zip and upload it here. However
          many frames your zip contains, they're automatically downsampled to a smooth, web-appropriate count (evenly
          sampled across the whole sequence, so the full motion is kept) and uploaded in order — no need to trim it
          yourself first.
        </p>
        {hero.frames.length > 0 ? (
          <div className="mb-4">
            <div className="text-[13px] font-semibold text-ink mb-2">
              {hero.frames.length} frames currently uploaded
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[hero.frames[0], hero.frames[Math.floor(hero.frames.length / 2)], hero.frames[hero.frames.length - 1]].map(
                (url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={url} alt={`Frame preview ${i + 1}`} className="h-20 w-32 object-cover border border-line" />
                ),
              )}
            </div>
            <form action={clearScrollFrameHeroFramesAction} className="mt-3">
              <button type="submit" className="text-[12.5px] font-semibold text-red-700 underline">
                Remove uploaded frames &amp; turn off
              </button>
            </form>
          </div>
        ) : (
          <div className="text-[13px] text-slate-400 mb-4">No frames uploaded yet.</div>
        )}
        <form action={uploadScrollFrameHeroZipAction} encType="multipart/form-data" className="flex flex-col gap-3">
          <input
            type="file"
            name="framesZip"
            accept=".zip,application/zip,application/x-zip-compressed"
            required
            className="text-[13.5px]"
          />
          <button
            type="submit"
            className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-2.5 rounded-[var(--radius)] self-start"
          >
            Upload &amp; Process Zip
          </button>
          <p className="text-[11.5px] text-slate-400">
            Processing uploads each frame to Cloudinary and can take a little while for a large zip — stay on this
            page until it redirects back with a confirmation.
          </p>
        </form>
      </div>

      <div className="bg-white border border-line p-6">
        <h2 className="text-[15px] font-bold text-ink mb-4">2. Settings</h2>
        <form action={updateScrollFrameHeroSettingsAction} className="flex flex-col gap-4">
          <label className="flex items-center gap-2.5 text-[13.5px] font-medium text-ink">
            <input type="checkbox" name="enabled" value="1" defaultChecked={hero.enabled} className="w-4 h-4" />
            Show this animation on the homepage instead of the normal hero
          </label>
          {hero.enabled && hero.frames.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 px-4 py-2.5 text-[12.5px] text-amber-800">
              This is turned on, but no frames are uploaded yet — the homepage will keep showing its normal hero
              until you upload a zip above.
            </div>
          ) : null}
          <div>
            <FieldLabel
              htmlFor="scrollLength"
              hint="How much scrolling it takes to play through the whole animation. Longer feels more deliberate and cinematic; shorter gets visitors to the location popup faster."
            >
              Scroll Distance
            </FieldLabel>
            <select
              id="scrollLength"
              name="scrollLength"
              defaultValue={hero.scrollLength}
              className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white"
            >
              <option value="short">Short</option>
              <option value="medium">Medium</option>
              <option value="long">Long</option>
            </select>
          </div>

          <div className="border-t border-line pt-4 mt-1">
            <div className="text-[13px] font-bold text-ink mb-3">Location popup (shown once the animation finishes)</div>
            <div className="flex flex-col gap-4">
              <div>
                <FieldLabel htmlFor="popupHeadline" hint="Main title on the popup that appears once the animation finishes.">Headline</FieldLabel>
                <input
                  id="popupHeadline"
                  name="popupHeadline"
                  defaultValue={hero.popupHeadline}
                  className="w-full border border-line px-3.5 py-2.5 text-[14px]"
                />
              </div>
              <div>
                <FieldLabel htmlFor="popupSubtext" hint="Short supporting line under the headline.">Subtext</FieldLabel>
                <textarea
                  id="popupSubtext"
                  name="popupSubtext"
                  defaultValue={hero.popupSubtext}
                  rows={2}
                  className="w-full border border-line px-3.5 py-2.5 text-[14px]"
                />
              </div>
              <div>
                <FieldLabel htmlFor="popupCtaLabel" hint="Label on the button a visitor clicks after choosing a location.">Button Label</FieldLabel>
                <input
                  id="popupCtaLabel"
                  name="popupCtaLabel"
                  defaultValue={hero.popupCtaLabel}
                  className="w-full border border-line px-3.5 py-2.5 text-[14px]"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)] self-start"
          >
            Save Settings
          </button>
        </form>
      </div>
    </div>
  );
}
