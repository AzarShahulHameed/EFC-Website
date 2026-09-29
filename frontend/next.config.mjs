/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Every backend fetch in lib/api.ts now aborts after 8s and falls back to
  // placeholder content on failure, so a slow/unreachable API can no longer
  // hang a page's data collection indefinitely. This is just extra headroom
  // on top of that real fix, for a page that legitimately makes several
  // sequential (not just parallel) API calls — the default 60s was already
  // enough in practice, this just leaves more margin.
  staticPageGenerationTimeout: 120,
};

export default nextConfig;
