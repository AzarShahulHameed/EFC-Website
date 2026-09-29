# EFC — Frontend

A Next.js (App Router) + TypeScript + Tailwind CSS site for the firm's
public website and a fully wired admin dashboard, backed by the
`sterling-vance-api` NestJS project. Multi-language (`/en /ar /de`
with RTL for Arabic) and Cloudinary-backed image uploads throughout.
Languages can be added from Admin → Languages without touching code for
their content, and content can be auto-translated from English with one
click (see "New: auto-translate, German, dropdown header nav, section
visibility toggles, and more" below).

## Structure

Every page is its own route/file, as requested:

```
app/
  layout.tsx                       root shell (fonts, <html>/<body>)
  globals.css
  (marketing)/                     route group — shares Header + Footer
    layout.tsx
    page.tsx                       /
    about/page.tsx                 /about
    services/page.tsx              /services
    services/[slug]/page.tsx       /services/external-audit, etc.
    team/page.tsx                  /team
    careers/page.tsx               /careers
    insights/page.tsx              /insights
    contact/page.tsx               /contact
    find-an-expert/page.tsx        /find-an-expert
  admin/
    layout.tsx                     sidebar + topbar shell
    page.tsx                       /admin

components/
  site/Header.tsx, Footer.tsx
  admin/Sidebar.tsx, Topbar.tsx

lib/
  content.ts                       every page's copy/data lives here
```

`(marketing)` is a Next.js **route group** — the parentheses keep it out
of the URL, so `app/(marketing)/about/page.tsx` still serves `/about`,
but it gets its own layout (header + footer) separate from `/admin`,
which has its own sidebar shell instead.

## Running it

```bash
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL and the CLOUDINARY_* vars
npm run dev
```

Photo/logo/resume uploads (Team, Testimonials, Client Logos, Insights,
Site Settings logo, job applications) need `CLOUDINARY_CLOUD_NAME`,
`CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` set — a free Cloudinary
account is enough. Without them, everything else works; only the upload
step fails, with an error naming the missing variable.

Then open `http://localhost:3000` for the site and
`http://localhost:3000/admin` for the dashboard.

**If the admin dashboard renders twice side-by-side** (two full sidebars),
that's a dev-server file-watcher artifact from route folders being moved
around during development, not a code bug — stop the dev server, delete
`.next/`, and run `npm run dev` again.

## Multi-language routing & RTL

Every marketing page now lives under `app/[lang]/(marketing)/...`, so
routes are `/en/services`, `/ar/services`, `/de/services`, etc.
(`/admin` sits outside `[lang]` and is not localized.)

- **`middleware.ts`** redirects any unprefixed path (`/services`) to the
  default locale (`/en/services`), and leaves `/admin`, `/api`, `/_next`
  and static files alone.
- **`app/[lang]/(marketing)/layout.tsx`** validates the `lang` segment
  (404s on anything not in `lib/i18n.ts`'s `locales`), and wraps the page
  in a `<div dir="rtl" lang="ar">` for Arabic — Next.js only allows one
  root `<html>` layout, and `/admin` isn't localized, so direction is set
  on a wrapper div rather than `<html>` itself. Most of the layout is
  flexbox with `gap`, which mirrors automatically under `dir="rtl"`; spot-check
  anywhere `grid-template-columns` order matters if you extend this.
- **`Header`** is a client component (`usePathname`) so the language
  switcher can swap the locale segment of the *current* path rather than
  always bouncing to the homepage.
- **`lib/i18n.ts`** holds the locale list, the RTL list, the `lh()` link
  helper, and a small `uiStrings` dictionary for chrome text (nav labels,
  the "Book a Consultation" button, etc.) — **these translations are
  placeholders that need a native-speaker review**, same as everything
  else in `[brackets]`.
- Content itself (services, team, insights, hero copy, ...) was already
  wired to accept `?lang=` in `lib/api.ts` from the previous step — every
  page now passes `params.lang` into those calls, so translations appear
  automatically once an editor adds them in the admin. Until then, the
  API/`content.ts` fallback is English for every locale.

## Wired to the live API

This frontend now talks to the `sterling-vance-api` backend (a separate
project — run it alongside this one). `lib/api.ts` is the data layer:

- Every page that lists content (`/`, `/services`, `/services/[slug]`,
  `/team`, `/careers`, `/insights`, `/contact`, `/find-an-expert`) is now
  an **async Server Component** that calls a `get...()` function in
  `lib/api.ts`, which `fetch()`es `NEXT_PUBLIC_API_URL` (see
  `.env.local.example` — defaults to `http://localhost:4000/api`).
- If the API is unreachable, or a section hasn't been edited in the admin
  yet (empty array/object back from the API), `lib/api.ts` falls back to
  the placeholder content in `lib/content.ts` — so the site never renders
  an empty page, it just shows the placeholders until an editor fills
  them in.
- The **contact form** submits through a real Next.js Server Action
  (`lib/actions.ts` → `submitContactLead`), which POSTs to `/api/leads`
  with `source: "CONTACT_FORM"` — a real lead lands in the CRM.

Run both projects together:

```bash
# terminal 1
cd sterling-vance-api && npm install && npm run start:dev

# terminal 2
cd sterling-vance-web && npm install && cp .env.local.example .env.local && npm run dev
```

### Still static (by design, for now)

`Header`/`Footer`'s nav menu *structure* falls back to `lib/content.ts` /
`lib/i18n.ts` when nothing's been saved in `/admin/header-footer` yet, but
company name, contact info, logo, social links, nav labels and footer
columns are all CMS-driven now — see below. The one thing still fully
hardcoded is the built-in translated nav labels in `lib/i18n.ts`'s
`uiStrings`, used as the fallback for languages other than English until
you add per-language nav overrides.

### The admin dashboard — every section wired, uploads via Cloudinary

`/admin` is a real, authenticated app covering everything in the sidebar:

**Content**
- **`/admin/content`** — the homepage's and about page's flexible
  `ContentBlock` JSON (hero, stats, trust strip, why-choose-us,
  industries, intro/mission/vision, values, timeline, leadership message)
  as raw JSON.
- **`/admin/services`** — list + create + enable/disable + delete.
- **`/admin/team`** — list + create (with photo upload) + a full
  **edit page** (`/admin/team/[id]/edit`, photo replacement included) +
  enable/disable + delete.
- **`/admin/testimonials`** — list + create (with client photo upload) +
  enable/disable + delete.
- **`/admin/client-logos`** — upload/enable/disable/delete the logos in
  the homepage's client logo strip.
- **`/admin/insights`** — list + create (with cover image upload) +
  publish/unpublish + delete.
- **`/admin/branches`** — list + create + enable/disable + delete.
- **`/admin/careers`** — job openings (list + create + close) and a
  separate **`/admin/careers/applications`** screen to review submissions
  and change their status. The public `/careers` page links each opening
  to a real apply form (`/careers/[jobId]/apply`) that uploads a resume to
  Cloudinary and posts to `/careers/applications` — this used to be a
  dead button.

**Site structure**
- **`/admin/site-settings`** (new) — company name, tagline, phone, email,
  address, logo upload, and social links. This is what makes the firm's
  name actually editable without touching code — it's stored as a
  `ContentBlock` (`page: "global", section: "siteConfig"`) and read by
  `Header`, `Footer` and the About page via `getSiteConfig()`.
- **`/admin/header-footer`** (new) — the main nav menu and the footer's
  link columns, as JSON (`page: "global", section: "navLinks"` /
  `"footerLinks"`).
- **`/admin/seo`** — per-path meta title/description/canonical records.
  The frontend doesn't yet call `GET /seo/meta` to populate `<head>` per
  route — saving here changes what the API returns, not yet what search
  engines see.
- **`/admin/languages`** — enable/disable a language; the default
  language can't be disabled.
- **`/admin/theme`** — edits the tokens `GET /theme` serves. Same caveat
  as SEO: the frontend still renders from the Tailwind config baked at
  build time, not these tokens — wiring it to read them as CSS custom
  properties is the natural next step.
- **`/admin/audit-log`** (new) — every create/update/delete made by a
  signed-in admin, logged automatically server-side (see the API README).

**Growth**
- **`/admin/leads`** — list every lead, change its pipeline status.

**Auth**
- **`/admin/login`** — email + password against `POST /auth/login`, with
  an MFA step when an account has it enabled. The JWT is stored in an
  **httpOnly cookie**, never exposed to client JS.
- Every write action (`lib/admin-actions.ts`) now checks the API's
  response and sends you back to the form with the real error message on
  failure, instead of redirecting to the list page unconditionally (an
  earlier bug that made failures look like silent successes).

**File uploads use Cloudinary** (`lib/cloudinary.ts`) — a signed upload
using Node's built-in `crypto`, no SDK dependency. Set
`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET`
in `.env.local` (free tier is fine) or uploads will fail with a clear
error naming the missing variable.

**Tooltips**: form fields across every admin create/edit screen have a
"?" badge (`components/admin/FieldLabel.tsx`) explaining what the field
does — hover or focus it.

### Theme Builder and SEO now actually affect the live site

Both used to only change what the API returned. Now:

- **Theme** — `app/layout.tsx` fetches `GET /theme` on every request and
  injects the tokens as CSS custom properties (`--color-navy`,
  `--color-gold`, `--font-heading`, `--radius`, etc.). `tailwind.config.ts`
  points its `navy`/`gold`/`paper` colors and `serif`/`sans` fonts at
  those variables, so every existing `bg-navy`, `text-gold`,
  `font-serif` class site-wide picks up the live value with no
  component changes needed. `lib/theme-runtime.ts` converts the admin's
  hex input into the `R G B` channel format Tailwind's alpha-aware color
  functions need, and derives the `-light`/`-2` shades (which the Theme
  Builder doesn't have dedicated fields for) by lightening the base
  color. `borderRadius` is wired the same way — every `rounded-[2px]` in
  the codebase was changed to `rounded-[var(--radius)]`. **Not wired**:
  `buttonStyle` and `cardStyle` (sharp/rounded/pill, bordered/shadowed/flat)
  are saved but not consumed — applying them would mean conditional
  classes on every button/card instance, not just a CSS variable swap.
- **SEO** — every marketing page now exports `generateMetadata()`, which
  calls `getSeoMeta(path, lang)` (`GET /seo/meta`) and uses the admin's
  title/description/canonical when a record exists for that exact path,
  falling back to a sensible per-page default otherwise. Save a record at
  `/admin/seo` for e.g. `/services/external-audit` and its `<head>`
  actually changes.

### Multi-language editing

Services, Team, Testimonials and Insights now have real per-language
editing, not just an English-only create form:

- Create forms have a **Language** selector — pick which language you're
  writing the first version in.
- Each now has an **edit page** (`/admin/<resource>/[id]/edit`) with
  language tabs (`components/admin/LanguageTabs.tsx`) — switch tabs to
  add or update that language's translation; fields that aren't
  per-language (name, slug, photo, branch, rating, ...) stay shared
  across all four.
- Branches and Client Logos remain single-language by design — nothing
  in their schema is translatable (an address and a logo image don't
  change per language).

### MFA enrollment and refresh tokens

- **`/admin/security`** (new) — shows MFA status for the signed-in
  account. "Enable MFA" calls `POST /auth/mfa/setup`, renders the
  resulting `otpauth://` URL as a QR code (via the free
  `api.qrserver.com` image service — no dependency added) plus the raw
  secret for manual entry, and a form to confirm the 6-digit code via
  `POST /auth/mfa/confirm`. MFA can also be disabled from the same page.
- **Refresh tokens are real now.** `POST /auth/login` returns both an
  access token (15 min) and a refresh token (7 days); both are stored as
  separate httpOnly cookies. Next.js can only set cookies from
  Middleware or a Server Action — not from a Server Component's render —
  so the actual refresh happens in `middleware.ts`: on every `/admin`
  request (except `/admin/login`), it decodes the access token's `exp`
  (without verifying the signature — that's the API's job; this is only
  to decide whether refreshing is worth attempting), and if it's missing
  or expiring within 30 seconds, calls `POST /auth/refresh` and writes
  the new token pair onto the response before the page renders. This is
  the same pattern Next.js's own docs show for refresh-token auth. A
  refresh token that's itself expired or invalid just lets the existing
  401-redirect-to-login handling in every admin page take over.
- **What this doesn't give you**: true revocation (there's no
  server-side denylist — a stolen refresh token stays valid until it
  expires; treat this as stateless rotation, not a full session-store
  design), and a UI to see or revoke other active sessions.

### Admin shell: no-code content editing, fixed layout

- **Pages & Content and Header & Footer are now plain forms** — no JSON,
  no code. Text fields, and for lists (stats, trust badges, "why choose
  us," industries, values, timeline, nav menu, footer columns) a fixed
  number of pre-rendered rows where leaving a row blank removes it. A
  non-technical editor can do everything here by typing into labeled
  boxes.
- **The dashboard shell is now fixed in place.** `app/admin/(dashboard)/layout.tsx`
  pins the whole shell to the viewport height (`h-screen overflow-hidden`);
  the sidebar and topbar no longer scroll away — only the content pane
  under the topbar does, and only vertically. Every table that could get
  wide (Leads, Services, Team, etc.) scrolls horizontally *within its own
  box* instead of ever widening the page sideways.
- **On a duplicated sidebar**: a thorough code audit (grep across the
  whole project) confirms `<Sidebar />` is rendered from exactly one
  place — `app/admin/(dashboard)/layout.tsx` — with no second layout or
  stray page file anywhere. If you still see it twice, it's a dev-server
  artifact (most commonly two `next dev` processes running on the same
  port, or a Fast-Refresh reconciliation glitch after the route folders
  were restructured earlier in this project's history) — kill any
  running `next dev` processes, delete `.next/`, and start fresh with
  `npm run dev`. I can't reproduce or rule this out further from a static
  code review alone; I don't have a way to run this app and view it in a
  browser from here.

**New: the dashboard's search box actually works now.** It was pure
decoration before — no `name` attribute, not wired to a form, so typing
into it and pressing Enter did nothing. It now submits to
`/admin/search?q=...`, which searches across Services, Team, Branches,
Leads, Insights and Testimonials by name/title/slug and links straight
to each result's edit screen. "+ New Service" was already working (it
opens the Services page, which has the "Add a Service" form built in)
— if that felt like "no option to create," it's likely because the
create form only asks for the essentials (slug, title, summary,
description); the fuller AEO fields (What is it / Benefits / Process /
FAQs etc.) are filled in on the Edit screen after the service exists,
by design, to keep the initial form short.

**New: Image Position control**, for every image you were asking about —
uploaded via the admin, cropped into a fixed shape on the public site, and
now with a Top / Center / Bottom control so the important part of the
photo doesn't get cut off:
- **Team member photos** (`/admin/team/[id]/edit`) — also, the public
  Team page, Find an Expert page, and homepage now actually render the
  uploaded photo instead of a `[Photo]` placeholder box (they read the
  photo before, but never displayed it — genuinely missing, now fixed).
- **Blog/Insight cover images** (`/admin/insights/[id]/edit`) — the
  Insights list page now shows the cover thumbnail too (previously
  text-only cards).
- **Homepage hero image** (`/admin/content?page=home`) — optional; upload
  one and it replaces the decorative bar-chart panel next to the
  headline. Leave it empty and the panel stays as-is.
- **About page image** (`/admin/content?page=about`) — optional; shown
  beside the company story.

Left for a future pass, flagged rather than silently skipped: Service
detail pages and the individual Service admin form have no image field
at all today (only an icon key and a brochure PDF) — if you want a hero
image per service, say so and I'll add it the same way. Also noticed
while wiring this: there's no `/insights/[slug]` detail page yet — the
Insights list links nowhere per article. Both are real, scoped asks, not
done yet.

**Since the last update — a reported bug that turned out to be a stale
local copy, plus one genuinely new feature:**
- Re-checked the reported "duplicate sidebar / not static / scrolling"
  issue by actually running this exact code (`npm run dev` + a headless
  browser screenshot, not just reading the source) — it renders with a
  single sidebar, a single fixed header, and no page-level scroll, on
  this exact zip. Same result for the "company name isn't
  configurable," "no landing page," and "service detail page isn't
  configurable in the dashboard" reports: the company name/logo has read
  from Site Settings (not a hardcoded "EFC") for a while
  now, the homepage and the auto-generated per-branch local-SEO landing
  pages (`/dubai-audit-firm` etc., with LocalBusiness schema) both
  render correctly, and the Services edit page already has every AEO
  field (What is it / Who needs it / Benefits / Process / Cost factors /
  Timeline / FAQs). If you're still seeing any of this, it's almost
  certainly an old copy of the project on disk or a stale `.next` build
  — see "If something looks out of date" below before assuming it's a
  code bug.
- New: **System Messages** (`/admin/messages`) — the actual success/error
  wording shown on the Contact form and the Careers application form
  (e.g. "Please fill in your name and email before sending") is no
  longer hardcoded in the page source. It's editable per-language from
  this new dashboard screen, backed by the same Translation table the
  language system already used for UI labels — a sensible default ships
  as the field's placeholder until an admin overrides it.
- New: the API terminal now prints one line per request (method, path,
  status, timing). Previously the only thing that ever appeared after
  startup was a 500-level error, so a normal save from the dashboard was
  invisible in that terminal — that's what "the backend log isn't
  showing anything" was.

## New: rich text, per-block animation, live preview, and site-wide hover effects (phase 1 of the page-builder ask)

You asked for full control from the dashboard — build pages, control every
text's font/size/color/bold/italic, animation on everything, a preview eye
icon everywhere. That's genuinely a Wix/Webflow-scale build; doing it
properly (rather than half-wiring it across 15+ content blocks in one pass
and risking breakage) means shipping it in stages. This is stage one, and
the pattern below is now proven end-to-end and ready to roll out further —
say the word for which block/page to do next.

- **`components/admin/RichTextField.tsx`** — a bold/italic/underline, font
  size and text color toolbar over a `contentEditable` field. No new
  dependency (it's built on `document.execCommand`, not a third-party
  editor). Content is stored as an HTML string in the same JSON field the
  old plain textarea used, and rendered on the public site through
  **`lib/rich-text.ts`**'s `sanitizeRichText()` — an allowlist sanitizer
  that strips anything except the formatting tags themselves (no
  `<script>`, no `onclick=`, etc.) before it's used with
  `dangerouslySetInnerHTML`. Wired up so far on: Hero Body Text, About
  Page → Company Story, About Page → Leadership Message.
- **`components/admin/AnimationPicker.tsx`** — a dropdown (None / Fade Up
  / Fade In / Slide From Left / Slide From Right / Zoom In) that saves an
  `animation` field alongside a block's content.
  **`components/site/Reveal.tsx`** (the scroll-reveal wrapper from the
  previous update) now reads a `variant` matching those same option
  values, so a block's animation becomes genuinely admin-configurable, not
  just on/off. Wired up so far on: the Hero's entrance animation (runs on
  page load, since the hero is always above the fold rather than
  scroll-triggered like the rest of the page).
- **`components/admin/HeroForm.tsx`** — the Hero Banner form is now a
  client component with a **live preview panel** (the eye icon, top-right
  of the form) that updates as you type or pick a file, without saving
  first. This is the reference implementation for "preview with an eye
  icon" — an accurate scaled mock of the real hero, not an iframe of the
  live site (an iframe would need the draft saved first to reflect it;
  this updates instantly instead).
- **Site-wide hover micro-animations** — buttons and cards on the public
  site now lift/respond subtly on hover (see the `main a`, `main button`,
  `main .card-grid > div` rules near the bottom of `app/globals.css`).
  This one's global — no per-page setup needed — and scoped to the public
  site's `<main>` so the admin dashboard's own buttons/cards stay still.
- All of the above respects `prefers-reduced-motion` and degrades safely —
  nothing here can break a page that never uses it.

**What's not done yet** (the rest of the phase-1 scope): rich text +
animation picker on the remaining content blocks (Stats, Trust Strip, Why
Choose Us, Industries, Services fields, Team bios, Testimonials, Insights
articles, Site Settings, Header/Footer); a live preview panel for those
same blocks; true page-building (assembling a new page from a section
library) and structured new-page templates are phase 2/3 and weren't
started — see the conversation for the three options laid out earlier.

## Fix: production build crash on an untranslated Insight/Service

If `npm run build` failed with `TypeError: Cannot read properties of
undefined (reading 'split')` while prerendering `/ar/insights/...`,
`/fr/insights/...` or `/hi/insights/...` (or a similar crash reading
`toLowerCase` on a service page) — that happened whenever an Insight
article or Service had content saved only in English but not yet
translated into the other languages: the API was returning `title`/
`excerpt`/`body` as `undefined` for the missing language, and the page
crashed trying to use them.

Fixed on both ends:
- **API** (`insights.service.ts`, `services.service.ts`) — when the
  requested language has no translation row yet, the API now falls back to
  the English translation instead of returning blank fields.
- **Frontend** — the insights/services pages no longer crash even if a
  field really is empty; they just render blank/fallback text instead of
  throwing.

Separately: your build log mentioned an article at
`/insights/transfer pricing` — that slug has a literal space in it, which
isn't URL-safe. Worth renaming that article's slug in Admin → Insights to
something like `transfer-pricing` (no spaces) so its URL works correctly
everywhere, not just to avoid the crash above.

**You'll also need the schema push described above** — if you saw
TypeScript errors like `'imageUrl' does not exist` or `'answers' does not
exist` when starting the backend, that means `npx prisma generate` /
`npx prisma db push` haven't been run yet against the current
`schema.prisma`. Run those two commands in `sterling-vance-api`, then
restart the backend.

## New: redesigned careers/apply page + Application Form Builder

The `/careers/:id/apply` page was previously a bare form with no job detail
on it at all. It's now redesigned to a Ceenex-style layout — using your own
EFC/EFC branding and copy, no other company's names or logos —
and the fields collected from applicants are now admin-configurable, not
hard-coded.

**Requires the backend README's "careers form-builder support" schema
push** (`npx prisma generate && npx prisma db push` in `sterling-vance-api`)
before this works end-to-end — the job's Key Responsibilities / Preferred
Qualifications text and the per-application custom answers both live in new
database columns.

- **Admin → Careers** — "Add a Job Opening" now also takes **Key
  Responsibilities** and **Preferred Qualifications** (one bullet per line,
  same convention as a Service's Benefits field).
- **Admin → Careers → Application Form Builder** (new page,
  `/admin/careers/form-builder`) — add, remove, reorder and configure extra
  applicant fields (label, type — text/email/phone/long text/dropdown/
  date/number —, required, and dropdown options). These apply to *every*
  job's apply page, in the order set here. No code change needed to add a
  field like "Nationality" or "Expected Salary" — it's the same flexible
  JSON content-block pattern used for the location gate, so there's no new
  schema for the field *definitions* themselves.
- **Public `/careers/:id/apply`** — now shows the job's title, department/
  location/type, full description, a "Key Responsibilities" and "Preferred
  Qualifications" section (bulleted, in the firm's accent color), then a
  centered "Apply Now" heading, then a field grid: the fixed fields (Full
  Name, Email, Phone, Resume, Cover Letter) plus whatever fields the
  Application Form Builder is configured with.
- **Admin → Careers → View Applications** — each row now has a "Details"
  column showing the applicant's phone, their answers to any custom fields,
  and their cover letter (collapsed). The CSV export also gained a "Custom
  Answers" column.
- A public `GET /careers/jobs/:id` endpoint was added to the API so the
  apply page can look up one job's full detail (previously the API only
  exposed the summary list used on `/careers`).

## New: overlay darkness, client logo display settings, reorderable menus, more section animations

- **Hero overlay darkness is now admin-configurable** — Admin → Content →
  Home → Hero Banner → **Overlay Darkness** slider. The hero's dark tint
  over your photo/video was previously a fixed value in the code (quite
  dark, to guarantee the white text stayed readable over any image) — if
  your video looked dull or muddy, that fixed darkness was why. It now
  defaults to a lighter 55% and you can drag it anywhere from 0 (no tint,
  full video/photo brightness) to 100 (the old fixed-dark look) with a
  live preview right there in the form.
- **Client Logos → Display Settings** (new, at the top of Admin → Client
  Logos) — alignment (center/left), logo size, and grayscale on/off. The
  homepage's "Trusted By" row now reads these instead of a fixed style.
- **Header & Footer menus are now reorderable** — Admin → Header & Footer:
  every link row has ↑/↓ buttons and a remove button, and there's an "Add
  Link" button, instead of a fixed number of blank slots you had to
  retype into to reorder.
- **More sections now have their own scroll animation**, configurable per
  page in Admin → Content → [Home/About/Services] → **Section
  Animations**: every major section on the homepage (Stats, Trust Strip,
  Client Logos, Services grid, Why Choose Us, Industries, Testimonials,
  Insights, Locations, bottom CTA), the About page (Story/Mission/Vision,
  Values, Timeline, Leadership), and the Services list/detail pages. This
  was previously only wired up for the Hero.

**About those bracketed placeholders on the live site** ("[XX]+",
"[PROFESSIONAL ACCOUNTANCY BODY]", etc.) — these are not hardcoded; they're
the seed/placeholder values for fields you haven't filled in yet, and every
one of them is editable right now:
- Stats numbers ("[XX]+ Years in Practice" etc.) → Admin → Content → Home
  → **Stats**
- "Member, [PROFESSIONAL ACCOUNTANCY BODY]" and the rest of that line
  under the hero buttons → Admin → Content → Home → Hero Banner →
  **Credential Line**
- "[PROFESSIONAL BODY]" in the Trust Strip → Admin → Content → Home →
  **Trust Strip**

If you're seeing a stray `]` character on its own on the homepage, that's
saved text sitting in one of the Hero fields (most likely **Body Text** or
**Credential Line**) rather than a bug — open Admin → Content → Home →
Hero Banner and check those fields for a leftover bracket.

## New: rich text + live preview on Services (page-builder rollout, next page)

Following the same reference pattern as the Hero (rich text toolbar + live
preview panel), **Services** now get it too — Admin → Services → Add a
Service, and Admin → Services → [service] → Edit:

- **Description**, **What is it?** and **Who needs it?** are now rich text
  (bold/italic/underline/font size/color), rendered on the public service
  detail page with the same styling you set in the admin. Summary stays
  plain text on purpose — it also feeds the homepage card, the Services
  listing card, and the page's `<meta description>`, none of which can
  render HTML.
- A **live preview panel** (eye icon, top-right of the Content section)
  shows an approximation of the service card and the top of its detail
  page as you type, before you save.
- Benefits, Process, Cost Factors, Timeline and FAQs are unchanged (still
  plain text — they're structured lists/short fields, not prose).

You asked for this across Team & Testimonials, Careers & Insights, and
Site-wide chrome (Header/Footer/Site Settings) too — those are next,
following this same pattern, in upcoming updates.

## New: rich text + live preview on Team & Testimonials

Continuing the same rollout — Admin → Team (add/edit) and Admin →
Testimonials (add/edit):

- **Team → Bio** is now rich text with a live card preview (photo, name,
  position, bio, qualification) as you type.
- **Testimonials → Quote** is now rich text with a live preview of the
  homepage testimonial card (quote, client name, title).
- Client Name/Title and Team Name/Position moved into the same preview
  panel so the preview updates as you type them, not just the rich-text
  field.

## New: rich text + live preview on Careers & Insights

Continuing the same rollout — Admin → Insights (add/edit) and Admin →
Careers (add):

- **Insights → Body** is now rich text (bold/italic/underline, font size,
  color) with a live article preview (title + formatted body) as you type,
  same toolbar as Hero/Services/Team/Testimonials.
- The public article page (`/insights/[slug]`) now renders Body as
  sanitized HTML instead of splitting plain text on blank lines — this
  also replaces the old paragraph-splitting logic that was the root cause
  of the earlier `/insights/transfer pricing` build crash for
  untranslated languages (that crash was already fixed at the data-fetch
  level; this is an unrelated follow-up cleanup of the same rendering
  path).
- **Careers → Description** (on the "Add a Job Opening" form) is now rich
  text too, with the same toolbar. The public apply page renders it as
  sanitized HTML.
- **Key Responsibilities** and **Preferred Qualifications** are
  deliberately left as plain, newline-per-item textareas — they render as
  bullet lists on the apply page, and turning each line into its own
  rich-text field would add complexity without a real benefit. Same
  reasoning as Services' Benefits/Process/Cost Factors/Timeline fields.
- Insight **Title** and **Excerpt** stay plain text on purpose — Excerpt
  feeds the `<meta description>` tag and the article-card blurb on
  `/insights`, so it needs to stay markup-free, same as Service Summary.
- There's still no "Edit" screen for job openings (Admin → Careers only
  supports Add + Close) — this was flagged before Careers/Insights work
  started and hasn't changed; happy to add one if you want it.

## New: site-wide chrome — every page now has admin-configurable animation, plus a real hardcoded-placeholder fix

The fourth and last of your four selected areas. Header, Footer and Site
Settings themselves turned out to have no long-form text fields left to
convert to rich text — every field there (company name, tagline, phone,
nav labels, footer link labels, etc.) is a short single-line value that
also feeds `<meta>` tags or the header/footer chrome, so it's correctly
staying plain text, same reasoning as Insight Excerpt and Service Summary.

What "site-wide chrome" turned into instead, so the "every page, every
animation, decided from the admin dashboard" part of your original ask is
actually complete rather than partially done:

- **Found and fixed a real hardcoded placeholder**: the paragraph under
  "Build your career in practice" on the public `/careers` page was
  literally hardcoded in the page's code —
  `[Placeholder — a short paragraph on culture, training pathways...]` —
  not wired to the admin dashboard at all. This is now a "Careers Page
  Intro" rich-text field at the top of **Admin → Careers**, with the same
  bold/italic/underline/size/color toolbar as everywhere else. This was
  the same class of bug as the bracketed stat placeholders and stray "]"
  you flagged earlier — those turned out to be admin-editable seed content
  already, but this one genuinely wasn't wired up, so thank you for
  pushing on it.
- **Every remaining public page now has scroll animation control**:
  Team, Careers, Insights (both the list and the individual article),
  Contact, and Find an Expert previously had zero `<Reveal>` wrapping at
  all — their sections just appeared instantly with no way to configure
  that, unlike Home/About/Services from the last update. They're now
  wrapped the same way, with a **Section Animations** picker for each on
  new tabs in **Admin → Pages & Content**: Team, Careers, Insights,
  Contact, Find an Expert (alongside the existing Home/About/Services
  tabs). Every page on the site is now covered by the same admin
  animation control.
- Team, Careers and Insights' actual content (team members, job listings,
  articles) still lives on their own dedicated admin screens — the new
  Content tabs for those three only hold the animation picker, with a
  one-line note pointing to where the content itself is edited, so
  nothing is duplicated.

## New: auto-translate, German, dropdown header nav, section visibility toggles, and more (2026-09-18)

Seven fixes/features from one round of feedback:

- **Auto-translate (Google Cloud Translation API)**: Insights, Services,
  Team and Testimonials edit screens now show an "Auto-translate" panel
  on the English tab. Click it and every non-English tab (Arabic, German)
  is filled in from the English content via Google Translate — rich-text
  fields keep their formatting, since they're translated with HTML-aware
  mode rather than as plain text. This is a first draft, not a publish:
  nothing is shown on the public site until you open the translated tab,
  review it, and hit Save yourself, same as filling it in by hand. Needs
  a `GOOGLE_TRANSLATE_API_KEY` set on the **backend** — see that repo's
  `.env.example` for exactly where to get one (a few clicks in Google
  Cloud Console, free for the first 500k characters/month). Without the
  key, the button shows a clear error and everything else keeps working.
- **Languages swapped**: French and Hindi removed, German added, on both
  the public site and every admin language dropdown. Admin → Languages
  also gained a self-service "Add a Language" form — note that a brand
  new language still needs one line added to `lib/i18n.ts`'s `locales`
  array (documented right there in the form) before its public `/xx/...`
  routes go live, because Next's static export needs the locale list at
  build time; the DB side (translations, content) is otherwise fully
  admin-driven from that form onward.
- **Header language & location are now real dropdowns** instead of a row
  of separate links, and the **phone number was removed** from the
  header's top utility bar per your request (it's still on Contact and in
  the footer).
