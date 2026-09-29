import Link from "next/link";

// Shown across the admin dashboard shell whenever English content has
// changed since the last time "Translate Everything Now" ran over it (see
// getTranslationStaleness in lib/admin-actions.ts) — the popup the user
// asked for: "if anything I change in future in the English it should give
// me the popup translation is needed... it should take me to translation
// setting." Rendered as a persistent top banner rather than a JS popup
// dialog so it survives a full page navigation without needing client-side
// state, and links straight to where it gets fixed.
export default function TranslationStaleBanner({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <Link
      href="/admin/translate-settings"
      className="block bg-amber-50 border-b border-amber-200 px-5 py-2 text-[12.5px] text-amber-800 hover:bg-amber-100 transition-colors"
    >
      <strong className="font-semibold">Translation needed</strong> — English content has changed in {count} place
      {count === 1 ? "" : "s"} since it was last translated. Click here to re-run Translate Everything Now.
    </Link>
  );
}
