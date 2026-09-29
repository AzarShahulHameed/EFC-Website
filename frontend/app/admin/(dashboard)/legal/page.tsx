import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";
import { updateLegalPageAction } from "@/lib/admin-actions";
import FieldLabel from "@/components/admin/FieldLabel";
import RichTextField from "@/components/admin/RichTextField";
import { legalPages as defaultLegalPages } from "@/lib/content";

const PAGES: { key: "privacy" | "terms" | "cookies"; label: string; publicPath: string }[] = [
  { key: "privacy", label: "Privacy Policy", publicPath: "/privacy" },
  { key: "terms", label: "Terms of Service", publicPath: "/terms" },
  { key: "cookies", label: "Cookies & Data Protection Policy", publicPath: "/cookies" },
];

export default async function AdminLegalPage({
  searchParams,
}: {
  searchParams: { saved?: string; error?: string };
}) {
  const [privacyRes, termsRes, cookiesRes] = await Promise.all([
    adminFetch("/content/legal-privacy/en"),
    adminFetch("/content/legal-terms/en"),
    adminFetch("/content/legal-cookies/en"),
  ]);
  if (privacyRes.status === 401 || termsRes.status === 401 || cookiesRes.status === 401) redirect("/admin/login");
  const privacyContent: any = privacyRes.ok ? await privacyRes.json() : {};
  const termsContent: any = termsRes.ok ? await termsRes.json() : {};
  const cookiesContent: any = cookiesRes.ok ? await cookiesRes.json() : {};

  const pageContent = {
    privacy: { ...defaultLegalPages.privacy, ...(privacyContent.content ?? {}) },
    terms: { ...defaultLegalPages.terms, ...(termsContent.content ?? {}) },
    cookies: { ...defaultLegalPages.cookies, ...(cookiesContent.content ?? {}) },
  };

  return (
    <div className="px-9 py-8">
      <h1 className="text-2xl font-bold text-ink mb-1">Legal Pages</h1>
      <p className="text-[13.5px] text-slate-500 mb-7">
        Privacy Policy, Terms of Service and Cookies &amp; Data Protection Policy, published at{" "}
        <code>/privacy</code>, <code>/terms</code> and <code>/cookies</code> — these are the pages the footer&apos;s
        Legal links (Admin &rarr; Header &amp; Footer) point to. The Cookies policy starts pre-filled with an
        accurate description of what this site actually stores (no third-party analytics or ad cookies — just
        sessionStorage/localStorage and this app&apos;s own database); Privacy and Terms start as clearly-marked
        placeholders. Written and legally reviewed content is your responsibility either way.
      </p>


      <div className="flex flex-col gap-6">
        {PAGES.map(({ key, label, publicPath }) => (
          <div key={key} className="bg-white border border-line p-6 max-w-3xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold text-ink">{label}</h2>
              <a
                href={publicPath}
                target="_blank"
                rel="noreferrer"
                className="text-[12.5px] font-semibold text-ink underline"
              >
                View public page &rarr;
              </a>
            </div>
            <form action={updateLegalPageAction.bind(null, key)} className="flex flex-col gap-4">
              <div>
                <FieldLabel htmlFor={`${key}-title`} hint="Shown as the page heading.">Page Title</FieldLabel>
                <input
                  id={`${key}-title`}
                  name="title"
                  required
                  defaultValue={pageContent[key].title}
                  className="w-full border border-line px-3.5 py-2.5 text-[14px]"
                />
              </div>
              <RichTextField
                name="body"
                label="Page Content"
                hint="Use the toolbar for bold, italic, underline, size and color. Headings within the text can use Large/X-Large size."
                defaultValueHtml={pageContent[key].body}
                rows={14}
              />
              <button
                type="submit"
                className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)] self-start"
              >
                Save {label}
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
