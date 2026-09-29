// The gradient scrim laid over the hero's photo/video so light text stays
// readable. Shared between the public homepage and the admin HeroForm's
// live preview so they always render identically. `opacityPct` (0–100)
// scales three fixed base stops — 100 reproduces the original, always-dark
// look; lower values let more of the photo/video show through.
export function heroScrim(opacityPct: number): string {
  const pct = Math.min(100, Math.max(0, opacityPct)) / 100;
  const top = 0.95 * pct;
  const mid = 0.78 * pct;
  const bottom = 0.45 * pct;
  return `linear-gradient(to top, rgba(7,14,28,${top}) 0%, rgba(10,27,51,${mid}) 55%, rgba(10,27,51,${bottom}) 100%)`;
}
