import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";
import { updateTranslateSettingsAction, translateEntireSiteAction } from "@/lib/admin-actions";
import { languageNames, locales, defaultLocale } from "@/lib/i18n";
import TranslateAllButton from "@/components/admin/TranslateAllButton";

type TranslateSettings = {
  apiKeySet: boolean;
  source: "db" | "env";
  configured: boolean;
};

type UsageRow = { languageCode?: string; source?: string; characters: number; requests: number };
type Usage = {
  totalCharacters: number;
  totalRequests: number;
  allTimeCharacters: number;
  allTimeRequests: number;
  billingPeriodStart: string;
  estimatedCostUsd: number;
  pricePerMillionChars: number;
  freeCharsPerMonth: number;
  byLanguage: UsageRow[];
  bySource: UsageRow[];
  recent: { id: string; charCount: number; languageCode: string; source: string; createdAt: string }[];
};

const SOURCE_LABEL: Record<string, string> = {
  manual: "Manual (Auto-translate button)",
  "auto-on-save": "Automatic (on English save)",
  services: "Services",
  insights: "Insights / Blog",
  team: "Team",
  testimonials: "Testimonials",
  "bulk-translate-all": "Translate Everything Now",
};

export default async function AdminTranslateSettingsPage() {
  const meRes = await adminFetch("/auth/me");
  if (meRes.status === 401) redirect("/admin/login");
  const me: any = meRes.ok ? await meRes.json() : null;

  if (me?.role !== "ADMIN" && me?.role !== "SUPER_ADMIN") {
    return (
      <div className="px-9 py-8">
        <h1 className="text-2xl font-bold text-ink mb-1">Translate Settings</h1>
        <div className="bg-amber-50 border border-amber-200 px-5 py-4 mt-6 max-w-xl text-[13.5px] text-amber-800 rounded-[var(--radius)]">
          This page is only available to Admins and Super Admins.
        </div>
      </div>
    );
  }

  const [settingsRes, usageRes] = await Promise.all([
    adminFetch("/settings/translate"),
    adminFetch("/settings/translate/usage"),
  ]);
  if (settingsRes.status === 401) redirect("/admin/login");
  const settings: TranslateSettings | null = settingsRes.ok ? await settingsRes.json() : null;
  const usage: Usage | null = usageRes.ok ? await usageRes.json() : null;

  return (
    <div className="px-9 py-8">
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-2xl font-bold text-ink">Translate Settings</h1>
        {settings?.configured ? (
          <span className="text-[11px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
            Configured
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            Not configured
          </span>
        )}
      </div>
      <p className="text-[13.5px] text-slate-500 mb-7 max-w-2xl">
        Powers every "Auto-translate" button across the admin dashboard, and automatically fills in any language
        that has no translation yet the moment you save a Service's English content — it never overwrites a
        translation you've already reviewed or hand-edited, so it's always safe to save.{" "}
        {settings?.source === "env" ? "Currently falling back to GOOGLE_TRANSLATE_API_KEY from the API's .env file." : null}
      </p>

      <form
        action={updateTranslateSettingsAction}
        className="bg-white border border-line p-6 max-w-xl flex flex-col gap-5 mb-8"
      >
        <div>
          <label htmlFor="apiKey" className="block text-[13px] font-semibold text-ink mb-1.5">
            Google Cloud Translation API key
          </label>
          <input
            id="apiKey"
            name="apiKey"
            type="password"
            placeholder={settings?.apiKeySet ? "•••••••• (leave blank to keep)" : "Paste your API key"}
            className="w-full border border-line px-3.5 py-2.5 text-[14px] rounded-[var(--radius)] focus:outline-none focus:border-ink"
          />
          <p className="text-[11.5px] text-slate-400 mt-1.5">
            From the{" "}
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-ink"
            >
              Google Cloud Console
            </a>{" "}
            — enable the "Cloud Translation API" on the project first. The key is never shown again after saving.
          </p>
        </div>

        <button
          type="submit"
          className="bg-gold hover:bg-gold-light text-[#1A1204] font-semibold text-[14px] px-5 py-2.5 rounded-[var(--btn-radius)] self-start transition-colors"
        >
          Save changes
        </button>
      </form>

      <TranslateAllButton
        action={translateEntireSiteAction}
        languageOptions={locales.filter((l) => l !== defaultLocale)}
      />

      <h2 className="text-[15px] font-bold text-ink mb-1">Usage &amp; estimated cost</h2>
      <p className="text-[12px] text-slate-400 mb-3">
        Since {usage?.billingPeriodStart ? new Date(usage.billingPeriodStart).toLocaleDateString() : "the start of this month"}{" "}
        — matching Google's free tier, which resets every calendar month rather than being a one-time allowance.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-line border border-line mb-3 max-w-3xl rounded-[var(--radius)] overflow-hidden">
        <div className="bg-white p-5">
          <div className="text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Characters this month</div>
          <div className="text-2xl font-bold text-ink">{(usage?.totalCharacters ?? 0).toLocaleString()}</div>
        </div>
        <div className="bg-white p-5">
          <div className="text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Requests this month</div>
          <div className="text-2xl font-bold text-ink">{(usage?.totalRequests ?? 0).toLocaleString()}</div>
        </div>
        <div className="bg-white p-5">
          <div className="text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Estimated cost this month</div>
          <div className="text-2xl font-bold text-ink">${(usage?.estimatedCostUsd ?? 0).toFixed(2)}</div>
        </div>
      </div>
      <p className="text-[12px] text-slate-400 mb-1 max-w-2xl">
        All-time: {(usage?.allTimeCharacters ?? 0).toLocaleString()} characters across {(usage?.allTimeRequests ?? 0).toLocaleString()} requests since this feature started logging.
      </p>
      <p className="text-[12px] text-slate-400 mb-8 max-w-2xl">
        Estimate only, based on Google's Basic-tier pricing (${usage?.pricePerMillionChars ?? 20} per 1,000,000
        characters, with the first {(usage?.freeCharsPerMonth ?? 500_000).toLocaleString()} characters free each
        month) — not a substitute for the real bill on your Google Cloud Billing account, which may differ with
        negotiated pricing, currency, or tax.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-3xl mb-8">
        <div className="bg-white border border-line p-5">
          <h3 className="text-[13px] font-bold text-ink mb-3">By language (this month)</h3>
          {usage && usage.byLanguage.length > 0 ? (
            <div className="flex flex-col gap-2">
              {usage.byLanguage.map((row) => (
                <div key={row.languageCode} className="flex items-center justify-between text-[13px]">
                  <span className="text-ink">{languageNames[row.languageCode as keyof typeof languageNames] ?? row.languageCode}</span>
                  <span className="text-slate-500">{row.characters.toLocaleString()} chars · {row.requests} req</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12.5px] text-slate-400">No translations run yet.</p>
          )}
        </div>
        <div className="bg-white border border-line p-5">
          <h3 className="text-[13px] font-bold text-ink mb-3">By source (this month)</h3>
          {usage && usage.bySource.length > 0 ? (
            <div className="flex flex-col gap-2">
              {usage.bySource.map((row) => (
                <div key={row.source} className="flex items-center justify-between text-[13px]">
                  <span className="text-ink">{SOURCE_LABEL[row.source ?? ""] ?? row.source}</span>
                  <span className="text-slate-500">{row.characters.toLocaleString()} chars · {row.requests} req</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12.5px] text-slate-400">No translations run yet.</p>
          )}
        </div>
      </div>

      <h3 className="text-[13px] font-bold text-ink mb-3">Recent activity</h3>
      <div className="bg-white border border-line max-w-3xl overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line text-left text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">
              <th className="px-4 py-2.5">When</th>
              <th className="px-4 py-2.5">Language</th>
              <th className="px-4 py-2.5">Source</th>
              <th className="px-4 py-2.5">Characters</th>
            </tr>
          </thead>
          <tbody>
            {usage && usage.recent.length > 0 ? (
              usage.recent.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="px-4 py-2.5 text-slate-500">{new Date(row.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-ink">{languageNames[row.languageCode as keyof typeof languageNames] ?? row.languageCode}</td>
                  <td className="px-4 py-2.5 text-slate-500">{SOURCE_LABEL[row.source] ?? row.source}</td>
                  <td className="px-4 py-2.5 text-ink">{row.charCount.toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">No translation calls logged yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
