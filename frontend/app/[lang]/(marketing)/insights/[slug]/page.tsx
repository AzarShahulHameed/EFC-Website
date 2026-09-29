import Link from "next/link";
import { getInsight, getInsights, getSectionAnimations, getSectionEffects, DELAY_MS, defaultSectionEffect, getSectionVisibility, buildPageMetadata, getPageTypography, HEADING_SIZE_PX, getSiteConfig, SITE_URL } from "@/lib/api";
import { isLocale, lh, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import { sanitizeRichText } from "@/lib/rich-text";
import { safeJsonLd } from "@/lib/json-ld";
import Reveal from "@/components/site/Reveal";
import type { RevealVariant } from "@/components/site/Reveal";
import LinkedInBadge from "@/components/site/LinkedInBadge";

export async function generateStaticParams() {
  const insights = await getInsights("en");
  return insights.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: { lang: string; slug: string } }) {
  const article = await getInsight(params.slug, params.lang);
  return buildPageMetadata(
    `/insights/${params.slug}`,
    params.lang,
    article ? `${article.title} — EFC` : "Insights — EFC",
    article?.excerpt ?? "Audit, tax and VAT updates from EFC's partners.",
  );
}

export default async function InsightArticlePage({ params }: { params: { lang: string; slug: string } }) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const [article, sectionAnim, sectionEffects, sectionVis, typography, siteConfig] = await Promise.all([
    getInsight(params.slug, lang),
    getSectionAnimations("insights"),
    getSectionEffects("insights"),
    getSectionVisibility("insights"),
    getPageTypography("insights"),
    getSiteConfig(lang),
  ]);
  if (!article) notFound();
  const anim = (key: string): RevealVariant => (sectionAnim[key] as RevealVariant) || "fade-up";
  const fx = (key: string) => sectionEffects[key] ?? defaultSectionEffect;
  const visible = (key: string): boolean => sectionVis[key] !== false;

  // Body comes from the admin's rich-text editor as sanitized HTML — same
  // dangerouslySetInnerHTML pattern used for Hero body / Service
  // description / Team bio / Testimonial quote.
  const bodyHtml = sanitizeRichText(article.body ?? article.excerpt ?? "");

  // Article JSON-LD — the structured-data equivalent of a blog post byline,
  // publish date and summary. This is what lets an AI answer engine (or a
  // Google "top stories"/rich-result card) cite this specific article with
  // confidence instead of treating it as undifferentiated page text; no
  // insight article had any schema at all before this.
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.date,
    ...(article.coverImageUrl ? { image: article.coverImageUrl } : {}),
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      ...(siteConfig.logoUrl ? { logo: { "@type": "ImageObject", url: siteConfig.logoUrl } } : {}),
    },
    mainEntityOfPage: `${SITE_URL}/${lang}/insights/${article.slug}`,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/${lang}` },
      { "@type": "ListItem", position: 2, name: "Insights", item: `${SITE_URL}/${lang}/insights` },
      { "@type": "ListItem", position: 3, name: article.title, item: `${SITE_URL}/${lang}/insights/${article.slug}` },
    ],
  };

  return (
    <article className="container-page py-24 max-w-3xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={safeJsonLd(articleSchema)}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={safeJsonLd(breadcrumbSchema)}
      />
      <Link href={lh(lang, "/insights")} className="text-[13.5px] font-semibold text-ink border-b border-ink pb-0.5">
        &larr; Back to Insights
      </Link>

      {article.category ? (
        <div className="text-[12.5px] font-semibold tracking-[0.14em] text-gold uppercase mt-8 mb-3.5">
          {article.category}
        </div>
      ) : null}
      <h1 className="font-serif text-ink leading-tight" style={{ fontSize: HEADING_SIZE_PX[typography.headingSize] }}>{article.title}</h1>
      <div className="flex items-center gap-4 mt-4">
        <div className="text-[13.5px] text-slate-500">{article.date}</div>
        {/* This page reached directly (e.g. from a search result or a
            bookmark) for a post the admin has also tagged with a real
            LinkedIn Post URL — offer that as the canonical version instead
            of only linking out from the listing cards, which skip straight
            to LinkedIn for these and never route a visitor here. */}
        <LinkedInBadge url={article.linkedinUrl} />
      </div>

      {article.coverVideoUrl ? (
        <video src={article.coverVideoUrl} controls className="w-full h-72 sm:h-96 object-cover rounded-[var(--radius)] mt-10 bg-black" />
      ) : article.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.coverImageUrl}
          alt=""
          style={{ objectPosition: article.coverImagePosition || "center" }}
          className="hover-target w-full h-72 sm:h-96 object-cover rounded-[var(--radius)] mt-10"
        />
      ) : null}

      {visible("article") ? (
      <Reveal variant={anim("article")} speed={fx("article").speed} delay={DELAY_MS[fx("article").delay]} hover={fx("article").hover} stagger={fx("article").stagger} background={fx("article").background} backgroundColor={fx("article").backgroundColor} backgroundTextColor={fx("article").backgroundTextColor}>
        <div
          className="mt-10 text-[16.5px] leading-relaxed text-ink [&_p]:mb-5 [&_p:last-child]:mb-0 [&_div]:mb-3 [&_div:last-child]:mb-0"
          dangerouslySetInnerHTML={{ __html: bodyHtml }}
        />
      </Reveal>
      ) : null}

      <div className="mt-16 pt-8 border-t border-line">
        <Link
          href={lh(lang, "/contact")}
          className="inline-block bg-gold text-[#1A1204] font-semibold text-[15px] px-7 py-4 rounded-[var(--btn-radius)] hover:bg-gold-light transition-colors"
        >
          Talk to an advisor about this
        </Link>
      </div>
    </article>
  );
}