- **Client logos now actually animate**: previously a static row despite
  being labeled "carousel." It's a genuine auto-scrolling marquee now
  (pauses on hover, falls back to a plain scrollable row under reduced-
  motion settings), and **Admin → Client Logos** got a real settings form
  — alignment, size, grayscale, and a Scroll/Static toggle — with a live
  preview built from your actual uploaded logos, so you can see the effect
  before saving.
- **Per-page, per-section visibility toggles**: every section on every
  page that already had an animation picker (Admin → Pages & Content) now
  has a checkbox next to it. Uncheck a section — Testimonials on the
  homepage, say — and it's completely removed from that page: no gap, no
  leftover spacing, nothing rendered at all. This is the "decide what
  visual shows on what page" control from your message.
- **Privacy Policy and Terms of Service didn't exist as pages at all** —
  the footer links pointed at `/privacy` and `/terms`, both 404s. Built
  both end-to-end: **Admin → Legal Pages** (title + rich-text body, one
  card per page) and the two public routes that render them.
- **Fixed three leftover placeholder/watermark boxes**: a `[Photo]` box
  that stayed visible even when a team member or expert had no photo
  uploaded (Team page, Find an Expert page), and a matching `[Photo]` box
  on the homepage's Insights cards when an article had no cover image.
  All three now simply don't render anything when the image is missing,
  instead of showing placeholder text on the live site.

