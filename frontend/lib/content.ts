// ---------------------------------------------------------------------------
// FALLBACK content. Pages now fetch live data through `lib/api.ts`, which
// calls the NestJS/Prisma backend. Everything exported from this file is
// only used when the API is unreachable or a section hasn't been populated
// in the admin dashboard yet — so the site always renders something
// sensible instead of an empty page. `navLinks`, `siteConfig` and
// `languages` are still used directly (menus aren't wired to the CMS yet —
// see the API README's "what's stubbed" section).
// ---------------------------------------------------------------------------

export const siteConfig = {
  name: "EFC", // TODO: replace with your firm's real name
  tagline: "Audit · Tax · VAT · Advisory — United Arab Emirates",
  phone: "+971 4 000 0000",
  email: "info@efc.ae",
  address: "Dubai, United Arab Emirates",
  // Site-wide WhatsApp number for the floating Call/WhatsApp popup (bottom
  // left of every public page) — separate from a branch's own WhatsApp
  // number, which is specific to that office. Leave blank to hide the
  // WhatsApp button; the Call button uses `phone` above and hides the same
  // way if that's ever cleared.
  whatsapp: "",
  // Turns the floating Call/WhatsApp popup on or off site-wide.
  floatingContactEnabled: true,
  // --- Pro-level SEO/AEO/GEO, all set in Admin → Site Settings ---
  // Google Search Console "HTML tag" verification code (just the content
  // value, e.g. "abc123..." — not the whole <meta> tag). Leave blank to
  // omit the tag.
  googleVerification: "",
  // Bing Webmaster Tools verification code, same idea (rendered as the
  // msvalidate.01 meta tag).
  bingVerification: "",
  // Fallback Open Graph/Twitter share image used on any page that doesn't
  // have its own image set in Admin → SEO & Schema — without this, a page
  // with no per-page image shares with no preview image at all.
  defaultOgImageUrl: "",
  // Emergency "take the whole site out of search results" switch — for a
  // staging/preview deployment, never meant to stay on for the live site.
  // A per-page noindex toggle (Admin → SEO & Schema) covers the normal
  // case; this is the coarse, site-wide override.
  sitewideNoindex: false,
  // Extra paths to block in robots.txt beyond the built-in /admin and /api
  // (one per line, e.g. "/internal-drafts"). Admin-configurable so a new
  // section can be excluded from crawling without a code change.
  robotsExtraDisallow: "",
  // --- Image protection (Admin → Site Settings → Image Protection) ---
  // A real website's images must be fetched by the browser to be shown, so
  // none of this makes an image impossible to save — it raises the bar
  // against casual copying and stops other sites from embedding yours.
  imageProtection: {
    // Blocks the right-click "Save Image As…" menu and drag-to-desktop on
    // every image/video across the public site (not the admin dashboard).
    disableRightClick: true,
    // Stamps a small text watermark onto every Cloudinary-hosted photo on
    // the public site, applied on the fly via a URL transform — no
    // re-uploading needed, and it never touches the original file.
    watermarkEnabled: false,
    watermarkText: "",
  },
  // --- Logo sizing (Admin → Site Settings → Logo Sizing) ---
  // Pixel heights for the uploaded logo everywhere it appears — every spot
  // used to render it at a small, hardcoded height with no way to change it
  // short of editing code. Width is never set directly; each spot uses
  // `object-contain`/`w-auto` so the logo keeps its own aspect ratio at
  // whatever height is set here, up to a generous max-width so a very wide
  // logo still can't overrun the surrounding layout.
  logoSizing: {
    headerHeight: 48, // Public site header (was a fixed 36px)
    footerHeight: 48, // Public site footer (was a fixed 36px)
    adminSidebarHeight: 32, // Admin dashboard sidebar (was a fixed 24px)
    loginHeight: 56, // Admin login screen (previously never actually shown)
  },
};

