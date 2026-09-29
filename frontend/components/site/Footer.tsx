import Link from "next/link";
import { footerLinks as defaultFooterLinks } from "@/lib/content";
import { lh, type Locale } from "@/lib/i18n";
import type { SiteConfig } from "@/lib/api";
import NewsletterForm from "./NewsletterForm";

export default function Footer({
  lang,
  siteConfig,
  footerLinks,
}: {
  lang: Locale;
  siteConfig: SiteConfig;
  footerLinks: typeof defaultFooterLinks;
}) {
  return (
    // `bg-footer`/`text-footer-fg-muted` (rather than the old hardcoded
    // `bg-navy`/`text-slate-300`) let the footer follow its own Theme
    // Builder → Footer Color independently of the header, with a
    // luminance-derived text color that stays legible whatever color is
    // picked (see app/layout.tsx's `footer`/`footerFg`/`footerFgMuted`
    // derivation and lib/theme-runtime.ts's contrastTextChannels).
    <footer className="w-full bg-footer text-footer-fg-muted">
      <div className="container-page pt-20 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          <div>
            <div className="flex items-center gap-3 min-w-0">
              {siteConfig.logoUrlDark || siteConfig.logoUrl ? (
                // Prefer the dark-background logo variant (Admin → Site
                // Settings → "Logo (for dark backgrounds)") when one is
                // set, since the footer's background is admin-configurable
                // now and a dark wordmark logo can disappear against it.
                // `object-contain`/`max-w` (instead of the old bare `h-8
                // w-auto`) stop a wide logo from overflowing/squashing.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={siteConfig.logoUrlDark || siteConfig.logoUrl}
                  alt={siteConfig.name}
                  // Admin → Site Settings → Logo Sizing → "Footer Logo
                  // Height" — was a fixed 36px (h-9) with no way to change it.
                  style={{ height: siteConfig.logoSizing.footerHeight, maxWidth: siteConfig.logoSizing.footerHeight * 4 }}
                  className="w-auto object-contain flex-shrink-0"
                />
              ) : null}
              <span className="font-serif text-lg font-semibold text-footer-fg truncate">{siteConfig.name}</span>
            </div>
            <p className="text-[13.5px] leading-relaxed mt-4 max-w-[240px] text-footer-fg-muted">
              Chartered auditors, tax advisers and business consultants serving the United Arab Emirates.
            </p>
            {siteConfig.social && Object.values(siteConfig.social).some(Boolean) ? (
              <div className="flex gap-4 mt-5 text-[12.5px]">
                {siteConfig.social.linkedin ? <a href={siteConfig.social.linkedin}>LinkedIn</a> : null}
                {siteConfig.social.instagram ? <a href={siteConfig.social.instagram}>Instagram</a> : null}
                {siteConfig.social.twitter ? <a href={siteConfig.social.twitter}>X / Twitter</a> : null}
              </div>
            ) : null}
          </div>

          <div>
            <div className="text-xs font-semibold text-footer-fg tracking-wider uppercase mb-4">Services</div>
            <div className="flex flex-col gap-2.5 text-[13.5px]">
              {footerLinks.services.map((l) => (
                <Link key={l.href} href={lh(lang, l.href)} className="hover:text-footer-fg">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-footer-fg tracking-wider uppercase mb-4">Company</div>
            <div className="flex flex-col gap-2.5 text-[13.5px]">
              {footerLinks.company.map((l) => (
                <Link key={l.href} href={lh(lang, l.href)} className="hover:text-footer-fg">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-footer-fg tracking-wider uppercase mb-4">Contact</div>
            <div className="flex flex-col gap-2.5 text-[13.5px]">
              <span>{siteConfig.address}</span>
              <a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}>{siteConfig.phone}</a>
              <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-footer-fg tracking-wider uppercase mb-4">Stay Informed</div>
            <NewsletterForm />
          </div>
        </div>

        <div className="border-t border-[#1E3050] mt-16 pt-6 flex flex-col sm:flex-row gap-3 justify-between text-[12.5px] text-footer-fg-muted">
          <span>&copy; {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</span>
          <div className="flex gap-6">
            {footerLinks.legal.map((l) => (
              <Link key={l.href} href={lh(lang, l.href)} className="hover:text-footer-fg">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
