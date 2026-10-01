import {
  heroContent as defaultHero,
  freezoneContent as defaultFreezone,
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
  careersIntro as defaultCareersIntro,
  legalPages as defaultLegalPages,
  services as defaultServices,
  team as defaultTeam,
  branches as defaultBranches,
  testimonials as defaultTestimonials,
  jobOpenings as defaultJobOpenings,
  applicationFormFields as defaultApplicationFormFields,
  type ApplicationFormField,
  insights as defaultInsights,
  siteConfig as defaultSiteConfig,
  footerLinks as defaultFooterLinks,
  uiStrings as defaultUiStrings,
  locationGateContent as defaultLocationGate,
  launchGateContent as defaultLaunchGate,
  pageHeaders as defaultPageHeaders,
  type Service,
  type SubService,
  type TeamMember,
  type Branch,
  type JobOpening,
  type InsightArticle,
} from "./content";
import { locales, defaultLocale } from "./i18n";
import { cache } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

// Every fetch to the backend below carries this timeout. Without it, a
// backend that's unreachable in a way that doesn't fail instantly (down but
// something else answers the port, a slow reverse proxy, a stalled Prisma
// query on the API side, a flaky network) leaves the fetch pending
// indefinitely — and since every one of these calls already falls back to
// placeholder content in a `catch` on any error, there's no reason for a
// stuck connection to hang the whole page. This matters most during
// `next build`'s static generation: Next kills a static-generation worker
// that doesn't finish a page within 60 seconds (`staticPageGenerationTimeout`)
// and restarts it, so a single hung fetch could repeatedly blow that budget
// and fail the build outright with "Collecting page data ... is still
// timing out". Failing fast here (well under 60s) means a slow/unreachable
// API degrades a page to its fallback content instead of stalling the build.
const API_TIMEOUT_MS = 8_000;
function withTimeout(): AbortSignal {
  return AbortSignal.timeout(API_TIMEOUT_MS);
}

// ---------------------------------------------------------------------------
// Image protection (Admin → Site Settings → Image Protection): when the
// watermark is enabled, every Cloudinary-hosted photo URL returned by ANY
// apiGet() call below gets a text-overlay transform appended on the fly —
// applied once, here, at the single low-level fetch helper every other
// function in this file goes through, rather than at each of the ~18 places
// across the site that render an <img>. `cache()` (React's per-request
// request memoization) means this only costs one extra fetch per page
// render no matter how many apiGet() calls happen alongside it.
// ---------------------------------------------------------------------------

type ImageProtectionSettings = { disableRightClick: boolean; watermarkEnabled: boolean; watermarkText: string };
const defaultImageProtectionSettings: ImageProtectionSettings = {
  disableRightClick: true,
  watermarkEnabled: false,
  watermarkText: "",
};

// Raw, request-memoized "fetch + parse JSON" with NO watermarking logic and
// NO knowledge of apiGet()/getImageProtectionSettings() — on purpose. apiGet()
// calls getImageProtectionSettings() (below) to decide whether to watermark
// whatever it just fetched, and getImageProtectionSettings() needs to read
// /content/global/en itself. If either of those two ever called back into
// the OTHER one's caller (apiGet() calling getPageContent(), or
// getImageProtectionSettings() calling getPageContent()/apiGet()), you get a
// real cycle: apiGet(path) awaits getImageProtectionSettings(), which awaits
// getPageContent("global","en"), which calls apiGet("/content/global/en"),
// which — being the same apiGet() function — again awaits
// getImageProtectionSettings(). Because that's wrapped in React's cache()
// with no arguments, the second call returns the exact same in-flight
// promise the whole chain started from, which is then awaited by its own
// dependency chain — a promise waiting on itself, which never resolves.
// (This is precisely what caused `next build` to hang past its
// staticPageGenerationTimeout and get killed with SIGTERM, on effectively
// every page, once getImageProtectionSettings briefly routed through
// getPageContent.) fetchJson() is the one shared, de-duped place raw
// content actually gets fetched from the network; apiGet() and
// getImageProtectionSettings() both call it directly and never call each
// other, so the cycle can't form.
const fetchJson = cache(async (path: string): Promise<unknown> => {
  const res = await fetch(`${API_URL}${path}`, { next: { revalidate: 60 }, signal: withTimeout() });
  if (!res.ok) return undefined;
  return res.json();
});

const getImageProtectionSettings = cache(async (): Promise<ImageProtectionSettings> => {
  try {
    const data = (await fetchJson("/content/global/en")) as Record<string, any> | undefined;
    const settings = { ...defaultImageProtectionSettings, ...(data?.siteConfig?.imageProtection ?? {}) };
    // An admin who leaves Watermark Text blank gets the firm's own Company
    // Name stamped instead of a generic placeholder.
    if (!settings.watermarkText) settings.watermarkText = data?.siteConfig?.name || "EFC Auditing";
    return settings;
  } catch {
    return defaultImageProtectionSettings;
  }
});

// Injects a Cloudinary text-overlay transform right after `/image/upload/`
// in the URL — works on any existing Cloudinary image URL with no
// re-upload, and never touches the original file. Non-Cloudinary URLs (the
// placeholder picsum.photos links in content.ts, say) pass through
// untouched, and video URLs are deliberately left alone (Cloudinary's video
// watermark syntax is different, and a text overlay isn't the same
// operation on a moving image).
function withWatermark(url: string, text: string): string {
  if (!url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) return url;
  const safeText = encodeURIComponent(text || "EFC Auditing");
  const transform = `l_text:Arial_16_bold:${safeText},co_white,o_55,g_south_east,x_14,y_14`;
  return url.replace("/image/upload/", `/image/upload/${transform}/`);
}

function deepWatermark<T>(value: T, text: string, key?: string): T {
  // Never stamp the firm's own logo or a partner/client's logo — a
  // watermark only makes sense on photography, not on a brand mark being
  // displayed as-is.
  if (key && /logo/i.test(key)) return value;
  if (typeof value === "string") {
    return (value.includes("res.cloudinary.com") ? withWatermark(value, text) : value) as unknown as T;
  }
  if (Array.isArray(value)) return value.map((v) => deepWatermark(v, text)) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = deepWatermark(v, text, k);
    return out as T;
  }
  return value;
}

// The public URL this site is reachable at — used to build absolute URLs
// for canonical links, Open Graph tags, the sitemap and robots.txt. Set
// NEXT_PUBLIC_SITE_URL in production; localhost is fine for local dev.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

