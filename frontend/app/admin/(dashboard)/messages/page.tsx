import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";
import { updateSystemMessageAction } from "@/lib/admin-actions";
import { SYSTEM_MESSAGE_KEYS, type SystemMessageKey } from "@/lib/api";
import FieldLabel from "@/components/admin/FieldLabel";
import LanguageTabs from "@/components/admin/LanguageTabs";

const GROUP_ORDER = ["Success", "Error", "Warning"] as const;
const GROUP_STYLES: Record<string, string> = {
  Success: "text-green-800 bg-green-100",
  Error: "text-red-800 bg-red-100",
  Warning: "text-amber-800 bg-amber-100",
};

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: { lang?: string; saved?: string; error?: string };
}) {
  const lang = searchParams.lang || "en";

  // The same generic Translation table the language system uses — this
  // page is just a curated, friendly editor over a fixed set of keys
  // instead of a raw key/value list.
  const res = await adminFetch(`/translations/${lang}`);
  if (res.status === 401) redirect("/admin/login");
  const saved: Record<string, string> = res.ok ? await res.json() : {};

  const keys = Object.keys(SYSTEM_MESSAGE_KEYS) as SystemMessageKey[];

  return (
    <div className="px-9 py-8">
      <h1 className="text-2xl font-bold text-ink mb-1">System Messages</h1>
      <p className="text-[13.5px] text-slate-500 mb-5 max-w-2xl">
        The exact wording shown to a visitor after they submit a form, upload a file, or hit an error — the Contact
        form, the Careers application form, and generic fallbacks. Edit any line below and it goes live immediately,
        per language, no code change or redeploy needed. Leave a field as-is to keep the default shown as its
        placeholder.
      </p>


      <LanguageTabs basePath="/admin/messages" current={lang} />

      <div className="flex flex-col gap-8 max-w-2xl">
        {GROUP_ORDER.map((group) => {
          const groupKeys = keys.filter((k) => SYSTEM_MESSAGE_KEYS[k].group === group);
          if (groupKeys.length === 0) return null;
          return (
            <div key={group} className="bg-white border border-line p-6">
              <span
                className={`inline-block text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full mb-4 ${GROUP_STYLES[group]}`}
              >
                {group} messages
              </span>
              <div className="flex flex-col gap-5">
                {groupKeys.map((key) => {
                  const meta = SYSTEM_MESSAGE_KEYS[key];
                  const currentValue = saved[key] ?? "";
                  return (
                    <form key={key} action={updateSystemMessageAction.bind(null, key, lang)} className="flex flex-col gap-2">
                      <FieldLabel
                        htmlFor={key}
                        hint="Shown exactly as typed here, in the language selected above. Leave blank to use the built-in default shown as placeholder text."
                      >
                        {meta.label}
                      </FieldLabel>
                      <div className="flex gap-2.5">
                        <textarea
                          id={key}
                          name="value"
                          defaultValue={currentValue}
                          placeholder={meta.fallback}
                          rows={2}
                          className="w-full border border-line px-3.5 py-2.5 text-[13.5px] resize-y"
                        />
                        <button
                          type="submit"
                          className="bg-gold text-[#1A1204] font-semibold text-[13px] px-4 rounded-[var(--btn-radius)] self-start py-2.5 whitespace-nowrap"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
