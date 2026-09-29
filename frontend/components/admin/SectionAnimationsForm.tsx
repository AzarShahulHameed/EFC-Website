import { updateSectionAnimationsAction } from "@/lib/admin-actions";
import AnimationPicker from "./AnimationPicker";

const btnCls = "mt-2 bg-gold text-[#1A1204] font-semibold text-[13.5px] px-5 py-2.5 rounded-[var(--radius)] self-start";
const cardCls = "bg-white border border-line p-6 max-w-3xl";

// One visibility toggle + AnimationPicker per section on a page, saved
// together. `sections` is [key, label] pairs matching the Reveal
// `id`/comment in the corresponding public page.tsx. `page` is a plain
// string key into the generic ContentBlock system — see TypographyForm.tsx
// for why this same form works for a composite sub-service page key too.
export default function SectionAnimationsForm({
  page,
  sections,
  savedAnimations,
  savedVisibility,
  savedEffects,
}: {
  page: string;
  sections: [string, string][];
  savedAnimations: Record<string, string>;
  savedVisibility: Record<string, boolean>;
  savedEffects?: Record<
    string,
    { speed?: string; delay?: string; hover?: string; stagger?: boolean; background?: string; backgroundColor?: string; backgroundTextColor?: string }
  >;
}) {
  const effects = savedEffects ?? {};
  return (
    <form action={updateSectionAnimationsAction.bind(null, page, sections.map(([key]) => key))} className={cardCls}>
      <h2 className="text-[15px] font-bold text-ink mb-1">Section Visibility &amp; Animations</h2>
      <p className="text-[12.5px] text-slate-400 mb-4">
        Turn a section off to hide it from this page entirely (the fastest way to remove one without deleting any
        content), and choose how it animates in — including a background color — as a visitor scrolls to it while
        it's on. &ldquo;None&rdquo; shows the section immediately, with no animation. Speed, delay, hover effect and
        stagger are advanced options layered on top of the animation style — leave them at their defaults for the
        site's original look. To add a brand-new section to this page (not just style one of the ones below), use{" "}
        <a href={`/admin/builder?page=${page}`} className="underline hover:text-ink">
          Page Builder
        </a>
        , which supports its own add/edit/delete/reorder for freeform content blocks.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
        {sections.map(([key, label]) => {
          const fx = effects[key] ?? {};
          return (
          <div key={key} className="border border-line rounded-[var(--radius)] p-3">
            <label className="flex items-center gap-2 text-[13px] font-semibold text-ink mb-2.5">
              <input
                type="checkbox"
                name={`visible_${key}`}
                defaultChecked={savedVisibility[key] !== false}
                className="w-4 h-4"
              />
              {label}
            </label>
            <AnimationPicker name={`anim_${key}`} label="Animation" defaultValue={savedAnimations[key] || "fade-up"} />

            <div className="grid grid-cols-2 gap-2 mt-2.5">
              <div>
                <label htmlFor={`speed_${key}`} className="text-[11px] font-semibold text-slate-500 block mb-1">Speed</label>
                <select id={`speed_${key}`} name={`speed_${key}`} defaultValue={fx.speed || "normal"} className="w-full border border-line px-2 py-1.5 text-[12.5px] bg-white">
                  <option value="slow">Slow</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                </select>
              </div>
              <div>
                <label htmlFor={`delay_${key}`} className="text-[11px] font-semibold text-slate-500 block mb-1">Delay</label>
                <select id={`delay_${key}`} name={`delay_${key}`} defaultValue={fx.delay || "none"} className="w-full border border-line px-2 py-1.5 text-[12.5px] bg-white">
                  <option value="none">None</option>
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                </select>
              </div>
              <div>
                <label htmlFor={`hover_${key}`} className="text-[11px] font-semibold text-slate-500 block mb-1">Hover Effect</label>
                <select id={`hover_${key}`} name={`hover_${key}`} defaultValue={fx.hover || "default"} className="w-full border border-line px-2 py-1.5 text-[12.5px] bg-white">
                  <option value="default">Default (subtle lift)</option>
                  <option value="lift">Lift (stronger)</option>
                  <option value="zoom">Zoom</option>
                  <option value="glow">Glow</option>
                  <option value="underline">Underline text</option>
                  <option value="none">None</option>
                </select>
              </div>
              <div>
                <label htmlFor={`background_${key}`} className="text-[11px] font-semibold text-slate-500 block mb-1">Background</label>
                <select id={`background_${key}`} name={`background_${key}`} defaultValue={fx.background || "none"} className="w-full border border-line px-2 py-1.5 text-[12.5px] bg-white">
                  <option value="none">None (page background)</option>
                  <option value="tint">Tint panel</option>
                  <option value="dark">Dark panel</option>
                  <option value="gradient">Gradient panel</option>
                  <option value="custom">Custom color…</option>
                </select>
              </div>
              <label className="flex items-center gap-1.5 text-[12px] text-ink self-end pb-1.5">
                <input type="checkbox" name={`stagger_${key}`} defaultChecked={fx.stagger === true} className="w-3.5 h-3.5" />
                Animate items one by one
              </label>
              <div>
                <label htmlFor={`backgroundColor_${key}`} className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Custom background color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={`backgroundColor_${key}`}
                    name={`backgroundColor_${key}`}
                    type="color"
                    defaultValue={fx.backgroundColor || "#0A1B33"}
                    className="w-9 h-8 border border-line p-0.5 bg-white cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-400">Used only when Background is &ldquo;Custom color&rdquo;</span>
                </div>
              </div>
              <div>
                <label htmlFor={`backgroundTextColor_${key}`} className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Custom text color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={`backgroundTextColor_${key}`}
                    name={`backgroundTextColor_${key}`}
                    type="color"
                    defaultValue={fx.backgroundTextColor || "#FFFFFF"}
                    className="w-9 h-8 border border-line p-0.5 bg-white cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-400">Keeps text readable against your custom color</span>
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>
      <button type="submit" className={btnCls}>Save Section Settings</button>
    </form>
  );
}
