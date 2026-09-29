// Shared success/error banner for admin pages. Every create/update/toggle/
// delete action in lib/admin-actions.ts redirects back to its list (or edit)
// page with `?saved=...` on success or `?error=...` on failure — this is
// the one place that turns those query params into something the admin
// actually sees. Before this component existed, more than a dozen admin
// pages accepted no `searchParams` at all, so those redirects were silently
// dropped and saving/toggling/deleting something gave no feedback whatsoever.
export default function Banner({
  searchParams,
  savedMessage,
}: {
  searchParams?: { saved?: string; error?: string };
  /** Override the default "Saved." wording, e.g. to name what was saved. */
  savedMessage?: string;
}) {
  if (!searchParams?.saved && !searchParams?.error) return null;

  if (searchParams.error) {
    return (
      <div className="bg-red-50 border border-red-200 px-5 py-3 mb-6 text-[13.5px] text-red-800 max-w-2xl">
        {decodeURIComponent(searchParams.error)}
      </div>
    );
  }

  const label = searchParams.saved && searchParams.saved !== "1" ? decodeURIComponent(searchParams.saved) : null;

  return (
    <div className="bg-green-50 border border-green-200 px-5 py-3 mb-6 text-[13.5px] text-green-800 max-w-2xl">
      {label ? `Saved "${label}".` : savedMessage ?? "Saved."}
    </div>
  );
}
