import type { Metadata } from "next";

// Defense-in-depth: robots.txt already disallows /admin for well-behaved
// crawlers, but a noindex meta tag also stops the dashboard (or the login
// page) from ever being indexed if it's ever linked to from somewhere
// robots.txt doesn't cover, or by a crawler that ignores robots.txt.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  // Every admin screen (login, forgot/reset-password, and the whole
  // dashboard) is wrapped in `.admin-shell`, which redeclares the same
  // CSS custom properties the public site's Theme Builder controls
  // (--color-navy, --color-gold, --radius, ...) with fixed, professional
  // values scoped to this subtree (see the ".admin-shell" block in
  // globals.css). Without this, the admin dashboard's own look was at
  // the mercy of whatever brand color/radius an admin picked for the
  // *public* website in Theme Builder — a bold public brand color or a
  // "very rounded" corner radius meant for marketing pages had no
  // business also reskinning the login screen and every table/button in
  // the dashboard. CSS variables cascade to descendants, so this one
  // wrapper is enough to repoint every existing `bg-navy`/`text-gold`/
  // `rounded-[var(--radius)]` class already used throughout the admin
  // codebase — no need to touch each page individually.
  return <div className="admin-shell">{children}</div>;
}