export const navLinks = [
  { label: "Services", href: "/services" },
  { label: "Industries", href: "/#industries" },
  { label: "About", href: "/about" },
  { label: "Insights", href: "/insights" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
];

export const languages = ["EN", "AR", "FR", "HI"] as const;

export const heroContent = {
  eyebrow: "Audit · Tax · VAT · Advisory — United Arab Emirates",
  headline: "Clarity you can build a business on.",
  body:
    "EFC delivers external and internal audit, tax, VAT and corporate advisory to regulated businesses across the Emirates — led by partners, grounded in the standards regulators expect.",
  primaryCta: { label: "Book a Consultation", href: "/contact" },
  secondaryCta: { label: "Explore Our Services", href: "/services" },
  credentialLine:
    "Licensed by the UAE Ministry of Economy · FTA-registered Tax Agency · Member, [PROFESSIONAL ACCOUNTANCY BODY]",
  // Optional — when unset, the hero keeps its decorative panel. Once set,
  // that panel is replaced by this uploaded image, cropped to fit with
  // `imagePosition` controlling which part of it stays visible.
  imageUrl: undefined as string | undefined,
  imagePosition: "center" as string, // CSS object-position keyword: "top" | "center" | "bottom"
  // Optional — when set, a looping muted background video replaces the
  // static image/decorative panel entirely. `imageUrl` (if also set) is
  // used as the video's poster frame while it loads.
  videoUrl: undefined as string | undefined,
  // 0–100 — how dark the scrim over the hero photo/video is, so light text
  // stays readable. Lower this if a video/photo looks dull or muddy; raise
  // it if text gets hard to read. 100 is the old, fixed-dark look.
  overlayOpacity: 55 as number,
  // How the hero's text content animates in on page load — one of
  // AnimationPicker's ANIMATION_OPTIONS values (components/admin/AnimationPicker.tsx).
  animation: "fade-up" as string,
};

// Homepage banner announcing a freezone approval/license — fully optional
// (leave `enabled` false to hide it entirely) and independent of the fixed
// Trust Strip badges above, since this is a single, larger, more prominent
// call-out with its own photo/video, link and animation rather than one
// more small badge in a row.
export const freezoneContent = {
  enabled: false,
  badge: "Freezone Approved",
  headline: "Approved to operate within [FREEZONE NAME]",
  body:
    "EFC is licensed to provide audit, tax and advisory services to businesses registered within [FREEZONE NAME], extending our regulatory reach across the Emirates.",
  ctaLabel: "Learn more",
  ctaHref: "/about",
  // Optional — when unset, the banner keeps a plain decorative panel.
  imageUrl: undefined as string | undefined,
  imagePosition: "center" as string,
  // Optional — when set, a looping muted background video replaces the
  // image/decorative panel entirely, same behavior as the Hero's video.
  videoUrl: undefined as string | undefined,
  // Which side of the banner the media sits on.
  mediaPosition: "right" as "left" | "right",
};

// Shown once, before a first-time visitor reaches the homepage, so they can
// pick their region. Fully optional — leave `enabled` false to skip it.
// The list of choices is not stored here: it's generated from the active
// Branches & Locations entries' `country` field, so adding or renaming a
// branch's country automatically updates the picker with no code changes.
export const locationGateContent = {
  enabled: false,
  headline: "Choose your location",
  subtext: "We'll tailor the services, contacts and regulatory information you see.",
  ctaLabel: "Continue",
  // Optional full-bleed background behind the picker — a video (if set)
  // plays instead of the image. Leave both blank to keep the plain dark
  // gradient background. `overlayOpacity` controls the scrim over
  // whichever one is showing (same idea, same helper, as the Hero's own
  // "Overlay Darkness" — see lib/hero-scrim.ts) so a bright video/photo
  // doesn't look flat or washed out with no way to fix it.
  backgroundImageUrl: "",
  backgroundVideoUrl: "",
  overlayOpacity: 65 as number,
  // The plain dark gradient shown when no photo/video is set — a hex
  // color an admin can retint to match their brand instead of the fixed
  // navy this originally shipped with.
  backgroundTint: "#070E1C" as string,
  // How the whole gate transitions in/out.
  animation: "fade" as "fade" | "zoom" | "slide-up" | "slide-down" | "blur" | "flip" | "rotate",
  // A second, independent transition for just the headline/subtext text,
  // playing slightly after the container's own animation — "stagger-
  // words" reveals the headline one word at a time for a more premium,
  // deliberate feel than everything appearing at once.
  textTransition: "fade" as "none" | "fade" | "slide-up" | "stagger-words",
  // Sharp/rounded/pill button corners for this gate's Continue button and
  // the country options — independent of the sitewide Theme Builder
  // setting, since an admin may want this one screen to stand apart.
  buttonStyle: "sharp" as "sharp" | "rounded" | "pill",
  // Shown next to the "EFC" mark by default — replace with your own
  // wordmark image, or just retype the initials/short name here.
  logoUrl: "",
  logoText: "EFC",
  // How often a visitor sees this gate:
  // "once" — remembered in this browser until they clear site data (localStorage, the original behavior)
  // "session" — reappears every new browser session/tab (sessionStorage)
  // "always" — shown on every single page load, never remembered
  trigger: "once" as "once" | "session" | "always",
};

// Pre-launch countdown wrapper. When enabled, every visitor sees ONLY this
// screen (no header, footer or page content at all) until `launchAt`
// passes — checked server-side on every request, so it can't be bypassed
// by changing a device's clock, and there's nothing for an admin to
// manually switch off at the exact moment: once real time passes
// `launchAt`, the gate stops rendering on its own. `enabled` is the
// separate master switch — turn the whole thing off (or reuse it for a
// future campaign by setting a new `launchAt`) without losing the rest of
// the configured look. Preview it any time from Admin → Launch Countdown →
// Preview, which always shows the current settings regardless of `enabled`.
export const launchGateContent = {
  enabled: false,
  // ISO datetime string (e.g. "2026-10-02T18:00:00.000Z"), or "" to show
  // the gate indefinitely (no ticking countdown, just enabled/disabled).
  launchAt: "",
  // Shown inside the circular lettermark when no logo image is uploaded.
  crestLetter: "E",
  logoUrl: "",
  headline: "Something new is almost ready.",
  subtext: "Our new website launches soon.",
  backgroundColor: "#0b1a33",
  accentColor: "#c9a24b",
  // Petal colors for the "blossom blast" that plays the moment the
  // countdown reaches zero, before the real site loads in.
  petalColors: ["#c9a24b", "#e2c67a", "#f6f1e6"] as string[],
  enableBlossom: true,
};

// `logoUrl` is optional per badge — an admin can upload a real logo image
// (Admin → Pages & Content → Home → Trust Strip) instead of, or alongside,
// the plain text label.
export const trustBadges = [
  { label: "UAE Ministry of Economy", logoUrl: undefined as string | undefined },
  { label: "FTA Registered Agent", logoUrl: undefined as string | undefined },
  { label: "ISO 27001 Certified", logoUrl: undefined as string | undefined },
  { label: "[PROFESSIONAL BODY]", logoUrl: undefined as string | undefined },
  { label: "DIFC Registered", logoUrl: undefined as string | undefined },
];

export const stats = [
  { value: "[XX]+", label: "Years in Practice" },
  { value: "[XXX]+", label: "Clients Advised" },
  { value: "[XXX]+", label: "Audit & Tax Professionals" },
  { value: "[X]", label: "UAE Branches" },
];

export type ServiceFaq = { question: string; answer: string };

export type Service = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  // AEO detail sections — all optional since the fallback catalog below
  // doesn't set them; live data from the admin dashboard does.
  whatIsIt?: string;
  whoNeedsIt?: string;
  benefits?: string;
  process?: string;
  costFactors?: string;
  timeline?: string;
  faqs?: ServiceFaq[];
  // Optional — shown on the service's card (homepage/Services list) and at
  // the top of its detail page. Not tied to a language, so it's set once
  // per service rather than per translation.
  imageUrl?: string;
  imagePosition?: string; // CSS object-position keyword: "top" | "center" | "bottom"
  // Who to contact about this service — picked from Team in the admin
  // dashboard (Admin → Services → Edit → Responsible Person). Optional:
  // when a service has none set, the detail page simply doesn't show the
  // contact card.
  responsiblePerson?: {
    id: string;
    name: string;
    position?: string;
    photoUrl?: string;
    photoPosition?: string;
    linkedinUrl?: string;
    email?: string;
    phone?: string;
  } | null;
  // Named sub-offerings under this service (e.g. Audit -> External Audit,
  // Internal Audit, IFRS Advisory) — Admin -> Services -> Edit -> Sub-Services.
  // English-only (not translated per-language) — see the API's SubService model.
  subServices?: SubService[];
};

