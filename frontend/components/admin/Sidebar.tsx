"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/admin-actions";
import AdminIcon from "./AdminIcon";

// `href: null` means the screen isn't built yet — shown but not clickable,
// so the sidebar honestly reflects what's wired up vs. still a mockup.
const navGroups = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/admin", icon: "dashboard" }],
  },
  {
    label: "Website Content",
    items: [
      { label: "Pages & Content", href: "/admin/content", icon: "content" },
      { label: "Page Builder", href: "/admin/builder", icon: "builder" },
      { label: "Services", href: "/admin/services", icon: "services" },
      { label: "Team", href: "/admin/team", icon: "team" },
      { label: "Testimonials", href: "/admin/testimonials", icon: "testimonials" },
      { label: "Client Logos", href: "/admin/client-logos", icon: "logos" },
      { label: "Freezone Approvals", href: "/admin/freezone", icon: "freezone" },
      { label: "Insights & Blog", href: "/admin/insights", icon: "insights" },
      { label: "Newsletter", href: "/admin/newsletter", icon: "newsletter" },
      { label: "Branches & Locations", href: "/admin/branches", icon: "branches" },
      { label: "Careers", href: "/admin/careers", icon: "careers" },
      { label: "Landing Animation", href: "/admin/landing-animation", icon: "film" },
      { label: "Scroll & Motion", href: "/admin/scroll-motion", icon: "sparkle" },
    ],
  },
  {
    label: "Site Structure",
    items: [
      { label: "Site Settings", href: "/admin/site-settings", icon: "settings" },
      { label: "Header & Footer", href: "/admin/header-footer", icon: "headerFooter" },
      { label: "UI Text", href: "/admin/ui-text", icon: "messages" },
      { label: "Legal Pages", href: "/admin/legal", icon: "legal" },
      { label: "SEO & Schema", href: "/admin/seo", icon: "seo" },
      { label: "Languages", href: "/admin/languages", icon: "languages" },
      { label: "System Messages", href: "/admin/messages", icon: "messages" },
      { label: "Theme Builder", href: "/admin/theme", icon: "theme" },
      { label: "Audit Log", href: "/admin/audit-log", icon: "auditLog" },
      { label: "Email Settings", href: "/admin/email-settings", icon: "mail" },
      { label: "Cloudinary Settings", href: "/admin/cloudinary-settings", icon: "cloud" },
      { label: "Translate Settings", href: "/admin/translate-settings", icon: "languages" },
    ],
  },
  {
    label: "Growth",
    items: [
      { label: "Analytics", href: "/admin/analytics", icon: "analytics" },
      { label: "Leads (CRM)", href: "/admin/leads", icon: "leads" },
      { label: "Chatbot", href: "/admin/chatbot", icon: "chatbot" },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "My Profile", href: "/admin/profile", icon: "profile" },
      { label: "Security", href: "/admin/security", icon: "security" },
    ],
  },
];

// Only Super Admins get the Users & Roles link — the page itself also
// checks this server-side (see app/admin/(dashboard)/users/page.tsx), so
// hiding it here is a UX nicety, not the actual access control.
const SUPER_ADMIN_ONLY_ITEM = { label: "Users & Roles", href: "/admin/users", icon: "users" };

function initials(name?: string | null) {
  if (!name) return "A";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "A";
}

