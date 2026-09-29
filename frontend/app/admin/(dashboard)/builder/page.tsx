import Link from "next/link";
import { redirect } from "next/navigation";
import { adminFetch } from "@/lib/session";
import AddPageBlockPanel from "@/components/admin/AddPageBlockPanel";
import PageBlocksAdminList from "@/components/admin/PageBlocksAdminList";

// Same page-key set the frontend's <PageBlocks> slot is wired into (see
// app/[lang]/(marketing)/*/page.tsx) — a sub-service's own page also
// accepts blocks (via its composite `subservice::slug::slug` key) but
// isn't listed as a tab here since there can be dozens of them; an admin
// editing a specific sub-service can still reach its blocks by typing that
// key into the URL (?page=subservice::external-audit::financial-...) if
// ever needed, but the common case — the site's main pages — is one click.
const PAGES = [
  { key: "home", label: "Home" },
  { key: "about", label: "About" },
  { key: "services", label: "Services" },
  { key: "team", label: "Team" },
  { key: "careers", label: "Careers" },
  { key: "insights", label: "Insights" },
  { key: "contact", label: "Contact" },
  { key: "find-an-expert", label: "Find an Expert" },
];
const PAGE_KEYS = PAGES.map((p) => p.key);

export default async function AdminBuilderPage({
  searchParams,
}: {
  searchParams: { page?: string; saved?: string; error?: string };
}) {
  // Usually one of the tabs below, but a sub-service's edit page links here
  // with its own composite key (e.g. "subservice::external-audit::vat-
  // returns") — honor that directly rather than forcing it back to "home".
  const page = (searchParams.page ?? "home").trim() || "home";
  const res = await adminFetch(`/page-blocks/admin/all/${page}`);
  if (res.status === 401) redirect("/admin/login");
  const blocks: any[] = res.ok ? await res.json() : [];

  return (
    <div className="px-9 py-8">
      <h1 className="text-2xl font-bold text-ink mb-1">Page Builder</h1>
      <p className="text-[13.5px] text-slate-500 mb-5 max-w-2xl">
        Add your own content to any page — a photo, a video, a note, a call-to-action banner, a quote, a gallery —
        without asking for a new section to be built first. Drag the grip to reorder blocks; each one has its own
        entrance animation and can be hidden without deleting it.
      </p>

      <div className="flex flex-wrap gap-2 mb-7">
        {PAGES.map((p) => (
          <Link
            key={p.key}
            href={`/admin/builder?page=${p.key}`}
            className={`text-[13px] font-semibold px-4 py-2 rounded-full border ${
              p.key === page ? "bg-ink text-white border-ink" : "bg-white text-ink border-line"
            }`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {!PAGE_KEYS.includes(page) ? (
        <p className="text-[12.5px] text-slate-500 mb-4">
          Editing a sub-service's own page (<code>{page}</code>) — reachable from its Edit Sub-Service screen, not from
          the tabs above.
        </p>
      ) : null}

      <div className="flex flex-col gap-6 max-w-3xl">
        {blocks.length > 0 ? (
          <PageBlocksAdminList page={page} blocks={blocks} />
        ) : (
          <p className="text-[13.5px] text-slate-400">No blocks added to this page yet — add your first one below.</p>
        )}

        <AddPageBlockPanel page={page} />
      </div>
    </div>
  );
}