export type SubService = {
  id: string;
  name: string;
  slug?: string;
  description?: string; // short teaser — the compact card on the parent Service page + this page's meta description
  body?: string; // full rich HTML content on this sub-service's own page (may include an admin-inserted link)
  imageUrl?: string;
  imagePosition?: string;
  videoUrl?: string;
  order?: number;
  // Same AEO detail sections as Service (see the matching comment there and
  // on the SubService model in schema.prisma) — flat/English-only fields,
  // all optional so a sub-service saved before this field set existed still
  // renders fine.
  metaTitle?: string;
  metaDescription?: string;
  whatIsIt?: string;
  whoNeedsIt?: string;
  benefits?: string;
  process?: string;
  costFactors?: string;
  timeline?: string;
  faqs?: ServiceFaq[];
  // Who to contact about this specific sub-service — same Responsible
  // Person pattern as Service, picked independently so a sub-service can
  // have its own point of contact rather than inheriting the parent
  // service's. Optional: the sub-service page simply doesn't show the
  // contact card when none is set.
  responsiblePerson?: {
    id: string;
    name: string;
    position?: string;
    photoUrl?: string;
    photoPosition?: string;
    linkedinUrl?: string;
    email?: string;
    phone?: string;
  } | null;
};

export const services: Service[] = [
  {
    slug: "external-audit",
    title: "External Audit",
    summary:
      "Independent statutory audits delivered to IFRS and UAE regulatory standards.",
    description:
      "Our external audit practice gives stakeholders assurance they can rely on, with partner sign-off on every opinion and a methodology built around your sector's regulatory pressure points.",
  },
  {
    slug: "internal-audit",
    title: "Internal Audit & Risk",
    summary: "Risk-based internal audit, controls testing and governance reviews.",
    description:
      "We strengthen the business between statutory cycles with internal audit programs tailored to your risk register, control environment and board reporting needs.",
  },
  {
    slug: "accounting-bookkeeping",
    title: "Accounting & Bookkeeping",
    summary: "Day-to-day bookkeeping, management accounts and financial reporting.",
    description:
      "Books structured for audit-readiness from day one, with monthly management accounts your leadership team can actually act on.",
  },
  {
    slug: "vat-services",
    title: "VAT Services",
    summary: "VAT registration, return filing, health checks and FTA audit support.",
    description:
      "From initial registration to ongoing filings and FTA audit defense, our VAT team keeps you compliant across every emirate and GCC trading relationship.",
  },
  {
    slug: "corporate-tax",
    title: "Corporate Tax Advisory",
    summary: "Corporate tax registration, computation and planning.",
    description:
      "Registration, computation and planning aligned to UAE Corporate Tax Law and transfer pricing rules, built to withstand scrutiny.",
  },
  {
    slug: "corporate-services-compliance",
    title: "Corporate Services & Compliance",
    summary: "Company formation, AML and ESR compliance, CFO services and payroll.",
    description:
      "Company formation, AML and ESR compliance, outsourced CFO services and payroll for regulated and free zone entities.",
  },
];