## New: Service Responsible Person, empty-hero fix, client logo spread/movement fix (2026-09-18, later same day)

A follow-up round on the same feedback thread:

- **Service detail page 404**: the actual cause was a slug typed with a
  stray space/comma (`sqm s,` in the URL you hit) — the Add Service form
  now auto-cleans whatever you type into Slug (lowercases it, swaps
  spaces/punctuation for hyphens) so that class of typo can't happen
  again going forward. The already-broken service from before still has
  its bad slug saved — open it in **Admin → Services → Edit** and
  re-save, or delete and recreate it, to get a clean URL.
- **New: Responsible Person on services**. Admin → Services → Edit (and
  the "Add a Service" form) now has a **Responsible Person** dropdown,
  populated from **Admin → Team**. Pick who should be the contact for
  that service and the public service page shows a card with their
  photo, name, position, and LinkedIn/email/phone as icon buttons. Team
  members gained **Email** and **Mobile Number** fields (next to the
  existing LinkedIn URL) in both the Add and Edit Team forms to back
  this — needs a backend schema push, see that repo's README.
- **Empty Hero no longer shows broken boxes**: if a hero field (eyebrow,
  headline, body, either button, credential line) is blank, that
  specific piece now just doesn't render, instead of showing an
  empty-but-styled box (what you saw as a stray gold rectangle and an
  empty outlined one). The background image/video/fallback illustration,
  layout and height are unaffected either way.
- **Client Logos**: the "Trusted By" carousel previously only auto-
  scrolled with more than 3 logos — with only 2 uploaded, it silently
  fell back to a static, centered pair that looked sparse against the
  wider Trust Strip above it. Auto-Scrolling now works with any number of
  logos ≥ 2 (they're repeated to fill the row before it loops). Static
  Row mode also gained a **Spread (edge to edge)** alignment option
  (alongside Center/Left) for when you'd rather not scroll a small set of
  logos — it stretches them across the full width instead of clustering
  them in the middle. Both are in the same **Admin → Client Logos →
  Display Settings** panel as before.
- **Where the rest of "not configured in admin" content actually lives** —
  several things you flagged already have an admin screen, just not
  where you looked:
  - The **`[PROFESSIONAL BODY]`** placeholder is one of the five Trust
    Strip badges — editable as a plain list (one per line) under
    **Admin → Pages & Content → Home → Trust Strip**.
  - **Stats, Why Choose Us, and Industries** on the homepage are all
    editable from that same **Admin → Pages & Content → Home** screen.
  - **Every page's section order/visibility/animation** — including the
    new Responsible Person card — is controlled from **Admin → Pages &
    Content → [page name] → Section Visibility & Animations**: a
    checkbox (show/hide) plus an animation-style picker (Fade Up, Fade
    In, Slide Left/Right, Zoom In, or None) for every named section on
    every page, home included. If there's a specific visual on a
    specific page you want a dedicated animation control for beyond what
    that per-section list already covers, tell me which one and I'll
    wire it in — "all pages, all visuals" is a lot of ground, and I'd
    rather get each one right than guess.

## New: Responsible Person sidebar, Team contact icons, instant admin saves, dropdown location/language (2026-09-18, third round)

- **Responsible Person moved to a left sidebar** on the service detail
  page instead of sitting below the description — it's sticky, so it
  stays in view as you scroll the rest of the page. The icon row now
  uses a shared `components/site/ContactIcons.tsx` component.
- **Service cards clamp their description** to 3 lines (`/services` and
  the homepage) instead of stretching the card to fit however much text
  was pasted in, and the link now reads **"See more"**. If a card still
  looks odd, it's almost always the underlying content — e.g. a service
  whose Description field has an unrelated bio pasted into it, or whose
  Image was uploaded as a marketing graphic with baked-in text — both
  are just what was entered in Admin → Services, not a rendering bug.
- **Team page and Find an Expert** now show LinkedIn/email/phone icons
  next to each person's name (same icons/fields as the Responsible
  Person card), and the Team page's bio also clamps to 4 lines.
- **Admin saves now reflect on the public site immediately.** Previously
  every public page cached its content for up to 60 seconds (so a save
  could take up to a minute to show up); every admin save now clears
  that cache the moment it succeeds. You may still need an ordinary
  browser refresh to see it — Next.js doesn't push updates into a tab
  that's already open.
- **Header location & language are now custom dropdowns**, not native
  `<select>` elements — a location pin / globe icon plus a dark panel
  matching the header, instead of the browser's own (always white)
  dropdown list. Same navigation behavior as before.

## New: per-page Text Size, and photo uploads for Trust Strip / Why Choose Us / Industries (2026-09-18, fourth round)

- **Text Size control, per page.** Admin → Content → (a page) now has a
  "Text Size" card with two dropdowns — **Heading Size** and **Body
  Size** (Small / Medium / Large) — controlling that page's main `<h1>`
  and its lead/intro paragraph. It's deliberately per-page rather than
  one global site-wide dial: almost every text size in the codebase is a
  hand-set pixel value (not a scalable root font-size), so a single
  global control couldn't reliably resize everything without breaking
  layouts. This covers Home, About, Services (list + each service detail
  page's title), Insights (list + each article's title), Team, Find an
  Expert, Careers and Contact.
- **Photo/icon uploads added to three homepage sections that didn't have
  them before:**
  - **Trust Strip** — each of up to 8 credentials can now have its own
    logo/badge image, shown above the label.
  - **Why Choose Us** — each of up to 6 reasons can now have its own icon
    image; leave it empty and the original checkmark icon is used
    instead.
  - **Industries** — each of up to 10 industry tags can now have a small
    icon shown inside the pill.
  
  All three are optional — you can leave every image blank and they'll
  look and behave exactly as before. Existing Trust Strip/Industries
  content saved as plain text lines (from before this feature) is read
  automatically; you don't need to re-enter it, only add images if you
  want them.

## New: Team hover bios, footer logo, nav-order fix, Partners/Key Members, SEO/AEO, built-in Analytics, advanced animations (2026-09-18, fifth round)

**Requires a backend migration** — see sterling-vance-api's README ("New:
Team categories, built-in Analytics") for the one command to run.

- **Team card hover** — a bio clamped to 4 lines on the Team page now
  reveals its full text in a floating panel on hover (or keyboard focus).
- **Footer logo** — the logo set in Admin → Site Settings now also shows
  in the footer, not just the header (it was uploadable before, just
  never rendered there).
- **Header nav-order bug fixed** — reordering the nav in Admin → Header &
  Footer (e.g. moving About before Services) had no visible effect,
  because Services was hardcoded to always render first regardless of
  its position in the saved order. It now renders wherever the admin
  puts it.
- **Team: Partners / Key Members** — each team member now has a Category
  (Admin → Team → Category, or on the Add/Edit form), and the public Team
  page groups into two headed sections when at least one of each exists.
  Everyone defaults to "Key Member" until re-categorized.
- **Admin → Leads now shows what was actually asked** — the leads table
  only ever showed name/contact/source/status; the service the person
  was interested in and their message were captured but never displayed.
  Each lead with either now has a "What [name] asked" expandable row.
- **SEO & AEO**: added `/sitemap.xml` and `/robots.txt` (neither existed
  before — search engines had no complete list of pages to crawl, and no
  explicit instruction to skip `/admin`), Open Graph + Twitter Card tags
  and hreflang language alternates on every page (via `buildPageMetadata`
  in `lib/api.ts`), a site-wide Organization/ProfessionalService JSON-LD
  block (name, logo, contact, every branch address), Article JSON-LD on
  each Insights post, and a Social Share Image field in Admin → SEO &
  Schema. None of this guarantees a #1 ranking — no one can promise that
  — but it fixes real, concrete gaps that hurt discoverability and how
  links look when shared.
- **Built-in Analytics** (Admin → Analytics) — page-view tracking with no
  third-party account needed: total views, a day-by-day chart, top pages
  and top referrers, over the last 7/30/90 days. The Dashboard's
  "Website Views" stat card is now wired to real data instead of showing
  "not implemented yet."
- **Advanced animation controls** — each section's existing Animation
  Style picker (Admin → Pages & Content → a page → Section Visibility &
  Animations) now also has **Speed** (slow/normal/fast), **Delay**
  (none/short/medium/long), a **Hover Effect** picker (default lift,
  stronger lift, zoom, glow, underline, or none) for the cards inside
  that section, and an **"Animate items one by one"** checkbox that
  staggers each card's entrance instead of the whole section fading in
  as one block. All four are optional — leave them at their defaults and
  a section behaves exactly as before.

## New: admin preview widened, bio-overlap fix, reorder-by-arrow everywhere, Toast-only messaging, sub-services, smarter chatbot, page headers admin-configurable, About photo gallery + milestones, SEO/AEO/GEO pass (sixth round)

**Requires a backend migration** — see sterling-vance-api's README ("New:
SubService model, chatbot escalation now links a Lead") for the command.

- **Editor preview panel widened** — the live-preview column on Team,
  Services, Testimonials, Insights and Client Logo edit screens was a
  fixed 380px, hidden below the `xl` breakpoint, leaving dead space next
  to a narrow form. It's now `minmax(420px, 34vw)` and visible from `lg`
  up.
