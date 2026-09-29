import { getSiteConfig, getServices, getBranches, SITE_URL } from "@/lib/api";

// GEO (Generative Engine Optimization): an emerging convention — plain-text,
// always up to date, no HTML/CSS noise for an LLM-based crawler (ChatGPT,
// Perplexity, Claude, Google's AI Overviews, etc.) to parse — that gives an
// AI answer engine a concise, structured summary of the site: who the firm
// is, what it offers, and where to find more. Nothing here is hardcoded —
// it's rebuilt from the same admin-configured Site Settings, Services and
// Branches used everywhere else on the site, so it always matches what's
// actually live.
export async function GET() {
  const [siteConfig, services, branches] = await Promise.all([
    getSiteConfig("en"),
    getServices("en"),
    getBranches(),
  ]);

  // A sitewide "block from search engines" also means "don't let an AI
  // crawler summarize this deployment as if it were the real site" — the
  // same staging/preview switch in Admin → Site Settings covers this file.
  if (siteConfig.sitewideNoindex) {
    return new Response("# This deployment is not indexed. See the live site for current information.", {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const lines: string[] = [];
  lines.push(`# ${siteConfig.name}`);
  if (siteConfig.tagline) lines.push(`> ${siteConfig.tagline}`);
  lines.push("");
  lines.push(
    siteConfig.tagline
      ? `${siteConfig.name} — ${siteConfig.tagline}. This file summarizes the site for AI assistants and answer engines; see the linked pages for full detail.`
      : `This file summarizes ${siteConfig.name} for AI assistants and answer engines; see the linked pages for full detail.`,
  );
  lines.push("");

  lines.push("## Services");
  for (const s of services) {
    const desc = s.summary ? ` — ${s.summary}` : "";
    lines.push(`- [${s.title}](${SITE_URL}/en/services/${s.slug})${desc}`);
  }
  lines.push("");

  lines.push("## Locations");
  for (const b of branches) {
    lines.push(`- ${b.city}${b.country ? `, ${b.country}` : ""}: ${b.address ?? ""}`.trim());
  }
  lines.push("");

  lines.push("## Key Pages");
  lines.push(`- [About](${SITE_URL}/en/about)`);
  lines.push(`- [Our Team](${SITE_URL}/en/team)`);
  lines.push(`- [Insights](${SITE_URL}/en/insights)`);
  lines.push(`- [Contact](${SITE_URL}/en/contact)`);
  if (siteConfig.phone) lines.push(`- Phone: ${siteConfig.phone}`);
  if (siteConfig.email) lines.push(`- Email: ${siteConfig.email}`);

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