// About page — fallback for the ContentBlock sections editable at
// /admin/content?page=about.
// Note on the copy below: unlike the Privacy/Terms placeholders further
// down (which deliberately look like scary unfinished text, to force an
// admin to replace real legal wording before launch), these are ordinary
// marketing copy — until an admin edits them from Admin → Pages & Content,
// they're what a visitor actually sees. A bracketed "[Placeholder — ...]"
// instruction reads as a broken page to a visitor, so these are written as
// plain, generic-but-professional sentences instead, editable the same way.
export const aboutIntro = {
  story:
    "Founded on rigorous audit discipline, the firm has grown by applying that same standard of precision to every engagement — from statutory audits to tax, VAT and advisory work across the UAE.",
  mission: "To give clients a clear, independent view of their numbers, backed by specialists who stand behind every opinion they sign.",
  vision: "To be the audit and advisory partner UAE businesses turn to first, known as much for discretion and precision as for the breadth of services on offer.",
  imageUrl: undefined as string | undefined,
  imagePosition: "center" as string, // CSS object-position keyword: "top" | "center" | "bottom"
};

// About page — photo gallery (team/office photos that crossfade into one
// another). Empty by default; the section simply doesn't render until an
// admin uploads at least one photo from Admin → Pages & Content → About.
export const aboutGallery = {
  photos: [] as { url: string; caption?: string }[],
};

// Page headers (the small-caps eyebrow, the <h1>, and the lead paragraph
// right under it) for every marketing page that has one. These used to be
// plain strings typed directly into each page's JSX — not editable from
// Admin at all. Now every page reads its header from here via getPageHeader
// in lib/api.ts, and an admin can rewrite any of the three from
// Admin → Pages & Content → (page) → Page Header. `lead` supports a
// "{name}" placeholder, filled in with the site's company name at render
// time (see the About page's use of it). Home isn't listed — its headline
// already comes from the Hero section (Admin → Pages & Content → Home).
export const pageHeaders: Record<string, { eyebrow: string; headline: string; lead: string }> = {
  about: {
    eyebrow: "About Us",
    headline: "A firm built on audit discipline, applied across the business.",
    lead: "{name} is a UAE-based audit, tax and advisory practice.",
  },
  team: {
    eyebrow: "Our Team",
    headline: "Partner-led, specialist-staffed",
    lead: "Meet the people who lead your engagements — every client works directly with a partner or director, not just a case team.",
  },
  services: {
    eyebrow: "Services",
    headline: "Full-spectrum assurance, tax and advisory",
    lead: "Every engagement is led by a partner and staffed by specialists who know your sector's regulatory pressure points.",
  },
  careers: {
    eyebrow: "Careers",
    headline: "Build your career in practice",
    lead: "",
  },
  contact: {
    eyebrow: "Contact Us",
    headline: "Speak with a partner",
    lead: "Tell us about your business and we'll connect you with the right specialist within one business day.",
  },
  "find-an-expert": {
    eyebrow: "Find an Expert",
    headline: "Match with the right specialist",
    lead: "Filter by industry, location, service or language to find the partner or director best suited to your engagement.",
  },
  insights: {
    eyebrow: "Insights",
    headline: "Audit, tax and VAT updates",
    lead: "Regulatory changes and practical guidance from our partners, published as they happen.",
  },
};

