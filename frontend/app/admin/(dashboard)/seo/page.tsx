import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";
import { upsertSeoAction } from "@/lib/admin-actions";
import FieldLabel from "@/components/admin/FieldLabel";

export default async function AdminSeoPage({
  searchParams,
}: {
  searchParams: { error?: string; saved?: string; edit?: string };
}) {
  const res = await adminFetch("/seo/admin/all");
  if (res.status === 401) redirect("/admin/login");
  const rows: any[] = res.ok ? await res.json() : [];
  // "Edit" on a row just re-runs the same add/update form pre-filled with
  // that row's saved values — the form already upserts by path+language, so
  // submitting it again with the same path/lang updates the existing
  // record instead of creating a duplicate.
  const editing = searchParams.edit ? rows.find((r) => r.id === searchParams.edit) : undefined;

  return (
    <div className="px-9 py-8">
      <h1 className="text-2xl font-bold text-ink mb-1">SEO &amp; Schema</h1>
      <p className="text-[13.5px] text-slate-500 mb-7">
        Per-path meta title, description and canonical URL. The frontend should call
        <code className="mx-1">GET /seo/meta?path=...&amp;lang=...</code> to populate each page's <code>&lt;head&gt;</code>.
      </p>

      {searchParams.error ? (
        <div className="bg-red-50 border border-red-200 px-5 py-3 mb-6 text-[13.5px] text-red-800 max-w-xl">
          {searchParams.error}
        </div>
      ) : null}
      {searchParams.saved ? (
        <div className="bg-emerald-50 border border-emerald-200 px-5 py-3 mb-6 text-[13.5px] text-emerald-800 max-w-xl">
          Saved.
        </div>
      ) : null}

      <div className="bg-white border border-line mb-8 overflow-x-auto">
        {rows.length === 0 ? (
          <div className="px-6 py-8 text-[13.5px] text-slate-400">No SEO records yet — add the first one below.</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left">
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Path</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Lang</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Meta Title</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Schema</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Indexing</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={`border-t border-slate-100 ${editing?.id === r.id ? "bg-amber-50/60" : ""}`}>
                  <td className="px-6 py-3.5 text-[13.5px] text-ink font-medium">{r.path}</td>
                  <td className="px-6 py-3.5 text-[13.5px] text-muted uppercase">{r.languageCode}</td>
                  <td className="px-6 py-3.5 text-[13.5px] text-muted">{r.metaTitle}</td>
                  <td className="px-6 py-3.5 text-[13px] text-muted">{r.schemaJson ? (r.schemaType || "Custom") : "—"}</td>
                  <td className="px-6 py-3.5 text-[13px]">
                    {r.noindex ? (
                      <span className="text-red-700 font-semibold">Blocked (noindex)</span>
                    ) : (
                      <span className="text-emerald-700">Indexed</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-[13px]">
                    <a href={`/admin/seo?edit=${r.id}`} className="text-ink underline hover:text-gold">Edit</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white border border-line p-6 max-w-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-bold text-ink">{editing ? `Editing: ${editing.path} (${editing.languageCode})` : "Add / Update a Page's SEO"}</h2>
          {editing ? (
            <a href="/admin/seo" className="text-[12.5px] text-slate-400 underline hover:text-ink">Cancel edit</a>
          ) : null}
        </div>
        <form action={upsertSeoAction} className="flex flex-col gap-4">
          <div>
            <FieldLabel htmlFor="path" hint="The page's URL path, without the language prefix — e.g. /services/external-audit.">Path</FieldLabel>
            <input id="path" name="path" required defaultValue={editing?.path ?? ""} placeholder="/services/external-audit" className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div>
            <FieldLabel htmlFor="languageCode" hint="Each language gets its own SEO record for the same path.">Language</FieldLabel>
            <select id="languageCode" name="languageCode" defaultValue={editing?.languageCode ?? "en"} className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white">
              <option value="en">English</option>
              <option value="ar">Arabic</option>
              <option value="de">German</option>
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="metaTitle" hint="Shown in the browser tab and as the clickable headline in search results. Aim for under 60 characters.">Meta Title</FieldLabel>
            <input id="metaTitle" name="metaTitle" required defaultValue={editing?.metaTitle ?? ""} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div>
            <FieldLabel htmlFor="metaDescription" hint="The snippet shown under the title in search results. Aim for under 160 characters.">Meta Description</FieldLabel>
            <textarea id="metaDescription" name="metaDescription" required rows={3} defaultValue={editing?.metaDescription ?? ""} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div>
            <FieldLabel htmlFor="keywords" hint="Comma-separated — has little direct SEO impact today, but useful for your own reference.">Keywords</FieldLabel>
            <input id="keywords" name="keywords" defaultValue={editing?.keywords ?? ""} placeholder="audit firm dubai, vat consultant uae" className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div>
            <FieldLabel htmlFor="canonicalUrl" hint="Set this if the same content is also reachable at another URL, to tell search engines which one is authoritative.">Canonical URL</FieldLabel>
            <input id="canonicalUrl" name="canonicalUrl" defaultValue={editing?.canonicalUrl ?? ""} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div>
            <FieldLabel htmlFor="ogImageUrl" hint="The image shown when this page's link is shared on LinkedIn, WhatsApp, X, etc. Paste an already-uploaded image URL (e.g. a photo from this page, or the logo). Recommended size 1200×630. Leave blank to use the site-wide default image from Site Settings.">Social Share Image URL</FieldLabel>
            <input id="ogImageUrl" name="ogImageUrl" defaultValue={editing?.ogImageUrl ?? ""} placeholder="https://res.cloudinary.com/..." className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>

          <div className="border-t border-line pt-4 mt-1">
            <FieldLabel
              htmlFor="schemaType"
              hint="Which schema.org type the JSON-LD below represents — for your own reference and the table above; the type isn't enforced against the JSON."
            >
              Custom Structured Data — Schema Type (Advanced)
            </FieldLabel>
            <select
              id="schemaType"
              name="schemaType"
              defaultValue={editing?.schemaType ?? ""}
              className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white"
            >
              <option value="">— None —</option>
              <option value="Organization">Organization</option>
              <option value="LocalBusiness">LocalBusiness</option>
              <option value="FAQ">FAQ</option>
              <option value="Service">Service</option>
              <option value="Article">Article</option>
              <option value="Breadcrumb">Breadcrumb</option>
              <option value="WebSite">WebSite</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <FieldLabel
              htmlFor="schemaJson"
              hint={
                'Only needed for Home, About, Contact, the Services list and the Insights list — every other page (services, team, careers, branches) already builds its own structured data automatically from live content. Paste a single JSON object, e.g. { "@context": "https://schema.org", "@type": "WebSite", "name": "..." }. Leave blank for none. Saved but malformed JSON is rejected on save, not silently dropped.'
              }
            >
              Custom Schema.org JSON-LD (Advanced)
            </FieldLabel>
            <textarea
              id="schemaJson"
              name="schemaJson"
              rows={6}
              defaultValue={editing?.schemaJson ? JSON.stringify(editing.schemaJson, null, 2) : ""}
              placeholder='{ "@context": "https://schema.org", "@type": "WebSite", "name": "EFC" }'
              className="w-full border border-line px-3.5 py-2.5 text-[13px] font-mono"
            />
          </div>

          <label className="flex items-center gap-2.5 text-[13.5px] font-medium text-red-700">
            <input type="checkbox" name="noindex" defaultChecked={editing?.noindex ?? false} className="w-4 h-4" />
            Hide this page from search engines (noindex)
          </label>
          <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)] self-start">
            Save SEO Record
          </button>
        </form>
      </div>
    </div>
  );
}
