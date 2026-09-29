// A small, self-contained set of 24x24 stroke icons for the admin
// sidebar/topbar — deliberately not an npm dependency (one more package to
// pin/audit for a couple dozen glyphs), just plain inline SVG path data in
// one place so every nav item gets a consistent icon instead of the plain
// text-only list this sidebar used to be.
const PATHS: Record<string, string> = {
  dashboard: "M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6V11h-6v9zm0-16v5h6V4h-6z",
  content: "M6 4h9l3 3v13H6V4z M15 4v3h3 M9 12h6 M9 16h6",
  builder: "M4 5h16v3H4z M4 11h7v8H4z M13 11h7v8h-7z",
  services: "M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.4 7.2 17.9l.9-5.4-3.9-3.8 5.4-.8L12 3z",
  team: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5 M17 8a2.5 2.5 0 1 1 0 5 M16 20c0-2.6 1.8-4.6 4-5.3",
  testimonials: "M5 6h14v9H9l-4 3.5V15H5V6z",
  logos: "M4 5h16v14H4z M4 15l4-4 3 3 5-5 4 4",
  freezone: "M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z M9 12l2 2 4-4",
  insights: "M6 4h9l3 3v13H6V4z M15 4v3h3 M9 12h2 M9 16h6 M13 12h3",
  newsletter: "M3 6h18v12H3z M3 6l9 7 9-7",
  branches: "M12 3a5 5 0 0 1 5 5c0 4-5 10-5 10S7 12 7 8a5 5 0 0 1 5-5z M12 10.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  careers: "M4 8h16v11H4z M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2 M4 13h16",
  settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M19.4 13.5a7.6 7.6 0 0 0 .1-1.5 7.6 7.6 0 0 0-.1-1.5l2-1.6-2-3.4-2.4 1a7.7 7.7 0 0 0-2.6-1.5L14 2h-4l-.4 2.5a7.7 7.7 0 0 0-2.6 1.5l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 0 0 0 3l-2 1.6 2 3.4 2.4-1c.8.6 1.7 1.1 2.6 1.5L10 22h4l.4-2.5c.9-.4 1.8-.9 2.6-1.5l2.4 1 2-3.4-2-1.6z",
  headerFooter: "M4 4h16v4H4z M4 16h16v4H4z M4 10h16v4H4z",
  legal: "M12 3l8 3.5V11c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6.5L12 3z M9 12l2 2 4-4.5",
  seo: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M21 21l-4.3-4.3",
  languages: "M4 5h9 M8 3v2 M6 5c0 4 2 7 5 8.5 M12 5c-1 3.5-3.5 6-7 7.5 M13 21l4-9 4 9 M14.5 18h5",
  messages: "M4 4h16v11H8l-4 4V4z",
  theme: "M12 3a9 9 0 1 0 0 18c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2H17a4 4 0 0 0 4-4c0-4.4-4-7.4-9-7.4z M7.5 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M9.5 8.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M14.5 8.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M16.5 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
  auditLog: "M6 3h9l3 3v15H6V3z M15 3v3h3 M9 11h6 M9 15h6",
  analytics: "M4 20V10 M10 20V4 M16 20v-7 M22 20H2",
  leads: "M3 5h18v3H3z M5 8v11h14V8 M9 12h6",
  chatbot: "M5 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 4v-4H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M9 10h.01 M12 10h.01 M15 10h.01",
  security: "M12 3l8 3.5V11c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6.5L12 3z M12 8v4 M12 15.5h.01",
  users: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5 M17.5 6.5l1.2 1.2 2.3-2.3",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M21 21l-4.3-4.3",
  bell: "M5 8C5 5.2 7.2 3 10 3C12.8 3 15 5.2 15 8V11.5L16.5 14H3.5L5 11.5V8Z M8 16.5C8.3 17.3 9.1 18 10 18C10.9 18 11.7 17.3 12 16.5",
  logout: "M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4 M16 15l4-4-4-4 M20 11H9",
  profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 20c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5",
  sun: "M12 4V2 M12 22v-2 M4 12H2 M22 12h-2 M6.3 6.3 4.9 4.9 M19.1 19.1l-1.4-1.4 M6.3 17.7l-1.4 1.4 M19.1 4.9l-1.4 1.4",
  moon: "M20 13.5A8.5 8.5 0 1 1 10.5 4a7 7 0 0 0 9.5 9.5z",
  mail: "M3 5h18v14H3z M3 5l9 8 9-8",
  cloud: "M7 18a4.5 4.5 0 0 1-.6-8.96A5.5 5.5 0 0 1 17 8.5a4 4 0 0 1 .5 7.97 M7 18h10",
  film: "M4 5h16v14H4z M4 9h3 M4 15h3 M17 9h3 M17 15h3 M9 5v14 M15 5v14",
  sparkle: "M12 3l1.8 4.9L18.7 9.7 13.8 11.5 12 16.4 10.2 11.5 5.3 9.7 10.2 7.9z M19 15l0.7 1.9L21.6 17.6 19.7 18.3 19 20.2 18.3 18.3 16.4 17.6 18.3 16.9z M5 15l0.6 1.6L7.2 17.2 5.6 17.8 5 19.4 4.4 17.8 2.8 17.2 4.4 16.6z",
};

export default function AdminIcon({
  name,
  className = "w-[17px] h-[17px]",
}: {
  name: keyof typeof PATHS;
  className?: string;
}) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      {name === "sun" ? <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" /> : null}
      <path d={d} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
