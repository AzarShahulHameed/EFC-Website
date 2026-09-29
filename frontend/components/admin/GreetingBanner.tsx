"use client";

import { useEffect, useState } from "react";

type Period = "morning" | "afternoon" | "evening" | "night";

function periodFor(hour: number): Period {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 20) return "evening";
  return "night";
}

const COPY: Record<Period, { greeting: string; sub: string }> = {
  morning: { greeting: "Good morning", sub: "Here's what's happening across your site today." },
  afternoon: { greeting: "Good afternoon", sub: "Here's how things are looking so far today." },
  evening: { greeting: "Good evening", sub: "Here's a look at today before you wrap up." },
  night: { greeting: "Good evening", sub: "Everything's running — here's the latest, whenever you check in." },
};

// Reads the *visitor's* local clock (not the server's) via useEffect, so an
// admin in a different timezone from wherever this is hosted still gets
// "good morning" at their own morning — the same reasoning used elsewhere
// in this app for guessing a visitor's region from their timezone rather
// than trusting a server-side clock.
export default function GreetingBanner({ name }: { name?: string | null }) {
  const [period, setPeriod] = useState<Period | null>(null);
  const [timeLabel, setTimeLabel] = useState("");

  useEffect(() => {
    function tick() {
      const now = new Date();
      setPeriod(periodFor(now.getHours()));
      setTimeLabel(now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }));
    }
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  // Renders a static, period-less shell on the server / first paint so
  // there's no layout jump once the client clock kicks in a moment later.
  const p = period ?? "morning";
  const isNight = p === "night";
  const isDusk = p === "evening";

  const bg = isNight
    ? "linear-gradient(135deg, #0B1226 0%, #131E3B 55%, #1B2A4F 100%)"
    : isDusk
      ? "linear-gradient(135deg, #2B2350 0%, #6B3B5E 45%, #C97A5A 100%)"
      : p === "afternoon"
        ? "linear-gradient(135deg, #2E6FA8 0%, #4E9BD4 55%, #8FCBEA 100%)"
        : "linear-gradient(135deg, #2A5C8A 0%, #5B9BC9 50%, #F3C98A 100%)"; // morning

  return (
    <div
      className="relative overflow-hidden rounded-[var(--radius)] px-7 py-6 mb-7 text-white shadow-[var(--admin-shadow-md)]"
      style={{ background: bg }}
    >
      {/* Stars — night only */}
      {isNight ? (
        <div aria-hidden="true" className="absolute inset-0">
          {STAR_POSITIONS.map((s, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                top: s.top,
                left: s.left,
                width: s.size,
                height: s.size,
                opacity: 0.7,
                animation: `admin-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
              }}
            />
          ))}
        </div>
      ) : null}

      {/* Drifting clouds — day/dusk */}
      {!isNight ? (
        <div aria-hidden="true" className="absolute inset-0 overflow-hidden opacity-40">
          <CloudShape className="absolute top-4 left-[8%] w-20" style={{ animation: "admin-drift 38s linear infinite" }} />
          <CloudShape className="absolute top-10 left-[55%] w-14" style={{ animation: "admin-drift 52s linear infinite -14s" }} />
        </div>
      ) : null}

      {/* Sun / moon */}
      <div
        aria-hidden="true"
        className="absolute -right-4 -top-6 sm:right-6 sm:top-6"
        style={{ animation: "admin-float 6s ease-in-out infinite" }}
      >
        {isNight ? <MoonGlyph /> : <SunGlyph spinning={p === "morning" || p === "afternoon"} />}
      </div>

      <div className="relative">
        <h1 className="text-[22px] sm:text-[25px] font-bold leading-tight">
          {COPY[p].greeting}
          {name ? `, ${name.split(" ")[0]}` : ""}
          {isNight ? " 🌙" : isDusk ? " 🌇" : " ☀️"}
        </h1>
        <p className="text-[13.5px] text-white/80 mt-1.5 max-w-md">{COPY[p].sub}</p>
        {timeLabel ? <p className="text-[11.5px] text-white/50 mt-3 font-medium tracking-wide">{timeLabel}</p> : null}
      </div>
    </div>
  );
}

function SunGlyph({ spinning }: { spinning: boolean }) {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
      <circle cx="36" cy="36" r="14" fill="#FFE3A0" opacity="0.95" />
      <circle cx="36" cy="36" r="20" fill="#FFE3A0" opacity="0.18" />
      <g style={spinning ? { transformOrigin: "36px 36px", animation: "admin-spin-slow 40s linear infinite" } : undefined}>
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 360) / 8;
          return (
            <rect
              key={i}
              x="35"
              y="6"
              width="2"
              height="8"
              rx="1"
              fill="#FFE3A0"
              opacity="0.8"
              transform={`rotate(${angle} 36 36)`}
            />
          );
        })}
      </g>
    </svg>
  );
}

function MoonGlyph() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="32" r="16" fill="#E9EEFB" opacity="0.16" />
      <path
        d="M40 18a14 14 0 1 0 6 22.4A11.6 11.6 0 0 1 40 18z"
        fill="#EFE9D8"
        style={{ filter: "drop-shadow(0 0 10px rgba(239,233,216,0.35))" }}
      />
    </svg>
  );
}

function CloudShape({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 100 40" fill="white" className={className} style={style} aria-hidden="true">
      <ellipse cx="30" cy="24" rx="22" ry="14" />
      <ellipse cx="55" cy="18" rx="18" ry="13" />
      <ellipse cx="70" cy="26" rx="20" ry="12" />
    </svg>
  );
}

const STAR_POSITIONS = [
  { top: "14%", left: "12%", size: 2, duration: 3.2, delay: 0 },
  { top: "28%", left: "22%", size: 1.5, duration: 4, delay: 0.6 },
  { top: "10%", left: "38%", size: 2, duration: 2.8, delay: 1.1 },
  { top: "40%", left: "48%", size: 1.5, duration: 3.6, delay: 0.3 },
  { top: "18%", left: "62%", size: 2, duration: 3, delay: 1.4 },
  { top: "35%", left: "72%", size: 1.5, duration: 4.2, delay: 0.8 },
  { top: "12%", left: "82%", size: 2, duration: 3.4, delay: 0.2 },
  { top: "50%", left: "30%", size: 1.5, duration: 3.8, delay: 1.7 },
];
