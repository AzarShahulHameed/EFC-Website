import NotificationsBell from "./NotificationsBell";
import AdminIcon from "./AdminIcon";

export default function Topbar() {
  return (
    <div className="flex-shrink-0 bg-white/90 backdrop-blur-sm border-b border-line px-9 py-4 flex items-center justify-between sticky top-0 z-30">
      <form action="/admin/search" method="GET" className="w-[360px] relative">
        <label htmlFor="admin-search" className="sr-only">
          Search content
        </label>
        <AdminIcon name="search" className="w-[15px] h-[15px] absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id="admin-search"
          name="q"
          type="search"
          placeholder="Search pages, services, leads…"
          className="w-full bg-slate-50 border border-line pl-9 pr-3.5 py-2.5 text-[13.5px] rounded-[var(--radius)] focus:bg-white transition-colors"
        />
      </form>
      <div className="flex items-center gap-4">
        <NotificationsBell />
        <div className="w-px h-6 bg-line" />
        <a
          href="/admin/services"
          className="bg-gold hover:bg-gold-light text-[#1A1204] font-semibold text-[13px] px-4.5 py-2.5 rounded-[var(--btn-radius)] shadow-sm transition-colors"
        >
          + New Service
        </a>
      </div>
    </div>
  );
}