// ---------------------------------------------------------------------------
// Every function below hits the live API first. If the API is unreachable
// (e.g. you're running the frontend without the backend during early UI
// work) or a section simply hasn't been populated in the admin yet, it
// falls back to the placeholder content in `content.ts` instead of
// crashing the page — so the site always renders something sensible.
// ---------------------------------------------------------------------------

async function apiGet<T>(path: string, fallback: T): Promise<T> {
  try {
    const data = await fetchJson(path);
    if (data === undefined) return fallback;
    if (Array.isArray(data) && data.length === 0) return fallback;
    if (data && typeof data === "object" && !Array.isArray(data) && Object.keys(data).length === 0) return fallback;
    const protection = await getImageProtectionSettings();
    if (!protection.watermarkEnabled) return data as T;
    return deepWatermark(data, protection.watermarkText) as T;
  } catch {
    return fallback;
  }
}

// --- Generic per-page content blocks (page/section/languageCode -> JSON) ---

// Wrapped in React's per-request `cache()`: a single page render routinely
// asks for the same page/lang pair many times over (getSiteConfig,
// getNavLinksOverride, getFooterLinksContent, getClientLogosDisplay,
// getSectionAnimations/Effects/Visibility, getPageTypography, etc. all read
// "global" or the current page's own ContentBlock independently). Without
// memoization those turn into that many *separate* concurrent fetch() calls
// to the exact same URL, which is what triggered Next's internal fetch-cache
// de-duping to clone a Response whose body another concurrent caller had
// already consumed ("Response.clone: Body has already been consumed",
// non-fatal but noisy during `next build`'s static generation). Deduping
// here means every caller for a given page/lang shares one in-flight fetch.
export const getPageContent = cache(async (page: string, lang = "en"): Promise<Record<string, any>> => {
  return apiGet<Record<string, any>>(`/content/${page}/${lang}`, {});
});

// --- Page Builder: admin-added freeform blocks on top of any page ---
// (Admin → Page Builder). This is what lets an admin add new homepage/
// about/contact/etc. content themselves — a photo, a video, a rich-text
// note, a CTA banner, a quote, a gallery, or a spacer — without a
// developer adding a new hardcoded section first. See components/site/
// PageBlocks.tsx for how each `type` renders.

export type PageBlock = {
  id: string;
  page: string;
  type: "richText" | "image" | "video" | "imageText" | "cta" | "quote" | "gallery" | "spacer" | "faq";
  content: Record<string, any>;
  animation?: string;
  order?: number;
  isActive?: boolean;
};

export async function getPageBlocks(page: string, lang = "en"): Promise<PageBlock[]> {
  return apiGet<PageBlock[]>(`/page-blocks/${page}?lang=${lang}`, []);
}

// --- Site-wide settings: company name, contact info, logo, social ---

// `logoUrlDark` is a second, optional logo image specifically for the dark
// header/footer bands (Admin → Site Settings → "Logo (for dark
// backgrounds)") — most uploaded logos are dark wordmarks meant for a light
// page background and become invisible once the Theme Builder's header/
// footer color is dark, so this lets an admin supply a light/white variant
// for those two spots specifically. Falls back to `logoUrl` when unset, so
// nothing changes for anyone who never uploads one (see Header.tsx/
// Footer.tsx's `siteConfig.logoUrlDark || siteConfig.logoUrl`).
export type SiteConfig = typeof defaultSiteConfig & { logoUrl?: string; logoUrlDark?: string; social?: Record<string, string> };

// An admin clearing a field back to blank (rather than never having touched
// it) shouldn't make a saved override with an empty string beat a sensible
// default — an empty Company Name, for instance, previously made the About
// page read "is a UAE-based audit..." with nothing before it. Stripping
// blank strings before merging means "unset" and "cleared" behave the same:
// both fall back to the default until something real is typed in.
function withoutBlanks<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== "") (out as any)[key] = value;
  }
  return out;
}

export async function getSiteConfig(lang = "en"): Promise<SiteConfig> {
  const content = await getPageContent("global", lang);
  const saved = withoutBlanks(content.siteConfig ?? {});
  return {
    ...defaultSiteConfig,
    ...saved,
    // Deep-merged rather than replaced wholesale — an admin who has only
    // ever changed, say, the header height shouldn't lose the other three
    // saved sizes (or fall back to 0) just because this object is nested.
    logoSizing: { ...defaultSiteConfig.logoSizing, ...((saved as any).logoSizing ?? {}) },
  };
}

// --- Location gate (pre-homepage location picker) ---

export type LocationGateConfig = typeof defaultLocationGate;

export async function getLocationGateConfig(lang = "en"): Promise<LocationGateConfig> {
  const content = await getPageContent("global", lang);
  return { ...defaultLocationGate, ...(content.locationGate ?? {}) };
}

// --- Launch countdown gate (pre-launch, site-wide) ---
// Deliberately always read as "en" regardless of the visitor's locale —
// admin-configured technical settings (enabled, launchAt, colors) aren't
// translatable content, and the headline/subtext text isn't wired into
// the bulk-translate pipeline yet (see the admin action's own comment).

export type LaunchGateConfig = typeof defaultLaunchGate;

// Deliberately bypasses getPageContent()'s shared fetchJson() (and its
// `revalidate: 60` Data Cache) with a dedicated, always-fresh, uncached
// fetch. This check gates whether EVERY visitor sees the real site at all,
// so it must reflect the true current config on every single request —
// a stale-for-up-to-60-seconds read here could keep the countdown frozen
// past its real launch moment (or briefly reveal the site early right
// after an admin re-enables it), which a 60s cache is fine for ordinary
// page copy but never fine for this.
export async function getLaunchGateConfig(): Promise<LaunchGateConfig> {
  try {
    const res = await fetch(`${API_URL}/content/global/en`, { cache: "no-store", signal: withTimeout() });
    const content = res.ok ? await res.json() : {};
    return { ...defaultLaunchGate, ...((content as any)?.launchGate ?? {}) };
  } catch {
    return defaultLaunchGate;
  }
}

// True only while the gate should actually block the site: the master
// switch is on AND (no launch time is set, OR that time hasn't passed
// yet). Once real server time passes `launchAt`, this flips to false on
// its own — nothing to remember to switch off at the exact moment.
export function isLaunchGateActive(config: LaunchGateConfig): boolean {
  if (!config.enabled) return false;
  if (!config.launchAt) return true;
  const target = new Date(config.launchAt).getTime();
  return Number.isFinite(target) ? Date.now() < target : true;
}

export type LocationGateEntry = { country: string; externalUrl?: string };

