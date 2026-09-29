// ---------------------------------------------------------------------------
// Locale configuration. Page/content copy (services, team, insights, hero
// text, etc.) is translated through the CMS — see lib/api.ts, which already
// passes `lang` through to every endpoint. This file covers the much
// smaller surface of *chrome* strings (nav labels, buttons) that aren't
// content records, plus the routing helpers every page needs.
//
// The `uiStrings` translations below are placeholders for you to have
// reviewed by a native speaker before shipping — treat them the same as
// the [bracketed] placeholders elsewhere in this project.
// ---------------------------------------------------------------------------

export const locales = ["en", "ar", "de"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";
export const rtlLocales: readonly Locale[] = ["ar"];

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function dirFor(lang: Locale): "rtl" | "ltr" {
  return rtlLocales.includes(lang) ? "rtl" : "ltr";
}

// Prefixes an internal path with the current locale, e.g. lh("ar", "/contact") -> "/ar/contact"
export function lh(lang: Locale, path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/${lang}${normalized}`;
}

export const languageNames: Record<Locale, string> = {
  en: "English",
  ar: "العربية",
  de: "Deutsch",
};

// Which country's flag represents each language in the header's language
// picker, plus that country's name shown alongside it (Admin → nothing to
// configure here — this is a fixed 1:1 mapping since `locales` itself is a
// fixed set of three). Arabic is paired with the UAE specifically (not a
// generic pan-Arab flag) since that's this firm's own primary Arabic-
// speaking market, not an assertion that UAE is the only place Arabic is
// spoken.
export const languageCountry: Record<Locale, { code: string; country: string }> = {
  en: { code: "gb", country: "United Kingdom" },
  ar: { code: "ae", country: "United Arab Emirates" },
  de: { code: "de", country: "Germany" },
};

export const uiStrings: Record<Locale, Record<string, string>> = {
  en: {
    services: "Services",
    industries: "Industries",
    about: "About",
    insights: "Insights",
    careers: "Careers",
    contact: "Contact",
    bookConsultation: "Book a Consultation",
    exploreServices: "Explore Our Services",
    utilityLocations: "Dubai · Abu Dhabi · Sharjah",
  },
  ar: {
    services: "الخدمات",
    industries: "القطاعات",
    about: "من نحن",
    insights: "رؤى ومقالات",
    careers: "وظائف",
    contact: "تواصل معنا",
    bookConsultation: "احجز استشارة",
    exploreServices: "استكشف خدماتنا",
    utilityLocations: "دبي · أبوظبي · الشارقة",
  },
  de: {
    services: "Leistungen",
    industries: "Branchen",
    about: "Über uns",
    insights: "Einblicke",
    careers: "Karriere",
    contact: "Kontakt",
    bookConsultation: "Beratung buchen",
    exploreServices: "Unsere Leistungen",
    utilityLocations: "Dubai · Abu Dhabi · Sharjah",
  },
};
