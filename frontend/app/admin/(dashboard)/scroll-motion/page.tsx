import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";
import { getScrollMotion } from "@/lib/api";
import { updateScrollMotionAction } from "@/lib/admin-actions";
import FieldLabel from "@/components/admin/FieldLabel";

export default async function AdminScrollMotionPage({
  searchParams,
}: {
  searchParams: { error?: string; saved?: string };
}) {
  const meRes = await adminFetch("/auth/me");
  if (meRes.status === 401) redirect("/admin/login");

  const settings = await getScrollMotion();

  return (
    <div className="px-9 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-ink mb-1">Scroll &amp; Motion</h1>
      <p className="text-[13.5px] text-slate-500 mb-7">
        Site-wide feel of scrolling and a couple of ambient touches — separate from the per-section entrance
        animations you set under Content → [page] → Section Visibility &amp; Animations. These apply everywhere on
        the public site at once, no per-page setup needed.
      </p>

      {searchParams.error ? (
        <div className="bg-red-50 border border-red-200 px-5 py-3 mb-6 text-[13.5px] text-red-800">{searchParams.error}</div>
      ) : null}
      {searchParams.saved ? (
        <div className="bg-emerald-50 border border-emerald-200 px-5 py-3 mb-6 text-[13.5px] text-emerald-800">Saved.</div>
      ) : null}

      <div className="bg-white border border-line p-6">
        <form action={updateScrollMotionAction} className="flex flex-col gap-5">
          <label className="flex items-center gap-2.5 text-[13.5px] font-medium text-ink">
            <input type="checkbox" name="enabled" value="1" defaultChecked={settings.enabled} className="w-4 h-4" />
            Smooth (eased) scrolling
          </label>
          <p className="text-[12.5px] text-slate-400 -mt-3">
            Replaces the browser's default instant jump-scroll with a gliding, inertial scroll — the same feel used
            on most modern marketing sites. Automatically turns itself off for any visitor whose device has
            "Reduce Motion" turned on, and for keyboard/screen-reader scrolling.
          </p>

          <div>
            <FieldLabel
              htmlFor="intensity"
              hint="How pronounced the gliding feel is. Subtle just rounds off the hard edges; Strong is a slower, more deliberate glide."
            >
              Smoothness
            </FieldLabel>
            <select
              id="intensity"
              name="intensity"
              defaultValue={settings.intensity}
              className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white"
            >
              <option value="subtle">Subtle</option>
              <option value="normal">Normal</option>
              <option value="strong">Strong</option>
            </select>
          </div>

          <div className="border-t border-line pt-4 mt-1 flex flex-col gap-4">
            <label className="flex items-center gap-2.5 text-[13.5px] font-medium text-ink">
              <input type="checkbox" name="parallaxHero" value="1" defaultChecked={settings.parallaxHero} className="w-4 h-4" />
              Parallax drift on the homepage hero image/video
            </label>
            <p className="text-[12.5px] text-slate-400 -mt-3">
              The hero media drifts a few pixels slower than the rest of the page as you scroll past it, giving it a
              subtle sense of depth instead of scrolling flat with everything else.
            </p>

            <label className="flex items-center gap-2.5 text-[13.5px] font-medium text-ink">
              <input type="checkbox" name="cursorGlow" value="1" defaultChecked={settings.cursorGlow} className="w-4 h-4" />
              Soft cursor-following light on dark sections
            </label>
            <p className="text-[12.5px] text-slate-400 -mt-3">
              A faint warm glow follows the mouse over the homepage hero (and any section styled the same way), a
              small ambient touch used on award-winning marketing sites. No effect on touch devices.
            </p>
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