// Careers page — fallback for the ContentBlock section editable at
// /admin/content?page=careers. Replaces what used to be a hardcoded
// bracketed placeholder paragraph directly in the page's JSX.
export const careersIntro = {
  story:
    "We invest in our people from day one — structured training pathways (including ACCA/CPA support), hands-on client exposure, and a culture where questions are encouraged, not just answered.",
};

// Legal pages (Privacy Policy / Terms of Service) — fallback for the
// ContentBlock sections editable at /admin/legal. The footer's Legal
// links (Admin → Header & Footer) already point at /privacy and /terms;
// those routes previously didn't exist at all (404).
export const legalPages = {
  privacy: {
    title: "Privacy Policy",
    body:
      "[Placeholder — describe what personal data you collect, why, how long you keep it, and how a visitor can contact you about it. Replace this from Admin → Legal Pages before you go live — this is a placeholder, not legal advice.]",
  },
  terms: {
    title: "Terms of Service",
    body:
      "[Placeholder — describe the terms under which visitors and clients use this site and engage your firm's services. Replace this from Admin → Legal Pages before you go live — this is a placeholder, not legal advice.]",
  },
  // Unlike the two placeholders above, this describes what the site
  // genuinely does, mechanism by mechanism — no browser cookie is set
  // anywhere on the public site; everything below is sessionStorage/
  // localStorage or a server-side database row. An admin can still
  // reword this freely from Admin → Legal Pages; this is the accurate
  // starting point, not a placeholder, but it is not legal advice either.
  cookies: {
    title: "Cookies & Data Protection Policy",
    body:
      "<p>We don't use tracking cookies, advertising cookies, or any third-party analytics service (no Google Analytics, no Meta Pixel, no ad network) on this website. Here is exactly what this site does store, and why.</p>" +
      "<p><strong>1. Browsing session ID (sessionStorage, not a cookie)</strong><br>When you visit, your browser generates a random ID and holds it in sessionStorage — a browser storage area that is automatically erased the moment you close this tab, and is never sent to any other website. We use it for two things: (a) counting how many separate visits our pages get, and grouping which pages were viewed together in one visit, so we can see which pages tend to lead to another; and (b) if you submit our contact form, that same ID is included with your enquiry so our team can see which pages you looked at before reaching out — for example, to follow up about the specific service you were reading about. This ID is never linked to your identity unless and until you voluntarily submit a form with your name and email.</p>" +
      "<p><strong>2. Region/location preference (sessionStorage or localStorage)</strong><br>If you use the location picker to choose your region, your choice is remembered in your browser (sessionStorage or localStorage, depending on how our team has configured it) so you aren't asked again on every page. This never leaves your browser and is not sent to our servers.</p>" +
      "<p><strong>3. Page-view records (our own server, no third party)</strong><br>Each page you view is recorded in our own database: the page path, the language, the referring page (if any), an approximate country guessed from your browser's timezone setting (not your IP address — we do not log IP addresses for this purpose), and a general device/browser category (e.g. \"Mobile / Safari\") derived from standard browser information sent with every web request. This never includes your name, email, or any other personal detail unless you separately submit one to us via a form.</p>" +
      "<p><strong>4. Information you submit directly</strong><br>If you fill in our contact form (or a similar enquiry form), we store what you typed — your name, email, phone number if given, company, the service you're asking about, and your message — so our team can respond to you. This is stored in our own database and is not shared with third parties except where necessary to provide the service you asked about (for example, a specific branch office handling your enquiry).</p>" +
      "<p><strong>5. Third-party content</strong><br>Some pages may embed images or video hosted on Cloudinary, a media-hosting service; loading these may cause your browser to make a request to Cloudinary's servers in the ordinary way that loading any embedded image does. We do not use Cloudinary, or any other embedded service, for tracking or advertising purposes.</p>" +
      "<p><strong>Your choices.</strong> You can clear sessionStorage/localStorage at any time via your browser's site settings or by using private/incognito browsing, without affecting your ability to use this site. Submitting a form is always optional. If you have questions about this policy or want us to delete information you've submitted, please contact us using the details on our Contact page.</p>",
  },
};

export const aboutValues = [
  { title: "Independence", description: "Our opinions are never for sale — audit objectivity comes first." },
  { title: "Precision", description: "Every figure is checked against source; nothing is assumed." },
  { title: "Discretion", description: "Client information is handled with the confidentiality it deserves." },
];

export const aboutTimeline = [
  { year: "2010", event: "Firm founded in Dubai." },
  { year: "2015", event: "Opened Abu Dhabi branch office." },
  { year: "2018", event: "Opened Sharjah branch office." },
  { year: "2022", event: "Achieved ISO 27001 certification." },
];