// Distinct, non-empty countries drawn from active branches, in the order
// they first appear (which follows the admin's branch `order` field) — this
// is what powers the location gate's list of choices with zero hardcoding.
// A country carries an `externalUrl` when the branch that introduced it has
// one set (Admin → Branches → Edit → "External Website URL") — picking that
// country on the gate sends the visitor there instead of into this site.
//
// Two branches can share the same "Country" value (e.g. two offices in the
// same country, or two admins who both left it at the default) — when that
// happens, whichever branch has an `externalUrl` set wins that slot, even
// if it wasn't the first branch encountered. Without this, a branch added
// (or reordered) after another branch already "claimed" that country would
// silently have its External Website URL ignored on the live gate, even
// though it was saved correctly in the admin dashboard — that's the bug
// this fixes (previously: strictly first-branch-wins, full stop).
export async function getBranchCountries(): Promise<LocationGateEntry[]> {
  const branches = await getBranches();
  const seen = new Map<string, LocationGateEntry>();
  for (const b of branches) {
    if (!b.country) continue;
    const existing = seen.get(b.country);
    if (!existing || (!existing.externalUrl && b.externalUrl)) {
      seen.set(b.country, { country: b.country, externalUrl: b.externalUrl || undefined });
    }
  }
  return Array.from(seen.values());
}

// --- Header nav / footer links ---
// Returns null for navLinks when nothing's been saved yet, so the caller
// can fall back to the built-in translated labels in lib/i18n.ts instead
// of an empty menu.

export async function getNavLinksOverride(lang = "en"): Promise<{ label: string; href: string }[] | null> {
  const content = await getPageContent("global", lang);
  return Array.isArray(content.navLinks) && content.navLinks.length > 0 ? content.navLinks : null;
}

export async function getFooterLinksContent(lang = "en"): Promise<typeof defaultFooterLinks> {
  const content = await getPageContent("global", lang);
  return content.footerLinks ?? defaultFooterLinks;
}

// Admin → Site Settings → UI Text (see `uiStrings` in content.ts for why
// this exists): the Contact form's field labels and the chat widget's
// interface chrome, merged field-by-field over the English defaults so a
// language that hasn't been (re)translated since a new string was added
// still shows something sensible instead of a blank label.
export type UiStrings = typeof defaultUiStrings;

export async function getUiStrings(lang = "en"): Promise<UiStrings> {
  const content = await getPageContent("global", lang);
  const saved = (content.uiStrings ?? {}) as Partial<UiStrings>;
  return {
    contactForm: { ...defaultUiStrings.contactForm, ...(saved.contactForm ?? {}) },
    chatbot: {
      ...defaultUiStrings.chatbot,
      ...(saved.chatbot ?? {}),
      smallTalk: { ...defaultUiStrings.chatbot.smallTalk, ...(saved.chatbot?.smallTalk ?? {}) },
    },
  };
}

// --- Page headers (eyebrow / <h1> / lead paragraph) for pages that have
// one — see the comment on `pageHeaders` in content.ts for why this exists.
// `{name}" in `lead` is replaced with the site's company name so the About
// page's default reads naturally without hardcoding the firm's name here.

export type PageHeader = { eyebrow: string; headline: string; lead: string };

export async function getPageHeader(page: string, lang = "en"): Promise<PageHeader> {
  const defaults = defaultPageHeaders[page] ?? { eyebrow: "", headline: "", lead: "" };
  const [content, siteConfig] = await Promise.all([getPageContent(page, lang), getSiteConfig(lang)]);
  const merged = { ...defaults, ...withoutBlanks(content.pageHeader ?? {}) };
  return { ...merged, lead: merged.lead.replace("{name}", siteConfig.name) };
}

// --- Home page flexible content blocks (hero, stats, trust strip, etc.) ---

export type HomeContent = {
  hero: typeof defaultHero;
  freezone: typeof defaultFreezone;
  stats: typeof defaultStats;
  trustBadges: typeof defaultTrustBadges;
  whyChooseUs: typeof defaultWhyChooseUs;
  industries: typeof defaultIndustries;
};

export async function getHomeContent(lang = "en"): Promise<HomeContent> {
  const content = await getPageContent("home", lang);
  return {
    hero: content.hero ?? defaultHero,
    freezone: { ...defaultFreezone, ...(content.freezone ?? {}) },
    stats: content.stats ?? defaultStats,
    // Both arrays used to be saved as plain strings (before per-item logo/
    // icon uploads existed) — normalize an old string row into the new
    // {label/name, ...Url} shape so a site with existing saved content
    // doesn't break when it updates to this version.
    trustBadges: normalizeRows(content.trustBadges, defaultTrustBadges, "label"),
    whyChooseUs: content.whyChooseUs ?? defaultWhyChooseUs,
    industries: normalizeRows(content.industries, defaultIndustries, "name"),
  };
}

// --- Freezone/regulatory approvals — a firm registered with more than one
// freezone or regulator shows all of them, rotating one after another,
// instead of the single-entry banner this used to be limited to. ---

export type FreezoneApproval = {
  id: string;
  badge: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl?: string;
  imagePosition?: string;
  videoUrl?: string;
  mediaPosition?: "left" | "right";
  order: number;
  isActive: boolean;
};

export async function getFreezoneApprovals(lang = "en"): Promise<FreezoneApproval[]> {
  const approvals = await apiGet<FreezoneApproval[]>(`/freezone-approvals?lang=${lang}`, []);
  if (approvals.length > 0) return approvals;
  // Back-compat: a site updating from before this list existed may still
  // have one enabled entry saved the old way (Admin → Home Content →
  // Freezone Banner). Rather than that content silently disappearing the
  // moment this update is applied, show it as a single-item list until an
  // admin adds real entries through the new Admin → Freezone Approvals
  // screen.
  const legacy = await getHomeContent(lang);
  if (!legacy.freezone.enabled) return [];
  return [{ id: "legacy", order: 0, isActive: true, ...legacy.freezone }];
}

export type FreezoneDisplay = {
  enabled: boolean;
  autoRotateSeconds: number;
  pauseOnHover: boolean;
};

const defaultFreezoneDisplay: FreezoneDisplay = { enabled: true, autoRotateSeconds: 7, pauseOnHover: true };

export async function getFreezoneDisplay(): Promise<FreezoneDisplay> {
  const content = await getPageContent("home");
  return { ...defaultFreezoneDisplay, ...(content.freezoneDisplay ?? {}) };
}

function normalizeRows<T extends Record<string, unknown>>(
  saved: unknown,
  fallback: T[],
  textKey: keyof T,
): T[] {
  if (!Array.isArray(saved) || saved.length === 0) return fallback;
  return saved.map((row) =>
    typeof row === "string" ? ({ [textKey]: row } as unknown as T) : (row as T),
  );
}

