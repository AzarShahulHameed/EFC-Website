import { updatePageHeaderAction } from "@/lib/admin-actions";
import { pageHeaders as defaultPageHeaders } from "@/lib/content";
import FieldLabel from "./FieldLabel";

const inputCls = "w-full border border-line px-3.5 py-2.5 text-[14px] focus:outline-none focus:border-ink";
const btnCls = "mt-2 bg-gold text-[#1A1204] font-semibold text-[13.5px] px-5 py-2.5 rounded-[var(--radius)] self-start";
const cardCls = "bg-white border border-line p-6 max-w-3xl";

// The small-caps eyebrow, <h1> and lead paragraph at the top of an
// admin-configurable page — see TypographyForm.tsx for why `page` is a
// plain string key that also works for a composite sub-service page key.
export default function PageHeaderForm({ page, saved }: { page: string; saved: Record<string, any> }) {
  const defaults = defaultPageHeaders[page] ?? { eyebrow: "", headline: "", lead: "" };
  const header = { ...defaults, ...saved };
  return (
    <form action={updatePageHeaderAction.bind(null, page)} className={`${cardCls} mb-6`}>
      <h2 className="text-[15px] font-bold text-ink mb-1">Page Header</h2>
      <p className="text-[12.5px] text-slate-400 mb-4">
        The small label, main heading and intro line at the top of this page.
      </p>
      <div className="flex flex-col gap-4">
        <div>
          <FieldLabel htmlFor="eyebrow" hint="The small uppercase label above the heading.">Eyebrow Label</FieldLabel>
          <input id="eyebrow" name="eyebrow" defaultValue={header.eyebrow} maxLength={60} className={inputCls} />
        </div>
        <div>
          <FieldLabel htmlFor="headline" hint="This page's main <h1> title.">Headline</FieldLabel>
          <input id="headline" name="headline" defaultValue={header.headline} maxLength={200} className={inputCls} />
        </div>
        <div>
          <FieldLabel htmlFor="lead" hint="The intro sentence right under the heading. You can use {name} to insert your company name.">Lead Paragraph</FieldLabel>
          <textarea id="lead" name="lead" rows={2} defaultValue={header.lead} maxLength={400} className={inputCls} />
        </div>
      </div>
      <button type="submit" className={btnCls}>Save Page Header</button>
    </form>
  );
}
