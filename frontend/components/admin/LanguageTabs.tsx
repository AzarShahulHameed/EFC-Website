import Link from "next/link";

const LANGS = [
  { code: "en", label: "English" },
  { code: "ar", label: "Arabic" },
  { code: "de", label: "German" },
];

export default function LanguageTabs({ basePath, current }: { basePath: string; current: string }) {
  return (
    <div className="flex gap-2 mb-5">
      {LANGS.map((l) => (
        <Link
          key={l.code}
          href={`${basePath}?lang=${l.code}`}
          className={`text-[12.5px] font-semibold px-3.5 py-1.5 rounded-full border ${
            l.code === current ? "bg-ink text-white border-ink" : "bg-white text-ink border-line"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