// --- About page flexible content blocks ---

export type AboutContent = {
  intro: typeof defaultAboutIntro;
  values: typeof defaultAboutValues;
  timeline: typeof defaultAboutTimeline;
  leadership: typeof defaultAboutLeadership;
  gallery: typeof defaultAboutGallery;
  milestoneAnimation: typeof defaultAboutMilestoneAnimation;
};

export async function getAboutContent(lang = "en"): Promise<AboutContent> {
  const content = await getPageContent("about", lang);
  return {
    intro: content.intro ?? defaultAboutIntro,
    values: content.values ?? defaultAboutValues,
    timeline: content.timeline ?? defaultAboutTimeline,
    leadership: content.leadership ?? defaultAboutLeadership,
    gallery: content.gallery ?? defaultAboutGallery,
    // Merge (not replace) so an admin who's only customized the walk speed
    // still gets the default character images, and vice-versa — same
    // pattern as everywhere else a saved ContentBlock might be a partial
    // object from before this section existed.
    milestoneAnimation: { ...defaultAboutMilestoneAnimation, ...(content.milestoneAnimation ?? {}) },
  };
}

// --- Careers page intro (flexible content block, replaces what used to be
// a hardcoded placeholder paragraph in the page's JSX) ---

export async function getCareersIntro(lang = "en"): Promise<typeof defaultCareersIntro> {
  const content = await getPageContent("careers", lang);
  return content.intro ?? defaultCareersIntro;
}

// --- Legal pages (Privacy Policy / Terms of Service / Cookies & Data Protection) ---

export type LegalPageKey = "privacy" | "terms" | "cookies";

export async function getLegalPage(page: LegalPageKey, lang = "en"): Promise<{ title: string; body: string }> {
  const content = await getPageContent(`legal-${page}`, lang);
  return { ...defaultLegalPages[page], ...(content.content ?? {}) };
}

// --- Services ---

export async function getServices(lang = "en"): Promise<Service[]> {
  return apiGet<Service[]>(`/services?lang=${lang}`, defaultServices);
}

export async function getService(slug: string, lang = "en"): Promise<Service | undefined> {
  const fallback = defaultServices.find((s) => s.slug === slug);
  return apiGet<Service | undefined>(`/services/${slug}?lang=${lang}`, fallback);
}

// A sub-service has no endpoint of its own — it's always fetched by
// loading its parent service (already returns the full sub-services array)
// and picking out the one whose slug matches. Falls back to matching by id
// (as a string) for a sub-service that was never given a slug.
export async function getSubService(
  serviceSlug: string,
  subServiceSlug: string,
  lang = "en",
): Promise<{ service: Service; subService: SubService } | undefined> {
  const service = await getService(serviceSlug, lang);
  const subService = service?.subServices?.find((ss) => (ss.slug || ss.id) === subServiceSlug);
  return service && subService ? { service, subService } : undefined;
}

// The composite key every sub-service's own page uses for the generic
// per-page admin-configuration system (getPageHeader/getPageTypography/
// getSectionAnimations/getSectionEffects/getSectionVisibility — all of
// which take a plain `page: string` with no backend whitelist, see the
// comment on ContentBlock in the API README). Kept as one helper so the
// public page and the admin edit page can never compute this key
// differently from one another.
//
// Deliberately NOT `services/${slug}/${slug}` with real slashes — the
// content-fetching route is `GET /content/:page/:languageCode`, a single
// URL path segment per param, so a literal "/" inside `page` would be
// parsed as extra path segments and 404. "::" isn't a valid slug
// character (slugs are lowercased/hyphenated by `slugify()`), so it can't
// collide with a real slug on either side.
export function subServicePageKey(serviceSlug: string, subServiceSlug: string): string {
  return `subservice::${serviceSlug}::${subServiceSlug}`;
}

// --- Team ---

function mapTeamMember(raw: any): TeamMember {
  return {
    id: raw.id ?? undefined,
    name: raw.name,
    category: raw.category === "Partner" ? "Partner" : "Key Member",
    position: raw.position,
    branch: raw.branch ?? "",
    bio: raw.bio,
    qualification: raw.qualification ?? "",
    languages: raw.languagesSpoken ?? raw.languages ?? [],
    photoUrl: raw.photoUrl ?? undefined,
    photoPosition: raw.photoPosition ?? "center",
    linkedinUrl: raw.linkedinUrl ?? undefined,
    email: raw.email ?? undefined,
    phone: raw.phone ?? undefined,
  };
}

export async function getTeam(lang = "en"): Promise<TeamMember[]> {
  const raw = await apiGet<any[]>(`/team?lang=${lang}`, null as any);
  if (!raw) return defaultTeam;
  return raw.map(mapTeamMember);
}

// --- Branches ---

// Slugifies a city name into the local-SEO landing page slug the spec
// calls for, e.g. "Abu Dhabi" -> "abu-dhabi-audit-firm".
export function branchSlug(city: string): string {
  return (
    city
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + "-audit-firm"
  );
}

function mapBranch(raw: any): Branch {
  return {
    city: raw.city,
    country: raw.country ?? undefined,
    address: raw.address ?? raw.addressLine,
    phone: raw.phone,
    email: raw.email,
    hours: raw.hours ?? raw.workingHours,
    whatsapp: raw.whatsapp ?? undefined,
    googleMapsUrl: raw.googleMapsUrl ?? undefined,
    slug: branchSlug(raw.city),
    externalUrl: raw.externalUrl ?? undefined,
  };
}

export async function getBranches(): Promise<Branch[]> {
  const raw = await apiGet<any[]>(`/branches`, null as any);
  if (!raw) return defaultBranches.map((b) => ({ ...b, slug: branchSlug(b.city) }));
  return raw.map(mapBranch);
}

// Used by the auto-generated branch landing pages
// (app/[lang]/(marketing)/[branchSlug]/page.tsx) to look up a branch by
// its "<city>-audit-firm" slug.
export async function getBranchBySlug(slug: string): Promise<Branch | undefined> {
  const branches = await getBranches();
  return branches.find((b) => b.slug === slug);
}

// --- Testimonials ---

function mapTestimonial(raw: any) {
  return {
    quote: raw.quote,
    name: raw.name ?? raw.clientName,
    role: raw.role ?? raw.clientTitle,
    photoUrl: raw.clientPhotoUrl ?? raw.photoUrl ?? undefined,
    rating: typeof raw.rating === "number" ? raw.rating : 5,
  };
}

export async function getTestimonials(lang = "en") {
  const raw = await apiGet<any[]>(`/testimonials?lang=${lang}`, null as any);
  if (!raw) return defaultTestimonials;
  return raw.map(mapTestimonial);
}

