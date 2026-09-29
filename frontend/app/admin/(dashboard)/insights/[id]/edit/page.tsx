import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { adminFetch } from "@/lib/session";
import { updateInsightAction, autoTranslateInsightAction } from "@/lib/admin-actions";
import FieldLabel from "@/components/admin/FieldLabel";
import LanguageTabs from "@/components/admin/LanguageTabs";
import InsightBodyField from "@/components/admin/InsightBodyField";
import ImageUploadField from "@/components/admin/ImageUploadField";
import AutoTranslateButton from "@/components/admin/AutoTranslateButton";
import { EditorLayout } from "@/components/admin/PreviewPanel";
import { locales, languageNames, defaultLocale } from "@/lib/i18n";

export default async function EditInsightPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { lang?: string; saved?: string; error?: string };
}) {
  const lang = searchParams.lang ?? "en";
  const res = await adminFetch(`/insights/admin/${params.id}`);
  if (res.status === 401) redirect("/admin/login");
  if (!res.ok) notFound();

  const article: any = await res.json();
  const translation = article.translations?.find((t: any) => t.languageCode === lang);

  return (
    <div className="px-9 py-8">
      <Link href="/admin/insights" className="text-[13px] font-semibold text-muted hover:text-ink">
        &larr; Insights &amp; Blog
      </Link>
      <h1 className="text-2xl font-bold text-ink mt-4 mb-1">Edit Article</h1>
      <p className="text-[13.5px] text-slate-500 mb-5">
        Slug: <code>{article.slug}</code> — cover image is shared across languages; title, excerpt and body are per
        language.
      </p>

      <LanguageTabs basePath={`/admin/insights/${article.id}/edit`} current={lang} />

      {searchParams.saved ? (
        <div className="bg-slate-50 border border-line px-5 py-3 mb-6 text-[13.5px] text-ink max-w-xl">
          Saved the {lang.toUpperCase()} translation.
        </div>
      ) : null}
      {!translation ? (
        <div className="bg-slate-50 border border-line px-5 py-3 mb-6 text-[13.5px] text-ink max-w-xl">
          No {lang.toUpperCase()} translation yet — fill in the fields below to add one.
        </div>
      ) : null}

      {lang === defaultLocale ? (
        <div className="max-w-4xl">
          <AutoTranslateButton
            action={autoTranslateInsightAction.bind(null, article.id)}
            targetLanguages={locales.filter((l) => l !== defaultLocale)}
            labels={languageNames}
          />
        </div>
      ) : null}

      <EditorLayout label="Article Preview">
      <form
        action={updateInsightAction.bind(null, article.id)}
        encType="multipart/form-data"
        className="bg-white border border-line p-6 max-w-2xl flex flex-col gap-4"
      >
        <input type="hidden" name="languageCode" value={lang} />

        <ImageUploadField
          id="coverImage"
          label="Cover Image"
          hint="Uploaded to Cloudinary. Leave empty to keep the current cover image — shared across every language."
          fileFieldName="coverImage"
          currentUrl={article.coverImageUrl}
          previewClassName="w-full h-32 object-cover border border-line"
          previewStyle={{ objectPosition: article.coverImagePosition || "center" }}
        />
        <div>
          <FieldLabel htmlFor="coverImagePosition" hint="Which part of the image stays visible when it's cropped into the card's fixed shape — shared across every language.">
            Cover Image Position
          </FieldLabel>
          <select
            id="coverImagePosition"
            name="coverImagePosition"
            defaultValue={article.coverImagePosition || "center"}
            className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white"
          >
            <option value="top">Top</option>
            <option value="center">Center</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="coverVideo" hint="An optional video for this article's detail page — independent of the cover image above, shared across every language.">
            Cover Video
          </FieldLabel>
          {article.coverVideoUrl ? (
            <div className="flex items-center gap-3 mb-2">
              <video src={article.coverVideoUrl} className="w-40 h-24 object-cover border border-line" muted />
              <span className="text-[12.5px] text-slate-500">Current video — upload a new file to replace it.</span>
            </div>
          ) : null}
          <input id="coverVideo" name="coverVideo" type="file" accept="video/*" className="w-full text-[13.5px]" />
          {article.coverVideoUrl ? (
            <label className="flex items-center gap-2 text-[12.5px] text-slate-500 mt-2">
              <input type="checkbox" name="removeCoverVideo" value="1" className="w-3.5 h-3.5" />
              Remove the current video
            </label>
          ) : null}
        </div>
        <div>
          <FieldLabel htmlFor="postType" hint="Which of the three Insights filter tabs this post shows up under on the public site — shared across every language.">
            Content Type
          </FieldLabel>
          <select
            id="postType"
            name="postType"
            defaultValue={article.postType || "insight"}
            className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white"
          >
            <option value="newsletter">Newsletter</option>
            <option value="insight">Insight</option>
            <option value="fun_activity">Fun Activity</option>
          </select>
        </div>
        <div>
          <FieldLabel
            htmlFor="linkedinUrl"
            hint="Optional. If this post is also (or only) a LinkedIn post, paste its URL here — the card on the public Insights page and home page will show a LinkedIn mark and link straight out to LinkedIn instead of this site's own article page. Leave blank for a normal on-site article. Shared across every language."
          >
            LinkedIn Post URL
          </FieldLabel>
          <input
            id="linkedinUrl"
            name="linkedinUrl"
            type="url"
            placeholder="https://www.linkedin.com/posts/..."
            defaultValue={article.linkedinUrl ?? ""}
            className="w-full border border-line px-3.5 py-2.5 text-[14px]"
          />
        </div>
        <div>
          <FieldLabel htmlFor="title" hint={`Headline, in ${lang.toUpperCase()}.`}>Title ({lang.toUpperCase()})</FieldLabel>
          <input id="title" name="title" required defaultValue={translation?.title ?? ""} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
        </div>
        <div>
          <FieldLabel htmlFor="excerpt" hint={`Summary shown on the article card, in ${lang.toUpperCase()}.`}>Excerpt ({lang.toUpperCase()})</FieldLabel>
          <input id="excerpt" name="excerpt" required defaultValue={translation?.excerpt ?? ""} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
        </div>
        <InsightBodyField
          defaultValueHtml={translation?.body ?? ""}
          title={translation?.title}
          label={`Body (${lang.toUpperCase()})`}
        />
        <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)] self-start">
          Save Changes
        </button>
      </form>
      </EditorLayout>
    </div>
  );
}
