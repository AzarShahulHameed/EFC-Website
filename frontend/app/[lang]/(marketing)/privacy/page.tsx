import { getLegalPage, buildPageMetadata } from "@/lib/api";
import { isLocale, type Locale } from "@/lib/i18n";
import { notFound } from "next/navigation";
import { sanitizeRichText } from "@/lib/rich-text";

export async function generateMetadata({ params }: { params: { lang: string } }) {
  const page = await getLegalPage("privacy", params.lang);
  return buildPageMetadata(
    "/privacy",
    params.lang,
    `${page.title} — EFC`,
    "How EFC collects, uses and protects your personal data.",
  );
}

export default async function PrivacyPolicyPage({ params }: { params: { lang: string } }) {
  if (!isLocale(params.lang)) notFound();
  const page = await getLegalPage("privacy", params.lang as Locale);

  return (
    <article className="container-page py-24 max-w-3xl">
      <h1 className="font-serif text-4xl text-ink leading-tight mb-10">{page.title}</h1>
      <div
        className="text-[15.5px] leading-relaxed text-ink [&_p]:mb-5 [&_p:last-child]:mb-0 [&_div]:mb-3 [&_div:last-child]:mb-0"
        dangerouslySetInnerHTML={{ __html: sanitizeRichText(page.body) }}
      />
    </article>
  );
}