// --- Client logos ---

export async function getClientLogos() {
  return apiGet<{ name: string; imageUrl: string }[]>(`/client-logos`, []);
}

// Display settings for the "Trusted By" logo strip — configured in
// Admin → Client Logos, stored the same flexible way as the location gate.
export type ClientLogosDisplay = {
  // "spread" stretches the row edge-to-edge (space-between) — useful with
  // only a couple of logos in a wide section, so they don't look stranded
  // in the middle.
  alignment: "left" | "center" | "spread";
  size: "sm" | "md" | "lg";
  grayscale: boolean;
  // "scroll" is a continuously auto-scrolling carousel (matches the "logo
  // carousel" label on Admin → Client Logos); "static" is a plain wrapped
  // row using `alignment`. Both respect prefers-reduced-motion.
  motion: "scroll" | "static";
  // How fast the "scroll" marquee moves — a named speed rather than a raw
  // duration, matching every other speed picker in this project (Reveal's
  // own "slow"/"normal"/"fast"). Ignored when motion is "static".
  speed: "slow" | "normal" | "fast";
  // Whether hovering the strip pauses the scroll — on by default so a
  // visitor can actually read a logo they're interested in.
  pauseOnHover: boolean;
  // Where beyond the homepage this strip also appears. The homepage's own
  // showing is still controlled by that page's Section Visibility toggle
  // (Admin → Pages & Content → Home) — these three are additive, for the
  // pages that never had a Section Visibility entry for this at all.
  showOnServicesPage: boolean;
  showOnServiceDetailPage: boolean;
  showOnSubServicePage: boolean;
  // Background color of the shared dark band this strip sits in on the
  // Services list / Service detail / Sub-service detail pages (directly
  // above the Testimonials section there) — blank keeps the original navy.
  // Admin → Client Logos → Display Settings.
  bandColor?: string;
};

const defaultClientLogosDisplay: ClientLogosDisplay = {
  alignment: "center",
  size: "md",
  grayscale: true,
  motion: "scroll",
  speed: "normal",
  pauseOnHover: true,
  showOnServicesPage: false,
  showOnServiceDetailPage: false,
  showOnSubServicePage: false,
  bandColor: "",
};

export async function getClientLogosDisplay(): Promise<ClientLogosDisplay> {
  const content = await getPageContent("global");
  return { ...defaultClientLogosDisplay, ...(content.clientLogosDisplay ?? {}) };
}

// --- Header utility bar (the "Our Locations" / language row above the main
// header) — style is admin-configurable from Admin → Header & Footer rather
// than the single fixed look it used to always render with.
export type HeaderUtilityBarStyle = "bar" | "minimal" | "pill";
export type HeaderUtilityBarConfig = {
  // "bar" (default): the original look — a solid full-width band, same
  //   header color, directly above the main header row.
  // "minimal": no separate band at all — the pickers sit directly on the
  //   main header's own background with no divider, for a lighter, less
  //   "two shelves stacked" feel.
  // "pill": each picker becomes its own small rounded, bordered pill/chip
  //   sitting on the utility band, rather than plain inline text+icon.
  style: HeaderUtilityBarStyle;
};
const defaultHeaderUtilityBar: HeaderUtilityBarConfig = { style: "bar" };
export async function getHeaderUtilityBar(): Promise<HeaderUtilityBarConfig> {
  const content = await getPageContent("global");
  return { ...defaultHeaderUtilityBar, ...(content.headerUtilityBar ?? {}) };
}

// Display settings for the testimonials section — same idea as
// ClientLogosDisplay above, configured in Admin → Testimonials.
export type TestimonialsDisplay = {
  // "grid" is the original static 3-column layout (still the right choice
  // with only a handful of testimonials); "carousel" auto-advances one
  // card SET (up to 3) at a time, horizontally, the same "MNC-style"
  // rotating strip requested for client logos and the Freezone approvals;
  // "single" auto-advances ONE testimonial at a time with a crossfade +
  // slide-up transition — a distinct "one by one" animation, not a
  // continuously-scrolling marquee like the client logos strip and not a
  // multi-card carousel.
  layout: "grid" | "carousel" | "single";
  cardSize: "sm" | "md" | "lg";
  // How often the carousel advances to the next card. Ignored when layout
  // is "grid".
  autoAdvanceSpeed: "slow" | "normal" | "fast";
  pauseOnHover: boolean;
  showOnServicesPage: boolean;
  showOnServiceDetailPage: boolean;
  showOnSubServicePage: boolean;
  // Google-review styling/redirect (Admin → Testimonials → Display
  // Settings → "Google Reviews"). Every card gets a 5-star row either way;
  // when a URL is set, a small Google "G" mark appears and the whole card
  // links out to it. `googleRating`/`googleReviewCount` feed the standalone
  // summary badge (GoogleReviewBadge.tsx) — shown wherever the testimonials
  // section itself renders (when `showGoogleBadge` is on) and, separately,
  // on the Contact page (`showOnContactPage`) even where the full
  // testimonials list doesn't.
  googleReviewUrl?: string;
  googleRating?: number;
  googleReviewCount?: number;
  showGoogleBadge: boolean;
  showOnContactPage: boolean;
  // Background color of the HOME PAGE's own standalone "Client
  // Perspectives / What our clients say" testimonials section — set here,
  // on Testimonials' own admin page, rather than only through the generic
  // per-section "Background" control buried in Pages & Content → Home
  // (Admin → Testimonials → Display Settings → "Section Background
  // Color"). Blank keeps the original navy and defers to that generic
  // control if the admin has set one there. When set, the section heading
  // and eyebrow text automatically switch to readable dark/light text for
  // whatever color is picked, instead of assuming a dark background.
  sectionBackgroundColor?: string;
};

const defaultTestimonialsDisplay: TestimonialsDisplay = {
  layout: "grid",
  cardSize: "md",
  autoAdvanceSpeed: "normal",
  pauseOnHover: true,
  showOnServicesPage: false,
  showOnServiceDetailPage: false,
  showOnSubServicePage: false,
  googleReviewUrl: undefined,
  googleRating: undefined,
  googleReviewCount: undefined,
  showGoogleBadge: false,
  showOnContactPage: false,
  sectionBackgroundColor: "",
};

export async function getTestimonialsDisplay(): Promise<TestimonialsDisplay> {
  const content = await getPageContent("global");
  return { ...defaultTestimonialsDisplay, ...(content.testimonialsDisplay ?? {}) };
}