export const aboutLeadership = {
  message:
    "Every engagement carries our name, so it carries our full attention — that commitment to clients and to the standards we hold ourselves to hasn't changed since our first audit.",
  name: "Managing Partner",
  // Optional headshot of the managing partner, shown beside the message.
  imageUrl: undefined as string | undefined,
  imagePosition: "center" as string,
};

// About page — the walking-character animation on the Milestones section.
// The character is a 3-frame sprite (one standing/idle pose, two walking
// poses) swapped in place to fake a walk cycle, rather than a single image
// that's just translated across the screen — this reads as an actual person
// walking instead of a sticker sliding along a rail. All three images ship
// with sensible defaults (bundled in /public/images/milestone-character/)
// but every one of them, plus the walk speed, the character's on-screen
// size, and whether a milestone's card stays hidden until the character
// physically reaches it, is editable from
// Admin → Pages & Content → About → Milestones Animation — nothing here is
// hardcoded to this particular illustrated character.
export const aboutMilestoneAnimation = {
  idleImageUrl: "/images/milestone-character/idle.png",
  walk1ImageUrl: "/images/milestone-character/walk-1.png",
  walk2ImageUrl: "/images/milestone-character/walk-2.png",
  speed: "slow" as "slow" | "medium" | "fast",
  size: "small" as "small" | "medium" | "large",
  // When true (the default), a milestone's card is hidden until the
  // character actually arrives at that stop — "what's been achieved"
  // reveals itself step by step instead of all at once. When false, every
  // card is visible from the start and the character just walks past them.
  revealOnArrival: true,
};

// `iconUrl` is optional on every row below — an admin can upload a custom
// icon/logo per item from Admin → Pages & Content → Home; a row with none
// set just uses the built-in fallback icon (or plain text, for badges).
export const whyChooseUs = [
  {
    title: "Partner-Led Engagements",
    description:
      "A partner signs off every audit opinion and remains your point of contact throughout.",
    iconUrl: undefined as string | undefined,
  },
  {
    title: "Regulatory Depth",
    description:
      "Deep, current knowledge of UAE Corporate Tax, VAT, AML and ESR frameworks as they evolve.",
    iconUrl: undefined as string | undefined,
  },
  {
    title: "Sector Specialists",
    description:
      "Dedicated teams for real estate, hospitality, financial services and free zone entities.",
    iconUrl: undefined as string | undefined,
  },
  {
    title: "UAE-Wide Coverage",
    description:
      "Offices across Dubai, Abu Dhabi and Sharjah, with correspondent coverage nationwide.",
    iconUrl: undefined as string | undefined,
  },
];

export const industries = [
  { name: "Real Estate & Construction", iconUrl: undefined as string | undefined },
  { name: "Retail & E-commerce", iconUrl: undefined as string | undefined },
  { name: "Hospitality & Leisure", iconUrl: undefined as string | undefined },
  { name: "Healthcare", iconUrl: undefined as string | undefined },
  { name: "Financial Services", iconUrl: undefined as string | undefined },
  { name: "Free Zone Entities", iconUrl: undefined as string | undefined },
  { name: "Manufacturing & Trading", iconUrl: undefined as string | undefined },
  { name: "Professional Services", iconUrl: undefined as string | undefined },
];

export const testimonials = [
  {
    quote:
      "EFC guided us through our first FTA audit with precision. Their partner was reachable at every stage.",
    name: "[Client Name]",
    role: "[Title, Company]",
  },
  {
    quote:
      "Their VAT health check found exposures our previous advisor missed, well before filing deadlines.",
    name: "[Client Name]",
    role: "[Title, Company]",
  },
  {
    quote:
      "A genuine sector specialist team — they understood our hospitality margins from the first meeting.",
    name: "[Client Name]",
    role: "[Title, Company]",
  },
];

export type Branch = {
  city: string;
  country?: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  whatsapp?: string;
  googleMapsUrl?: string;
  // URL slug for this branch's auto-generated local-SEO landing page,
  // e.g. "dubai-audit-firm" — see app/[lang]/(marketing)/[branchSlug].
  slug?: string;
  // Set when this location already runs its own separate website — the
  // location picker (LocationGate) sends a visitor straight there instead
  // of tailoring this site to them. See Admin → Branches → Edit.
  externalUrl?: string;
};

