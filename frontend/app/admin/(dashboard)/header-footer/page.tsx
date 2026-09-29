import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";
import { updateFooterLinksAction, updateNavLinksAction, updateHeaderUtilityBarAction } from "@/lib/admin-actions";
import { navLinks as defaultNavLinks, footerLinks as defaultFooterLinks } from "@/lib/content";
import ReorderableLinkRows from "@/components/admin/ReorderableLinkRows";
import FieldLabel from "@/components/admin/FieldLabel";

const btnCls = "mt-2 bg-gold text-[#1A1204] font-semibold text-[13.5px] px-5 py-2.5 rounded-[var(--radius)] self-start";
const cardCls = "bg-white border border-line p-6 max-w-3xl";

export default async function AdminHeaderFooterPage({
  searchParams,
}: {
  searchParams: { saved?: string; error?: string };
}) {
  const res = await adminFetch("/content/global/en");
  if (res.status === 401) redirect("/admin/login");
  const content: any = res.ok ? await res.json() : {};

  const navLinks: { label: string; href: string }[] =
    Array.isArray(content.navLinks) && content.navLinks.length > 0 ? content.navLinks : defaultNavLinks;
  const footerLinks = { ...defaultFooterLinks, ...(content.footerLinks ?? {}) };
  const utilityBarStyle: "bar" | "minimal" | "pill" = content.headerUtilityBar?.style ?? "bar";

  return (
    <div className="px-9 py-8">
      <h1 className="text-2xl font-bold text-ink mb-1">Header &amp; Footer</h1>
      <p className="text-[13.5px] text-slate-500 mb-7">
        Type a label and a link for each menu item — leave a row's label blank to remove it. Only English is editable
        here; other languages fall back to the site's built-in translated labels.
      </p>


      <div className="flex flex-col gap-6">
        <form action={updateHeaderUtilityBarAction} className={cardCls}>
          <h2 className="text-[15px] font-bold text-ink mb-1">Utility Bar Style</h2>
          <p className="text-[12.5px] text-slate-400 mb-4">
            The look of the &ldquo;Our Locations&rdquo; / language row at the very top of the header, above the logo
            and main menu.
          </p>
          <FieldLabel htmlFor="utilityBarStyle" hint="Purely visual — doesn't change what's inside the bar, just how it's presented.">
            Style
          </FieldLabel>
          <select
            id="utilityBarStyle"
            name="utilityBarStyle"
            defaultValue={utilityBarStyle}
            className="w-full max-w-sm border border-line px-3.5 py-2.5 text-[14px] bg-white focus:outline-none focus:border-ink"
          >
            <option value="bar">Bar — full-width band (default)</option>
            <option value="minimal">Minimal — blends into the header, no divider</option>
            <option value="pill">Pill — each picker as a rounded chip</option>
          </select>
          <button type="submit" className={btnCls}>Save Utility Bar Style</button>
        </form>

        <form action={updateNavLinksAction} className={cardCls}>
          <h2 className="text-[15px] font-bold text-ink mb-1">Header Menu</h2>
          <p className="text-[12.5px] text-slate-400 mb-4">
            Up to 10 links, shown in this order — use the arrows to reorder.
          </p>
          <ReorderableLinkRows prefix="nav" initialRows={navLinks} max={10} />
          <button type="submit" className={btnCls}>Save Header Menu</button>
        </form>

        <form action={updateFooterLinksAction} className={cardCls}>
          <h2 className="text-[15px] font-bold text-ink mb-1">Footer — Services Column</h2>
          <ReorderableLinkRows prefix="footer_services" initialRows={footerLinks.services} max={6} />

          <h2 className="text-[15px] font-bold text-ink mt-7 mb-1">Footer — Company Column</h2>
          <ReorderableLinkRows prefix="footer_company" initialRows={footerLinks.company} max={6} />

          <h2 className="text-[15px] font-bold text-ink mt-7 mb-1">Footer — Legal Links</h2>
          <ReorderableLinkRows prefix="footer_legal" initialRows={footerLinks.legal} max={4} />

          <button type="submit" className={btnCls}>Save Footer Links</button>
        </form>
      </div>
    </div>
  );
}
