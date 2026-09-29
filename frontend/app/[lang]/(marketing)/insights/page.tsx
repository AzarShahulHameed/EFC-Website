import Link from "next/link";
import { getInsights, getPageBlocks, getSectionAnimations, getSectionEffects, DELAY_MS, defaultSectionEffect, getSectionVisibility, buildPageMetadata, getPageTypography, getPageHeader, HEADING_SIZE_PX, BODY_SIZE_PX, HEADING_FONT_CLASS } from "@/lib/api";
import { INSIGHT_POST_TYPE_LABELS, type InsightPostType } from "@/lib/content";
import { isLocale, lh, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import Reveal from "@/components/site/Reveal";
import type { RevealVariant } from "@/components/site/Reveal";
import PageBlocks from "@/components/site/PageBlocks";
import { LinkedInMark } from "@/components/site/LinkedInBadge";
import CustomSchemaScript from "@/components/site/CustomSchemaScript";

const FILTER_TYPES = Object.keys(INSIGHT_POST_TYPE_LABELS) as InsightPostType[];

export async function generateMetadata({ params }: { params: { lang: string } }) {
  return buildPageMetadata(
    "/insights",
    params.lang,
    "Insights — EFC",
    "Audit, tax and VAT updates from EFC's partners.",
  );
}

export default async function InsightsPage({
  params,
  searchParams,
}: {
  params: { lang: string };
  searchParams: { type?: string };
}) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const activeType = FILTER_TYPES.includes(searchParams.type as InsightPostType)
    ? (searchParams.type as InsightPostType)
    : undefined;
  const [insights, sectionAnim, sectionEffects, sectionVis, typography, header, pageBlocks] = await Promise.all([
    getInsights(lang, activeType),
    getSectionAnimations("insights"),
    getSectionEffects("insights"),
    getSectionVisibility("insights"),
    getPageTypography("insights"),
    getPageHeader("insights", lang),
    getPageBlocks("insights", lang),
  ]);
  const anim = (key: string): RevealVariant => (sectionAnim[key] as RevealVariant) || "fade-up";
  const fx = (key: string) => sectionEffects[key] ?? defaultSectionEffect;
  const visible = (key: string): boolean => sectionVis[key] !== false;

  return (
    <>
    <CustomSchemaScript path="/insights" lang={lang} />
    <div className="container-page py-24">
      <div className={typography.align === "center" ? "text-center" : ""}>
        {header.eyebrow ? (
          <div className="text-[13px] font-semibold tracking-[0.14em] text-gold uppercase mb-3.5">{header.eyebrow}</div>
        ) : null}
        <h1 className={`${HEADING_FONT_CLASS[typography.fontFamily]} text-ink max-w-2xl leading-tight mb-6 ${typography.align === "center" ? "mx-auto" : ""}`} style={{ fontSize: HEADING_SIZE_PX[typography.headingSize] }}>{header.headline}</h1>
        {header.lead ? (
        <p className={`text-muted leading-relaxed max-w-2xl ${typography.align === "center" ? "mx-auto" : ""}`} style={{ fontSize: BODY_SIZE_PX[typography.bodySize] }}>
          {header.lead}
        </p>
        ) : null}
      </div>

      {/* Content-type filter: Newsletter / Insight / Fun Activity, set per
          post from Admin → Insights → Edit. A plain link-based tab bar
          (not client-side JS) so the filtered view is itself a real,
          bookmarkable/shareable, server-rendered URL (?type=newsletter). */}
      <div className="flex flex-wrap gap-2 mt-10">
        <Link
          href={lh(lang, "/insights")}
          className={`px-4 py-2 text-[13px] font-semibold rounded-full border transition-colors ${
            !activeType ? "bg-navy text-white border-navy" : "border-line text-muted hover:border-ink hover:text-ink"
          }`}
        >
          All
        </Link>
        {FILTER_TYPES.map((t) => (
          <Link
            key={t}
            href={lh(lang, `/insights?type=${t}`)}
            className={`px-4 py-2 text-[13px] font-semibold rounded-full border transition-colors ${
              activeType === t ? "bg-navy text-white border-navy" : "border-line text-muted hover:border-ink hover:text-ink"
            }`}
          >
            {INSIGHT_POST_TYPE_LABELS[t]}
          </Link>
        ))}
      </div>

      {visible("grid") ? (
      <Reveal variant={anim("grid")} speed={fx("grid").speed} delay={DELAY_MS[fx("grid").delay]} hover={fx("grid").hover} stagger={fx("grid").stagger} background={fx("grid").background} backgroundColor={fx("grid").backgroundColor} backgroundTextColor={fx("grid").backgroundTextColor}>
        {insights.length === 0 ? (
          <p className="text-[14.5px] text-muted mt-10">No posts in this category yet.</p>
        ) : (
        <div className="flex flex-col card-grid gap-px bg-line border border-line mt-8">
          {insights.map((article) => {
            const cardChildren = (
              <>
                {article.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={article.coverImageUrl}
                    alt=""
                    style={{ objectPosition: article.coverImagePosition || "center" }}
                    className="w-full sm:w-48 h-32 object-cover border border-line flex-shrink-0"
                  />
                ) : null}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-[12px] font-semibold tracking-[0.1em] text-gold uppercase">{article.category}</div>
                    {article.postType ? (
                      <span className="text-[10.5px] font-semibold uppercase tracking-wide text-slate-400 border border-line rounded-full px-2 py-0.5">
                        {INSIGHT_POST_TYPE_LABELS[article.postType]}
                      </span>
                    ) : null}
                    {article.linkedinUrl ? (
                      // A LinkedIn Post URL (Admin → Insights → Edit) makes
                      // the whole card an external link to the real
                      // LinkedIn post instead of this site's own article
                      // page — the mark here is just the visual cue for
                      // that before the visitor clicks.
                      <LinkedInMark size={16} />
                    ) : null}
                  </div>
                  <h2 className="font-serif text-xl text-ink font-semibold mt-2.5 group-hover:text-gold">
                    {article.title}
                  </h2>
                  <p className="text-[14.5px] text-muted leading-relaxed mt-2.5 max-w-2xl">{article.excerpt}</p>
                  <div className="text-[13px] text-slate-500 mt-4">{article.date}</div>
                </div>
              </>
            );
            const cardClassName = "group bg-white p-8 flex flex-col sm:flex-row gap-6 hover:bg-paper-2 transition-colors";
            return article.linkedinUrl ? (
              <a
                key={article.slug}
                href={article.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className={cardClassName}
              >
                {cardChildren}
              </a>
            ) : (
              <Link key={article.slug} href={lh(lang, `/insights/${article.slug}`)} className={cardClassName}>
                {cardChildren}
              </Link>
            );
          })}
        </div>
        )}
      </Reveal>
      ) : null}
    </div>
    <PageBlocks blocks={pageBlocks} lang={lang} />
    </>
  );
}
