import { updateTypographyAction } from "@/lib/admin-actions";
import FieldLabel from "./FieldLabel";

const cardCls = "bg-white border border-line p-6 max-w-3xl";
const btnCls = "mt-2 bg-gold text-[#1A1204] font-semibold text-[13.5px] px-5 py-2.5 rounded-[var(--radius)] self-start";

// Heading/body text size, font and alignment for one admin-configurable
// "page" — the two elements every page has exactly one of (its main <h1>
// and its lead paragraph). `page` is a plain string key into the generic
// ContentBlock system (see getPageTypography in lib/api.ts), so this same
// form works for a top-level page ("about", "services") or a composite key
// for an individual sub-service page ("services/<slug>/<sub-slug>") with
// zero backend changes either way.
export default function TypographyForm({ page, saved, detailNote }: { page: string; saved: Record<string, any>; detailNote?: string }) {
  const headingSize = ["sm", "md", "lg"].includes(saved.headingSize) ? saved.headingSize : "md";
  const bodySize = ["sm", "md", "lg"].includes(saved.bodySize) ? saved.bodySize : "md";
  const align = ["left", "center"].includes(saved.align) ? saved.align : "left";
  const fontFamily = ["serif", "sans"].includes(saved.fontFamily) ? saved.fontFamily : "serif";
  return (
    <form action={updateTypographyAction.bind(null, page)} className={`${cardCls} mb-6`}>
      <h2 className="text-[15px] font-bold text-ink mb-1">Text Size, Font &amp; Alignment</h2>
      <p className="text-[12.5px] text-slate-400 mb-4">
        Sets the size, font and alignment of this page&apos;s main heading and lead paragraph.{detailNote ?? ""}
      </p>
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <div>
          <FieldLabel htmlFor="headingSize" hint="This page's main <h1> title.">Heading Size</FieldLabel>
          <select id="headingSize" name="headingSize" defaultValue={headingSize} className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white">
            <option value="sm">Small</option>
            <option value="md">Medium (default)</option>
            <option value="lg">Large</option>
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="bodySize" hint="This page's lead/intro paragraph, right under the heading.">Body Size</FieldLabel>
          <select id="bodySize" name="bodySize" defaultValue={bodySize} className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white">
            <option value="sm">Small</option>
            <option value="md">Medium (default)</option>
            <option value="lg">Large</option>
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="fontFamily" hint="The typeface used for this page's main heading.">Heading Font</FieldLabel>
          <select id="fontFamily" name="fontFamily" defaultValue={fontFamily} className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white">
            <option value="serif">Serif (default)</option>
            <option value="sans">Sans-serif</option>
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="align" hint="Left- or center-aligns this page's heading and lead paragraph.">Alignment</FieldLabel>
          <select id="align" name="align" defaultValue={align} className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white">
            <option value="left">Left (default)</option>
            <option value="center">Center</option>
          </select>
        </div>
      </div>
      <button type="submit" className={btnCls}>Save Text Size, Font &amp; Alignment</button>
    </form>
  );
}
