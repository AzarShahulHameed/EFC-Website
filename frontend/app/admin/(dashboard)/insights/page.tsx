import { redirect } from "next/navigation";
import Link from "next/link";
import { adminFetch } from "@/lib/session";
import { createInsightAction, deleteInsightAction, togglePublishInsightAction } from "@/lib/admin-actions";
import FieldLabel from "@/components/admin/FieldLabel";
import InsightBodyField from "@/components/admin/InsightBodyField";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { EditorLayout } from "@/components/admin/PreviewPanel";
import { INSIGHT_POST_TYPE_LABELS } from "@/lib/content";

export default async function AdminInsightsPage({
  searchParams,
}: {
  searchParams: { error?: string; saved?: string };
}) {
  const res = await adminFetch("/insights/admin/all");
  if (res.status === 401) redirect("/admin/login");
  const articles: any[] = res.ok ? await res.json() : [];

  return (
    <div className="px-9 py-8">
      <h1 className="text-2xl font-bold text-ink mb-1">Insights &amp; Blog</h1>
      <p className="text-[13.5px] text-slate-500 mb-7">
        Audit, tax and VAT updates published to the public /insights page.
      </p>


      <div className="bg-white border border-line mb-8 overflow-x-auto">
        {articles.length === 0 ? (
          <div className="px-6 py-8 text-[13.5px] text-slate-400">No articles yet — add the first one below.</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left">
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide"></th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Title</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Slug</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Filter Tab</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => {
                const en = a.translations?.find((t: any) => t.languageCode === "en");
                return (
                  <tr key={a.id} className="border-t border-slate-100">
                    <td className="pl-6 py-3">
                      {a.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.coverImageUrl} alt="" className="w-12 h-9 object-cover rounded-sm" />
                      ) : (
                        <div className="w-12 h-9 bg-slate-50 border border-line rounded-sm" />
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-[13.5px] text-ink font-medium">{en?.title ?? a.slug}</td>
                    <td className="px-6 py-3.5 text-[13.5px] text-muted">{a.slug}</td>
                    <td className="px-6 py-3.5 text-[13px] text-muted">
                      {INSIGHT_POST_TYPE_LABELS[(a.postType as keyof typeof INSIGHT_POST_TYPE_LABELS) ?? "insight"] ?? "Insight"}
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          a.isPublished ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {a.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      <Link href={`/admin/insights/${a.id}/edit`} className="text-[12.5px] font-semibold text-ink mr-4">
                        Edit
                      </Link>
                      <form action={togglePublishInsightAction.bind(null, a.id, a.isPublished)} className="inline">
                        <button type="submit" className="text-[12.5px] font-semibold text-ink mr-4">
                          {a.isPublished ? "Unpublish" : "Publish"}
                        </button>
                      </form>
                      <form action={deleteInsightAction.bind(null, a.id)} className="inline">
                        <button type="submit" className="text-[12.5px] font-semibold text-red-700">Delete</button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <EditorLayout label="Article Preview">
      <div className="bg-white border border-line p-6 max-w-2xl">
        <h2 className="text-[15px] font-bold text-ink mb-4">Add an Article</h2>
        <form action={createInsightAction} encType="multipart/form-data" className="flex flex-col gap-4">
          <div>
            <FieldLabel htmlFor="languageCode" hint="Which language this title/excerpt/body is written in. Add other languages from the Edit screen afterward.">Language</FieldLabel>
            <select id="languageCode" name="languageCode" defaultValue="en" className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white">
              <option value="en">English</option>
              <option value="ar">Arabic</option>
              <option value="de">German</option>
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="slug" hint="URL-safe identifier — becomes /insights/your-slug. Can't be changed later without breaking links.">Slug</FieldLabel>
            <input id="slug" name="slug" required placeholder="e.g. vat-health-check-checklist" className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div>
            <FieldLabel htmlFor="postType" hint="Which of the three Insights filter tabs (Newsletter / Insight / Fun Activity) this post shows up under on the public site — shared across every language. You can change this later from the Edit screen too.">
              Content Type
            </FieldLabel>
            <select id="postType" name="postType" defaultValue="insight" className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white">
              <option value="newsletter">Newsletter</option>
              <option value="insight">Insight</option>
              <option value="fun_activity">Fun Activity</option>
            </select>
          </div>
          <ImageUploadField
            id="coverImage"
            label="Cover Image"
            hint="Optional — shown on the article's card in the /insights list. Uploaded to Cloudinary."
            fileFieldName="coverImage"
          />
          <div>
            <FieldLabel htmlFor="coverVideo" hint="Optional — shown on the article's own detail page, independent of the cover image above. Uploaded to Cloudinary.">
              Cover Video
            </FieldLabel>
            <input id="coverVideo" name="coverVideo" type="file" accept="video/*" className="w-full text-[13.5px]" />
          </div>
          <div>
            <FieldLabel
              htmlFor="linkedinUrl"
              hint="Optional. If this post is also (or only) a LinkedIn post, paste its URL here — its card links straight out to LinkedIn instead of this site's own article page. Leave blank for a normal on-site article."
            >
              LinkedIn Post URL
            </FieldLabel>
            <input id="linkedinUrl" name="linkedinUrl" type="url" placeholder="https://www.linkedin.com/posts/..." className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div>
            <FieldLabel htmlFor="title" hint="Headline shown on the article card and its own page.">Title</FieldLabel>
            <input id="title" name="title" required className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div>
            <FieldLabel htmlFor="excerpt" hint="1–2 sentence summary shown on the article card.">Excerpt</FieldLabel>
            <input id="excerpt" name="excerpt" required className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <InsightBodyField />
          <label className="flex items-center gap-2 text-[13.5px] text-ink">
            <input type="checkbox" name="isPublished" className="w-4 h-4" />
            Publish immediately
          </label>
          <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)] self-start">
            Save Article
          </button>
        </form>
      </div>
      </EditorLayout>
    </div>
  );
}