// --- Landing page scroll-driven frame-sequence animation (Admin → Landing
// Animation): an admin uploads a zip of sequential frames (e.g. a 48fps
// clip exported frame-by-frame); the homepage hero then scrubs through
// those frames as the visitor scrolls — a `position: sticky` canvas whose
// current frame is driven by scroll progress rather than by time, the same
// technique behind Apple's product pages. Once the visitor scrolls all the
// way through it (the sequence's last frame), a location-selection popup
// appears over a blurred freeze-frame, matching the existing Location
// Gate's "pick your office" flow but triggered by finishing the animation
// instead of by page-load frequency.
export type ScrollFrameHero = {
  enabled: boolean;
  // Cloudinary URLs, already in playback order, already downsampled to a
  // web-appropriate frame count at upload time (see
  // uploadFrameZipToCloudinary in lib/cloudinary.ts).
  frames: string[];
  // How much scroll distance the animation plays out over — "long" gives
  // the smoothest, most deliberate scrub; "short" gets to the popup fastest.
  scrollLength: "short" | "medium" | "long";
  popupHeadline: string;
  popupSubtext: string;
  popupCtaLabel: string;
};

const defaultScrollFrameHero: ScrollFrameHero = {
  enabled: false,
  frames: [],
  scrollLength: "medium",
  popupHeadline: "Choose your location",
  popupSubtext: "Select the office closest to you to see tailored content.",
  popupCtaLabel: "Continue",
};

export async function getScrollFrameHero(): Promise<ScrollFrameHero> {
  const content = await getPageContent("global");
  return { ...defaultScrollFrameHero, ...(content.scrollFrameHero ?? {}) };
}

// --- Site-wide scroll & motion polish (Admin → Scroll & Motion). Separate
// from the per-section Reveal-on-scroll animations above — this covers the
// *feel* of scrolling itself (eased/inertial rather than the browser's
// default instant jump-scroll) plus two small ambient touches that make the
// whole site read as less "blunt" without needing any per-page config:
// a faint parallax drift on hero media, and a soft light that follows the
// cursor over dark sections. All four are independent toggles so an admin
// who only wants the smooth-scroll feel can leave the other two off.
export type ScrollMotionSettings = {
  enabled: boolean;
  // Maps to how much inertia/lag the eased scroll has — "subtle" is barely
  // perceptible (for admins who just want to round off the hard edges),
  // "strong" is a pronounced, glide-y feel.
  intensity: "subtle" | "normal" | "strong";
  parallaxHero: boolean;
  cursorGlow: boolean;
};

const defaultScrollMotion: ScrollMotionSettings = {
  enabled: true,
  intensity: "normal",
  parallaxHero: true,
  cursorGlow: false,
};

// Lenis' own duration (seconds) + easing per intensity — see SmoothScroll.tsx.
export const SCROLL_MOTION_DURATION: Record<ScrollMotionSettings["intensity"], number> = {
  subtle: 0.7,
  normal: 1.1,
  strong: 1.6,
};

export async function getScrollMotion(): Promise<ScrollMotionSettings> {
  const content = await getPageContent("global");
  return { ...defaultScrollMotion, ...(content.scrollMotion ?? {}) };
}

// --- Per-section scroll-reveal animation, configured in Admin → Content →
// [page] → Section Animations. Every Reveal-wrapped section on a page has
// its own key here (e.g. "stats", "whyChooseUs"); a page/section combo with
// no saved choice falls back to "fade-up".
export async function getSectionAnimations(page: string): Promise<Record<string, string>> {
  const content = await getPageContent(page);
  return content.sectionAnimations && typeof content.sectionAnimations === "object"
    ? content.sectionAnimations
    : {};
}

// --- Per-section visibility, configured alongside Section Animations in
// Admin → Pages & Content → [page] → Section Visibility & Animations. A
// section with no saved choice is visible by default — only an explicit
// `false` hides it, so existing sites with nothing saved yet don't lose
// any sections.
export async function getSectionVisibility(page: string): Promise<Record<string, boolean>> {
  const content = await getPageContent(page);
  return content.sectionVisibility && typeof content.sectionVisibility === "object"
    ? content.sectionVisibility
    : {};
}

// --- Per-section animation *speed*, *delay*, *hover effect* and *stagger*
// — the "advanced" animation controls layered on top of the plain
// animation style above, configured in the same "Section Visibility &
// Animations" card in Admin → Pages & Content → [page]. Kept as a
// separate ContentBlock (rather than folded into `sectionAnimations`,
// which stays a plain string per key) so existing saved animation
// choices don't need to change shape — a section with nothing saved here
// just uses the defaults below, same look as before this feature existed.
export type SectionEffect = {
  speed: "slow" | "normal" | "fast";
  delay: "none" | "short" | "medium" | "long";
  hover: "default" | "lift" | "zoom" | "glow" | "underline" | "none";
  stagger: boolean;
  // Text alignment for the section — real CSS `text-align`, so it actually
  // cascades to any heading/paragraph inside that doesn't set its own
  // alignment. Undefined/"left" both mean "use the page's normal layout".
  align?: "left" | "center" | "right";
  // Section background treatment — lets an admin set off a section (a
  // tinted panel, or a full dark band) without touching code, the same way
  // Wix/Squarespace section styles work. "none" keeps the page's normal
  // background straight through. "custom" uses backgroundColor/
  // backgroundTextColor below instead of one of the three fixed presets.
  background?: "none" | "tint" | "dark" | "gradient" | "custom";
  backgroundColor?: string;
  backgroundTextColor?: string;
};
export const defaultSectionEffect: SectionEffect = {
  speed: "normal",
  delay: "none",
  hover: "default",
  stagger: false,
  align: "left",
  background: "none",
  backgroundColor: "",
  backgroundTextColor: "",
};
// Milliseconds a Reveal should wait before starting, per admin "Delay" choice.
export const DELAY_MS: Record<SectionEffect["delay"], number> = { none: 0, short: 150, medium: 400, long: 800 };

export async function getSectionEffects(page: string): Promise<Record<string, SectionEffect>> {
  const content = await getPageContent(page);
  const raw = content.sectionEffects;
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, SectionEffect> = {};
  for (const [key, value] of Object.entries(raw as Record<string, Partial<SectionEffect>>)) {
    out[key] = { ...defaultSectionEffect, ...value };
  }
  return out;
}

// --- Per-page heading/body text size, set in Admin → Pages & Content →
// [page] → Text Size. Applies to that page's main <h1> and its lead
// paragraph — the two elements every page has exactly one of — not every
// individual piece of text on the page, since the rest of the site's type
// is hand-set per element rather than on one shared scale. "services" and
// "insights" cover both their list page and their [slug] detail page.
export type PageTypography = {
  headingSize: "sm" | "md" | "lg";
  bodySize: "sm" | "md" | "lg";
  align: "left" | "center";
  fontFamily: "serif" | "sans";
};

