import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";
import { createLanguageAction, toggleLanguageActiveAction } from "@/lib/admin-actions";
import FieldLabel from "@/components/admin/FieldLabel";

export default async function AdminLanguagesPage({
  searchParams,
}: {
  searchParams: { error?: string; saved?: string };
}) {
  const res = await adminFetch("/admin/languages");
  if (res.status === 401) redirect("/admin/login");
  const languages: any[] = res.ok ? await res.json() : [];

  return (
    <div className="px-9 py-8">
      <h1 className="text-2xl font-bold text-ink mb-1">Languages</h1>
      <p className="text-[13.5px] text-slate-500 mb-7">
        Turning a language off here removes it from the public site's language switcher and the
        <code className="mx-1">/[lang]/...</code> routes it can reach — content already saved in that language stays
        in the database.
      </p>


      <div className="bg-white border border-line max-w-2xl overflow-x-auto">
        {languages.length === 0 ? (
          <div className="px-6 py-8 text-[13.5px] text-slate-400">
            No languages yet — run <code className="mx-1">npm run prisma:seed</code> in the API to create the
            default four.
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left">
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Language</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Code</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Direction</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                <th className="px-6 py-3 text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide"></th>
              </tr>
            </thead>
            <tbody>
              {languages.map((l) => (
                <tr key={l.code} className="border-t border-slate-100">
                  <td className="px-6 py-3.5 text-[13.5px] text-ink font-medium">{l.name}</td>
                  <td className="px-6 py-3.5 text-[13.5px] text-muted uppercase">{l.code}</td>
                  <td className="px-6 py-3.5 text-[13.5px] text-muted">{l.isRTL ? "RTL" : "LTR"}</td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        l.isActive ? "bg-green-100 text-green-800" : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {l.isActive ? "Active" : "Inactive"}
                      {l.isDefault ? " · Default" : ""}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    {l.isDefault ? (
                      <span className="text-[12px] text-slate-400">Default language</span>
                    ) : (
                      <form action={toggleLanguageActiveAction.bind(null, l.code, l.name, l.isActive)}>
                        <button type="submit" className="text-[12.5px] font-semibold text-ink">
                          {l.isActive ? "Disable" : "Enable"}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white border border-line p-6 max-w-2xl mt-8">
        <h2 className="text-[15px] font-bold text-ink mb-1">Add a Language</h2>
        <p className="text-[12.5px] text-slate-400 mb-4">
          Adds the language here so it's ready for content and translations. Reaching it on the public site's{" "}
          <code>/[lang]/...</code> routes needs one additional one-line code change (a Next.js requirement — every
          locale has to be known when the site builds) — ask your developer to add it to <code>lib/i18n.ts</code>{" "}
          once you've added it here.
        </p>
        <form action={createLanguageAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="code" hint="Two-letter ISO code, e.g. 'de' for German, 'es' for Spanish.">Language Code</FieldLabel>
              <input id="code" name="code" required maxLength={5} placeholder="e.g. es" className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
            </div>
            <div>
              <FieldLabel htmlFor="name" hint="Display name shown in the admin dashboard.">Language Name</FieldLabel>
              <input id="name" name="name" required placeholder="e.g. Spanish" className="w-full border border-line px-3.5 py-2.5 text-[14px]" />
            </div>
          </div>
          <label className="flex items-center gap-2 text-[13.5px] text-ink">
            <input type="checkbox" name="isRTL" className="w-4 h-4" />
            Right-to-left script (like Arabic)
          </label>
          <button type="submit" className="bg-gold text-[#1A1204] font-semibold text-[14px] px-5 py-3 rounded-[var(--radius)] self-start">
            Add Language
          </button>
        </form>
      </div>
    </div>
  );
}
