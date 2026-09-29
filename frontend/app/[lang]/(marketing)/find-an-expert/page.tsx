import { getTeam, getPageBlocks, getSectionAnimations, getSectionEffects, DELAY_MS, defaultSectionEffect, getSectionVisibility, buildPageMetadata, getPageTypography, getPageHeader, HEADING_SIZE_PX, BODY_SIZE_PX, HEADING_FONT_CLASS } from "@/lib/api";
import { isLocale, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import Reveal from "@/components/site/Reveal";
import type { RevealVariant } from "@/components/site/Reveal";
import ContactIcons from "@/components/site/ContactIcons";
import PageBlocks from "@/components/site/PageBlocks";

export async function generateMetadata({ params }: { params: { lang: string } }) {
  return buildPageMetadata(
    "/find-an-expert",
    params.lang,
    "Find an Expert — EFC",
    "Match with the right EFC partner or director for your engagement.",
  );
}

export default async function FindAnExpertPage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) notFound();
  const [team, sectionAnim, sectionEffects, sectionVis, typography, header, pageBlocks] = await Promise.all([
    getTeam(params.lang as Locale),
    getSectionAnimations("find-an-expert"),
    getSectionEffects("find-an-expert"),
    getSectionVisibility("find-an-expert"),
    getPageTypography("find-an-expert"),
    getPageHeader("find-an-expert", params.lang),
    getPageBlocks("find-an-expert", params.lang as Locale),
  ]);
  const anim = (key: string): RevealVariant => (sectionAnim[key] as RevealVariant) || "fade-up";
  const fx = (key: string) => sectionEffects[key] ?? defaultSectionEffect;
  const visible = (key: string): boolean => sectionVis[key] !== false;

  return (
    <>
    <div className="container-page py-24">
      <div className={typography.align === "center" ? "text-center" : ""}>
        {header.eyebrow ? (
          <div className="text-[13px] font-semibold tracking-[0.14em] text-gold uppercase mb-3.5">
            {header.eyebrow}
          </div>
        ) : null}
        <h1 className={`${HEADING_FONT_CLASS[typography.fontFamily]} text-ink max-w-2xl leading-tight mb-6 ${typography.align === "center" ? "mx-auto" : ""}`} style={{ fontSize: HEADING_SIZE_PX[typography.headingSize] }}>
          {header.headline}
        </h1>
        {header.lead ? (
        <p className={`text-muted leading-relaxed max-w-2xl ${typography.align === "center" ? "mx-auto" : ""}`} style={{ fontSize: BODY_SIZE_PX[typography.bodySize] }}>
          {header.lead}
        </p>
        ) : null}
      </div>

      {visible("filters") ? (
      <Reveal variant={anim("filters")} speed={fx("filters").speed} delay={DELAY_MS[fx("filters").delay]} hover={fx("filters").hover} stagger={fx("filters").stagger} background={fx("filters").background} backgroundColor={fx("filters").backgroundColor} backgroundTextColor={fx("filters").backgroundTextColor}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12">
          <select className="border border-line px-4 py-3 text-[14px] bg-white">
            <option>Industry</option>
            <option>Real Estate</option>
            <option>Hospitality</option>
            <option>Financial Services</option>
          </select>
          <select className="border border-line px-4 py-3 text-[14px] bg-white">
            <option>Location</option>
            <option>Dubai</option>
            <option>Abu Dhabi</option>
            <option>Sharjah</option>
          </select>
          <select className="border border-line px-4 py-3 text-[14px] bg-white">
            <option>Service</option>
            <option>External Audit</option>
            <option>VAT Services</option>
            <option>Corporate Tax</option>
          </select>
          <select className="border border-line px-4 py-3 text-[14px] bg-white">
            <option>Language</option>
            <option>English</option>
            <option>Arabic</option>
            <option>German</option>
          </select>
        </div>
      </Reveal>
      ) : null}

      {visible("grid") ? (
      <Reveal variant={anim("grid")} speed={fx("grid").speed} delay={DELAY_MS[fx("grid").delay]} hover={fx("grid").hover} stagger={fx("grid").stagger} background={fx("grid").background} backgroundColor={fx("grid").backgroundColor} backgroundTextColor={fx("grid").backgroundTextColor}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 card-grid gap-px bg-line border border-line mt-12">
          {team.map((member) => (
            <div key={member.name} className="bg-white p-7">
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
                <h2 className="text-[16px] font-semibold text-ink">{member.name}</h2>
                <ContactIcons name={member.name} linkedinUrl={member.linkedinUrl} email={member.email} phone={member.phone} />
              </div>
              <div className="text-[13.5px] text-gold mt-0.5">{member.position}</div>
              <div className="text-[12.5px] text-slate-500 mt-1">
                {member.branch} · {member.languages.join(", ")}
              </div>
            </div>
          ))}
        </div>
      </Reveal>
      ) : null}
    </div>
    <PageBlocks blocks={pageBlocks} lang={params.lang as Locale} />
    </>
  );
}
