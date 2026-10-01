"use client";

import { useEffect, useRef, useState } from "react";

// Shown INSTEAD OF the entire site — see the marketing layout, which
// renders only this component (no Header/Footer/page content at all) while
// lib/api.ts's isLaunchGateActive() is true. The gating decision itself is
// made server-side on every request (see the layout), so this component's
// only job is the ticking display and the reveal moment: when the
// countdown reaches zero, it plays the blossom-burst animation and then
// reloads the page so the server re-evaluates and serves the real site —
// there is nothing for this component to "reveal" into on its own, since
// the actual homepage was never sent to the browser in the first place.
type Props = {
  launchAt: string; // ISO datetime, or "" for an indefinite hold with no ticking clock
  crestLetter: string;
  logoUrl?: string;
  headline: string;
  subtext: string;
  backgroundColor: string;
  accentColor: string;
  petalColors: string[];
  enableBlossom: boolean;
};

function pad(n: number) {
  return String(Math.max(n, 0)).padStart(2, "0");
}

export default function LaunchGate({
  launchAt,
  crestLetter,
  logoUrl,
  headline,
  subtext,
  backgroundColor,
  accentColor,
  petalColors,
  enableBlossom,
}: Props) {
  const target = launchAt ? new Date(launchAt).getTime() : null;
  const [left, setLeft] = useState<number | null>(target ? target - Date.now() : null);
  const [reloading, setReloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    if (!target) return;
    // If the target is already in the past the moment this mounts, the
    // server should already have revealed the real site instead of sending
    // this component at all — the one legitimate way to land here anyway is
    // a leftover/cached HTML response from just before the launch moment.
    // Try ONE reload to pick up the server's now-current decision, but cap
    // it at one attempt (tracked in sessionStorage, which a real reload
    // doesn't clear) so a genuinely stuck config (e.g. an indefinite hold
    // with no launch time set) shows a static 00:00:00 instead of looping
    // reloads forever.
    if (target - Date.now() <= 0) {
      try {
        const key = "launchGateRetried";
        if (!sessionStorage.getItem(key)) {
          sessionStorage.setItem(key, "1");
          window.location.reload();
        }
      } catch {
        // sessionStorage unavailable (private mode, etc.) — just show the
        // static 00:00:00 rather than risk a reload loop with no way to cap it.
      }
      return;
    }
    const id = setInterval(() => {
      const remaining = target - Date.now();
      setLeft(remaining);
      if (remaining <= 0 && !firedRef.current) {
        firedRef.current = true;
        clearInterval(id);
        if (enableBlossom) burst();
        setTimeout(() => setReloading(true), enableBlossom ? 900 : 0);
        // The server is the source of truth for whether the gate is still
        // active — reloading re-runs that check instead of this component
        // guessing that "zero" means "launched".
        setTimeout(() => window.location.reload(), enableBlossom ? 2000 : 300);
      }
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  function burst() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const colors = petalColors.length > 0 ? petalColors : [accentColor];
    const cx = innerWidth / 2;
    const cy = innerHeight / 2;
    const particles = Array.from({ length: 90 }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 7;
      return {
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 0.3,
        size: 6 + Math.random() * 10,
        color: colors[i % colors.length],
        life: 1,
      };
    });

    let last = performance.now();
    function frame(now: number) {
      const dt = Math.min((now - last) / 1000, 0.033);
      last = now;
      ctx!.clearRect(0, 0, innerWidth, innerHeight);
      let alive = false;
      for (const p of particles) {
        if (p.life <= 0) continue;
        alive = true;
        p.vy += 9 * dt;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life -= dt * 0.45;
        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rot);
        ctx!.globalAlpha = Math.max(p.life, 0);
        ctx!.fillStyle = p.color;
        ctx!.beginPath();
        ctx!.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();
      }
      if (alive) requestAnimationFrame(frame);
      else ctx!.clearRect(0, 0, innerWidth, innerHeight);
    }
    requestAnimationFrame(frame);
  }

  const days = left !== null ? Math.floor(left / 86400000) : 0;
  const hours = left !== null ? Math.floor(left / 3600000) % 24 : 0;
  const mins = left !== null ? Math.floor(left / 60000) % 60 : 0;
  const secs = left !== null ? Math.floor(left / 1000) % 60 : 0;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden px-4"
      style={{ backgroundColor }}
      role="dialog"
      aria-modal="true"
      aria-label={headline}
    >
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" aria-hidden="true" />
      <div
        className="relative w-full max-w-xl text-center flex flex-col items-center gap-7 transition-opacity duration-1000"
        style={{ opacity: reloading ? 0 : 1 }}
      >
        <div className="flex flex-col items-center gap-2.5">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-12 max-w-[180px] object-contain" />
          ) : (
            <div
              className="w-12 h-12 rounded-full border flex items-center justify-center font-serif text-lg"
              style={{ borderColor: accentColor, color: accentColor }}
            >
              {crestLetter}
            </div>
          )}
        </div>

        <h1 className="font-serif italic text-white leading-snug" style={{ fontSize: "clamp(20px,3.6vw,30px)" }}>
          {headline}
        </h1>

        {target !== null ? (
          <div className="flex gap-3 sm:gap-5" aria-live="polite">
            {[
              { n: days, l: "Days" },
              { n: hours, l: "Hours" },
              { n: mins, l: "Mins" },
              { n: secs, l: "Secs" },
            ].map((u, i) => (
              <div key={u.l} className="flex items-start gap-3 sm:gap-5">
                {i > 0 ? <span className="font-serif text-white/20 text-2xl sm:text-4xl -mt-1">:</span> : null}
                <div className="flex flex-col items-center gap-1.5 min-w-[52px] sm:min-w-[64px]">
                  <div
                    className="font-serif tabular-nums leading-none"
                    style={{ color: accentColor, fontSize: "clamp(28px,7vw,48px)" }}
                  >
                    {pad(u.n)}
                  </div>
                  <div className="text-[10px] tracking-[0.24em] uppercase text-white/50">{u.l}</div>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {subtext ? <p className="text-[13px] text-white/55 max-w-sm leading-relaxed">{subtext}</p> : null}
      </div>
    </div>
  );
}