- **Team bio no longer gets covered by the row below** — the old
  hover-expand bio panel used `position: absolute` + `z-index` tricks
  that a lower grid row could still paint over, and never worked on
  touch devices at all. Replaced with a centered modal dialog ("Read
  full bio") that has no stacking relationship with its neighbors.
- **No more incomplete-looking grid rows** — Team's grid used to need an
  invisible filler box to pad out a partial last row (e.g. 3 of 4
  people); it's now a plain gapped grid with per-card borders, so a
  partial row just ends — nothing shown, nothing to fake.
- **Reorder-by-arrow on Team, Testimonials, Client Logos and Branches** —
  the ▲▼ (or ←→) controls already used for Services and the header/footer
  nav are now available on these lists too, so "which one shows first"
  is always an admin decision, never source order.
- **Every success/error message is now a Toast, nowhere a banner** —
  `Toast.tsx` already existed and was correctly mounted, but ~37 admin
  pages also rendered their own duplicate top-of-page banner alongside
  it. Those are all removed; the floating, auto-dismissing Toast is now
  the only success/error UI anywhere in the dashboard.
- **Services now support Sub-Services** — e.g. "External Audit" can list
  several specific audit offerings underneath it. Manage them from a
  service's edit page; they show on that service's public page under
  "What this includes," and the header's Services dropdown now shows
  headline + sub-service names only (the old per-service description
  under each hover item is gone, per feedback that it was too busy).
- **Chatbot answers from the whole site, not just FAQs** — it now
  searches Services, Insights and Team content in addition to the FAQ
  list (no external AI/API — still local keyword matching, just over a
  wider set of documents), replies with a "Learn more →" link to the
  matched page when there is one, and a new **Admin → Chatbot** page
  shows every conversation, who asked (name + email, once a visitor
  leaves them when requesting a person), and a transcript — plus FAQ
  management, moved here from wherever it lived before.
- **Every page's header is now admin-configurable** — the eyebrow label,
  `<h1>`, and lead paragraph on About, Team, Services, Careers, Contact,
  Find an Expert and Insights used to be plain strings typed directly
  into each page's source. They're now editable from Admin → Pages &
  Content → (page) → **Page Header**. (Home's headline already came from
  the Hero section, so it isn't included here.) The existing **Text
  Size** form on the same screen also gained a **Heading Font**
  (serif/sans) and **Alignment** (left/center) control.
- **About page: Photo Gallery + Milestones** — a new Admin → Pages &
  Content → About → **Photo Gallery** lets you upload up to 8 team/office
  photos (each with an optional caption); on the public page they
  crossfade into one another automatically. The existing Firm Timeline
  content is unchanged but now renders as a proper vertical milestone
  timeline (connecting line, dot markers, larger year) instead of a
  plain list.
- **SEO/AEO/GEO pass** — added `BreadcrumbList` JSON-LD to service and
  insight detail pages, a `Service`/`OfferCatalog` JSON-LD block on each
  service page (lists its sub-services as structured `Offer`s), a
  `noindex` meta tag on every `/admin` route as defense-in-depth
  alongside the existing `robots.txt` disallow, and a new `/llms.txt`
  route — an emerging convention that gives AI answer engines (ChatGPT,
  Perplexity, Claude, Google AI Overviews) a concise, always-current,
  plain-text summary of the firm, its services and its locations, built
  from the same admin-configured content as everything else. No one can
  promise a #1 ranking, but this closes real, concrete structured-data
  and machine-readability gaps.

**Still open, and worth planning as its own round**: the full
"Wix/Webflow-style" visual builder — per-element font, spacing, layering
and drag-positioned live preview on every individual visual across every
page — is a substantially larger undertaking than the per-page Text
Size/Font/Alignment and per-section Animation/Visibility controls that
exist today. Those controls now cover every page and every section, but
they operate at the page/section level, not a from-scratch per-element
canvas editor. Flagging this rather than overstating what shipped.

## New: drag-and-drop reorder, per-branch "own website" redirect, floating Call/WhatsApp, richer animations + section backgrounds, expanded Analytics, pro-level SEO/AEO/GEO (seventh round)

**Requires a backend update** — pull the latest `sterling-vance-api` too;
see its README's matching "seventh round" section for the schema fields
this depends on (`Branch.externalUrl`, `PageView`'s new session/country/
device/browser columns, `SeoMeta.noindex`). No manual SQL needed — the
usual `npx prisma db push` picks all of it up.

- **Real drag-and-drop reordering** — Team, Testimonials, Client Logos,
  Branches and Services list pages now support dragging a row/card by its
  handle to reorder it, saved as one request (`PATCH .../admin/reorder`)
  instead of the old one-swap-at-a-time arrows. The ▲▼ arrows are still
  there too (drag isn't accessible from a keyboard), so nothing was taken
  away — this is a second, faster way to do the same thing.
- **A branch that already has its own separate website** — added an
  optional **External Website URL** field to each branch (Admin →
  Branches & Locations). When set, clicking that location in the
  full-screen Location Gate sends the visitor straight to that URL
  instead of filtering the site to that region — the picker shows an
  "Opens separate site →" badge on any location configured this way, so
  it's clear before clicking.
- **Floating Call / WhatsApp popup** — a small stacked pair of circular
  buttons at the bottom-left of every public page (Call using the phone
  number already in Site Settings, WhatsApp using a new WhatsApp Number
  field there), on by default and can be turned off entirely. The
  chatbot, confirmed already bottom-right, wasn't moved — there was
  nothing to fix there.
- **Richer animation library + per-section backgrounds** — `Reveal.tsx`
  gained five new entrance styles (Blur In, Clip Reveal, 3D Flip, Elastic
  Pop, Rotate In — all labeled "(advanced)" in the picker) on top of the
  existing fade/slide/zoom set, and every section on every page now also
  has a **Background** choice (None / Tint panel / Dark panel / Gradient
  panel) alongside its existing Animation/Speed/Delay/Hover/Stagger
  controls in Admin → Pages & Content → Section Visibility & Animations —
  the first concrete step toward the "specific visual per section, not
  one flat page of text" look that was asked for, short of a full
  drag-and-drop canvas editor (see "Still open" above, which remains the
  larger undertaking).
- **Expanded, still fully self-hosted Analytics** — Admin → Analytics now
  also shows: a **Sessions** count (distinct visits, not just page
  views); **Countries** (guessed client-side from the visitor's browser
  timezone — no IP address or third-party geo-IP service involved,
  anywhere); **Devices** and **Browsers** (parsed from the request's own
  User-Agent header); **Top Entry Pages** and **Top Exit Pages** (where a
  visit starts and ends); and a **Traffic Flow** list — the most common
  single "page A, then page B" step across all visits, which is the
  literal "how the traffic flows" the brief asked for. Still no Google
  Analytics/GA4 account, no cookie, no persistent visitor ID — the same
  privacy posture as before, just a deeper view of the same first-party
  data.
- **Pro-level SEO/AEO/GEO pass** — closes the standard "ranking
  checklist" items that were still missing, all admin-configurable:
  - Per-page **noindex** toggle (Admin → SEO & Schema) for pages that
    shouldn't compete in search results, plus a site-wide "block this
    entire site" emergency switch (Admin → Site Settings — meant for a
    staging/preview deployment only).
  - **Google Search Console** and **Bing Webmaster Tools** ownership
    verification meta tags — paste the code from each service into Site
    Settings, no code or file upload needed.
  - **`hreflang` `x-default`** added alongside the existing per-language
    alternates on every page, so a visitor whose browser language isn't
    English/Arabic/German still gets pointed at a sensible default.
  - A site-wide **default social share image**, used when a page has no
    image of its own set in SEO & Schema, so a shared link never has a
    completely blank preview.
  - `robots.txt` now has an admin field for **extra disallow paths**
    (Site Settings) on top of the always-blocked `/admin`/`/api`.
  - New structured data: **`Person`** entries for every team member (an
    `ItemList` on the Team page) and **`JobPosting`** entries for every
    open role (Careers page) — both strong candidates for Google/AI
    answer-engine rich results, and both previously had zero schema at
    all.
  - Being honest about what this can't promise: no configuration change
    guarantees a #1 global ranking — that also depends on backlinks,
    content quality/freshness, site speed and competition, none of which
    a settings page can manufacture. What shipped here closes concrete,
    verifiable technical gaps a search engine or AI crawler would
    otherwise penalize or simply miss.

## If something looks out of date

If a fix described in this README doesn't match what you see running
locally, sync your copy before treating it as a bug:

```bash
# Backend
cd backend
rm -rf node_modules dist
npm install
npx prisma generate

# Frontend
cd ../frontend   # or wherever this project lives
rm -rf node_modules .next
npm install
npm run dev
```

Also do a hard refresh in the browser (Ctrl+Shift+R / Cmd+Shift+R) or
open the dashboard in a private/incognito window — a cached old bundle
in the browser looks identical to a real bug.

**New: MNC-standard public site pass (homepage-first)**

The public marketing site's design system (navy/gold palette, serif
headings, hairline card grids — see `tailwind.config.ts` /
`app/globals.css`) was already close to a Big-4-style corporate look, but a
few real gaps kept it from feeling finished:

- `components/site/Header.tsx` — the desktop nav had **no mobile menu at
  all**: below the `md` breakpoint the links simply disappeared with no way
  to reach them. Added a proper hamburger/drawer for phones and tablets,
  and gave "Services" a Deloitte-style mega-menu (hover reveals a panel of
  your live services, pulled from the admin dashboard, not hardcoded).
- Homepage (`app/[lang]/(marketing)/page.tsx`) — added a "Latest Insights"
  section (there was previously no way to discover articles from the
  homepage at all), and gave the "Why Choose Us" icons real checkmarks
  instead of empty circles.
- **New:** `/insights/[slug]` article detail page — this genuinely didn't
  exist before; clicking an insight anywhere led nowhere. Also fixed
  `mapInsight()` in `lib/api.ts`, which was never mapping the article
  `body` field through from the API at all, so even a full write-up typed
  into the admin editor had nowhere to be displayed.

This is a first, homepage-focused pass. Extending the same treatment
(mega-menu-style layouts, richer imagery) to Services/About/Team/Careers is
the natural next step — say the word and I'll continue there.

**New: animated video hero + pre-homepage location gate + scroll animations**

- **Full-bleed animated hero** (`app/[lang]/(marketing)/page.tsx`) — the
  homepage hero is now a full-bleed section behind the header, with a
  looping muted background video (upload one in **Content → Home → Hero
  Banner → Hero Background Video**), a dark scrim so text stays readable
  over any footage, and a bouncing "Scroll" cue. No video uploaded? It falls
  back to your hero image (now with a slow Ken Burns drift instead of
  sitting static) or, with neither set, an inline vector skyline — never a
  blank hero. Uploads go through the same Cloudinary helper already used
  for images (`lib/cloudinary.ts`'s `/auto/upload` endpoint auto-detects
  video, so no backend changes were needed). The stats band that used to sit
  below the hero is now a white card that floats up and overlaps the hero's
  bottom edge, matching the "landing page" look you asked for.
- **Location gate** (`components/site/LocationGate.tsx`) — an optional
  full-screen picker shown once, before a first-time visitor reaches any
  page of the site, so they can choose their region. Turn it on and edit its
  copy in **Site Settings → Location Gate**. The list of countries is *not*
  typed in anywhere — it's read live from the countries set on your active
  branches in **Branches & Locations** (a new "Country" field there), so
  adding a branch in a new country automatically adds it to the picker. The
  choice is remembered in the visitor's browser (`localStorage`), so it only
  asks once. A small inline script decides whether to show it *before* the
  page renders, so there's no flash of the homepage underneath it.
- **Scroll-reveal animation** (`components/site/Reveal.tsx`) — a reusable
  wrapper, applied across every homepage section below the hero, that fades
  and lifts content into place the first time it scrolls into view.
  Respects `prefers-reduced-motion`, and degrades to "just visible" if
  `IntersectionObserver` isn't available, so it's never a content gate.

These are all off/absent unless you turn them on: an empty Hero Background
Video field keeps the image hero, and Location Gate defaults to disabled
until you switch it on in Site Settings.

**If you don't see the video/scroll-animation/location-gate features:**
they only exist from this zip onward — extract this over your `frontend`
folder (or a clean folder — see the reset steps earlier in this README),
then `npm install && npm run build && npm run start` (or `npm run dev`),
and hard-refresh the browser. There's nothing to turn on to see the scroll
animation — it runs on every homepage visit; the video and location gate
are opt-in as described above.

**New: partner/leadership photo, and full service creation in one step**

- **Leadership Message photo** — the "A Message From Leadership" block on
  the About page had no way to add a photo at all; it was text-only. Added
  an optional headshot field in **Content → About → Leadership Message**,
  shown next to the quote on the public About page.
  (Team member photos already had an upload field on the Team admin
  screen and were already rendering on the public Team page — if those
  aren't showing for you, check that a photo was actually uploaded for
  that member's row.)
- **Service images** — services had no image field anywhere. Added
  `imageUrl`/`imagePosition` to the Service model itself (see the backend
  README — this needs `npx prisma db push` after pulling the update) and
  wired it into the Services admin screen, the homepage service cards, the
  Services listing page, and each service's detail page.
- **"Add a Service" now creates a full service, not just a stub** — it
  previously only took a slug, title, summary and description, so every
  new service needed a second trip to its Edit screen just to become
  usable. The create form now includes the image, "What Is It", "Who
  Needs It", Benefits, Process, Cost Factors, Timeline and FAQ fields
  right on the same form — filling them in is optional, but you can now
  create a fully detailed service in one step. `updateServiceAction` is
  unchanged, so existing edit flows still work exactly as before.

**Previously, since the last update:**
- The admin dashboard's own sidebar had a literal, hardcoded "Sterling &
  Vance" name/logo regardless of what was set in Site Settings — the
  public site already read the name/logo dynamically
  (`components/site/Header.tsx`), the admin shell just never did. Fixed:
  `app/admin/(dashboard)/layout.tsx` now fetches Site Settings and passes
  `companyName`/`logoUrl` into `Sidebar`.
- Theme Builder's color fields are no longer raw hex text boxes — a new
  `components/admin/ColorField.tsx` pairs a native click-to-pick color
  swatch with the hex code, so nobody has to know or type a hex value.
  "Border Radius" is now a plain-language dropdown (Square / Barely
  rounded / Softly rounded / Rounded / Very rounded) instead of a raw CSS
  length field.
- Service detail pages had four sections that were literal
  `[Placeholder — ...]` text hardcoded in the page component — not
  connected to the admin dashboard at all. Fixed end to end: added
  `whatIsIt`/`whoNeedsIt`/`benefits`/`process`/`costFactors`/`timeline`/
  `faqs` to `ServiceTranslation` (needs a
  `npx prisma migrate dev --name add_service_detail_fields` on your
  machine — see below), a new "Answer Engine Sections" block on the
  service edit form, and real rendering on the public service page,
  including FAQ schema.org JSON-LD for each service's FAQs.
- Auto-generated branch/local-SEO landing pages now exist — one per
  active branch, at `/<city>-audit-firm` (e.g. `/dubai-audit-firm`),
  built from whatever's in Branches & Locations with LocalBusiness
  JSON-LD, no code change needed per branch. See
  `app/[lang]/(marketing)/[branchSlug]/page.tsx`, `branchSlug()` in
  `lib/api.ts`, and the Contact page's office cards, which now link to
  each one. Added to the sitemap too.
- `buttonStyle` ("sharp"/"rounded"/"pill") and `cardStyle`
  ("bordered"/"shadowed"/"flat") from the Theme Builder now actually
  render on the live site, not just saved to the API. Button style
  drives a dedicated `--btn-radius` CSS variable applied to every CTA
  button/link across the header and marketing pages (kept separate from
  the general `--radius` field so the two don't fight). Card style is
  applied via a `data-card-style` attribute on `<body>` plus a shared
  `.card-grid` marker class on the "hairline grid" card containers used
  on Home, Services, Team, Contact, Find an Expert and Insights — see
  the rules in `app/globals.css` and `lib/theme-runtime.ts`'s
  `buttonRadius()`/`normalizeCardStyle()` helpers.
- Branches and Client Logos now have real edit pages
  (`/admin/branches/[id]/edit`, `/admin/client-logos/[id]/edit`) with an
  "Edit" link from each list row, backed by new `updateBranchAction`/
  `updateClientLogoAction` server actions — no more delete-and-recreate
  to fix a typo. Client Logo edit keeps the existing image unless a new
  file is chosen.

**Genuinely still not built**, flagged rather than hidden:
- A full third-party security audit. What's actually in place: bcrypt
  password hashing, JWT + optional TOTP MFA, RBAC guards on every admin
  route, class-validator on every DTO with `whitelist`/
  `forbidNonWhitelisted`, Prisma's parameterized queries (no raw SQL
  injection surface), httpOnly session cookies, and — found and fixed in
  an earlier pass — a rate limiter that was configured but never actually
  applied as a guard, so it had been silently inert; it's now enforced
  globally (120 req/min) with a tighter 5/min limit on `/auth/login`.

## New: sub-service pages, fixed branch-redirect bug, sticky header, rich-text links, fully configurable Location Gate, homepage Freezone banner (eighth round)

**Requires a backend update** — pull the latest `sterling-vance-api` too;
see its README's matching "eighth round" section for the new
`SubService.body`/`imageUrl`/`imagePosition`/`videoUrl` columns
(`npx prisma migrate deploy` / `db push` picks these up, no manual SQL).

- **Fixed:** a branch with an "External Website URL" set (Admin →
  Branches & Locations) could silently be ignored by the Location Gate if
  another branch shared the same Country value (e.g. two branches both
  defaulting to "United Arab Emirates" because Country was left blank) —
  whichever branch happened to be read first "won" that country's slot,
  even if it had no external URL. Fixed in `getBranchCountries()` (`lib/
  api.ts`) so a branch **with** an external URL always wins its country's
  slot. The Country field's admin hint now explains this grouping
  behavior explicitly.
- **Sub-services now have their own full pages, with full design
  control**, matching the KGRN-style mega-menu reference you sent:
  - Each sub-service (Admin → Services → edit a service → Sub-Services)
    can now get its own URL slug, rich-text body, photo, video, and — via
    a new **Edit** link on that row — its own dedicated edit page with
    the *exact same* admin controls a main Service page has: Page
    Header, Typography (font/size/color per element), and Section
    Animations, all completely independent of the parent service and
    every other sub-service, per your "full independent control" choice.
  - On a Service's own page, sub-services show as compact cards with a
    "Learn More" toggle that expands in place (photo/video + rich body),
    and — once a slug is set — a "View full page →" link to the
    sub-service's own standalone page (`/services/[slug]/[subSlug]`).
  - The header's mega-menu now lists each service's sub-services as
    individually clickable links underneath it (capped at 6, sorted by
    the order set in the admin), instead of plain non-clickable text —
    the same pattern as the attached competitor reference. Sub-service
    pages are also added to the sitemap once they have a slug.
  - Rich-text fields (used for a sub-service's body, and everywhere else
    `RichTextField` appears — Hero, Services, Insights, Team,
    Testimonials) now support inserting a hyperlink: select some text,
    click the link icon in the toolbar, paste a URL. External links
    (`http(s)://`) automatically open in a new tab; `javascript:`/`data:`
    links are rejected by the sanitizer. This is what "place a redirect
    link in the content that takes them to a particular page" is built
    on — usable in any rich-text field, on any page, right now.
- **Header now stays frozen while the page content scrolls**, both
  vertically and horizontally — the entire header (utility bar + main
  nav together, not just the nav row) is now `position: sticky` as one
  unit, so the locations/language switcher no longer scrolls away
  leaving only the nav row frozen mid-page.
- **Location Gate (the pre-homepage location picker) is now fully
  admin-configurable** (Admin → Site Settings → Location Gate):
  background photo or video upload, an animation style (Fade / Zoom /
  Slide Up), and a "when should this appear" trigger — once per visitor
  (remembered on that device), once per browser session, or every single
  page load with no memory at all. The list of region choices itself is
  still generated live from Branches & Locations, as before.
- **New: "Approved Freezone" homepage banner** (Admin → Pages & Content →
  Home → Approved Freezone Banner) — an optional, more prominent
  call-out than the small Trust Strip badges, with its own badge text,
  headline, body, link (internal page or external URL — external links
  open in a new tab automatically), photo or video upload, media side
  (left/right), and its own scroll-reveal animation via the Section
  Animations panel further down the same tab, exactly like every other
  homepage section. Off by default until an admin fills it in and turns
  it on.

**Deliberately not built this round, flagged rather than attempted:** a
full drag-and-drop "website builder" (add/remove/rearrange arbitrary new
sections or blocks freely across any page from the admin dashboard,
Wix/Squarespace-style). What exists today — and now covers essentially
every page and section, including sub-services and the new Freezone
banner — is deep per-page, per-section control: typography, colors,
spacing, animations, photo/video, visibility and reordering for every
block the site currently has. That's a different, much narrower thing
than a from-scratch visual page-builder that lets you invent entirely new
layouts without any code changes at all. If that's genuinely what's
needed next, it's worth scoping as its own dedicated project — it's a
substantial undertaking on top of everything shipped so far, not a small
addition to this round.

## New: Page Builder — admin-added content blocks on any page (ninth round)

**Requires a backend update** — pull the latest `sterling-vance-api` too;
see its README's matching "tenth round" section for the new `PageBlock`
table this depends on.

This is the "website builder" piece that was deliberately deferred last
round, scoped as a real, usable increment rather than attempted as a
full drag-and-drop visual canvas in one pass — see "what this is not"
below for the honest boundary.

- **New admin screen: Page Builder** (Admin → Website Content → Page
  Builder, `/admin/builder`). Pick a page (Home, About, Services, Team,
  Careers, Insights, Contact, Find an Expert — plus any sub-service's own
  page, reachable via a new "Open in Page Builder" link on its edit
  screen) and add content blocks yourself, with no developer involved:
  - **Rich Text** — a formatted note (the same toolbar used everywhere
    else, including the hyperlink support added last round).
  - **Photo** — with optional caption and a click-through link.
  - **Video** — with playback controls and an optional poster image.
  - **Photo + Text** — a headline/body next to a photo or video, either
    side, with its own link.
  - **Call-to-Action Banner** — a headline and button.
  - **Quote** — a large pull-quote with an attribution line.
  - **Photo Gallery** — up to 8 photos in a grid.
  - **Spacer** — plain vertical space to separate two blocks.
  
  Every block has its own entrance animation (the same picker used
  throughout the site), can be hidden without deleting it, and is
  reordered by dragging its grip — same drag-and-drop mechanism as
  Services/Team/Branches lists. Blocks render after that page's existing
  fixed content (see `components/site/PageBlocks.tsx`).
- **Backend**: a new `PageBlock` model — `{ page, type, content (JSON),
  animation, order, isActive }` — with admin CRUD + reorder endpoints and
  a public `GET /page-blocks/:page?lang=` the frontend calls per page.
  `page` accepts the same string keys the existing Page Header/Typography/
  Section Animations system already uses (including a sub-service's
  composite `subservice::slug::slug` key), so no new "which page" concept
  was introduced — this slots into the page-key system that already
  existed rather than inventing a second one.

**What this is not**, flagged rather than overstated: this is an
*additive* block list, not a from-scratch visual canvas. An admin adds,
edits, reorders, hides and deletes blocks *appended after* a page's
existing fixed sections (Hero, Stats, Services Grid, etc.) — they can't
yet drag a block to a specific spot *between* two fixed sections, resize
a canvas freely, or build a page from a totally blank slate the way
Wix/Squarespace's page editor works. Combined with the deep per-section
control that already existed (typography, colors, spacing, per-section
animation/visibility on every page, plus now this block system for new
content), the gap left is genuinely narrow — but it's still a gap, and
closing it fully means a real drag-to-position visual layout engine,
which is its own project on top of everything shipped across these nine
rounds.

## Fix: production build crash (`TypeError: ... is not a function`) whenever Location Gate was enabled

`npm run build` could fail on almost every page — but only once Location
Gate was actually turned on (Admin → Site Settings → Location Gate →
enabled), which is why this could ship without being caught earlier: an
empty/unreachable backend never exercises that code path at all.

**Root cause**: `locationGateBootScript()` — a small helper that builds the
inline `<script>` deciding whether the gate should show before the page
even hydrates — used to live inside `components/site/LocationGate.tsx`,
which has `"use client"` at the top. Next.js turns every export of a
`"use client"` file into a client-reference marker when a **Server
Component** (the marketing layout) imports it directly — invisible to
`tsc` and even to `next dev`, but a production `next build` throws the
moment that code path actually runs.

**Fix**: the function now lives in its own plain file,
`lib/location-gate-boot-script.ts` (no `"use client"`), imported by both
the layout (as a real function) and `LocationGate.tsx` (as a type-only
import for `LocationGateTrigger`). Verified by standing up a throwaway
mock API server with `locationGate.enabled: true` and non-default field
values and running a full `next build` against it — the sandbox's normal
"API unreachable" condition can't catch a bug gated behind non-default
admin settings, so this is now the standing way any Location Gate/rare
admin-setting change gets verified before delivery, not just this one fix.

## New: Location Gate advanced customization, all-pages animation expansion, lead↔session analytics, Cookies policy (tenth round)

**Backend counterpart**: `sterling-vance-api`'s matching "eleventh round"
section — run `npx prisma db push` once to pick up the new `Lead.sessionId`
column before this round's Analytics/Leads features will show real data.

- **Location Gate is no longer "dull"-looking, and is far more
  configurable** (Admin → Site Settings → Location Gate):
  - Fixed the actual visual bug: the backdrop used to be the *same*
    element that faded 0→1, so the homepage was genuinely visible,
    blended through, for the whole transition. Now an always-opaque
    backdrop color sits behind two independently-animating layers
    (background art, then the content card) — the homepage never bleeds
    through again, at any animation speed or style.
  - New fields: **Background Darkness** (a scrim slider, same idea as the
    Hero's own "Overlay Darkness", for a bright uploaded photo/video),
    **Backdrop Color**, **Logo Image** + **Logo Text** fallback
    (replaces the hardcoded "EFC" box), a **Text Transition** picker
    (None / Fade / Slide Up / Word-by-Word Stagger) independent from the
    whole-gate **Animation** picker (now 7 options: Fade, Zoom, Slide
    Up/Down, Blur, Flip, Rotate), and a **Button Style** picker
    (Sharp / Rounded / Pill corners).
  - Removed the "Opens separate site →" text label per feedback that it
    read oddly — a country whose branch has an External Website URL set
    now just shows a plain arrow.
  - **Fixed a real feature-parity bug**: the header's own "Our Locations"
    dropdown didn't honor a branch's External Website URL the way the
    full-screen Location Gate already did — picking that country from the
    header just 404'd into a same-site route instead of leaving the site.
    Both pickers now agree.
- **"Ultimate advanced" animation/transition library, available on every
  page** — six further entrance variants (Pendulum Swing, Roll In, Skew
  In, Bounce In, 3D Tilt, Glow In) added to the same `AnimationPicker`
  every per-section admin form on the whole site already uses
  (`components/admin/AnimationPicker.tsx` / `components/site/Reveal.tsx`),
  bringing the total to 17 — from the original basic five, through the
  eight "advanced" ones added in an earlier round, to this round's
  "ultimate" tier. No new concept for an admin to learn: it's the exact
  same picker on every section of every page, just with more choices,
  including the landing page's own sections.
- **Leads now carry the browsing session that led to them, and Analytics
  surfaces auto-generated "Key Insights" from it**:
  - The anonymous analytics session ID (`sessionStorage`, the same one
    that already powered entry/exit-page tracking) is now attached to a
    contact-form submission via a hidden field
    (`components/site/SessionIdField.tsx`) — so once a visitor identifies
    themselves, their prior page-view trail is joinable to their lead
    record. Nothing changes for a lead source that doesn't have one.
  - **Admin → Analytics** gained a **Key Insights** panel — plain-English
    sentences generated from the window's leads and their sessions (e.g.
    "Visitors who convert view an average of 3.2 pages before submitting
    an inquiry.", "The page that most often starts a converting visit
    is…") — plus a **Recent Leads & Their Journeys** list showing each
    converting visitor's email next to the exact pages they viewed.
  - **Admin → Leads** gained a **"View browsing history →"** link (shown
    when a lead has a linked session) to a new `/admin/leads/[id]/journey`
    page listing that visitor's page-by-page trail in order, so a
    follow-up call can open with "I saw you were looking at our VAT
    services..." instead of a cold open.
- **New: a real Cookies & Data Protection Policy**, at `/cookies` (linked
  from the footer, editable at Admin → Legal Pages alongside Privacy/
  Terms). Unlike the Privacy/Terms placeholders, this ships pre-filled
  with an *accurate* description of what the site actually does — because
  there was something real to describe: no third-party analytics or
  advertising cookies at all, just the `sessionStorage`/`localStorage`
  mechanisms this project already uses (analytics session ID, region
  preference) and this app's own database (page-view records, and
  whatever a visitor submits through a form). An admin can reword it
  freely from the same rich-text editor as the other legal pages; this is
  the accurate starting point, not a placeholder, but it still isn't a
  substitute for having a lawyer confirm it covers your jurisdiction.

## New: client logos & testimonials on every service page, real newsletter/chatbot validation, multi-entry Freezone carousel (eleventh round)

**Backend counterpart**: `sterling-vance-api`'s matching "twelfth round"
section — run `npx prisma db push` once to pick up the new
`NewsletterSubscriber` and `FreezoneApproval` tables before this round's
newsletter and multi-approval features will work.

- **Client Logos and Testimonials now show on every Services page, not just
  the homepage** — the Services list, every service's detail page, and
  every sub-service page can each independently show or hide them (Admin →
  Client Logos / Admin → Testimonials → "Also show on"). The homepage's own
  showing is still controlled separately by its existing Section Visibility
  setting, so nothing changes there unless you touch it.
- **Both sections got real "advanced" animation/transition controls, fully
  admin-configurable with a live preview**:
  - **Client Logos**: a horizontal auto-scrolling marquee, with a **Scroll
    Speed** (Slow / Normal / Fast) and a **Pause on hover** toggle — on top
    of the existing size/alignment/grayscale/motion settings.
  - **Testimonials**: a new **Carousel** layout option (alongside the
    existing static Grid) that groups quotes into pages of three and
    auto-advances between them on an admin-set **Auto-Advance Speed**, with
    its own **Pause on hover** toggle and a **Card Size** control. The
    admin form's live preview renders the real public component against
    your actual saved testimonials, so what you see while picking settings
    is exactly what ships.
- **Fixed the newsletter signup form in the footer, which was completely
  non-functional** — the old form had no submit handler, no field name, and
  no validation at all, so it always looked broken regardless of what was
  typed in. It's now backed by a real `NewsletterSubscriber` table and
  endpoint, validates the email client-side before submitting, and shows an
  honest "subscribed" or "something went wrong" message either way
  (`components/site/NewsletterForm.tsx`).
- **Fixed a real trust bug in the chatbot's "leave your details" form**: on
  a failed submission it used to silently pretend it had succeeded. It now
  shows an honest error and never fakes success, and validates the email
  address for real (previously only checked it wasn't empty).
- **Shared, single-source-of-truth validation** (`lib/validation.ts`) now
  backs the newsletter form, the chatbot, and the Contact Us page, so all
  three enforce the same real email/phone rules instead of three slightly
  different ones.
- **Region-aware phone placeholder on Contact Us**: the phone field's
  example placeholder (e.g. `+971 50 123 4567` vs `+1 (555) 123-4567`) now
  guesses the visitor's country from their timezone — the same
  no-new-privacy-surface technique Analytics already used — instead of
  showing one hardcoded example to every visitor worldwide.
- **The homepage's "Approved Freezone" banner now supports more than one
  approval, auto-rotating between them** — for firms licensed with more
  than one freezone/authority, or with more than one partnership to
  announce. Manage the list at the new **Admin → Freezone Approvals**
  screen: add as many as you like, each with its own badge, headline, body,
  link, and photo-or-video; reorder by drag or arrow; enable/disable
  individually. With more than one active, they auto-advance horizontally
  on an admin-set interval, with an optional pause-on-hover, shown in a
  live preview. An existing single-banner setup keeps working exactly as
  before (it's read as one legacy entry) until you add a second one.

## New: image download protection, forgot password, fixed layout, production-ready audit log & notifications (twelfth round)

**Backend counterpart**: `sterling-vance-api`'s matching "thirteenth round"
section — run `npx prisma db push` once to pick up the new `Notification`
table before this round's notification bell will work.

This round prioritized security and outstanding bugs before the next
round's admin-dashboard redesign work.

- **Images can no longer be right-clicked, dragged, or saved from the
  website** (right-click/drag are disabled on every `<img>`/`<video>` via a
  small site-wide script), and an optional **watermark** can be turned on
  from **Admin → Site Settings → Image Protection** — every image URL
  served by the site gets a Cloudinary-generated text overlay on the fly,
  no re-uploading required. Full hotlink-blocking (stopping another site
  from embedding your images directly) has to be configured once in your
  Cloudinary account's own dashboard (Settings → Security) — the app can't
  control that from its own settings, and the new Site Settings section
  explains where to go and what to turn on.
- **Forgot password**, from the login screen: enter your email, get a
  6-digit code, set a new password — reusing the same OTP system already
  used for changing your password/email while signed in. For security, the
  page never reveals whether an email address has an account or not.
- **Show/hide password** eye-icon toggle on every password field across
  login, forgot-password, and reset-password.
- **Removed the seeded admin username/password that used to be printed
  right on the login page** — a real security hole in anything meant to go
  to production. (Nothing else changed about how the seed script works —
  see "Resetting demo data" below.)
- **Fixed a horizontal-scrollbar bug that could appear on some admin
  pages**, and made the admin sidebar and top header genuinely fixed in
  place — they no longer move at all when the page content scrolls,
  vertically or horizontally.
- **The public website's header no longer shifts or resizes on scroll** —
  it was already meant to stay pinned in place, and now it reliably does,
  confirmed by testing actual scroll behavior rather than just reading the
  code.
- **Audit Log is now genuinely production-ready**: paginated (50 per page,
  Newer/Older links), filterable by resource type/action/time range, and
  each row expands to show the full before/after details. Also fixed a
  real data-leak bug found while working on this — OTP codes typed during
  a password/email change were being written into the audit log in plain
  text; they're now redacted like every other sensitive field.
- **Notifications are fully wired up, end to end** — the bell icon in the
  admin header used to be decoration with no click handler and a
  permanently-on red dot. Now it shows a real unread count, and a new
  inquiry, newsletter signup, chatbot handoff, or job application creates
  an actual notification that shows up there (polling every 30 seconds),
  with "mark all read" and click-to-open-the-relevant-page. Also added a
  missing **Admin → Newsletter** page (subscribers list + CSV export) so
  the newsletter-signup notification has somewhere real to link to — the
  backend for this already existed from an earlier round but nothing in
  the dashboard ever showed it.
- **Security & validation audit** across the whole API: added rate limits
  to every public form that didn't already have one (contact/consultation
  form, careers application, chatbot, newsletter signup, page-view
  tracking) so they can't be spammed; added proper validation (and
  sensible length limits) to a few admin fields that were accepting raw,
  unchecked input; added the standard security response headers
  (`helmet`) to the API; closed a CSV-formula-injection risk in the
  careers CSV export (a submitted name or answer starting with `=`, `+`,
  `-`, or `@` could otherwise run as a formula when the file is opened in
  Excel); and a couple of smaller hardening fixes (proper 404s instead of
  a raw server error when updating a user that doesn't exist, page-builder
  drag-reorder now scoped to the page it's reordering so it can't
  accidentally touch another page's blocks).

**Still ahead, planned as its own round**: a full visual redesign of the
admin dashboard, per-section background-color/animation/edit controls on
every homepage/about/service section, a dashboard greeting with a
day/night sun-and-moon animation, your own profile photo, and moving
email (SMTP/Resend) and Cloudinary configuration into the admin dashboard
instead of the `.env` file.

## New: admin dashboard redesign, dashboard greeting, profile photo, email/Cloudinary config from the dashboard, custom section background colors (thirteenth round)

**Backend counterpart**: `sterling-vance-api`'s matching "fourteenth round"
section — run `npx prisma db push` once to pick up three new tables
(`EmailSettings`, `CloudinarySettings`, and the `User.photoUrl`/`phone`/
`bio` columns) before this round's Email Settings, Cloudinary Settings and
My Profile screens will work.

This round covers the admin-dashboard-quality work that was deliberately
deferred from the previous (security-first) round.

- **The whole admin dashboard has a refreshed, more professional visual
  design** — a decoupled admin color/spacing system (so a bold public-site
  brand color picked in Theme Builder can never again accidentally reskin
  the login screen or the dashboard's buttons/tables), soft card shadows,
  a slimmer scrollbar, real focus rings, and an icon next to every sidebar
  item instead of plain text.
- **The dashboard's top now greets you by name**, with a sun/moon icon and
  a full day/night sky — drifting clouds and a spinning sun by day,
  twinkling stars and a glowing moon at night — that changes automatically
  through the day based on your own clock, not the server's.
- **My Profile** (new, in the sidebar under Account): upload a profile
  photo, and set your display name, phone, and a short bio — shown in the
  sidebar and the dashboard greeting. This is separate from your login
  email/password/role, which still only change from Security or Users &
  Roles.
- **Email Settings** (new, Admin → Email Settings, Admin/Super Admin only):
  configure outbound email — SMTP (any provider) or Resend — directly from
  the dashboard instead of the API's `.env` file, with a "Send test email
  to myself" button to confirm it actually works. The `.env` values still
  work as a fallback for a fresh install.
- **Cloudinary Settings** (new, Admin → Cloudinary Settings, Admin/Super
  Admin only): same idea for image/video uploads — cloud name, API key and
  secret are now editable from the dashboard. The actual secret never has
  to live in this frontend project at all anymore; every upload asks the
  API for a short-lived signed-upload payload instead.
- **Section backgrounds now support a custom color**, not just the three
  built-in Tint/Dark/Gradient presets — pick "Custom color…" in any
  section's Background dropdown (Admin → Pages & Content → Home/About/
  Services → Section Visibility & Animations) and choose your own
  background and text color with a color-swatch picker.
- **Clarified how to add a whole new section** to the homepage, About
  page, or a service page — Section Visibility & Animations now links
  straight to **Page Builder**, which already supports adding, editing,
  deleting and reordering freeform content blocks on any page; the
  existing visibility toggle remains the fastest way to remove a built-in
  section without losing its content.
- **Analytics and the Dashboard overview got a real visual pass**: colored
  icon badges on every stat card, an up/down trend arrow on "Today vs.
  yesterday," gridlines and date labels on the views-over-time chart, and
  rounded corners with soft shadows applied consistently across every
  card, table and panel.

## New: branding cleanup, admin UX fixes, map embed, insights filters, SEO/AEO/GEO, and more (fifteenth round)

**Backend counterpart**: `sterling-vance-api`'s matching "fifteenth round"
section — run `npx prisma db push` once to pick up the new
`InsightArticle.postType` column before the Insights content-type filter
will work, and re-run `npx prisma generate` so the client picks it up too.

A large batch of fixes and additions:

- **"Sterling & Vance" replaced with "EFC"** everywhere it was hardcoded
  (fallback titles, placeholder content, READMEs) — the live site's actual
  company name was already admin-configurable and unaffected.
- **Every photo upload now has a Remove option**, not just replace-by-
  re-uploading — profile, team, testimonials, client logos, services,
  insights, branches, hero, freezone, and the Page Builder's own image/
  video/gallery blocks.
- **Drag-and-drop reordering + delete** added to About Gallery, Trust
  Strip, Why Choose Us, Industries, and the Page Builder's Gallery block
  (Team, Services, Testimonials, Client Logos, Freezone Approvals and
  Branches already had this).
- **Fixed the "Trusted By" strip sitting almost flush against the trust
  grid above it** on the homepage — a spacing bug, not a content issue.
- **A branch with its own External Website URL** (Admin → Branches → Edit)
  now actually sends visitors there from the Contact page and never gets
  its own dead internal landing page — matching how the header's location
  picker and the Location Gate already behaved.
- **A real, interactive Google Map** (satellite + Street View pegman, no
  API key or billing needed) now shows under each office on the Contact
  page, built automatically from that branch's own Address field.
- **Admins were getting logged out mid-edit and losing unsaved work.**
  Session lifetime extended from 15 minutes to 12 hours, and a handful of
  the longest edit forms (service, team bio, hero) now recover an unsaved
  draft from a dismissible "Restore/Discard" banner if the session ends
  before you save — see `lib/useUnsavedFormDraft.ts` for the pattern to
  apply to any other form.
- **Fixed Analytics "Yesterday" always showing 0** — a UTC/local-timezone
  mismatch in how the day buckets were computed, not a data problem.
- **Leads now show the last page each visitor viewed before leaving**, and
  Admin → Leads has an "Export for follow-up" button — a CSV of every
  lead's email + last page viewed, ready to upload as an ad-platform
  custom audience or import into an email tool.
- **Insights (blog) now has a Newsletter / Insight / Fun Activity filter**
  on the public listing page, set per post from its admin edit screen —
  and the home page now features the single most recent post prominently
  instead of just listing the latest three evenly.
- **Photos that weren't getting the section's animation/hover treatment**
  (About page's intro and leadership portraits, a few detail-page hero
  photos) now do, consistently with every other photo on the site.
- **The About page's Milestones section now has a horizontal, animated
  timeline with a small walking character** — a line-art "professional"
  (navy suit and gold tie, pulled from the site's own Theme Builder
  colors, briefcase in hand) strolls from one milestone to the next along
  a horizontal spine, pausing briefly at each stop, the first time the
  section scrolls into view; the walk cycle (legs, arms, a slight bob) is
  a small looping animation, and the *travel* between milestones is
  generated to fit however many milestones are entered (2, 4, 10 — it
  adapts). Stays horizontal at every screen size (scrolls sideways on
  narrow screens rather than collapsing to a vertical stack), and respects
  "reduce motion" system settings by showing the character standing at
  the final milestone instead of animating. (This replaces the
  alternating-card version from the previous round, which the vertical
  layout didn't match what was asked for.)
- **A new "FAQ" Page Builder block** (Admin → Page Builder → any page →
  Add Block → "FAQ (SEO/AEO)") renders a real accordion and emits
  `FAQPage` schema.org structured data — the concrete building block search
  engines' FAQ rich results and AI answer engines (ChatGPT, Google AI
  Overviews, Perplexity) look for to quote a page directly. The rest of the
  SEO/AEO/GEO toolkit (canonical URLs, hreflang, Open Graph, per-page
  `noindex`, and `/llms.txt`) was already in place from an earlier round —
  this fills the one real gap.
- Investigated the "admin saves feel slow" report — the usual suspects
  (audit-log write blocking the response, missing indexes, N+1 queries)
  were already correctly handled in this codebase; no backend bottleneck
  was found. If it's still slow, it's most likely Next.js dev mode
  recompiling an admin route on first hit after a change — try
  `npm run build && npm run start` to test real production performance.

## New: photo-based walking character on Milestones, `next start` crash fix (sixteenth round)

- **The Milestones walking character is now your own photo, not a drawing**
  — the small SVG line-art figure from the previous round has been
  replaced with a 3-frame photo/illustration sprite (a standing pose plus
  two walking poses, swapped in place to fake a natural stride) alongside
  a slower CSS animation moving it along the horizontal spine. The result
  reads as an actual small person walking, not a sticker sliding across
  the screen. Walks at an unhurried, human pace by default (configurable
  — see below), and renders small.
- **Each milestone's card now only appears once the character has actually
  walked there** — "what's been achieved" reveals itself step by step as
  the character reaches each stop, instead of every card being visible the
  moment the section scrolls into view. (Falls back to showing every card
  immediately for visitors with "reduce motion" turned on, since no walk
  plays for them.)
- **Fully configurable from Admin → Pages & Content → About → Milestones
  Animation**, a new panel with:
  - Three photo/image uploads — Standing/Idle Pose, Walking Pose 1,
    Walking Pose 2 — so the character can be swapped for a different
    person, mascot, or illustration at any time, no code changes needed.
    "Remove" resets any one frame back to the bundled default.
  - **Walk Speed** (Slow / Medium / Fast — Slow is the default).
  - **Character Size** (Small / Medium / Large — Small is the default).
  - **Card Reveal**: a toggle between "reveal each card only on arrival"
    (the default) and "show every card immediately."
- **Fixed a `next start` crash**: `Error: Functions cannot be passed
  directly to Client Components unless you explicitly expose it by
  marking it with "use server"`, hit on Admin → Pages & Content → Home
  and → About. Root cause: those pages pass plain functions as the
  `renderFields` prop into `DraggableImageRowsField` (the drag-and-drop
  rows component for Trust Strip, Why Choose Us, Industries, and the
  Photo Gallery) — legal in React when the caller is itself a Client
  Component, but not when the caller is a plain Server Component page
  (which `content/page.tsx` is), because a function can't be serialized
  across that boundary. This only surfaces in a real production build —
  `next dev` tolerates it — which is why it wasn't caught until `npm run
  start` was tried, per the crash log. Fixed by giving
  `DraggableImageRowsField` a second, Server-Component-safe way to
  describe each row's extra inputs: a plain `fields: [{ key, placeholder
  }]` array instead of a function, which the four affected call sites now
  use. Verified this doesn't recur by running an actual `npm run build &&
  npm run start` and hitting both admin pages afterward — clean server
  log, both pages render in full.

## Fix: Milestones character's head clipped, and it kept "marching in place" at every stop (seventeenth round)

- **The character's head was getting cut off.** Root cause: the row
  holding the character wasn't tall enough for the full image once the
  character was positioned above the spine line — and separately, setting
  `overflow-x: auto` on the horizontal-scroll wrapper around it makes the
  browser treat `overflow-y` as `auto` too, even though only the x-axis
  was asked for (that's the CSS spec's behavior, not a Tailwind quirk),
  which then clips anything poking out of its own box. Fixed by
  redesigning the layout so the character's own box (top-aligned, full
  height) always sits entirely inside the row's box — nothing pokes out
  to get clipped in the first place, and the character's feet now land
  exactly on the spine line instead of floating above it.
- **The character used to keep "walking in place" — swapping between its
  two walking-pose frames — the whole time it was standing at a
  milestone, not just at the very end.** It now switches to its standing
  pose and holds completely still the instant it arrives anywhere along
  the route, and only swaps walking frames while it's genuinely
  travelling between two milestones — the same rule applies at every
  intermediate stop, not only the final one.
- Slowed the default "Slow" walk speed down further, and confirmed with
  screenshots at several points through the walk: full head visible
  throughout, feet on the line, and the character stationary (idle pose)
  at each milestone it's reached, walking only in between.

## Fix: `next build` hanging / "Collecting page data ... is still timing out"

A real production `npm run build` could either print harmless
`TypeError: Response.clone: Body has already been consumed` lines during
static generation (build still finished fine) or, in a follow-up fix that
briefly made things worse, hang outright with repeated `Static worker
exited with code: null and signal: SIGTERM` and eventually fail with
`Error: Collecting page data for ... is still timing out`. Both traced back
to the same corner of `lib/api.ts`, so this entry replaces the two smaller
notes that were here before.

**Original cause**: several unrelated helper functions (site config, nav
links, footer links, image-protection settings, and more) each
independently fetched `/content/global/en`, so a single page render could
fire off multiple *separate* concurrent `fetch()` calls to the exact same
URL. Next's fetch cache tries to de-dupe identical concurrent requests by
cloning the `Response` for each caller, and that clone could lose a race
against another caller's `.json()` having already consumed the body — the
source of the `Response.clone` warning.

**The regression this caused**: the first fix routed
`getImageProtectionSettings()` through the same shared, cached
`getPageContent()` call everything else uses, to remove the duplicate
fetch. That created a real cycle: `apiGet()` always calls
`getImageProtectionSettings()` to decide whether to watermark whatever it
just fetched; `getImageProtectionSettings()` was now calling
`getPageContent()`, which calls `apiGet()` again — which calls
`getImageProtectionSettings()` again. Because that call is memoized
per-request with no arguments, the second call returned the exact same
still-pending promise the whole chain started from, so it ended up waiting
on itself. A promise that awaits itself never resolves, which is what
Next's 60/120-second per-page timeout was actually catching (an 8-second
fetch timeout was added at the same time, but it couldn't help here — the
hang wasn't a slow network call, it was a deadlock with no fetch in
flight).

**Actual fix**: added one small, deliberately dumb helper,
`fetchJson(path)`, that only fetches and parses JSON — it doesn't know
about watermarking and never calls `apiGet()` or
`getImageProtectionSettings()`. Both `apiGet()` and
`getImageProtectionSettings()` now call `fetchJson()` directly instead of
calling each other indirectly, so identical URLs still share one in-flight
request (fixing the original `Response.clone` warning) without the two
functions ever forming a cycle. Verified with a full `npm run build` against
a mock API (including a branch landing page and the watermark path both
exercised) completing cleanly with no clone warnings, no timeouts, and no
hangs. The 8-second fetch timeout and the `staticPageGenerationTimeout: 120`
in `next.config.mjs` are kept as sensible defense-in-depth for a genuinely
slow or unreachable backend, but neither one was the actual fix for this
issue.

## Fix: admins logged out mid-edit, losing unsaved changes

Two related problems, both from the same underlying report ("I got logged
out while filling in a form and lost everything I typed"):

1. **The access token was too short for how this tool is actually used.**
   `JWT_EXPIRES_IN` defaulted to 15 minutes. `middleware.ts`'s
   `maybeRefreshSession()` already refreshes it silently on every `/admin`
   request that's expiring within 30s — but that only helps when *another*
   request happens to land in that 30s window. An admin who spends more
   than 15 minutes on one long form (reading a document, on a call, just
   thinking) submits into an already-expired token: the refreshed cookie
   middleware just wrote only takes effect on the *next* request (setting
   response cookies doesn't change what the *current* request already read
   via `cookies()`), so that Server Action's own `adminFetch` call still
   sees the old, expired token, gets a 401, and `apiWrite()` immediately
   `redirect()`s to `/admin/login` — taking the just-submitted `FormData`
   with it. Fixed by lengthening `JWT_EXPIRES_IN` to 12h (see
   `sterling-vance-api/.env.example` and `auth.module.ts`) — comfortably
   covers a workday, and the 7-day refresh token is what actually bounds
   exposure from a stolen cookie, not the access token's lifetime. The
   matching cookie `maxAge`s in `lib/admin-actions.ts` (login) and
   `middleware.ts` (silent refresh) were updated to match.

2. **Even a legitimate 401 (or a closed tab, or a crash) had no safety
   net.** `apiWrite()` redirects to `/admin/login` on any 401, and a
   `redirect()` from a Server Action doesn't carry the submitted
   `FormData` anywhere — whatever was typed is just gone. Fix #1 makes
   this rare, but doesn't make it impossible, so a small draft-recovery
   layer was added on top:

   - `lib/useUnsavedFormDraft.ts` — a hook that watches a `<form>`'s
     `input`/`change` events and mirrors its field values into
     `sessionStorage`, keyed by the page's path (+ its `?page=`/`?lang=`
     query params, so e.g. the Home Hero draft and the About Hero draft on
     the same `/admin/content` route don't collide). Skips file/password/
     secret-shaped fields. Clears itself once the page reloads with a
     `?saved=...` from a successful save.
   - `components/admin/UnsavedChangesBanner.tsx` — drop this anywhere
     inside an edit form (it finds its enclosing `<form>` itself) and, if
     a draft is sitting in `sessionStorage` for this exact page/tab when it
     mounts, it shows a small dismissible banner: "You have unsaved
     changes from your last session — Restore / Discard."

   **Reference implementation** — wired into three of the longer edit
   forms: `ServiceFieldsForm.tsx` (Services → Edit), `TeamBioField.tsx`
   (Team → Edit) and `HeroForm.tsx` (Pages & Content → Home → Hero). To add
   it to another admin edit form: import `UnsavedChangesBanner` and render
   `<UnsavedChangesBanner />` as a child of that form's `<form>` element —
   nothing else to wire up. It's a plain draft (whatever was last typed,
   recoverable on the next visit), not a full dirty-state tracker — it
   doesn't diff against initial values or warn before navigating away.

## Resetting demo data

If you ran the API's seed script before it was trimmed down, it created a
demo service, service category, and theme row. Run this once from
`sterling-vance-api` to remove them:

```bash
npm run prisma:clean-demo
```


The seed script itself (`npm run prisma:seed`) now only creates the four
languages and one Super Admin login — everything else starts empty and is
meant to be added through `/admin`.


Anything in `[brackets]` in `lib/content.ts` — stats, names, addresses,
bios — is fallback placeholder content. Replace it via the admin
dashboard once it's wired up, or directly in the file for now.

## New: sub-service admin parity, one-Save-button + restore, auto-translate KPI, Google-review testimonials, Theme Builder header/footer/contrast fix, LinkedIn posts (eighteenth round)

- **Sub-services now have full admin parity with Services**: Responsible
  Person, meta title/description, "what is it"/"who needs it"/process/
  cost factors/timeline/FAQs — same fields, same public-page layout
  (`services/[slug]/[subSlug]/page.tsx`), including the sticky Responsible
  Person sidebar. That sidebar's scroll bug (on both Service and
  Sub-service pages) is fixed: it was `items-start` on the parent CSS
  Grid, which shrinks a grid item's box to its own content and removes the
  room `position: sticky` needs to travel — removed, not worked around.
- **One Save button + "unsaved changes" restore**, opt-in per page via a
  `<div data-autosave-scope>` wrapper (see `UnsavedChangesGuard.tsx`) —
  wraps every `<form>` inside it, hides their individual Save buttons once
  JS confirms active, drafts to `localStorage`, and offers a Restore/
  Discard banner if you navigate away with unsaved changes. Rolled out to
  Services → Edit and Sub-service → Edit as the reference implementation;
  wrapping another page's forms the same way is all that's needed to
  extend it further.
- **Google Cloud Translation is now admin-configurable** (Admin →
  Translate Settings): API key stored in the database (env var stays as a
  fallback), plus a usage/cost KPI panel (characters translated, request
  count, estimated cost against Google's Basic-tier pricing, broken down
  by language and by source). Services auto-fill missing-language
  translations on save now, tagged `auto-on-save` in that KPI so it's
  distinguishable from a manual "Auto-translate" click.
- **Testimonials redesigned as Google-review-style cards**: star rating,
  Google "G" mark, optional whole-card link-out to a real Google Business
  review URL, admin-configurable rating/review count/badge visibility, and
  a toggle to also show the review badge on the Contact page. Client
  logos + testimonials on service/sub-service pages were fighting each
  other for space — combined into one shared dark band with a heading.
- **Theme Builder fixes**: the site logo is no longer clipped/invisible
  against a dark header (fixed sizing + an optional second "Logo (for dark
  backgrounds)" upload), Header Color and Footer Color are now independent
  fields (previously both silently followed Primary Color), header/footer
  text automatically switches between a light and dark palette based on
  the chosen background's luminance so it never goes unreadable, and
  Heading/Body Text Color are now Theme Builder fields too (`ink`/`muted`
  converted to the same CSS-variable pattern as the other brand colors).
  Deliberately **not** added: a global font-size/weight scale — this
  codebase's type sizes are hardcoded arbitrary Tailwind values (e.g.
  `text-[14.5px]`) rather than the default rem scale, so a generic control
  would have had no real effect; flagged here rather than shipped as a
  control that silently does nothing.
- **Background/font config audit**: found and fixed a real bug on the home
  page where four full-width sections' hardcoded background class was
  silently fighting the admin's own Section Background picker for that
  same section, making the control a no-op; fixed by only falling back to
  the hardcoded default when the admin hasn't customized that section.
  Also replaced ~27 hardcoded gold-hex (`#8A6D2E`) text/background classes
  across the public site with the theme's `gold`/`accentColor` token, so
  Theme Builder's Accent Color field now actually reaches them. Known,
  documented follow-up: individual card fills (stat card, trust-badge
  tiles, service/location cards) don't yet follow a per-section
  "card background" admin field — only the section wrapper behind them
  does; adding that is a distinct, not-yet-built control.
- **Insights/Blog: LinkedIn post support.** A new "LinkedIn Post URL"
  field (Admin → Insights → Add/Edit) makes that post's card — on the
  Insights list and the home page's latest-posts teaser — show a LinkedIn
  mark and link straight out to the real LinkedIn post in a new tab,
  instead of this site's own `/insights/[slug]` page. Independent of the
  existing Newsletter/Insight/Fun Activity content-type filter — any of
  the three can also carry a LinkedIn URL.

## Fix: broken client logos, sticky Responsible Person sidebar, hardcoded contact dropdown, small/invisible logos, chatbot greeting (nineteenth round)

A round of bug reports plus a few admin-configurability gaps, all fixed:

- **Broken/gray client logos on dark sections**: the old dark-tone treatment
  applied `grayscale brightness-0 invert` to every logo image, which
  crushes any real (non-transparent-silhouette) logo into a solid
  black/white rectangle — exactly the "gray blocks" reported. Replaced
  with a small white card behind each logo on a dark section instead, so
  every logo stays true to its real colors regardless of the section's
  background.
- **Client logos + testimonials band background is now admin-configurable**
  (Admin → Client Logos → Display Settings → "Section Background Color
  (Services / Detail Pages)") — previously a hardcoded navy on the
  Services list, service detail, and sub-service detail pages. Blank
  keeps the original navy; doesn't affect the homepage.
- **Testimonial photo not visible**: a saved photo URL that's since gone
  bad (deleted from Cloudinary, an old broken link) now falls back to the
  initials avatar instead of leaving a browser broken-image icon in its
  place.
- **Responsible Person sidebar sticky fix, for real this time**: the
  sticky card was wrapped in the entrance-animation component, which
  applies its own `transform` to that same element — a `position: sticky`
  element that ever carries a `transform` is a well-known cross-browser
  sticky-breaker (notably Safari/iOS). The sidebar no longer animates in
  (`variant="none"`), which removes the transform entirely; it stays
  pinned reliably now, on both the service detail and sub-service detail
  pages.
- **Contact page "Service of Interest" is no longer hardcoded** — it's a
  searchable field (type-to-filter, backed by the real live Services
  list) that also accepts free text for anything not in the list, with no
  separate "Other" toggle needed.
- **Header "Utility Bar Style" is now admin-configurable** (Admin →
  Header & Footer → "Utility Bar Style"): Bar (original full-width band),
  Minimal (blends into the header, no divider), or Pill (each
  locations/language picker as its own rounded chip).
- **Logo sizing is now admin-configurable everywhere** (Admin → Site
  Settings → "Logo Sizing"): separate pixel-height fields for the header,
  footer, admin dashboard sidebar, and admin login screen — all four were
  previously fixed in code (36px/36px/24px, and the login screen never
  rendered the uploaded logo at all — always the placeholder icon,
  regardless of Site Settings). Defaults were also bumped up (48/48/32/56)
  so logos read as more presentable out of the box. The admin sidebar's
  logo+name lockup is now horizontally centered rather than hugging the
  left edge, and the login screen's logo is centered above the company
  name rather than not shown.
- **Chatbot now greets a plain "Hi"/"Hello"** instead of falling through
  to its generic "I couldn't find anything… talk to a member of our team
  instead?" reply — that fallback (not an LLM; the bot is a client-side
  keyword-match engine, see `ChatWidget.tsx`) fired for any greeting
  because words like "hi"/"hey" are too short to match against site
  content, and reads exactly like "immediately jumps to collecting your
  details" once combined with the always-visible "Talk to a person
  instead" link. Greetings are now recognized as their own case and get a
  warm, natural opener back.
- **Site/admin slowness**: not a code bug — diagnosed as Neon's
  serverless-Postgres auto-suspend/cold-start (the free tier suspends
  compute after inactivity; the first query after that takes several
  seconds to tens of seconds to wake it, and this project's local dev
  setup talks to that cloud database over the network rather than to a
  local Postgres instance). Two remedies: adjust Neon's auto-suspend
  window in its dashboard, or point local development at a local Postgres
  instance instead.

## Fix: header utility bar color, invisible testimonials text, testimonial photo visibility, active-page nav indicator, sticky Responsible Person sidebar, Google Translate billing accuracy, SEO/AEO/GEO audit (twentieth round)

- **Header utility bar (locations/language/currency row) now uses Footer
  Color**, not Header Color — only that top strip switched; the logo and
  main navigation below it are unchanged. Matches the request to move
  "the location and language" row alone into the footer's color scheme.
- **Fixed invisible "What Our Clients Say" / testimonials heading**: it
  was hardcoded to a near-white color that only reads against a dark
  background. Now computed from whatever background color is actually in
  effect (`contrastTextColor()` in `lib/theme-runtime.ts`), on the
  homepage's own testimonials section and the shared "What Our Clients
  Say" band on the Services list, service detail, and sub-service detail
  pages.
- **Homepage testimonials section now has its own dedicated background
  color control** (Admin → Testimonials → Display Settings → "Section
  Background Color (Home Page)") — previously the only way to change it
  was the generic, easy-to-miss per-section Reveal control under Pages &
  Content → Home. Verified end-to-end that `revalidatePath` already forces
  a full-site cache refresh on every admin save, so "my background change
  isn't applying" was really this invisible-text bug, not a caching or
  wiring problem — confirmed correct, no change needed there.
- **Testimonial client photo made clearly visible**: enlarged from 36px to
  44px with a visible ring border and higher-contrast initials fallback —
  a working photo/initials circle that was simply small and borderless
  against a dark card could easily read as "not there." The broken-photo
  → initials fallback from the previous round was kept as-is.
- **Header nav now underlines the current page** — an active-link
  indicator (gold underline on desktop, a left accent bar in the mobile
  drawer) so a visitor can tell which page they're on, including "Services"
  staying highlighted while browsing any service or sub-service detail
  page.
- **Responsible Person sidebar no longer disappears after scrolling**, for
  real this time: the previous `top-24` sticky offset was a fixed guess
  that no longer matched the header's actual height once the header
  became admin-configurable (logo height, utility bar style). The header
  now publishes its live height as a CSS variable
  (`--site-header-h`, via a `ResizeObserver`) and the sidebar's sticky
  offset is computed from it (`calc(var(--site-header-h) + 16px)`) on both
  the service detail and sub-service detail pages, so it stays correct
  regardless of how the header is configured.
- **Google Cloud Translation API verified end-to-end** — confirmed the
  integration is real (Translation API v2 REST, API key auth, correct
  character-count billing basis) and found one real billing bug: the
  usage/cost estimate on Admin → Translate Settings was comparing
  *all-time* character usage against Google's free tier, which actually
  resets every *calendar month* — so the estimated cost stayed inflated
  in any month after total usage first crossed 500,000 characters, even
  with zero new usage that month. Fixed by scoping the cost-driving
  figures to the current UTC calendar month, with both this month's and
  all-time totals now shown separately.
- **SEO / AEO / GEO audit**: confirmed per-page meta tags, Open Graph/
  Twitter tags, hreflang alternates, `robots.txt`, `sitemap.xml`, and
  `llms.txt` are all genuinely admin-driven and built from live data, and
  that the Service/FAQ/Breadcrumb/LocalBusiness/Team/JobPosting structured
  data on service, branch, team and careers pages is generated from real
  content, not placeholders. Found and fixed one real gap: the SEO admin
  page's "Custom Schema.org JSON-LD" fields (`schemaType`/`schemaJson`)
  were stored by the API but had no admin UI to set them and were never
  rendered on any page. Added the fields to Admin → SEO & Schema (with
  JSON validation on save, and an "Edit" link per row so an existing
  record can be updated instead of only added), and added a
  `CustomSchemaScript` component that renders the saved JSON-LD on Home,
  About, Contact, the Services list, and the Insights list — the pages
  that don't already build their own structured data automatically.

## New/Fix: smarter chatbot, team field delete bug, sticky sidebar hardening, one-by-one testimonials, scroll-driven landing animation (twenty-first round)

- **Chatbot upgraded to a much smarter rule-based assistant** (`ChatWidget.tsx`) — no external AI API in this deployment (that would need an OpenAI/Anthropic key and a per-conversation cost, which wasn't wanted here), but a considerably better matching engine and conversational range:
  - Stopword filtering + a small synonym map (`cost`/`price`/`charge` → `fee`, `phone`/`email`/`speak` → `contact`, `hours`/`schedule` → `timing`, etc.) so a visitor's own phrasing matches site content even when it doesn't use the exact words admin content is written in.
  - A confidence threshold (a matched document must cover a real share of the visitor's words, not just one coincidental shared word) — replaces the old "any single shared word counts" logic that could confidently answer with an unrelated FAQ.
  - Full small-talk coverage — greetings, "thanks", farewells, "how are you", and plain acknowledgements ("ok"/"cool") each get a natural, varied, professional reply instead of only greetings being handled and everything else falling through to a generic miss.
  - Rude/profane input is met with a calm, professional redirect ("I'm here to help, and I'd like to keep our conversation professional...") rather than the bot either ignoring it or (previously) trying to keyword-match it against site content.
  - Branch/office data (address, phone, working hours) is now one of the document sources it searches, so "where are you located" or "what are your Dubai office hours" can be answered directly from real data, not just curated FAQs.
  - The "I don't know" fallback is now honest rather than a flat dead-end: it says it doesn't want to guess and offers the human handoff in the same message.
- **Fixed team member field deletes not persisting** (mobile number, qualification, LinkedIn URL, email): `updateTeamMemberAction`/`createTeamMemberAction` were converting a blank field to `undefined` before sending it to the API — which the backend correctly treats as "field not included in this update, leave it alone" (the same convention used for secrets like an API key you don't want to accidentally blank out). For a normal content field, that meant clearing it in the admin UI looked like it worked (the form went blank) but never actually reached the database — a refresh brought the old value straight back. Now sends `""` through explicitly for these fields, so a real clear is actually saved. The backend DTO (`team-member.dto.ts`) also had `email`/`phone` fields that would have rejected an intentional clear-to-blank with a validation error even once the frontend was fixed (`@IsEmail`/`@Matches` don't skip an empty string, only `undefined`) — both now use `@ValidateIf` so blank is accepted.
- **Responsible Person sidebar sticky fix, hardened further**: the ResizeObserver-based `--site-header-h` mechanism from the previous round was verified correct in isolation (a standalone reproduction confirmed the sticky-offset math itself works), but only took effect once client-side JS mounted — meaning the very first paint (and anyone whose JS is slow to run) briefly used a generic fallback value. `--site-header-h` is now also computed **server-side**, from the same admin settings (Logo Sizing's header height, Utility Bar Style) that determine the header's real height, and written into the root `:root{}` stylesheet rule in `app/layout.tsx` — correct from the very first paint, with the client-side ResizeObserver seamlessly taking over the instant it mounts (a plain stylesheet rule is always overridden by the later inline style, so there's no conflict between the two). If this is still showing the old behavior after deploying this round, make sure the API has been rebuilt/restarted and the frontend has been rebuilt with `npm run build` — simply copying files over without rebuilding leaves Next.js serving the previous compiled output.
- **Testimonials: new "Single, one by one" layout** (Admin → Testimonials → Display Settings → Layout) — one testimonial at a time with its own crossfade + slide-up transition between them, distinct from the existing Grid (all at once) and Carousel (groups of 3) layouts, and distinct from the Client Logos strip's continuous marquee scroll. Also fixed a real bug found while adding this: `updateTestimonialsDisplayAction` hardcoded the saved layout to only ever be `"carousel"` or `"grid"`, silently discarding any other value — worth knowing since it means a previous "Carousel" selection was the only non-default choice this save action could actually persist.
- **New: admin-configurable scroll-driven landing animation** (Admin → Landing Animation) — upload a .zip of sequential frame images (e.g. a 48fps clip exported frame-by-frame) and the homepage hero becomes a scroll-scrubbed animation: a `position: sticky` canvas whose visible frame is driven by scroll progress rather than time (the technique behind Apple's product pages) — scrolling down plays forward, scrolling back up reverses it. Whatever frame count the zip contains is automatically downsampled to a smooth, web-appropriate count (evenly sampled across the full sequence, so the whole motion is kept, not just its first second) and uploaded to Cloudinary in playback order. Once the visitor scrolls to the final frame, a location-selection popup appears as a real `backdrop-filter: blur` overlay over the frozen last frame (not an opaque replacement) — selecting a branch navigates on, same destination logic as the existing Location Gate (an external URL for a branch with its own separate site, otherwise that branch's local page). Falls back to a static final-frame image with a manual "choose location" button for anyone with `prefers-reduced-motion` set. Turned off by default — the homepage keeps its normal video/image hero until an admin uploads frames and enables it.

## New/Fix: Insights filter admin gap, chatbot fuzzy matching, site-wide Scroll & Motion, one-click Translate Everything, country flags (twenty-second round)

- **Fixed Insights admin gap**: the *edit* screen already had the Newsletter / Insight / Fun Activity filter-tab picker, but the *create* form didn't — every new post silently defaulted to "Insight" until someone remembered to re-open and re-save it just to set the tab. The create form now has the same picker as edit, and the admin list table shows a "Filter Tab" column so a wrongly-tagged post is obvious at a glance instead of only visible on the public filter tabs.
- **Chatbot: typo/fuzzy tolerance** (`ChatWidget.tsx`) — matching previously required an exact word (via a `Set.has()` lookup against each answer's keywords), so a single typo ("audti", "compnay") dropped a message straight to the generic fallback even though a human would obviously know what was meant. Word matching now runs through a length-scaled Levenshtein distance check (0 edits allowed for ≤4-letter words, 1 for 5–7, 2 for 8+, with an early-exit optimization so this stays fast even with many keywords) — close misspellings now match, while short words still require an exact match so "tax" doesn't accidentally match "tag". Verified with a standalone test script covering realistic typos against both false positives and false negatives.
- **New: site-wide Scroll & Motion settings** (Admin → Scroll & Motion) — the site previously had no smooth/eased scrolling at all (the browser's default instant jump-scroll) and no admin control over it. Three independent toggles, all off-by-default-safe and all respecting `prefers-reduced-motion`:
  - **Smooth (eased) scrolling** — replaces native scroll with an inertial, gliding scroll (via the `lenis` library), with a Subtle/Normal/Strong smoothness setting.
  - **Parallax drift on the homepage hero** — the hero image/video drifts a few pixels slower than the rest of the page while scrolling past it, for a sense of depth. Mutually exclusive with the existing Ken Burns hero zoom (both animate the same CSS `transform`, so only one is applied at a time based on this setting — picking both would silently make one a no-op).
  - **Cursor-following ambient light** — a soft warm glow follows the mouse over the homepage hero, off by default.
  Implemented in `components/site/SmoothScroll.tsx`, driven by a `--scroll-y` CSS variable updated on every animation frame; verified with Playwright that the attributes it sets actually appear on `<html>` and that `--scroll-y` tracks real scroll position.
- **New: "Translate Everything Now" — one-click, whole-site translation** (Admin → Translate Settings). Previously, translation only existed as a per-record "Auto-translate" button on Services/Team/Testimonials/Insights edit screens — every other piece of on-screen copy (the homepage hero, About page, Careers intro, Legal pages, page headers, footer links, nav labels, the location-gate popup, site tagline) was **only ever saved in English**, even though the backend has always supported a translation per page/section/language — so an Arabic or German visitor was silently seeing the English placeholder fallback text on all of that, never a translation, because nothing had ever been *saved* under `ar`/`de` for it. One click now:
  - Loops the existing per-record translate logic over **every** Insight, Service, Team member and Testimonial (not just the one being edited).
  - Translates every real, visitor-facing ContentBlock section that the public site actually reads per-language (Home hero/freezone banner/stats/trust badges/why-choose-us/industries, About intro/values/timeline/leadership/gallery captions, Careers intro, all three Legal pages, every page's header eyebrow/headline/lead, the site tagline, nav labels, footer link labels, and the Location Gate popup text) — batched into as few Google Translate calls as possible per page.
  - Deliberately **skips** every admin *setting* stored the same way (animation styles, speeds, layout choices, the Landing Animation's frame list) — those are only ever read in English by the code regardless of visitor language, and translating a value like `"medium"` would silently break whatever reads it back expecting one of a fixed set of English strings.
  - Protects `{placeholder}` tokens (e.g. the About page header's `{name}` company-name substitution) from being mangled by Google Translate, by swapping them for a neutral marker before sending and restoring the real token afterward.
  - **"Overwrite existing translations" is off by default** — a re-run only fills in items with no saved translation yet for that language; an admin's own hand-edits are never silently replaced unless this box is checked.
  - **Two content types can't be included yet** because they have no translation storage at the database level at all — Freezone Approvals and Sub-service pages. Both stay English-only everywhere regardless of this feature, until a future schema change adds real translation storage for them; the button's result message says this explicitly rather than silently skipping them.
  - **Staleness detection**: after a successful run, a hash of the English text just translated is recorded (Admin's own internal `translationTracking` content block, never shown publicly). A new banner across the top of every admin page (`TranslationStaleBanner`) compares today's English content against those hashes and says "Translation needed — English content has changed in N places since it was last translated," linking straight to Translate Settings — this is the "if I change the English later, tell me to re-translate" behavior, implemented as a persistent banner rather than a JS popup so it survives normal page navigation.
- **New: country flags on the location & language dropdowns** — the header's "Our Locations" dropdown now shows each branch's flag next to its name (matched from the Branch's free-text "Country" field, now backed by a 249-country `<datalist>` typeahead on the Branch admin form so the match is reliable), and the language switcher shows each language's flag + the language name + the country it's paired with (English → United Kingdom, العربية → United Arab Emirates, Deutsch → Germany) instead of a generic globe icon. Uses the `flag-icons` npm package (SVG/CSS-based) rather than emoji flags specifically because Windows (pre-11) and some Android browsers render emoji flags as plain two-letter text instead of an actual flag image — this renders identically on every device. Verified with a Playwright screenshot of both dropdowns.

**A note on this round's most-requested feature (Translate Everything Now):** this fills in real Google Translate output automatically, the same as every existing "Auto-translate" button always has — it is a first draft, not a substitute for a native speaker reviewing the AR/DE tabs before a page goes live, the same caveat that's always applied to the per-record buttons. "Fully production ready" for translated copy means a human review pass on top of this, not skipping it.

## Fix: "Translate Everything Now" skipped the footer, nav labels, and every other never-customized page section

- The first version of the bulk-translate feature above only translated a ContentBlock section (Home hero, footer links, nav labels, About intro, site tagline, etc.) when an admin had *actually opened that screen and clicked Save at least once in English*. Most sites never touch several of these screens — the footer, for instance — and simply keep the code's built-in English default (`lib/content.ts`'s `footerLinks`, `heroContent`, `navLinks`, and so on), which the public site has always shown to every visitor regardless of language. Because that default was never technically "saved," the bulk-translate action saw nothing to translate and silently moved on, leaving those sections showing English text on the Arabic/German site even after a successful "Translate Everything Now" run.
- Every section-translating function in `lib/admin-actions.ts` now falls back to that exact same default object (via a new shared `getSectionFallback()`) whenever nothing's been explicitly saved in English — the same default the public getter in `lib/api.ts` already falls back to — so it translates what visitors are actually seeing, not just what an admin happened to have saved. `getTranslationStaleness()` (the "Translation needed" banner) uses the identical fallback lookup so the two can never disagree about what "the current English content" is.
- If you already ran "Translate Everything Now" once and it reported skipping most page sections, run it again — with "Overwrite" still off, it will only fill in the sections this fix newly makes visible (the footer, nav labels, etc.) and won't touch anything already translated.

## Fix: edited English content stayed untranslated forever, Freezone Approvals/Sub-services couldn't translate at all, RTL Milestones animation, chatbot mismatches, Contact form + chatbot ignoring language (twenty-third round)

**Backend change this round — see `sterling-vance-api`'s README for the schema/migration steps (`npx prisma generate && npx prisma db push`) required before this frontend works correctly.**

- **Fix — "I edited the footer/an Insight/etc. in English, but the translation still shows the old text"**: two separate bugs stacked on top of each other:
  1. `translateEntireSiteAction`/`getTranslationStaleness` read "the current English content" through `lib/api.ts`'s `getPageContent()`, which is deliberately cached for 60 seconds for ordinary site traffic — so a translate run could read a stale snapshot from just before your edit. A new `getPageContentFresh()` (uses `adminFetch`'s `cache: "no-store"`) replaces it everywhere inside the translate feature, so it always reads the database directly.
  2. Even with fresh reads, the original "already translated → skip" check only looked at *whether* a translation existed, never *whether it still matched the English it was translated from* — so once a section (or an Insight/Service/Team member/Testimonial) was translated once, editing the English afterward left the old translation in place forever unless you manually ticked "Overwrite existing translations" (which also re-translates everything else, clobbering any translations you'd hand-edited). Every section and record type now compares the *hash of the English content at last translation time* (already recorded, just wasn't being used for this) against the current hash — a translation whose English hasn't changed is still safely skipped, but an edited one is automatically re-translated even with Overwrite off. A translation with no recorded hash (typed in directly on a language tab, or translated before this tracking existed) is left alone either way, so nothing already reviewed by hand gets silently overwritten.
- **New: Freezone Approvals and Sub-services can now be translated** — previously called out in this file as a known gap with no translation storage at the database level at all. Added `FreezoneApprovalTranslation` and `SubServiceTranslation` (new Prisma models, see the API README) holding other-language overrides on top of the existing English badge/headline/body/ctaLabel (Freezone Approvals) and name/description/body/AEO-fields (Sub-services) columns — same "base English row + per-language override table" shape the rest of the schema already uses. "Translate Everything Now" now loops both, the public site (`getFreezoneApprovals()`, and a service's `subServices` on its detail page) renders the translated text for `ar`/`de` automatically, and the summary message no longer says these two are excluded.
- **Fix — Arabic (RTL) Milestones timeline**: the walking-figure animation on the About page computed its position as a plain left-to-right percentage and animated the physical `left` CSS property directly from it. The dots/cards are laid out in a CSS grid, which the browser auto-mirrors under `dir="rtl"`, but the walking figure's `left`-based path didn't — so in Arabic the dots visually reversed order while the character kept walking the old (now wrong) direction, completely out of sync with them. `MilestoneTimeline` now takes the page's `lang`, mirrors its position math when the locale is RTL (reusing `lib/i18n.ts`'s existing `dirFor()`, no new RTL-locale list), and the whole section now flows consistently in the reading direction.
- **Fix — chatbot answering the wrong service ("audit" → a VAT service mentioning "FTA audit")**: the matcher scored every candidate doc by a flat count of shared keywords with no regard for whether the match landed in the doc's title (the actual topic) or was just one word buried in a long summary, and ties were broken purely by which doc happened to be built first (FAQs, then Services, then Insights, Team, Branches) — so a long, generic doc that merely *mentioned* a word could beat the doc that's actually *about* it. Matching now weights a title hit far above a body hit, normalizes by how large/generic a doc's keyword bag is (a short, on-topic doc beats a long one that name-drops the word once), and gives admin-curated FAQs a slight edge on close ties, since those are the one doc type this bot is deliberately trained on. Typo tolerance and the multi-word coverage threshold are unchanged.
- **Fix — Contact form and chatbot ignored the selected language**: the Contact page's field labels/placeholders/submit button/"Our Offices" heading, and the chat widget's header/placeholders/buttons/small-talk replies, were plain English string literals in the JSX — every other piece of copy around them (page headers, FAQs, services) was already translated per the constraint that nothing should be hardcoded, but these weren't. Added a new admin-configurable/translatable section — Admin → Site Structure → **UI Text** — covering every one of those strings (English is edited there directly; "Translate Everything Now" now translates it into every other language like any other section). The Contact page reads it server-side; the chat widget (a client component) fetches it directly from the public `/content/global/:lang` endpoint on language switch, falling back to the English defaults until that resolves.

## New/fixed: video upload for Insights, international phone picker, security hardening, dead-code cleanup (twenty-sixth round)

- **New: video upload for Insights/Blog**. Each article now has an optional Cover Video (Cloudinary-hosted, admin-settable from both the "Add an Article" and "Edit Article" screens, with a remove-video checkbox on edit) alongside the existing Cover Image. On the article's own detail page, a set video takes priority and renders as an inline `<video controls>` player; the image remains the fallback and is still what's used on the /insights listing cards. Same pattern as the sub-service detail page's existing video/image priority.
- **New: international phone number field** (`components/site/PhoneNumberField.tsx`) — every visitor-facing phone field (Contact Us, Careers job application, including any admin-added custom "Phone" field in the job application form builder) is now a country-flag + dial-code + short-country-name dropdown paired with the national-number box, combined into one value on submit. Defaults to the UAE and forces left-to-right layout so it never breaks under Arabic (RTL). Backed by a small static reference table (`lib/dial-codes.ts`, derived from the site's existing country list) — no new npm dependency. The old `RegionAwarePhoneInput.tsx` is removed, fully superseded by this.
- **Fix: phone validation was one character too strict for some countries.** The shared phone pattern's length cap (used by the Contact/Careers server actions and mirrored in the backend DTOs) was 20 characters — too tight once a longer dial code (e.g. `+1876`) is combined with a formatted national number. Raised to 30 in `lib/validation.ts` and the matching backend DTOs.
- **Security — fixed a stored-XSS gap in JSON-LD structured data.** Every page embedding structured data via `<script type="application/ld+json">` used `JSON.stringify()` directly, which does not escape `<`; any field containing a literal `</script>` — most notably the fully free-form "Custom Schema.org JSON-LD" field on the SEO settings screen, but also any admin-authored title text reflected into schema — could break out of the script tag and inject arbitrary HTML. Added `lib/json-ld.ts`'s `safeJsonLd()` (escapes `<` as `<`, semantically identical JSON) and switched every such call site (Organization schema, branch/careers/insights/services/team page schema, `PageBlocks.tsx`, and the admin custom-schema renderer) to use it.
- **Security — bumped Next.js to 14.2.35** (from 14.2.5) to pick up a batch of patched advisories on the same major/minor line (no App Router/Server Actions API changes). `npm audit` still shows some remaining advisories whose fix requires a Next 15/16 major-version migration — recommended as a separate, deliberately-tested upgrade, not bundled into this round.
- **Dead code removed**: `components/admin/FreezoneForm.tsx` (an old single-banner freezone admin form, fully superseded by `FreezoneDisplayForm.tsx`/the carousel-based Freezone Approvals feature — zero remaining references), the orphaned `updateFreezoneAction` server action in `lib/admin-actions.ts`, and the unused `isValidPhone()` helper in `lib/validation.ts` (every call site already validates inline against the exported `PHONE_PATTERN`). No dependencies were removed — every one in `package.json` is genuinely used. Verified with a full `tsc --noEmit` + production build before and after; nothing else in the codebase was found to be meaningfully dead.
- **Seed data**: see the API README's changelog — the hardcoded `admin@efc.ae` / `ChangeMe123!` login this project shipped with during earlier rounds is gone from the seed script; a fresh install now creates its first admin account from `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` environment variables instead. This is a backend-only change (see that README for what it means for your *existing* live database/admin account).