export const branches: Branch[] = [
  {
    city: "Dubai",
    country: "United Arab Emirates",
    address: "[Street Address], Dubai, UAE",
    phone: "+971 4 000 0000",
    email: "dubai@efc.ae",
    hours: "Sun–Thu, 9:00 AM – 6:00 PM",
  },
  {
    city: "Abu Dhabi",
    country: "United Arab Emirates",
    address: "[Street Address], Abu Dhabi, UAE",
    phone: "+971 2 000 0000",
    email: "abudhabi@efc.ae",
    hours: "Sun–Thu, 9:00 AM – 6:00 PM",
  },
  {
    city: "Sharjah",
    country: "United Arab Emirates",
    address: "[Street Address], Sharjah, UAE",
    phone: "+971 6 000 0000",
    email: "sharjah@efc.ae",
    hours: "Sun–Thu, 9:00 AM – 6:00 PM",
  },
];

export type TeamMember = {
  id?: string;
  name: string;
  category?: "Partner" | "Key Member";
  position: string;
  branch: string;
  bio: string;
  qualification: string;
  languages: string[];
  photoUrl?: string;
  photoPosition?: string; // CSS object-position keyword: "top" | "center" | "bottom"
  linkedinUrl?: string;
  email?: string;
  phone?: string;
};

export const team: TeamMember[] = [
  {
    name: "[Partner Name]",
    position: "Managing Partner, Audit",
    branch: "Dubai",
    bio: "Placeholder bio — background, sector focus and years of experience.",
    qualification: "[FCCA / CPA / ACA]",
    languages: ["English", "Arabic"],
  },
  {
    name: "[Partner Name]",
    position: "Head of Tax Advisory",
    branch: "Dubai",
    bio: "Placeholder bio — background, sector focus and years of experience.",
    qualification: "[CTA / ACA]",
    languages: ["English", "German"],
  },
  {
    name: "[Director Name]",
    position: "Director, VAT Services",
    branch: "Abu Dhabi",
    bio: "Placeholder bio — background, sector focus and years of experience.",
    qualification: "[ACCA]",
    languages: ["English", "German"],
  },
  {
    name: "[Director Name]",
    position: "Director, Corporate Services",
    branch: "Sharjah",
    bio: "Placeholder bio — background, sector focus and years of experience.",
    qualification: "[CPA]",
    languages: ["English", "Arabic"],
  },
];

export type JobOpening = {
  id?: string;
  title: string;
  department: string;
  location: string;
  type: string;
  description?: string;
  responsibilities?: string; // newline-separated bullets, same convention as Service.benefits
  qualifications?: string; // newline-separated bullets
  postedAt?: string; // ISO date — powers the Careers page's JobPosting structured data (datePosted)
  closesAt?: string; // ISO date, optional — JobPosting's validThrough when set
};

export const jobOpenings: JobOpening[] = [
  { title: "Senior Auditor", department: "External Audit", location: "Dubai", type: "Full-time" },
  { title: "VAT Consultant", department: "Tax & VAT", location: "Abu Dhabi", type: "Full-time" },
  { title: "Corporate Tax Associate", department: "Tax Advisory", location: "Dubai", type: "Full-time" },
  { title: "Audit Trainee", department: "External Audit", location: "Sharjah", type: "Graduate Program" },
];

// --- Application Form Builder ---
// Admin-configurable extra fields collected on the /careers/:id/apply page,
// on top of the fixed Full Name / Email / Phone / Resume / Cover Letter
// fields. Stored as a ContentBlock (page="global", section=
// "applicationFormFields") — the same flexible-JSON pattern used for the
// location gate and other global settings, so no new backend schema is
// needed for the field *definitions* themselves (only for submitted answers,
// which land in JobApplication.answers).
export type ApplicationFieldType = "text" | "email" | "tel" | "textarea" | "select" | "date" | "number";

export type ApplicationFormField = {
  id: string;
  label: string;
  type: ApplicationFieldType;
  required: boolean;
  options?: string; // newline-separated, only used when type === "select"
};

export const applicationFormFields: ApplicationFormField[] = [];

// The three fixed content types Admin → Insights tags every post with
// (Admin → Pages & Content → Insights → filter), independent of the
// free-text `category` tag above — this is what powers the public
// Insights page's Newsletter / Insight / Fun Activity filter tabs.
export type InsightPostType = "newsletter" | "insight" | "fun_activity";
export const INSIGHT_POST_TYPE_LABELS: Record<InsightPostType, string> = {
  newsletter: "Newsletter",
  insight: "Insight",
  fun_activity: "Fun Activity",
};

export type InsightArticle = {
  slug: string;
  category: string;
  postType?: InsightPostType;
  title: string;
  excerpt: string;
  body?: string;
  date: string;
  coverImageUrl?: string;
  coverImagePosition?: string; // CSS object-position keyword: "top" | "center" | "bottom"
  // An uploaded video for this post, shown on its detail page — optional
  // and independent of coverImageUrl, same "photo, video, or both" pairing
  // as a Service's own imageUrl/videoUrl.
  coverVideoUrl?: string;
  // When set (Admin → Insights → "LinkedIn Post URL"), this post links out
  // to a real LinkedIn post instead of its own /insights/[slug] page, and
  // its card gets a LinkedIn badge — see components/site/LinkedInBadge.tsx.
  // Independent of postType: any of the three content types can carry one.
  linkedinUrl?: string;
};

