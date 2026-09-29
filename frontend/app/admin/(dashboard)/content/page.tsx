import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";
import {
  updateHeroAction,
  updateStatsAction,
  updateTrustBadgesAction,
  updateWhyChooseUsAction,
  updateIndustriesAction,
  updateAboutIntroAction,
  updateAboutValuesAction,
  updateAboutTimelineAction,
  updateAboutLeadershipAction,
  updateAboutGalleryAction,
  updateAboutMilestoneAnimationAction,
} from "@/lib/admin-actions";
import FieldLabel from "@/components/admin/FieldLabel";
import HeroForm from "@/components/admin/HeroForm";
import RichTextField from "@/components/admin/RichTextField";
import TypographyForm from "@/components/admin/TypographyForm";
import PageHeaderForm from "@/components/admin/PageHeaderForm";
import SectionAnimationsForm from "@/components/admin/SectionAnimationsForm";
import ImageUploadField from "@/components/admin/ImageUploadField";
import DraggableImageRowsField from "@/components/admin/DraggableImageRowsField";
import {
  heroContent as defaultHero,
  stats as defaultStats,
  trustBadges as defaultTrustBadges,
  whyChooseUs as defaultWhyChooseUs,
  industries as defaultIndustries,
  aboutIntro as defaultAboutIntro,
  aboutValues as defaultAboutValues,
  aboutTimeline as defaultAboutTimeline,
  aboutLeadership as defaultAboutLeadership,
  aboutGallery as defaultAboutGallery,
  aboutMilestoneAnimation as defaultAboutMilestoneAnimation,
} from "@/lib/content";

const PAGES = [
  { key: "home", label: "Home" },
  { key: "about", label: "About" },
  { key: "services", label: "Services" },
  { key: "team", label: "Team" },
  { key: "careers", label: "Careers" },
  { key: "insights", label: "Insights" },
  { key: "contact", label: "Contact" },
  { key: "find-an-expert", label: "Find an Expert" },
];

const PAGE_KEYS = PAGES.map((p) => p.key);
type PageKey = (typeof PAGE_KEYS)[number];

