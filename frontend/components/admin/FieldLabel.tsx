// A label with a small "?" badge — hover or focus it to see what the field
// does. Pure CSS/HTML (native `title` attribute), no client JS needed, so
// it works inside Server Component forms.
export default function FieldLabel({
  htmlFor,
  children,
  hint,
}: {
  htmlFor: string;
  children: React.ReactNode;
  hint: string;
}) {
  return (
    <label htmlFor={htmlFor} className="flex items-center gap-1.5 text-[13px] font-semibold text-ink mb-1.5">
      {children}
      <span
        tabIndex={0}
        title={hint}
        aria-label={hint}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-slate-300 text-slate-400 text-[10px] font-bold cursor-help select-none hover:border-slate-500 hover:text-slate-600 focus:outline-none focus:border-slate-500"
      >
        ?
      </span>
    </label>
  );
}