// A single, fixed-in-place sidebar. It's rendered exactly once, from
// app/admin/(dashboard)/layout.tsx — if you ever see it twice on screen,
// that's not this component being mounted twice (see the README's
// "double sidebar" note for how to check what actually is happening).
export default function Sidebar({
  companyName,
  logoUrl,
  logoHeight = 32,
  role,
  userName,
  photoUrl,
}: {
  companyName: string;
  logoUrl?: string | null;
  // Admin → Site Settings → Logo Sizing → "Admin Sidebar Logo Height" — was
  // a fixed 24px (h-6) with no way to change it.
  logoHeight?: number;
  role?: string;
  userName?: string | null;
  photoUrl?: string | null;
}) {
  const pathname = usePathname();

  const groups =
    role === "SUPER_ADMIN"
      ? navGroups.map((group) =>
          group.label === "Account" ? { ...group, items: [...group.items, SUPER_ADMIN_ONLY_ITEM] } : group,
        )
      : navGroups;

  return (
    <aside className="w-64 flex-shrink-0 bg-navy flex flex-col h-screen border-r border-black/20">
      {/* `justify-center` (not the old left-aligned row) so the logo+name
          lockup sits centered in the sidebar's width, the way a sidebar
          "brand" block usually does, rather than hugging the left edge. */}
      <div className="flex items-center justify-center gap-2.5 px-5 pt-6 pb-5 flex-shrink-0 min-w-0">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt={companyName} style={{ height: logoHeight }} className="w-auto max-w-[140px] object-contain flex-shrink-0" />
        ) : (
          <svg width="22" height="22" viewBox="0 0 30 30" fill="none" aria-hidden="true" className="flex-shrink-0">
            <path d="M15 2L27 8V15C27 21.5 21.8 26.8 15 28C8.2 26.8 3 21.5 3 15V8L15 2Z" stroke="#BF9B4A" strokeWidth="1.8" />
            <path d="M9.5 15.3L13 18.8L20.5 11.2" stroke="#BF9B4A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        <span className="font-serif text-[15.5px] font-bold text-[#F5F3EC] truncate tracking-[-0.01em]">{companyName}</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3.5 pb-4 flex flex-col gap-0.5">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="text-[10.5px] font-bold tracking-[0.12em] text-slate-500 uppercase px-2.5 pt-4 pb-1.5">
              {group.label}
            </div>
            {group.items.map((item) => {
              const isActive = item.href && (pathname === item.href || pathname.startsWith(item.href + "/"));
              if (!item.href) {
                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-2.5 px-2.5 py-2.5 rounded-md text-[13px] font-medium text-slate-600 cursor-not-allowed"
                  >
                    <span className="flex items-center gap-2.5">
                      <AdminIcon name={item.icon as any} className="w-[16px] h-[16px] opacity-50" />
                      {item.label}
                    </span>
                    <span className="text-[9.5px] font-semibold text-slate-500 border border-slate-700 px-1.5 py-0.5 rounded">
                      Soon
                    </span>
                  </div>
                );
              }
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`group flex items-center gap-2.5 px-2.5 py-2.5 rounded-md text-[13px] font-medium transition-colors ${
                    isActive
                      ? "bg-gold/[0.14] text-[#F2E9D2] font-semibold ring-1 ring-inset ring-gold/25"
                      : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  <AdminIcon
                    name={item.icon as any}
                    className={`w-[16px] h-[16px] flex-shrink-0 ${isActive ? "text-gold" : "text-slate-500 group-hover:text-slate-300"}`}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="flex-shrink-0 px-3.5 py-3.5 border-t border-white/10 flex items-center justify-between gap-2">
        <Link href="/admin/profile" className="flex items-center gap-2.5 min-w-0 group">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt={userName || "Profile"}
              className="w-8 h-8 rounded-full object-cover flex-shrink-0 ring-1 ring-white/10"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-navy-2 flex items-center justify-center text-xs font-bold text-gold flex-shrink-0">
              {initials(userName)}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-[#F2E9D2] truncate group-hover:underline">
              {userName || "Admin"}
            </div>
            <div className="text-[11px] text-slate-500">Signed in</div>
          </div>
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            aria-label="Log out"
            title="Log out"
            className="text-slate-400 hover:text-slate-100 p-1.5 rounded hover:bg-white/[0.06] flex-shrink-0"
          >
            <AdminIcon name="logout" className="w-[16px] h-[16px]" />
          </button>
        </form>
      </div>
    </aside>
  );
}