const inputCls = "w-full border border-line px-3.5 py-2.5 text-[14px] focus:outline-none focus:border-ink";
const btnCls = "mt-2 bg-gold text-[#1A1204] font-semibold text-[13.5px] px-5 py-2.5 rounded-[var(--radius)] self-start";
const cardCls = "bg-white border border-line p-6 max-w-3xl";

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: { page?: string; saved?: string; error?: string };
}) {
  const page: PageKey = (PAGE_KEYS as string[]).includes(searchParams.page ?? "") ? (searchParams.page as PageKey) : "home";
  const res = await adminFetch(`/content/${page}/en`);
  if (res.status === 401) redirect("/admin/login");
  const content: Record<string, any> = res.ok ? await res.json() : {};

  return (
    <div className="px-9 py-8">
      <h1 className="text-2xl font-bold text-ink mb-1">Pages &amp; Content</h1>
      <p className="text-[13.5px] text-slate-500 mb-5">
        Type your changes into the fields below and save — no code or technical formatting needed. Changes appear on
        the live site right away.
      </p>

      <div className="flex flex-wrap gap-2 mb-7">
        {PAGES.map((p) => (
          <Link
            key={p.key}
            href={`/admin/content?page=${p.key}`}
            className={`text-[13px] font-semibold px-4 py-2 rounded-full border ${
              p.key === page ? "bg-ink text-white border-ink" : "bg-white text-ink border-line"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>


      <TypographyForm
        page={page}
        saved={content.typography ?? {}}
        detailNote={
          page === "services"
            ? " Also applies to each service's detail page."
            : page === "insights"
              ? " Also applies to each article's detail page."
              : undefined
        }
      />

      {page !== "home" ? <PageHeaderForm page={page} saved={content.pageHeader ?? {}} /> : null}

      {page === "home" ? (
        <HomeForms content={content} />
      ) : page === "about" ? (
        <AboutForms content={content} />
      ) : page === "services" ? (
        <ServicesForms content={content} />
      ) : (
        <AnimationsOnlyForms page={page} content={content} />
      )}
    </div>
  );
}

const HOME_SECTIONS: [string, string][] = [
  ["stats", "Stats Band"],
  ["freezone", "Approved Freezone Banner"],
  ["trustBadges", "Trust Strip"],
  ["clientLogos", "Client Logos"],
  ["services", "Services Grid"],
  ["whyChooseUs", "Why Choose Us"],
  ["industries", "Industries"],
  ["testimonials", "Testimonials"],
  ["insights", "Latest Insights"],
  ["locations", "Locations"],
  ["cta", "Bottom Call-to-Action"],
];

const ABOUT_SECTIONS: [string, string][] = [
  ["intro", "Story / Mission / Vision"],
  ["gallery", "Photo Gallery"],
  ["values", "Values"],
  ["timeline", "Milestones"],
  ["leadership", "Leadership Message"],
];

const SERVICES_SECTIONS: [string, string][] = [
  ["grid", "Services Grid (list page)"],
  ["responsiblePerson", "Responsible Person card (detail page)"],
  ["detail", "Who / Process / Timeline / Cost (detail page)"],
  ["benefits", "Benefits (detail page)"],
  ["faqs", "FAQs (detail page)"],
];

const TEAM_SECTIONS: [string, string][] = [["grid", "Team Grid"]];

const CAREERS_SECTIONS: [string, string][] = [["openings", "Current Openings List"]];

const INSIGHTS_SECTIONS: [string, string][] = [
  ["grid", "Articles Grid (list page)"],
  ["article", "Article Body (detail page)"],
];

const CONTACT_SECTIONS: [string, string][] = [
  ["form", "Contact Form"],
  ["offices", "Our Offices"],
];

const FIND_AN_EXPERT_SECTIONS: [string, string][] = [
  ["filters", "Filter Bar"],
  ["grid", "Expert Grid"],
];

const OTHER_PAGE_SECTIONS: Record<string, [string, string][]> = {
  team: TEAM_SECTIONS,
  careers: CAREERS_SECTIONS,
  insights: INSIGHTS_SECTIONS,
  contact: CONTACT_SECTIONS,
  "find-an-expert": FIND_AN_EXPERT_SECTIONS,
};

const OTHER_PAGE_NOTES: Record<string, ReactNode> = {
  team: (
    <>
      Team members (photo, name, position, bio) are managed in{" "}
      <a href="/admin/team" className="underline">Admin → Team</a>. This tab only controls how the team grid
      animates as visitors scroll.
    </>
  ),
  careers: (
    <>
      The intro paragraph and job openings are managed in{" "}
      <a href="/admin/careers" className="underline">Admin → Careers</a>. This tab only controls how the openings
      list animates as visitors scroll.
    </>
  ),
  insights: (
    <>
      Articles (title, excerpt, body, cover image) are managed in{" "}
      <a href="/admin/insights" className="underline">Admin → Insights</a>. This tab only controls how the
      articles list and article body animate as visitors scroll.
    </>
  ),
  contact: <>This tab controls how the contact form and offices list animate as visitors scroll to them.</>,
  "find-an-expert": <>This tab controls how the filter bar and expert grid animate as visitors scroll to them.</>,
};

// Pages whose prose/list content is fully managed on their own admin screen
// (Team, Careers, Insights) or that have no editable prose at all (Contact,
// Find an Expert) — here we only expose the Section Animations control, so
// every page on the site gets the same "font/size/color/animation from the
// dashboard" treatment the user asked for, without duplicating fields that
// already live elsewhere.
function AnimationsOnlyForms({ page, content }: { page: string; content: Record<string, any> }) {
  const sections = OTHER_PAGE_SECTIONS[page] ?? [];
  return (
    <div className="flex flex-col gap-6">
      <p className="text-[13px] text-slate-500 max-w-2xl">{OTHER_PAGE_NOTES[page]}</p>
      <SectionAnimationsForm page={page} sections={sections} savedAnimations={content.sectionAnimations ?? {}} savedVisibility={content.sectionVisibility ?? {}} savedEffects={content.sectionEffects ?? {}} />
    </div>
  );
}

function ServicesForms({ content }: { content: Record<string, any> }) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-[13px] text-slate-500 max-w-2xl">
        Individual services (title, description, image, benefits, FAQs, etc.) are managed in{" "}
        <a href="/admin/services" className="underline">Admin → Services</a>. This tab only controls how the
        services pages animate as visitors scroll.
      </p>
      <SectionAnimationsForm page="services" sections={SERVICES_SECTIONS} savedAnimations={content.sectionAnimations ?? {}} savedVisibility={content.sectionVisibility ?? {}} savedEffects={content.sectionEffects ?? {}} />
    </div>
  );
}

function HomeForms({ content }: { content: Record<string, any> }) {
  const hero = { ...defaultHero, ...(content.hero ?? {}) };
  const stats: { value: string; label: string }[] =
    Array.isArray(content.stats) && content.stats.length > 0 ? content.stats : defaultStats;
  // Trust Strip / Industries used to be saved as plain string[] before the
  // photo-upload feature; normalize old saves into the new row-object shape
  // so the admin form doesn't crash on legacy content.
  const trustBadges: { label: string; logoUrl?: string }[] =
    Array.isArray(content.trustBadges) && content.trustBadges.length > 0
      ? content.trustBadges.map((row: any) => (typeof row === "string" ? { label: row } : row))
      : defaultTrustBadges;
  const whyChooseUs: { title: string; description: string; iconUrl?: string }[] =
    Array.isArray(content.whyChooseUs) && content.whyChooseUs.length > 0 ? content.whyChooseUs : defaultWhyChooseUs;
  const industries: { name: string; iconUrl?: string }[] =
    Array.isArray(content.industries) && content.industries.length > 0
      ? content.industries.map((row: any) => (typeof row === "string" ? { name: row } : row))
      : defaultIndustries;

  return (
    <div className="flex flex-col gap-6">
      {/* HERO */}
      <HeroForm action={updateHeroAction} hero={hero} />

      {/* FREEZONE BANNER — now a multi-entry list (one or more approvals
          that auto-rotate), managed on its own dedicated screen the same
          way Client Logos and Testimonials are. */}
      <div className="bg-white border border-line p-6 max-w-3xl">
        <h2 className="text-[15px] font-bold text-ink mb-1">Approved Freezone / Partnership Banner</h2>
        <p className="text-[12.5px] text-slate-400 mb-4">
          Manage one or more approvals — each with its own photo/video, headline and link. With more than one
          active, they auto-rotate on the homepage. This section&apos;s visibility and scroll-in animation are still
          set below, in Section Visibility &amp; Animations.
        </p>
        <a
          href="/admin/freezone"
          className="inline-block bg-gold text-[#1A1204] font-semibold text-[13.5px] px-5 py-2.5 rounded-[var(--radius)]"
        >
          Manage Freezone Approvals →
        </a>
      </div>

      {/* STATS */}
      <form action={updateStatsAction} className={cardCls}>
        <h2 className="text-[15px] font-bold text-ink mb-1">Stats</h2>
        <p className="text-[12.5px] text-slate-400 mb-4">
          The numbers shown on the dark band (e.g. years in practice, clients advised). Leave a row blank to remove it.
        </p>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => {
            const s = stats[i];
            return (
              <div key={i} className="grid grid-cols-2 gap-3">
                <input name={`stat_${i}_value`} placeholder="e.g. 25+" defaultValue={s?.value ?? ""} className={inputCls} />
                <input name={`stat_${i}_label`} placeholder="e.g. Years in Practice" defaultValue={s?.label ?? ""} className={inputCls} />
              </div>
            );
          })}
        </div>
        <button type="submit" className={btnCls}>Save Stats</button>
      </form>

      {/* TRUST STRIP */}
      <form action={updateTrustBadgesAction} encType="multipart/form-data" className={cardCls}>
        <h2 className="text-[15px] font-bold text-ink mb-1">Trust Strip</h2>
        <p className="text-[12.5px] text-slate-400 mb-4">
          Up to 8 credentials (e.g. &ldquo;ISO 27001 Certified&rdquo;), each with an optional logo/badge image. Drag
          the grip to reorder, or use &times; to remove a row.
        </p>
        <DraggableImageRowsField
          prefix="trustBadges"
          max={8}
          initialRows={trustBadges}
          emptyRow={{ label: "", logoUrl: "" }}
          imageField="logoUrl"
          imageLabel="Logo"
          addLabel="Add a credential"
          fields={[{ key: "label", placeholder: "Credential", className: inputCls }]}
        />
        <button type="submit" className={btnCls}>Save Trust Strip</button>
      </form>

      {/* WHY CHOOSE US */}
      <form action={updateWhyChooseUsAction} encType="multipart/form-data" className={cardCls}>
        <h2 className="text-[15px] font-bold text-ink mb-1">Why Choose Us</h2>
        <p className="text-[12.5px] text-slate-400 mb-4">
          Up to 6 reasons, each with an optional icon image (falls back to the default checkmark icon when left
          empty). Drag the grip to reorder, or use &times; to remove a row.
        </p>
        <DraggableImageRowsField
          prefix="why"
          max={6}
          initialRows={whyChooseUs}
          emptyRow={{ title: "", description: "", iconUrl: "" }}
          imageField="iconUrl"
          imageLabel="Icon"
          addLabel="Add a reason"
          fields={[
            { key: "title", placeholder: "Title", className: inputCls },
            { key: "description", placeholder: "Description", className: inputCls },
          ]}
        />
        <button type="submit" className={btnCls}>Save Why Choose Us</button>
      </form>

      {/* INDUSTRIES */}
      <form action={updateIndustriesAction} encType="multipart/form-data" className={cardCls}>
        <h2 className="text-[15px] font-bold text-ink mb-1">Industries</h2>
        <p className="text-[12.5px] text-slate-400 mb-4">
          Up to 10 industries, each with an optional small tag icon. Drag the grip to reorder, or use &times; to
          remove a row.
        </p>
        <DraggableImageRowsField
          prefix="industries"
          max={10}
          initialRows={industries}
          emptyRow={{ name: "", iconUrl: "" }}
          imageField="iconUrl"
          imageLabel="Icon"
          addLabel="Add an industry"
          fields={[{ key: "name", placeholder: "Industry", className: inputCls }]}
        />
        <button type="submit" className={btnCls}>Save Industries</button>
      </form>

      <SectionAnimationsForm page="home" sections={HOME_SECTIONS} savedAnimations={content.sectionAnimations ?? {}} savedVisibility={content.sectionVisibility ?? {}} savedEffects={content.sectionEffects ?? {}} />
    </div>
  );
}

function AboutForms({ content }: { content: Record<string, any> }) {
  const intro = { ...defaultAboutIntro, ...(content.intro ?? {}) };
  const values: { title: string; description: string }[] =
    Array.isArray(content.values) && content.values.length > 0 ? content.values : defaultAboutValues;
  const timeline: { year: string; event: string }[] =
    Array.isArray(content.timeline) && content.timeline.length > 0 ? content.timeline : defaultAboutTimeline;
  const leadership = { ...defaultAboutLeadership, ...(content.leadership ?? {}) };
  const galleryPhotos: { url: string; caption?: string }[] =
    Array.isArray(content.gallery?.photos) ? content.gallery.photos : defaultAboutGallery.photos;
  const milestoneAnimation = { ...defaultAboutMilestoneAnimation, ...(content.milestoneAnimation ?? {}) };

  return (
    <div className="flex flex-col gap-6">
      {/* INTRO */}
      <form action={updateAboutIntroAction} encType="multipart/form-data" className={cardCls}>
        <h2 className="text-[15px] font-bold text-ink mb-4">Story, Mission &amp; Vision</h2>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <ImageUploadField
              id="image"
              label="About Page Image"
              hint="Optional — shown alongside the company story on the About page. Uploaded to Cloudinary."
              fileFieldName="image"
              existingUrlFieldName="existingImageUrl"
              currentUrl={intro.imageUrl}
              previewClassName="w-32 h-20 object-cover border border-line"
              previewStyle={{ objectPosition: intro.imagePosition || "center" }}
            />
            <div>
              <FieldLabel htmlFor="imagePosition" hint="Which part of the image stays visible when it's cropped to fit.">Image Position</FieldLabel>
              <select id="imagePosition" name="imagePosition" defaultValue={intro.imagePosition || "center"} className={`${inputCls} bg-white`}>
                <option value="top">Top</option>
                <option value="center">Center</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>
          </div>
          <RichTextField
            name="story"
            label="Company Story"
            hint="The opening paragraph on the About page. Use the toolbar for bold, italic, underline, size and color."
            defaultValueHtml={intro.story}
            rows={4}
          />
          <div>
            <FieldLabel htmlFor="mission" hint="Why the firm exists and who it serves.">Mission</FieldLabel>
            <textarea id="mission" name="mission" rows={2} defaultValue={intro.mission} className={inputCls} />
          </div>
          <div>
            <FieldLabel htmlFor="vision" hint="Where the firm is headed.">Vision</FieldLabel>
            <textarea id="vision" name="vision" rows={2} defaultValue={intro.vision} className={inputCls} />
          </div>
        </div>
        <button type="submit" className={btnCls}>Save Story, Mission &amp; Vision</button>
      </form>

      {/* VALUES */}
      <form action={updateAboutValuesAction} className={cardCls}>
        <h2 className="text-[15px] font-bold text-ink mb-1">Values</h2>
        <p className="text-[12.5px] text-slate-400 mb-4">Leave a row's title blank to remove it.</p>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => {
            const v = values[i];
            return (
              <div key={i} className="grid grid-cols-[1fr_2fr] gap-3">
                <input name={`value_${i}_title`} placeholder="Title" defaultValue={v?.title ?? ""} className={inputCls} />
                <input name={`value_${i}_description`} placeholder="Description" defaultValue={v?.description ?? ""} className={inputCls} />
              </div>
            );
          })}
        </div>
        <button type="submit" className={btnCls}>Save Values</button>
      </form>

      {/* TIMELINE */}
      <form action={updateAboutTimelineAction} className={cardCls}>
        <h2 className="text-[15px] font-bold text-ink mb-1">Firm Timeline</h2>
        <p className="text-[12.5px] text-slate-400 mb-4">Leave a row's year blank to remove it.</p>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 8 }).map((_, i) => {
            const t = timeline[i];
            return (
              <div key={i} className="grid grid-cols-[100px_1fr] gap-3">
                <input name={`timeline_${i}_year`} placeholder="Year" defaultValue={t?.year ?? ""} className={inputCls} />
                <input name={`timeline_${i}_event`} placeholder="What happened" defaultValue={t?.event ?? ""} className={inputCls} />
              </div>
            );
          })}
        </div>
        <button type="submit" className={btnCls}>Save Timeline</button>
      </form>

      {/* LEADERSHIP */}
      <form action={updateAboutLeadershipAction} encType="multipart/form-data" className={cardCls}>
        <h2 className="text-[15px] font-bold text-ink mb-4">Leadership Message</h2>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <ImageUploadField
              id="image"
              label="Photo"
              hint="Optional headshot of the managing partner, shown beside the message on the About page. Uploaded to Cloudinary."
              fileFieldName="image"
              existingUrlFieldName="existingImageUrl"
              currentUrl={leadership.imageUrl}
              previewClassName="w-20 h-20 rounded-full object-cover border border-line"
              previewStyle={{ objectPosition: leadership.imagePosition || "center" }}
            />
            <div>
              <FieldLabel htmlFor="imagePosition" hint="Which part of the photo stays visible when it's cropped to fit.">Image Position</FieldLabel>
              <select id="imagePosition" name="imagePosition" defaultValue={leadership.imagePosition || "center"} className={`${inputCls} bg-white`}>
                <option value="top">Top</option>
                <option value="center">Center</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>
          </div>
          <RichTextField
            name="message"
            label="Message"
            hint="A short quote from firm leadership. Use the toolbar for bold, italic, underline, size and color."
            defaultValueHtml={leadership.message}
            rows={3}
          />
          <div>
            <FieldLabel htmlFor="name" hint="Who the quote is attributed to.">Attributed To</FieldLabel>
            <input id="name" name="name" defaultValue={leadership.name} className={inputCls} />
          </div>
        </div>
        <button type="submit" className={btnCls}>Save Leadership Message</button>
      </form>

      {/* PHOTO GALLERY */}
      <form action={updateAboutGalleryAction} encType="multipart/form-data" className={cardCls}>
        <h2 className="text-[15px] font-bold text-ink mb-1">Photo Gallery</h2>
        <p className="text-[12.5px] text-slate-400 mb-4">
          Up to 8 team or office photos that crossfade into one another on the About page. Add an optional caption
          per photo. Drag the grip to reorder, or use &times; to take one down.
        </p>
        <DraggableImageRowsField
          prefix="photo"
          max={8}
          initialRows={galleryPhotos}
          emptyRow={{ url: "", caption: "" }}
          imageField="url"
          imageFileFieldSuffix="image"
          imageLabel="Photo"
          addLabel="Add a photo"
          fields={[{ key: "caption", placeholder: "Caption (optional)", className: inputCls }]}
        />
        <button type="submit" className={btnCls}>Save Photo Gallery</button>
      </form>

      {/* MILESTONES ANIMATION */}
      <form action={updateAboutMilestoneAnimationAction} encType="multipart/form-data" className={cardCls}>
        <h2 className="text-[15px] font-bold text-ink mb-1">Milestones Animation</h2>
        <p className="text-[12.5px] text-slate-400 mb-4">
          The small character that walks across the Milestones section on the About page. Upload your own photos or
          illustrations for the three walk-cycle frames below — a standing pose and two mid-stride poses, swapped
          in place to fake a walking motion — or leave any of them as-is to keep the current one. &ldquo;Remove&rdquo;
          resets a frame back to the built-in default character.
        </p>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <ImageUploadField
            id="idle"
            label="Standing / Idle Pose"
            hint="Shown before the character starts walking, and while it's resting at a milestone."
            fileFieldName="idle"
            existingUrlFieldName="existingIdleUrl"
            removeFieldName="idleRemove"
            currentUrl={milestoneAnimation.idleImageUrl}
            previewClassName="w-full h-28 object-contain object-bottom border border-line bg-white"
          />
          <ImageUploadField
            id="walk1"
            label="Walking Pose 1"
            hint="First mid-stride frame."
            fileFieldName="walk1"
            existingUrlFieldName="existingWalk1Url"
            removeFieldName="walk1Remove"
            currentUrl={milestoneAnimation.walk1ImageUrl}
            previewClassName="w-full h-28 object-contain object-bottom border border-line bg-white"
          />
          <ImageUploadField
            id="walk2"
            label="Walking Pose 2"
            hint="Second mid-stride frame — alternates with Pose 1 while walking."
            fileFieldName="walk2"
            existingUrlFieldName="existingWalk2Url"
            removeFieldName="walk2Remove"
            currentUrl={milestoneAnimation.walk2ImageUrl}
            previewClassName="w-full h-28 object-contain object-bottom border border-line bg-white"
          />
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <FieldLabel htmlFor="speed" hint="How unhurried the walk between milestones feels.">Walk Speed</FieldLabel>
            <select id="speed" name="speed" defaultValue={milestoneAnimation.speed} className={`${inputCls} bg-white`}>
              <option value="slow">Slow (a relaxed, human pace)</option>
              <option value="medium">Medium</option>
              <option value="fast">Fast</option>
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="size" hint="How large the character renders on the page.">Character Size</FieldLabel>
            <select id="size" name="size" defaultValue={milestoneAnimation.size} className={`${inputCls} bg-white`}>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="revealOnArrival" hint="On: each milestone's card only appears once the character reaches it. Off: every card is visible immediately.">
              Card Reveal
            </FieldLabel>
            <label className="flex items-center gap-2 text-[13.5px] text-ink mt-2.5">
              <input
                type="checkbox"
                id="revealOnArrival"
                name="revealOnArrival"
                defaultChecked={milestoneAnimation.revealOnArrival}
                className="w-4 h-4"
              />
              Reveal each card only on arrival
            </label>
          </div>
        </div>
        <button type="submit" className={btnCls}>Save Milestones Animation</button>
      </form>

      <SectionAnimationsForm page="about" sections={ABOUT_SECTIONS} savedAnimations={content.sectionAnimations ?? {}} savedVisibility={content.sectionVisibility ?? {}} savedEffects={content.sectionEffects ?? {}} />
    </div>
  );
}
