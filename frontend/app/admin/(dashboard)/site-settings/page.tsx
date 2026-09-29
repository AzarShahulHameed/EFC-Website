import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";
import { updateSiteSettingsAction, updateLocationGateAction } from "@/lib/admin-actions";
import FieldLabel from "@/components/admin/FieldLabel";
import ColorField from "@/components/admin/ColorField";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { siteConfig as defaultSiteConfig, locationGateContent as defaultLocationGate } from "@/lib/content";

export default async function AdminSiteSettingsPage({
  searchParams,
}: {
  searchParams: { saved?: string; error?: string };
}) {
  const [res, branchesRes] = await Promise.all([
    adminFetch("/content/global/en"),
    adminFetch("/branches/admin/all"),
  ]);
  if (res.status === 401) redirect("/admin/login");
  const content: any = res.ok ? await res.json() : {};
  const site = {
    ...defaultSiteConfig,
    logoUrl: "",
    logoUrlDark: "",
    social: {},
    ...(content.siteConfig ?? {}),
    // Deep-merged, not overwritten wholesale, so saving before this field
    // existed (or changing only one of the four heights) doesn't blow away
    // the rest back to nothing.
    logoSizing: { ...defaultSiteConfig.logoSizing, ...(content.siteConfig?.logoSizing ?? {}) },
  };
  const locationGate = { ...defaultLocationGate, ...(content.locationGate ?? {}) };
  const branchesList: any[] = branchesRes.ok ? await branchesRes.json() : [];
  const countries = Array.from(
    new Set(branchesList.filter((b) => b.isActive).map((b) => b.country).filter(Boolean)),
  ) as string[];

  return (
    <div className="px-9 py-8">
      <h1 className="text-2xl font-bold text-ink mb-1">Site Settings</h1>
      <p className="text-[13.5px] text-slate-500 mb-7">
        Your firm&apos;s name, contact details, logo and social links — used across the header, footer and every
        page that references the company. Changing the name here does <em>not</em> require touching any code.
      </p>

      {searchParams.saved ? (
        <div className="bg-slate-50 border border-line px-5 py-3 mb-6 text-[13.5px] text-ink max-w-2xl">
          Saved. The public site picks it up on next request.
        </div>
      ) : null}

      <form
        action={updateSiteSettingsAction}
        encType="multipart/form-data"
        className="bg-white border border-line p-6 max-w-2xl flex flex-col gap-5"
      >
        <div>
          <FieldLabel htmlFor="name" hint="Your firm's name, shown in the header, footer, browser tab and every page title.">Company Name</FieldLabel>
          <input id="name" name="name" required defaultValue={site.name} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
        </div>
        <div>
          <FieldLabel htmlFor="tagline" hint="A short line describing what you do — used in SEO fallbacks and some hero sections.">Tagline</FieldLabel>
          <input id="tagline" name="tagline" defaultValue={site.tagline} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
        </div>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <FieldLabel htmlFor="phone" hint="Shown in the header's utility bar and the footer.">Phone</FieldLabel>
            <input id="phone" name="phone" defaultValue={site.phone} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div>
            <FieldLabel htmlFor="email" hint="Shown in the footer as a mailto link.">Email</FieldLabel>
            <input id="email" name="email" type="email" defaultValue={site.email} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
        </div>
        <div>
          <FieldLabel htmlFor="address" hint="Headquarters address, shown in the footer.">Address</FieldLabel>
          <input id="address" name="address" defaultValue={site.address} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
        </div>

        <div className="border-t border-line pt-5">
          <h2 className="text-[14px] font-bold text-ink mb-1">Floating Call / WhatsApp Popup</h2>
          <p className="text-[12.5px] text-slate-400 mb-4">
            A small popup at the bottom-left of every public page with a Call button (using Phone above) and a
            WhatsApp button, so visitors can reach you without hunting for the Contact page.
          </p>
          <label className="flex items-center gap-2.5 text-[13.5px] font-medium text-ink mb-4">
            <input type="checkbox" name="floatingContactEnabled" defaultChecked={site.floatingContactEnabled !== false} className="w-4 h-4" />
            Show the floating Call / WhatsApp popup
          </label>
          <FieldLabel htmlFor="whatsapp" hint="Include the country code, digits only or with + — e.g. +971501234567. Leave blank to hide just the WhatsApp button (Call still shows if Phone is set).">WhatsApp Number</FieldLabel>
          <input id="whatsapp" name="whatsapp" placeholder="+971501234567" defaultValue={site.whatsapp ?? ""} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
        </div>
        <ImageUploadField
          id="logo"
          label="Logo"
          hint="Shown in both the header and the footer (replaces the shield icon in the header when set). Leave empty to keep the current logo (or no logo)."
          fileFieldName="logo"
          existingUrlFieldName="existingLogoUrl"
          currentUrl={site.logoUrl}
          previewClassName="h-8 object-contain"
        />
        <ImageUploadField
          id="logoDark"
          label="Logo (for dark backgrounds)"
          hint="Optional. Most logos are dark wordmarks meant for a light page — if the Theme Builder's Header/Footer Color is dark, that logo can disappear. Upload a light or white variant here and it's used in the header/footer instead; leave empty to keep using the logo above everywhere."
          fileFieldName="logoDark"
          existingUrlFieldName="existingLogoUrlDark"
          currentUrl={site.logoUrlDark}
          previewClassName="h-8 object-contain bg-navy p-2"
        />

        <div className="border-t border-line pt-5">
          <h2 className="text-[14px] font-bold text-ink mb-1">Logo Sizing</h2>
          <p className="text-[12.5px] text-slate-400 mb-4">
            Height in pixels for the logo above, everywhere it's shown — width follows automatically to keep it from
            looking stretched. Nothing here is hardcoded in the templates; every value below is read from here.
          </p>
          <div className="grid grid-cols-2 gap-5">
            <div>
              <FieldLabel htmlFor="headerHeight" hint="Height of the logo in the public site's header, in pixels.">
                Header Logo Height (px)
              </FieldLabel>
              <input
                id="headerHeight"
                name="headerHeight"
                type="number"
                min={16}
                max={160}
                defaultValue={site.logoSizing.headerHeight}
                className="w-full border border-line px-3.5 py-2.5 text-[14px]"
              />
            </div>
            <div>
              <FieldLabel htmlFor="footerHeight" hint="Height of the logo in the public site's footer, in pixels.">
                Footer Logo Height (px)
              </FieldLabel>
              <input
                id="footerHeight"
                name="footerHeight"
                type="number"
                min={16}
                max={160}
                defaultValue={site.logoSizing.footerHeight}
                className="w-full border border-line px-3.5 py-2.5 text-[14px]"
              />
            </div>
            <div>
              <FieldLabel htmlFor="adminSidebarHeight" hint="Height of the logo at the top of this admin dashboard's sidebar, in pixels.">
                Admin Sidebar Logo Height (px)
              </FieldLabel>
              <input
                id="adminSidebarHeight"
                name="adminSidebarHeight"
                type="number"
                min={12}
                max={120}
                defaultValue={site.logoSizing.adminSidebarHeight}
                className="w-full border border-line px-3.5 py-2.5 text-[14px]"
              />
            </div>
            <div>
              <FieldLabel htmlFor="loginHeight" hint="Height of the logo on the admin sign-in screen, in pixels.">
                Login Screen Logo Height (px)
              </FieldLabel>
              <input
                id="loginHeight"
                name="loginHeight"
                type="number"
                min={16}
                max={200}
                defaultValue={site.logoSizing.loginHeight}
                className="w-full border border-line px-3.5 py-2.5 text-[14px]"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">
          <div>
            <FieldLabel htmlFor="linkedin" hint="Full URL, e.g. https://linkedin.com/company/yourfirm">LinkedIn URL</FieldLabel>
            <input id="linkedin" name="linkedin" defaultValue={site.social?.linkedin ?? ""} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div>
            <FieldLabel htmlFor="instagram" hint="Full URL, e.g. https://instagram.com/yourfirm">Instagram URL</FieldLabel>
            <input id="instagram" name="instagram" defaultValue={site.social?.instagram ?? ""} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div>
            <FieldLabel htmlFor="twitter" hint="Full URL, e.g. https://x.com/yourfirm">X / Twitter URL</FieldLabel>
            <input id="twitter" name="twitter" defaultValue={site.social?.twitter ?? ""} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
        </div>

        <div className="border-t border-line pt-5">
          <h2 className="text-[14px] font-bold text-ink mb-1">SEO &amp; Search Engines</h2>
          <p className="text-[12.5px] text-slate-400 mb-4">
            Site-wide search engine settings. Per-page title, description and social image live in{" "}
            <a href="/admin/seo" className="underline">SEO &amp; Schema</a> — these are the settings that apply
            everywhere at once.
          </p>
          <div className="grid grid-cols-2 gap-5 mb-5">
            <div>
              <FieldLabel htmlFor="googleVerification" hint="From Google Search Console → Settings → Ownership verification → HTML tag. Paste just the content value, not the whole tag.">Google Search Console Verification</FieldLabel>
              <input id="googleVerification" name="googleVerification" defaultValue={site.googleVerification ?? ""} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
            </div>
            <div>
              <FieldLabel htmlFor="bingVerification" hint="From Bing Webmaster Tools → Settings → Ownership verification → Meta tag.">Bing Webmaster Verification</FieldLabel>
              <input id="bingVerification" name="bingVerification" defaultValue={site.bingVerification ?? ""} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
            </div>
          </div>
          <div className="mb-5">
            <FieldLabel htmlFor="defaultOgImageUrl" hint="Shown when a page is shared on LinkedIn/WhatsApp/X and has no image of its own set in SEO &amp; Schema. Full image URL, ideally 1200×630.">Default Share Image URL</FieldLabel>
            <input id="defaultOgImageUrl" name="defaultOgImageUrl" defaultValue={site.defaultOgImageUrl ?? ""} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
          </div>
          <div className="mb-5">
            <FieldLabel htmlFor="robotsExtraDisallow" hint="One path per line (e.g. /internal-drafts). /admin and /api are always blocked automatically.">Extra robots.txt Disallow Paths</FieldLabel>
            <textarea id="robotsExtraDisallow" name="robotsExtraDisallow" rows={2} defaultValue={site.robotsExtraDisallow ?? ""} className="w-full border border-line px-3.5 py-2.5 text-[14px] font-mono" />
          </div>
          <label className="flex items-center gap-2.5 text-[13.5px] font-medium text-red-700">
            <input type="checkbox" name="sitewideNoindex" defaultChecked={site.sitewideNoindex === true} className="w-4 h-4" />
            Block this entire site from search engines (staging/preview only — never leave this on for the live site)
          </label>
        </div>

        <div className="border-t border-line pt-5">
          <h2 className="text-[14px] font-bold text-ink mb-1">Image Protection</h2>
          <p className="text-[12.5px] text-slate-400 mb-4">
            A real deterrent against casual copying — not a guarantee. A public website&apos;s images have to be
            sent to the visitor&apos;s browser to be shown, so no website can make an image truly impossible to
            save; anyone using their browser&apos;s developer tools can still reach the file underneath.
          </p>
          <label className="flex items-center gap-2.5 text-[13.5px] font-medium text-ink mb-4">
            <input
              type="checkbox"
              name="disableRightClick"
              defaultChecked={site.imageProtection?.disableRightClick !== false}
              className="w-4 h-4"
            />
            Disable right-click &amp; drag-to-save on every image and video, sitewide
          </label>
          <label className="flex items-center gap-2.5 text-[13.5px] font-medium text-ink mb-3">
            <input
              type="checkbox"
              name="watermarkEnabled"
              defaultChecked={site.imageProtection?.watermarkEnabled === true}
              className="w-4 h-4"
            />
            Stamp a text watermark on every photo, sitewide
          </label>
          <FieldLabel
            htmlFor="watermarkText"
            hint="Shown faintly in the bottom-right corner of every Cloudinary-hosted photo. Applied on the fly — your original files are never touched. Leave blank to use your Company Name."
          >
            Watermark Text
          </FieldLabel>
          <input
            id="watermarkText"
            name="watermarkText"
            placeholder={site.name}
            defaultValue={site.imageProtection?.watermarkText ?? ""}
            className="w-full border border-line px-3.5 py-2.5 text-[14px] max-w-sm"
          />
          <p className="text-[12px] text-slate-400 mt-4 leading-relaxed border-t border-line pt-4">
            <strong className="text-ink">Stopping other websites from hotlinking your photos</strong> — embedding
            your Cloudinary image URLs directly on their own pages — isn&apos;t something a setting here can do;
            it has to be turned on in your Cloudinary account, which actually serves the files: Cloudinary
            Console → Settings → Security → <em>Restricted media types</em> / <em>Allowed fetch domains</em>. Once
            set there, any request for your images from a page on another domain is refused at Cloudinary&apos;s
            edge — the strongest version of this protection that exists, and outside what this dashboard controls.
          </p>
        </div>

        <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)] self-start">
          Save Site Settings
        </button>
      </form>

      <form
        action={updateLocationGateAction}
        encType="multipart/form-data"
        className="bg-white border border-line p-6 max-w-2xl flex flex-col gap-5 mt-8"
      >
        <div>
          <h2 className="text-[15px] font-bold text-ink mb-1">Location Gate</h2>
          <p className="text-[13px] text-slate-500">
            Ask first-time visitors to pick their region before they reach the homepage. Choices come straight
            from the countries set on active branches below — add or rename a branch&apos;s country in{" "}
            <a href="/admin/branches" className="underline">Branches &amp; Locations</a> to change the list, no
            code changes needed.
          </p>
        </div>

        <label className="flex items-center gap-2.5 text-[13.5px] font-medium text-ink">
          <input type="checkbox" name="enabled" value="1" defaultChecked={locationGate.enabled} className="w-4 h-4" />
          Show the location picker before the homepage
        </label>

        <div className="text-[12.5px] text-slate-500 -mt-2">
          {countries.length > 0 ? (
            <>Current choices, from active branches: <strong className="text-ink">{countries.join(", ")}</strong></>
          ) : (
            <>No branch has a country set yet — add one on the Branches &amp; Locations page, or the gate will have nothing to show.</>
          )}
        </div>

        <div>
          <FieldLabel htmlFor="lg-headline" hint="Heading shown at the top of the picker.">Headline</FieldLabel>
          <input id="lg-headline" name="headline" defaultValue={locationGate.headline} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
        </div>
        <div>
          <FieldLabel htmlFor="lg-subtext" hint="One line of supporting copy under the headline.">Subtext</FieldLabel>
          <input id="lg-subtext" name="subtext" defaultValue={locationGate.subtext} className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
        </div>
        <div>
          <FieldLabel htmlFor="lg-cta" hint="Button label after a region is picked.">Continue Button Text</FieldLabel>
          <input id="lg-cta" name="ctaLabel" defaultValue={locationGate.ctaLabel} className="w-full border border-line px-3.5 py-2.5 text-[14px] max-w-xs" />
        </div>

        {locationGate.backgroundVideoUrl ? (
          <input type="hidden" name="existingVideoUrl" value={locationGate.backgroundVideoUrl} />
        ) : null}

        <div className="grid grid-cols-2 gap-4">
          <ImageUploadField
            id="lg-image"
            label="Background Image"
            hint="Optional — faint background image behind the picker. Uploaded to Cloudinary."
            fileFieldName="image"
            existingUrlFieldName="existingImageUrl"
            currentUrl={locationGate.backgroundImageUrl}
          />
          <div>
            <FieldLabel htmlFor="lg-video" hint="Optional — looping muted background video behind the picker. Takes priority over the image above when both are set.">Background Video</FieldLabel>
            <input id="lg-video" name="video" type="file" accept="video/*" className="w-full text-[13.5px]" />
            {locationGate.backgroundVideoUrl ? (
              <label className="flex items-center gap-2 text-[12.5px] text-slate-600 mt-2">
                <input type="checkbox" name="removeVideo" value="1" />
                Remove current video
              </label>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="lg-overlay" hint="How much the background image/video is darkened so the text on top stays readable. Same treatment as the homepage Hero.">Background Darkness ({locationGate.overlayOpacity ?? 65}%)</FieldLabel>
            <input
              id="lg-overlay"
              name="overlayOpacity"
              type="range"
              min={0}
              max={100}
              defaultValue={locationGate.overlayOpacity ?? 65}
              className="w-full"
            />
          </div>
          <div>
            <FieldLabel htmlFor="lg-tint" hint="Solid backdrop color, always fully opaque — shows instantly, with no fade, so the homepage never bleeds through while the picker animates in.">Backdrop Color</FieldLabel>
            <ColorField id="lg-tint" name="backgroundTint" defaultValue={locationGate.backgroundTint || "#070E1C"} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <ImageUploadField
            id="lg-logo"
            label="Logo Image"
            hint="Optional — replaces the default lettermark box in the picker. Uploaded to Cloudinary."
            fileFieldName="logo"
            existingUrlFieldName="existingLogoUrl"
            currentUrl={locationGate.logoUrl}
          />
          <div>
            <FieldLabel htmlFor="lg-logo-text" hint="Shown inside the default lettermark box when no logo image is set.">Logo Text (Fallback)</FieldLabel>
            <input id="lg-logo-text" name="logoText" defaultValue={locationGate.logoText || "EFC"} className="w-full border border-line px-3.5 py-2.5 text-[14px] max-w-xs" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <FieldLabel htmlFor="lg-animation" hint="How the whole picker transitions in and out.">Animation</FieldLabel>
            <select id="lg-animation" name="animation" defaultValue={locationGate.animation || "fade"} className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white">
              <option value="fade">Fade</option>
              <option value="zoom">Zoom</option>
              <option value="slide-up">Slide Up</option>
              <option value="slide-down">Slide Down</option>
              <option value="blur">Blur</option>
              <option value="flip">Flip</option>
              <option value="rotate">Rotate</option>
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="lg-text-transition" hint="How the headline and subtext reveal themselves.">Text Transition</FieldLabel>
            <select id="lg-text-transition" name="textTransition" defaultValue={locationGate.textTransition || "fade"} className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white">
              <option value="none">None</option>
              <option value="fade">Fade</option>
              <option value="slide-up">Slide Up</option>
              <option value="stagger-words">Word-by-Word Stagger</option>
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="lg-button-style" hint="Corner style for the region and continue buttons.">Button Style</FieldLabel>
            <select id="lg-button-style" name="buttonStyle" defaultValue={locationGate.buttonStyle || "sharp"} className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white">
              <option value="sharp">Sharp corners</option>
              <option value="rounded">Rounded corners</option>
              <option value="pill">Pill</option>
            </select>
          </div>
        </div>

        <div>
          <FieldLabel htmlFor="lg-trigger" hint="How often a visitor is asked to pick again.">When Should This Appear</FieldLabel>
          <select id="lg-trigger" name="trigger" defaultValue={locationGate.trigger || "once"} className="w-full border border-line px-3.5 py-2.5 text-[14px] bg-white max-w-sm">
            <option value="once">Once per visitor (remembers on this device)</option>
            <option value="session">Once per browser session (asks again next visit)</option>
            <option value="always">Every page load (never remembers)</option>
          </select>
        </div>

        <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)] self-start">
          Save Location Gate
        </button>
      </form>
    </div>
  );
}
