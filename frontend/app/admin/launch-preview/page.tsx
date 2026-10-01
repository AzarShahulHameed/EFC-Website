import { redirect } from "next/navigation";
import { getToken, adminFetch } from "@/lib/session";
import { launchGateContent as defaultLaunchGate } from "@/lib/content";
import LaunchGate from "@/components/site/LaunchGate";

// Admin-only, unlisted preview of the launch countdown's CURRENT saved
// settings — regardless of whether the master switch on /admin/launch is
// actually turned on. This is the "see it before you flip it on for real
// visitors" screen: it lives under /admin/* (own auth check below, same
// presence-only pattern as the dashboard layout) so a logged-out visitor
// can never reach it, and it's deliberately a sibling of the (dashboard)
// route group rather than inside it, so it renders full-bleed with no
// sidebar/topbar chrome around it — exactly what a real visitor would see.
export default async function LaunchPreviewPage() {
  const token = getToken();
  if (!token) redirect("/admin/login");

  const res = await adminFetch("/content/global/en");
  if (res.status === 401) redirect("/admin/login");
  const content: any = res.ok ? await res.json() : {};
  const launch = { ...defaultLaunchGate, ...(content.launchGate ?? {}) };

  return (
    <div>
      <a
        href="/admin/launch"
        className="fixed top-3 left-3 z-[10000] bg-white/90 text-ink text-[12.5px] font-semibold px-3.5 py-2 rounded-[var(--radius)] shadow"
      >
        &larr; Back to Launch Countdown settings
      </a>
      <LaunchGate
        launchAt={launch.launchAt}
        crestLetter={launch.crestLetter}
        logoUrl={launch.logoUrl}
        headline={launch.headline}
        subtext={launch.subtext}
        backgroundColor={launch.backgroundColor}
        accentColor={launch.accentColor}
        petalColors={launch.petalColors}
        enableBlossom={launch.enableBlossom}
      />
    </div>
  );
}