const defaultPageTypography: PageTypography = { headingSize: "md", bodySize: "md", align: "left", fontFamily: "serif" };

// px values, not rem — matches how the rest of the site's type is set.
export const HEADING_SIZE_PX: Record<PageTypography["headingSize"], string> = {
  sm: "28px",
  md: "36px",
  lg: "44px",
};
export const BODY_SIZE_PX: Record<PageTypography["bodySize"], string> = {
  sm: "15px",
  md: "17px",
  lg: "19px",
};
// Tailwind class, not a CSS value — applied alongside the existing
// `font-serif` class on each page's <h1> so admins can switch a page's
// heading to the site's sans-serif body font instead.
export const HEADING_FONT_CLASS: Record<PageTypography["fontFamily"], string> = {
  serif: "font-serif",
  sans: "font-sans",
};

export async function getPageTypography(page: string): Promise<PageTypography> {
  const content = await getPageContent(page);
  const t = content.typography;
  if (!t || typeof t !== "object") return defaultPageTypography;
  return {
    headingSize: ["sm", "md", "lg"].includes((t as any).headingSize) ? (t as any).headingSize : "md",
    bodySize: ["sm", "md", "lg"].includes((t as any).bodySize) ? (t as any).bodySize : "md",
    align: ["left", "center"].includes((t as any).align) ? (t as any).align : "left",
    fontFamily: ["serif", "sans"].includes((t as any).fontFamily) ? (t as any).fontFamily : "serif",
  };
}

// --- Insights / blog ---

function mapInsight(raw: any): InsightArticle {
  return {
    slug: raw.slug,
    category: raw.category ?? "",
    postType: raw.postType ?? "insight",
    title: raw.title ?? "Untitled",
    excerpt: raw.excerpt ?? "",
    body: raw.body ?? undefined,
    date: raw.date ?? (raw.publishAt ? new Date(raw.publishAt).toLocaleDateString() : "[Date]"),
    coverImageUrl: raw.coverImageUrl ?? undefined,
    coverImagePosition: raw.coverImagePosition ?? "center",
    coverVideoUrl: raw.coverVideoUrl ?? undefined,
    linkedinUrl: raw.linkedinUrl ?? undefined,
  };
}

// `type` filters to one of the three Admin → Insights content types
// ("newsletter" | "insight" | "fun_activity") — omit it for every post,
// which is what the public Insights page's "All" filter tab uses.
export async function getInsights(lang = "en", type?: string): Promise<InsightArticle[]> {
  const qs = type ? `?lang=${lang}&type=${encodeURIComponent(type)}` : `?lang=${lang}`;
  const raw = await apiGet<any[]>(`/insights${qs}`, null as any);
  if (!raw) return type ? defaultInsights.filter((a) => a.postType === type) : defaultInsights;
  return raw.map(mapInsight);
}

// Most recently published article across every type — powers the "latest
// post" card on the home page. Deliberately re-fetches rather than trying
// to reuse getInsights()'s own React cache() entry (that's keyed by the
// exact (lang, type) args, and this needs the unfiltered, most-recent-first
// list) — findAllPublic already orders by publishAt desc, so this is just
// "take the first one".
export async function getLatestInsight(lang = "en"): Promise<InsightArticle | undefined> {
  const all = await getInsights(lang);
  return all[0];
}

export async function getInsight(slug: string, lang = "en") {
  const fallback = defaultInsights.find((a) => a.slug === slug);
  const raw = await apiGet<any>(`/insights/${slug}?lang=${lang}`, fallback);
  return raw ? mapInsight(raw) : undefined;
}

// --- Careers ---

function mapJob(raw: any): JobOpening {
  return {
    id: raw.id,
    title: raw.title,
    department: raw.department,
    location: raw.location,
    type: raw.type ?? raw.employmentType,
    description: raw.description ?? undefined,
    responsibilities: raw.responsibilities ?? undefined,
    qualifications: raw.qualifications ?? undefined,
    postedAt: raw.postedAt ?? undefined,
    closesAt: raw.closesAt ?? undefined,
  };
}

export async function getJobOpenings(): Promise<JobOpening[]> {
  const raw = await apiGet<any[]>(`/careers/jobs`, null as any);
  if (!raw) return defaultJobOpenings;
  return raw.map(mapJob);
}

// Single job, used on the /careers/:id/apply page — the listing above only
// carries the summary fields, not the full description/responsibilities/
// qualifications shown there.
export async function getJobOpening(id: string): Promise<JobOpening | undefined> {
  const raw = await apiGet<any>(`/careers/jobs/${id}`, null as any);
  return raw ? mapJob(raw) : undefined;
}

// --- Application Form Builder: admin-configured extra applicant fields ---

export async function getApplicationFormFields(): Promise<ApplicationFormField[]> {
  const content = await getPageContent("global");
  const raw = content.applicationFormFields;
  return Array.isArray(raw) && raw.length > 0 ? raw : defaultApplicationFormFields;
}

// --- SEO metadata for <head> ---

export type SeoRecord = {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImageUrl?: string;
  schemaType?: string;
  schemaJson?: Record<string, unknown>;
  // Per-page "hide from search engines" — Admin → SEO & Schema. Emits
  // `<meta name="robots" content="noindex,nofollow">` for this exact
  // path+language, e.g. for a thank-you page or a duplicate-content variant
  // that shouldn't compete with the canonical page in search results.
  noindex?: boolean;
} | null;

export async function getSeoMeta(path: string, lang = "en"): Promise<SeoRecord> {
  return apiGet<SeoRecord>(`/seo/meta?path=${encodeURIComponent(path)}&lang=${lang}`, null);
}

/**
 * Builds a Next.js `Metadata` object for a page: an admin-set SEO record
 * (via /admin/seo) wins when one exists for this exact path + language;
 * otherwise falls back to the title/description passed in.
 *
 * Beyond title/description, this also fills in the things that actually
 * move search/AI-answer-engine visibility: Open Graph + Twitter Card tags
 * (so links shared on LinkedIn/WhatsApp/X show a title, description and
 * image instead of a bare URL, falling back to Admin → Site Settings'
 * site-wide default share image when a page has none of its own),
 * hreflang alternates for every language this site supports plus
 * `x-default` (tells Google which version to show a visitor whose
 * language doesn't match any of them), the admin-set keywords field, and
 * a `robots` directive that honors either this one page's "noindex"
 * toggle or a site-wide "block this whole site from search engines"
 * switch (Admin → Site Settings — meant for a staging/preview deployment,
 * not the live site).
 */
