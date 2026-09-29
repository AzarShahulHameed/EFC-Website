import { cookies } from "next/headers";

export const SESSION_COOKIE = "sv_token";
export const REFRESH_COOKIE = "sv_refresh";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export function getToken(): string | undefined {
  return cookies().get(SESSION_COOKIE)?.value;
}

// Fetch helper for everything under /admin — attaches the bearer token and
// never caches (dashboard data should always be fresh).
export async function adminFetch(path: string, init: RequestInit = {}) {
  const token = getToken();
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });
}
