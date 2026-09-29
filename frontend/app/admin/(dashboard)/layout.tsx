import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getToken, adminFetch } from "@/lib/session";
import { getSiteConfig } from "@/lib/api";
import { getTranslationStaleness } from "@/lib/admin-actions";
import Sidebar from "@/components/admin/Sidebar";
import Topbar from "@/components/admin/Topbar";
import Toast from "@/components/admin/Toast";
import UnsavedChangesGuard from "@/components/admin/UnsavedChangesGuard";
import TranslationStaleBanner from "@/components/admin/TranslationStaleBanner";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Presence-only check — a stale/expired cookie still gets past this,
  // but every adminFetch() call sends it to the API, which rejects an
  // invalid token with 401; each dashboard page redirects to /admin/login
  // on a 401 from its own fetch. See lib/session.ts and lib/admin-actions.ts.
  const token = getToken();
  if (!token) redirect("/admin/login");

  // The sidebar's brand name/logo previously read a hardcoded "Sterling &
  // Vance" placeholder regardless of what was set in Site Settings — the
  // public site already read this dynamically (see components/site/Header.tsx),
  // the admin shell just never did. Same source of truth for both now.
  const [siteConfig, meRes, translationStaleness] = await Promise.all([
    getSiteConfig(),
    adminFetch("/auth/me"),
    getTranslationStaleness(),
  ]);
  const me: any = meRes.ok ? await meRes.json() : null;

  // App-shell layout: the outer container is pinned to the viewport height
  // (h-screen, overflow-hidden) so nothing at this level scrolls. The
  // sidebar and topbar are fixed in place; only the content pane beneath
  // the topbar scrolls, and only vertically — overflow-x-hidden there
  // stops a wide table from ever widening the whole page sideways
  // (individual tables that need to scroll horizontally wrap themselves
  // in their own overflow-x-auto container instead).
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Reads success/error flags out of the URL and floats them as a
          dismissable toast (top-right, always visible) instead of every
          page rendering its own top-of-page banner an admin has to scroll
          up to see. Suspense is required here because it reads
          useSearchParams(), which opts this part of the tree into
          client-side-only rendering for that value. */}
      <Suspense fallback={null}>
        <Toast />
      </Suspense>
      <Sidebar
        companyName={siteConfig.name}
        logoUrl={siteConfig.logoUrl}
        logoHeight={siteConfig.logoSizing.adminSidebarHeight}
        role={me?.role}
        userName={me?.name}
        photoUrl={me?.photoUrl}
      />
      <div className="flex flex-col flex-1 min-w-0 h-screen">
        <TranslationStaleBanner count={translationStaleness.count} />
        <Topbar />
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* One consolidated Save button + a working "restore my unsaved
              changes" banner for every admin page that opts in (wraps its
              editable forms in `data-autosave-scope`) — see the component
              for the full rationale. Suspense is required here for the same
              reason as <Toast> above: it reads useSearchParams(). */}
          <Suspense fallback={children}>
            <UnsavedChangesGuard>{children}</UnsavedChangesGuard>
          </Suspense>
        </div>
      </div>
    </div>
  );
}