export async function buildPageMetadata(
  path: string,
  lang: string,
  fallbackTitle: string,
  fallbackDescription: string,
) {
  const [seo, siteConfig] = await Promise.all([getSeoMeta(path, lang), getSiteConfig(lang)]);
  const title = seo?.metaTitle ?? fallbackTitle;
  const description = seo?.metaDescription ?? fallbackDescription;
  const canonical = seo?.canonicalUrl || `${SITE_URL}/${lang}${path === "/" ? "" : path}`;
  const ogImageUrl = seo?.ogImageUrl || siteConfig.defaultOgImageUrl;
  const ogImage = ogImageUrl ? [{ url: ogImageUrl }] : undefined;
  const shouldNoindex = seo?.noindex === true || siteConfig.sitewideNoindex === true;

  return {
    title,
    description,
    keywords: seo?.keywords || undefined,
    robots: shouldNoindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    alternates: {
      canonical,
      languages: {
        ...Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}${path === "/" ? "" : path}`])),
        "x-default": `${SITE_URL}/${defaultLocale}${path === "/" ? "" : path}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: siteConfig.name || fallbackTitle.split(" — ")[1] || undefined,
      locale: lang,
      type: "website",
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage,
    },
  };
}

// --- Theme (admin-editable brand colors/typography, applied as CSS vars) ---

export async function getTheme() {
  return apiGet<Record<string, any>>(`/theme`, {
    primaryColor: "#0A1B33",
    secondaryColor: "#B08D3F",
    accentColor: "#B08D3F",
  });
}

// --- Leads: contact form, consultation requests ---

export async function submitLead(input: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  serviceOfInterest?: string;
  message?: string;
  source: "CONTACT_FORM" | "CHATBOT" | "CAREER_FORM" | "WHATSAPP" | "CONSULTATION_FORM";
  // The visitor's analytics session id (components/site/PageViewTracker.tsx's
  // sessionStorage-held id, threaded here as a hidden form field since this
  // whole call runs server-side and has no sessionStorage of its own) — lets
  // Admin → Analytics join this lead back to the page-view trail that led to
  // it. Optional: a visitor with sessionStorage blocked, or a lead source
  // that doesn't pass one through, still submits fine without it.
  sessionId?: string;
}) {
  const res = await fetch(`${API_URL}/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal: withTimeout(),
  });
  if (!res.ok) {
    if (res.status === 409) {
      const err = new Error("duplicate") as Error & { code: "DUPLICATE" };
      err.code = "DUPLICATE";
      throw err;
    }
    if (res.status === 400) {
      const err = new Error("validation") as Error & { code: "VALIDATION" };
      err.code = "VALIDATION";
      throw err;
    }
    throw new Error("Failed to submit inquiry.");
  }
  return res.json();
}

// --- Newsletter: footer "Stay Informed" signup ---

// Called directly from the client (components/site/NewsletterForm.tsx) —
// this is a plain fetch wrapper, not a server action, since the footer
// needs an inline success/failure message without a full-page redirect.
// `${API_URL}` is built from `NEXT_PUBLIC_API_URL`, so it's safe to resolve
// in the browser the same way it already is on the server elsewhere in
// this file.
export async function subscribeNewsletter(email: string) {
  const res = await fetch(`${API_URL}/newsletter/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    signal: withTimeout(),
  });
  if (!res.ok) {
    if (res.status === 400) {
      const err = new Error("validation") as Error & { code: "VALIDATION" };
      err.code = "VALIDATION";
      throw err;
    }
    throw new Error("Failed to subscribe.");
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// System Messages: the success/error/warning text shown after a form
// submission, upload, etc. Backed by the same generic Translation table
// the language system already uses (key + languageCode -> value), so an
// admin can reword or translate any of these from
// /admin/messages with no code change or redeploy. `SYSTEM_MESSAGE_KEYS`
// is the catalog that page renders and the fallback text used until an
// admin overrides a given key.
// ---------------------------------------------------------------------------

export const SYSTEM_MESSAGE_KEYS = {
  "message.contact.success": {
    group: "Success",
    label: "Contact form submitted",
    fallback: "Thank you — your inquiry has been received. A partner will be in touch within one business day.",
  },
  "message.contact.missing_fields": {
    group: "Error",
    label: "Contact form: required fields missing",
    fallback: "Please fill in your name and email before sending.",
  },
  "message.contact.invalid": {
    group: "Error",
    label: "Contact form: invalid input",
    fallback: "Please check your name, email and phone number — one of them doesn't look right.",
  },
  "message.contact.duplicate": {
    group: "Warning",
    label: "Contact form: duplicate submission",
    fallback: "We've already received this inquiry — thanks! A team member will be in touch shortly.",
  },
  "message.career.applied": {
    group: "Success",
    label: "Job application submitted",
    fallback: "Application received — thank you for applying. Our talent team will be in touch if you're shortlisted.",
  },
  "message.career.missing_fields": {
    group: "Error",
    label: "Job application: required fields missing",
    fallback: "Please fill in your name, email and attach a resume before submitting.",
  },
  "message.career.upload_failed": {
    group: "Error",
    label: "Job application: resume upload failed",
    fallback: "We couldn't upload your resume. Please try again with a PDF or Word document under 10MB.",
  },
  "message.career.submit_failed": {
    group: "Error",
    label: "Job application: submission failed",
    fallback: "Something went wrong submitting your application. Please try again in a moment.",
  },
  "message.career.invalid": {
    group: "Error",
    label: "Job application: invalid input",
    fallback: "Please check your name, email and phone number — one of them doesn't look right.",
  },
  "message.career.duplicate": {
    group: "Warning",
    label: "Job application: already applied",
    fallback: "You've already applied to this position with this email address.",
  },
  "message.form.network_error": {
    group: "Error",
    label: "Generic: network/connection issue",
    fallback: "We couldn't reach the server. Please check your connection and try again.",
  },
  "message.form.validation_error": {
    group: "Warning",
    label: "Generic: validation failed",
    fallback: "Please check the highlighted fields and try again.",
  },
} as const;

export type SystemMessageKey = keyof typeof SYSTEM_MESSAGE_KEYS;

export async function getSystemMessages(lang = "en"): Promise<Record<string, string>> {
  return apiGet<Record<string, string>>(`/translations/${lang}`, {});
}

export async function getSystemMessage(key: SystemMessageKey, lang = "en"): Promise<string> {
  const all = await getSystemMessages(lang);
  return all[key] ?? SYSTEM_MESSAGE_KEYS[key].fallback;
}