export const insights: InsightArticle[] = [
  {
    slug: "uae-corporate-tax-q3-update",
    category: "Tax Updates",
    postType: "insight",
    title: "UAE Corporate Tax: Q3 Update",
    excerpt: "Placeholder summary of the latest Corporate Tax Law guidance and what it means for your filings.",
    date: "[Date]",
  },
  {
    slug: "vat-health-check-checklist",
    category: "VAT Updates",
    postType: "newsletter",
    title: "A VAT Health Check Checklist for Free Zone Entities",
    excerpt: "Placeholder summary covering common exposure areas ahead of FTA review.",
    date: "[Date]",
  },
  {
    slug: "internal-audit-2027-priorities",
    category: "Audit Updates",
    postType: "insight",
    title: "Internal Audit Priorities for the Year Ahead",
    excerpt: "Placeholder summary of governance and controls themes we're seeing across sectors.",
    date: "[Date]",
  },
];

export const footerLinks = {
  services: services.slice(0, 4).map((s) => ({ label: s.title, href: `/services/${s.slug}` })),
  company: [
    { label: "About Us", href: "/about" },
    { label: "Our Team", href: "/team" },
    { label: "Careers", href: "/careers" },
    { label: "Insights", href: "/insights" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookies & Data Protection", href: "/cookies" },
  ],
};

// Admin → Site Settings → UI Text: every bit of interface chrome that isn't
// page content — the Contact form's field labels/placeholder/button, and
// the chat widget's header/placeholders/buttons/small-talk replies — was
// previously a plain English string literal baked straight into the JSX, so
// it never picked up the visitor's language even though everything around
// it (page headers, services, FAQs...) did. Stored exactly like every other
// section here: a ContentBlock (page="global", section="uiStrings") that
// falls back to this object when nothing's been saved, and gets picked up
// by "Translate Everything Now" the same as any other section (see
// getSectionFallback() in lib/admin-actions.ts).
export const uiStrings = {
  contactForm: {
    fullNameLabel: "Full Name",
    companyLabel: "Company",
    emailLabel: "Email",
    phoneLabel: "Phone",
    optionalSuffix: "(optional)",
    serviceLabel: "Service of Interest",
    servicePlaceholder: "Search or type a service…",
    serviceOtherOption: "Other",
    messageLabel: "Message",
    submitButton: "Send Inquiry",
    officesHeading: "Our Offices",
  },
  chatbot: {
    headerTitle: "Chat with us",
    closeAriaLabel: "Close chat",
    openAriaLabel: "Open chat",
    greeting: "Hi! Ask a question about our services, or tap a topic below to get started.",
    talkToPersonLabel: "Talk to a person instead",
    handoffPrompt: "Leave your name and email and a team member will follow up shortly.",
    namePlaceholder: "Your name",
    emailPlaceholder: "Your email",
    sendingLabel: "Sending…",
    sendToTeamButton: "Send to our team",
    handoffThanksMessage: "Thanks — we've got your details and someone will be in touch soon.",
    inputPlaceholder: "Type a message…",
    sendButton: "Send",
    nameRequiredError: "Enter your name.",
    emailInvalidError: "Enter a valid email address.",
    connectionErrorMessage: "Couldn't send that just now — check your connection and try again.",
    learnMoreLinkLabel: "Learn more",
    noAnswerFallback:
      "I don't have specific information on that yet, but I don't want to guess — a member of our team can give you a proper answer. Would you like me to connect you?",
    smallTalk: {
      greeting: [
        "Hello! How can I help you today? Feel free to ask about our services, fees, locations, or anything else about EFC.",
        "Hi there! What can I help you with — a service, our team, or something else?",
      ],
      thanks: [
        "You're very welcome! Is there anything else I can help you with?",
        "Happy to help! Let me know if there's anything else you'd like to know.",
      ],
      farewell: [
        "Thanks for stopping by — feel free to come back anytime you have a question. Have a great day!",
        "Take care! We're here whenever you need us.",
      ],
      howAreYou: ["I'm doing well, thank you for asking! How can I help you today?"],
      ack: [
        "Great — is there anything else I can help you with?",
        "Understood. Let me know if there's anything else on your mind.",
      ],
      profanity: [
        "I'm here to help, and I'd like to keep our conversation professional and respectful. Could you let me know what you're looking for, or I can connect you with a member of our team?",
      ],
    },
  },
};
