import { notFound } from "next/navigation";
import { getTeam, getPageBlocks, getSectionAnimations, getSectionEffects, DELAY_MS, defaultSectionEffect, getSectionVisibility, buildPageMetadata, getPageTypography, getPageHeader, getSiteConfig, HEADING_SIZE_PX, BODY_SIZE_PX, HEADING_FONT_CLASS, SITE_URL } from "@/lib/api";
import { isLocale, type Locale } from "@/lib/i18n";
import { sanitizeRichText } from "@/lib/rich-text";
import { safeJsonLd } from "@/lib/json-ld";
import Reveal from "@/components/site/Reveal";
import type { RevealVariant } from "@/components/site/Reveal";
import ContactIcons from "@/components/site/ContactIcons";
import BioReveal from "@/components/site/BioReveal";
import PageBlocks from "@/components/site/PageBlocks";

export async function generateMetadata({ params }: { params: { lang: string } }) {
  return buildPageMetadata(
    "/team",
    params.lang,
    "Our Team — EFC",
    "Meet the partners and directors who lead every EFC engagement.",
  );
}

export default async function TeamPage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) notFound();
  const lang = params.lang as Locale;
  const [team, sectionAnim, sectionEffects, sectionVis, typography, header, siteConfig, pageBlocks] = await Promise.all([
    getTeam(lang),
    getSectionAnimations("team"),
    getSectionEffects("team"),
    getSectionVisibility("team"),
    getPageTypography("team"),
    getPageHeader("team", params.lang),
    getSiteConfig(lang),
    getPageBlocks("team", lang),
  ]);
  const anim = (key: string): RevealVariant => (sectionAnim[key] as RevealVariant) || "fade-up";
  const fx = (key: string) => sectionEffects[key] ?? defaultSectionEffect;
  const visible = (key: string): boolean => sectionVis[key] !== false;

  // One Person entry per team member, admin-populated (Admin → Team) — lets
  // an AI answer engine or a Google "People also ask"-style result cite a
  // specific partner by name/title/qualification rather than treating the
  // whole page as one undifferentiated block of text.
  const teamSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: team.map((member, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Person",
        name: member.name,
        jobTitle: member.position,
        ...(member.photoUrl ? { image: member.photoUrl } : {}),
        ...(member.email ? { email: member.email } : {}),
        ...(member.linkedinUrl ? { sameAs: [member.linkedinUrl] } : {}),
        worksFor: { "@type": "Organization", name: siteConfig.name, url: SITE_URL },
      },
    })),
  };

  return (
    <>
    <div className="container-page py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={safeJsonLd(teamSchema)} />
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

      {visible("grid") ? (() => {
        const partners = team.filter((m) => m.category === "Partner");
        const keyMembers = team.filter((m) => m.category !== "Partner");
        const groups: { label: string; members: typeof team }[] = [
          ...(partners.length > 0 ? [{ label: "Partners", members: partners }] : []),
          ...(keyMembers.length > 0 ? [{ label: "Key Members", members: keyMembers }] : []),
        ];
        // If nobody's been categorized as a Partner yet, fall back to one
        // flat grid (the pre-split behavior) instead of an odd "Key
        // Members" heading over the whole team.
        const showHeadings = partners.length > 0 && keyMembers.length > 0;
        return (
      <Reveal variant={anim("grid")} speed={fx("grid").speed} delay={DELAY_MS[fx("grid").delay]} hover={fx("grid").hover} stagger={fx("grid").stagger} background={fx("grid").background} backgroundColor={fx("grid").backgroundColor} backgroundTextColor={fx("grid").backgroundTextColor}>
        {groups.map((group) => (
        <div key={group.label} className="mt-14 first:mt-14 [&:not(:first-child)]:mt-16">
          {showHeadings ? (
            <h2 className="font-serif text-xl text-ink mb-6">{group.label}</h2>
          ) : null}
        {/* Deliberately NOT the site's shared "hairline grid" convention
            (card-grid + gap-px + container bg-line) here — that technique
            paints the container's own background through any *unfilled*
            grid cell, which is exactly the case an incomplete last row
            creates (e.g. 3 people in a 4-column row). It used to need a
            same-color filler div to hide that; simpler and more robust to
            just give each card its own border and a real gap, so an
            incomplete row has nothing to fill — it just ends. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 card-grid gap-5">
          {group.members.map((member) => (
            <div key={member.name} className="bg-white border border-line p-7">
              {member.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.photoUrl}
                  alt={member.name}
                  style={{ objectPosition: member.photoPosition || "center" }}
                  className="w-full aspect-square object-cover border border-line mb-5"
                />
              ) : null}
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[16px] font-semibold text-ink">{member.name}</h3>
                <ContactIcons name={member.name} linkedinUrl={member.linkedinUrl} email={member.email} phone={member.phone} />
              </div>
              <div className="text-[13.5px] text-gold mt-0.5">{member.position}</div>
              <div className="text-[12.5px] text-slate-500 mt-1">{member.branch}</div>
              <BioReveal bio={sanitizeRichText(member.bio)} name={member.name} />
              <div className="text-[12px] text-slate-500 mt-3">
                {member.qualification} · {member.languages.join(", ")}
              </div>
            </div>
          ))}
        </div>
        </div>
        ))}
      </Reveal>
        );
      })() : null}
    </div>
    <PageBlocks blocks={pageBlocks} lang={lang} />
    </>
  );
}
