// Tiny, dependency-free User-Agent parser — just enough to bucket page
// views into "desktop/mobile/tablet" and a handful of common browser names
// for the Admin → Analytics breakdown. This is intentionally not a full UA
// database (ua-parser-js etc.) — the dashboard only ever shows coarse
// buckets, never the raw string, so a precise parse isn't worth the extra
// dependency.

export function parseDevice(userAgent: string | undefined): string {
  if (!userAgent) return 'Unknown';
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))/.test(ua)) return 'Tablet';
  if (/mobi|iphone|ipod|android/.test(ua)) return 'Mobile';
  return 'Desktop';
}

export function parseBrowser(userAgent: string | undefined): string {
  if (!userAgent) return 'Unknown';
  const ua = userAgent.toLowerCase();
  if (ua.includes('edg/')) return 'Edge';
  if (ua.includes('samsungbrowser')) return 'Samsung Internet';
  if (ua.includes('opr/') || ua.includes('opera')) return 'Opera';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('crios') || (ua.includes('chrome') && !ua.includes('chromium'))) return 'Chrome';
  if (ua.includes('fxios')) return 'Firefox';
  if (ua.includes('safari') && !ua.includes('chrome') && !ua.includes('crios')) return 'Safari';
  return 'Other';
}
