import Link from "next/link";
import { notFound } from "next/navigation";
import { getBranches, getPageBlocks, getSectionAnimations, getSectionEffects, DELAY_MS, defaultSectionEffect, getSectionVisibility, buildPageMetadata, getSystemMessage, getPageTypography, getPageHeader, HEADING_SIZE_PX, BODY_SIZE_PX, HEADING_FONT_CLASS, getTestimonialsDisplay, getServices, getUiStrings } from "@/lib/api";
import { submitContactLead } from "@/lib/actions";
import { isLocale, lh, type Locale } from "@/lib/i18n";
import Reveal from "@/components/site/Reveal";
import type { RevealVariant } from "@/components/site/Reveal";
import PageBlocks from "@/components/site/PageBlocks";
import SessionIdField from "@/components/site/SessionIdField";
import PhoneNumberField from "@/components/site/PhoneNumberField";
import BranchMapEmbed from "@/components/site/BranchMapEmbed";
import GoogleReviewBadge from "@/components/site/GoogleReviewBadge";
import CustomSchemaScript from "@/components/site/CustomSchemaScript";

export async function generateMetadata({ params }: { params: { lang: string } }) {
  return buildPageMetadata(
    "/contact",
    params.lang,
    "Contact Us — EFC",
    "Speak with a partner — offices across Dubai, Abu Dhabi and Sharjah.",
  );
}

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: { lang: string };
  searchParams: { success?: string; error?: string };
}) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const [branches, sectionAnim, sectionEffects, sectionVis, typography, header, pageBlocks, testimonialsDisplay, services, ui] = await Promise.all([
    getBranches(),
    getSectionAnimations("contact"),
    getSectionEffects("contact"),
    getSectionVisibility("contact"),
    getPageTypography("contact"),
    getPageHeader("contact", lang),
    getPageBlocks("contact", lang),
    getTestimonialsDisplay(),
    getServices(lang),
    getUiStrings(lang),
  ]);
  const t = ui.contactForm;
  const successMessage = searchParams.success ? await getSystemMessage("message.contact.success", lang) : null;
  const errorMessage =
    searchParams.error === "invalid"
      ? await getSystemMessage("message.contact.invalid", lang)
      : searchParams.error === "duplicate"
      ? await getSystemMessage("message.contact.duplicate", lang)
      : searchParams.error
      ? await getSystemMessage("message.contact.missing_fields", lang)
      : null;
  const anim = (key: string): RevealVariant => (sectionAnim[key] as RevealVariant) || "fade-up";
  const fx = (key: string) => sectionEffects[key] ?? defaultSectionEffect;
  const visible = (key: string): boolean => sectionVis[key] !== false;

  return (
    <>
    <CustomSchemaScript path="/contact" lang={lang} />
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
        {testimonialsDisplay.showOnContactPage && testimonialsDisplay.googleReviewUrl ? (
          <div className={`mt-6 ${typography.align === "center" ? "flex justify-center" : ""}`}>
            <GoogleReviewBadge
              url={testimonialsDisplay.googleReviewUrl}
              rating={testimonialsDisplay.googleRating}
              reviewCount={testimonialsDisplay.googleReviewCount}
            />
          </div>
        ) : null}
      </div>

      {successMessage ? (
        <div className="bg-paper-2 border border-line px-5 py-4 mt-8 max-w-2xl text-[14.5px] text-ink">
          {successMessage}
        </div>
      ) : null}
      {errorMessage ? (
        <div className="bg-red-50 border border-red-200 px-5 py-4 mt-8 max-w-2xl text-[14.5px] text-red-800">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-16 mt-16">
        {visible("form") ? (
        <Reveal variant={anim("form")} speed={fx("form").speed} delay={DELAY_MS[fx("form").delay]} hover={fx("form").hover} stagger={fx("form").stagger} background={fx("form").background} backgroundColor={fx("form").backgroundColor} backgroundTextColor={fx("form").backgroundTextColor}>
        <form action={submitContactLead.bind(null, lang)} className="flex flex-col gap-5">
          <SessionIdField />
          <div>
            <label htmlFor="name" className="block text-[13px] font-semibold text-ink mb-2">
              {t.fullNameLabel}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              minLength={2}
              maxLength={120}
              className="w-full border border-line px-4 py-3 text-[14.5px] focus:outline-none focus:border-ink"
            />
          </div>
          <div>
            <label htmlFor="company" className="block text-[13px] font-semibold text-ink mb-2">
              {t.companyLabel}
            </label>
            <input
              id="company"
              name="company"
              type="text"
              maxLength={160}
              className="w-full border border-line px-4 py-3 text-[14.5px] focus:outline-none focus:border-ink"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-[13px] font-semibold text-ink mb-2">
              {t.emailLabel}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              maxLength={254}
              // Same shape as lib/validation.ts's EMAIL_PATTERN (the one
              // the server action re-checks), expressed as an HTML
              // `pattern` — previously this relied only on the browser's
              // own loose native `type="email"` check, which accepts
              // things the server would then reject with a less friendly
              // redirect-based error.
              pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
              title="Enter a valid email address"
              className="w-full border border-line px-4 py-3 text-[14.5px] focus:outline-none focus:border-ink"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-[13px] font-semibold text-ink mb-2">
              {t.phoneLabel} <span className="font-normal text-slate-400">{t.optionalSuffix}</span>
            </label>
            <PhoneNumberField id="phone" name="phone" />
          </div>
          <div>
            <label htmlFor="service" className="block text-[13px] font-semibold text-ink mb-2">
              {t.serviceLabel} <span className="font-normal text-slate-400">{t.optionalSuffix}</span>
            </label>
            {/* Driven by the real, live Services list (Admin → Services) —
                not a fixed set of options. A native <input list> + <datalist>
                gives a searchable, type-to-filter dropdown for free (the
                browser filters the suggestions as the visitor types) while
                still being a plain text field underneath, so if what they're
                looking for isn't in the list they can simply type their own
                — no separate "Other" option/field needed, since typing
                anything not in the datalist is already how this control
                works. */}
            <input
              id="service"
              name="service"
              type="text"
              list="service-options"
              autoComplete="off"
              placeholder={t.servicePlaceholder}
              maxLength={160}
              className="w-full border border-line px-4 py-3 text-[14.5px] bg-white focus:outline-none focus:border-ink"
            />
            <datalist id="service-options">
              {services.map((s) => (
                <option key={s.slug} value={s.title} />
              ))}
              <option value={t.serviceOtherOption} />
            </datalist>
          </div>
          <div>
            <label htmlFor="message" className="block text-[13px] font-semibold text-ink mb-2">
              {t.messageLabel}
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              maxLength={4000}
              className="w-full border border-line px-4 py-3 text-[14.5px] focus:outline-none focus:border-ink"
            />
          </div>
          <button
            type="submit"
            className="bg-gold text-[#1A1204] font-semibold text-[15px] px-7 py-3.5 rounded-[var(--btn-radius)] self-start mt-2"
          >
            {t.submitButton}
          </button>
        </form>
        </Reveal>
        ) : null}

        {visible("offices") ? (
        <Reveal variant={anim("offices")} speed={fx("offices").speed} delay={DELAY_MS[fx("offices").delay]} hover={fx("offices").hover} stagger={fx("offices").stagger} background={fx("offices").background} backgroundColor={fx("offices").backgroundColor} backgroundTextColor={fx("offices").backgroundTextColor}>
        <div>
          <h2 className="font-serif text-2xl text-ink mb-6">{t.officesHeading}</h2>
          <div className="flex flex-col card-grid gap-px bg-line border border-line">
            {branches.map((b) => (
              <div key={b.city} className="bg-white p-6">
                <div className="font-serif text-lg font-semibold text-ink">{b.city}</div>
                <div className="text-[13.5px] text-muted mt-2 leading-relaxed">
                  {b.address}
                  <br />
                  {b.phone} · {b.email}
                  <br />
                  {b.hours}
                </div>
                {b.externalUrl ? (
                  // This branch runs its own separate website (Admin →
                  // Branches → Edit → "External Website URL") — send the
                  // visitor there directly instead of to this site's own
                  // branch landing page, the same rule the Location Gate and
                  // the header's location picker already follow. Opens in a
                  // new tab so the visitor doesn't lose this site entirely
                  // just from clicking a details link.
                  <a
                    href={b.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-[12.5px] font-semibold text-ink underline underline-offset-2 mt-3"
                  >
                    {b.city} office details &rarr;
                  </a>
                ) : b.slug ? (
                  <Link
                    href={lh(lang, `/${b.slug}`)}
                    className="inline-block text-[12.5px] font-semibold text-ink underline underline-offset-2 mt-3"
                  >
                    {b.city} office details &rarr;
                  </Link>
                ) : null}
                {/* A branch with its own external website has no map here
                    either — it isn't really "this site's office", it's a
                    pointer to a separate site that has its own. */}
                {!b.externalUrl && b.address ? (
                  <div className="mt-5">
                    <div className="text-[12.5px] font-semibold text-ink mb-2">
                      Get Directions to {b.city} Office
                    </div>
                    <BranchMapEmbed address={b.address} city={b.city} heightClass="h-52" className="border border-line" />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
        </Reveal>
        ) : null}
      </div>
    </div>
    <PageBlocks blocks={pageBlocks} lang={lang} />
    </>
  );
}
