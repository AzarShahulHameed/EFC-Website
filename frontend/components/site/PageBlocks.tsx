import Link from "next/link";
import type { PageBlock } from "@/lib/api";
import type { RevealVariant } from "@/components/site/Reveal";
import Reveal from "@/components/site/Reveal";
import { sanitizeRichText } from "@/lib/rich-text";
import { safeJsonLd } from "@/lib/json-ld";
import { lh, type Locale } from "@/lib/i18n";

// Renders whatever an admin has added to a page via Admin → Page Builder —
// this is the "add new content myself" half of the builder (the other half
// is the admin form itself, components/admin/PageBlockForm.tsx). Each
// block's `content` shape depends on its `type`; anything unrecognized (a
// future type an older deployed frontend doesn't know yet) is skipped
// rather than crashing the page.
export default function PageBlocks({ blocks, lang }: { blocks: PageBlock[]; lang: Locale }) {
  if (!blocks || blocks.length === 0) return null;

  function href(raw: string | undefined): string {
    if (!raw) return lh(lang, "/contact");
    return /^https?:\/\//i.test(raw) ? raw : lh(lang, raw);
  }
  function isExternal(raw: string | undefined): boolean {
    return /^https?:\/\//i.test(raw || "");
  }

  return (
    <>
      {blocks.map((block) => {
        const variant = (block.animation as RevealVariant) || "fade-up";
        const c = block.content || {};

        switch (block.type) {
          case "richText":
            if (!c.html) return null;
            return (
              <Reveal key={block.id} variant={variant} className="container-page py-14">
                <div
                  className="prose-block max-w-3xl mx-auto text-[15.5px] leading-relaxed text-muted"
                  dangerouslySetInnerHTML={{ __html: sanitizeRichText(c.html) }}
                />
              </Reveal>
            );

          case "image":
            if (!c.url) return null;
            return (
              <Reveal key={block.id} variant={variant} className="container-page py-14">
                <figure className="max-w-4xl mx-auto">
                  {c.link ? (
                    <Link href={href(c.link)} target={isExternal(c.link) ? "_blank" : undefined} rel={isExternal(c.link) ? "noopener noreferrer" : undefined}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.url}
                        alt={c.caption || ""}
                        style={{ objectPosition: c.position || "center" }}
                        className="w-full max-h-[520px] object-cover rounded-[var(--radius)]"
                      />
                    </Link>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.url}
                      alt={c.caption || ""}
                      style={{ objectPosition: c.position || "center" }}
                      className="w-full max-h-[520px] object-cover rounded-[var(--radius)]"
                    />
                  )}
                  {c.caption ? <figcaption className="text-[13px] text-slate-500 mt-3 text-center">{c.caption}</figcaption> : null}
                </figure>
              </Reveal>
            );

          case "video":
            if (!c.url) return null;
            return (
              <Reveal key={block.id} variant={variant} className="container-page py-14">
                <div className="max-w-4xl mx-auto rounded-[var(--radius)] overflow-hidden bg-navy">
                  <video
                    src={c.url}
                    poster={c.posterUrl || undefined}
                    controls
                    className="w-full max-h-[520px] object-cover"
                  />
                </div>
              </Reveal>
            );

          case "imageText":
            return (
              <Reveal key={block.id} variant={variant} className="container-page py-16">
                <div
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                    c.mediaPosition === "left" ? "lg:[&>*:first-child]:order-2" : ""
                  }`}
                >
                  <div>
                    {c.eyebrow ? (
                      <div className="text-[13px] font-semibold tracking-[0.14em] text-gold uppercase mb-3.5">{c.eyebrow}</div>
                    ) : null}
                    {c.headline ? <h2 className="font-serif text-3xl text-ink leading-tight mb-5 max-w-lg">{c.headline}</h2> : null}
                    {c.body ? (
                      <div
                        className="text-[15.5px] text-muted leading-relaxed max-w-md"
                        dangerouslySetInnerHTML={{ __html: sanitizeRichText(c.body) }}
                      />
                    ) : null}
                    {c.linkLabel ? (
                      <Link
                        href={href(c.link)}
                        target={isExternal(c.link) ? "_blank" : undefined}
                        rel={isExternal(c.link) ? "noopener noreferrer" : undefined}
                        className="inline-block mt-6 text-sm font-semibold text-ink border-b border-ink pb-0.5"
                      >
                        {c.linkLabel} &rarr;
                      </Link>
                    ) : null}
                  </div>
                  <div className="relative w-full h-64 sm:h-80 rounded-[var(--radius)] overflow-hidden bg-navy">
                    {c.videoUrl ? (
                      <video src={c.videoUrl} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
                    ) : c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : null}
                  </div>
                </div>
              </Reveal>
            );

          case "cta":
            if (!c.headline && !c.ctaLabel) return null;
            return (
              <Reveal key={block.id} variant={variant} className="w-full bg-paper-2">
                <div className="container-page py-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
                  <div>
                    {c.headline ? <h2 className="font-serif text-3xl text-ink leading-tight max-w-lg">{c.headline}</h2> : null}
                    {c.body ? <p className="text-[15px] text-muted mt-3 max-w-lg">{c.body}</p> : null}
                  </div>
                  {c.ctaLabel ? (
                    <Link
                      href={href(c.link)}
                      target={isExternal(c.link) ? "_blank" : undefined}
                      rel={isExternal(c.link) ? "noopener noreferrer" : undefined}
                      className="bg-gold text-[#1A1204] font-semibold text-[15px] px-8 py-4 rounded-[var(--btn-radius)] whitespace-nowrap hover:bg-gold-light transition-colors"
                    >
                      {c.ctaLabel}
                    </Link>
                  ) : null}
                </div>
              </Reveal>
            );

          case "quote":
            if (!c.quote) return null;
            return (
              <Reveal key={block.id} variant={variant} className="w-full bg-navy">
                <div className="container-page py-20 max-w-3xl mx-auto text-center">
                  <div
                    className="font-serif text-2xl text-[#FAF7EF] leading-snug"
                    dangerouslySetInnerHTML={{ __html: `&ldquo;${sanitizeRichText(c.quote)}&rdquo;` }}
                  />
                  {c.attribution ? <div className="mt-6 text-sm font-semibold text-gold-light">{c.attribution}</div> : null}
                </div>
              </Reveal>
            );

          case "gallery": {
            const images: { url: string; caption?: string }[] = Array.isArray(c.images) ? c.images : [];
            if (images.length === 0) return null;
            return (
              <Reveal key={block.id} variant={variant} stagger className="container-page py-16">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {images.map((img, i) => (
                    <figure key={i} className="rounded-[var(--radius)] overflow-hidden bg-navy">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.caption || ""} className="w-full h-40 object-cover" />
                    </figure>
                  ))}
                </div>
              </Reveal>
            );
          }

          case "spacer":
            return <div key={block.id} style={{ height: `${Number(c.height) || 48}px` }} aria-hidden="true" />;

          case "faq": {
            // A plain Q&A list an admin can drop onto any page from
            // Admin → Page Builder — this is the site's AEO/GEO (Answer
            // Engine / Generative Engine Optimization) building block: a
            // clear, literal question-and-answer pairing is exactly the
            // shape an AI answer engine (ChatGPT, Perplexity, Google AI
            // Overviews) looks for to quote directly, and the accompanying
            // FAQPage JSON-LD schema.org markup below is the same signal
            // traditional search (Google's own FAQ rich results) reads.
            // Nothing here is hardcoded — every question, answer, and
            // whether this block exists on a given page at all, is
            // whatever an admin added through the Page Builder.
            const items: { question: string; answer: string }[] = Array.isArray(c.items) ? c.items : [];
            if (items.length === 0) return null;
            const schema = {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: items.map((qa) => ({
                "@type": "Question",
                name: qa.question,
                acceptedAnswer: { "@type": "Answer", text: qa.answer },
              })),
            };
            return (
              <Reveal key={block.id} variant={variant} className="container-page py-16">
                <script type="application/ld+json" dangerouslySetInnerHTML={safeJsonLd(schema)} />
                <div className="max-w-3xl mx-auto">
                  {c.headline ? <h2 className="font-serif text-3xl text-ink leading-tight mb-8">{c.headline}</h2> : null}
                  <div className="flex flex-col divide-y divide-line border-t border-b border-line">
                    {items.map((qa, i) => (
                      <details key={i} className="group py-5">
                        <summary className="flex items-center justify-between gap-4 cursor-pointer list-none">
                          <span className="font-serif text-[17px] text-ink font-semibold">{qa.question}</span>
                          <span className="text-slate-400 text-xl leading-none group-open:rotate-45 transition-transform flex-shrink-0">+</span>
                        </summary>
                        <p className="text-[14.5px] text-muted leading-relaxed mt-3 max-w-2xl">{qa.answer}</p>
                      </details>
                    ))}
                  </div>
                </div>
              </Reveal>
            );
          }

          default:
            return null;
        }
      })}
    </>
  );
}
