import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, locales } from "@/lib/i18n";

const ACCESS_COOKIE = "sv_token";
const REFRESH_COOKIE = "sv_refresh";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

// Decodes a JWT's payload without verifying its signature — only used
// here to read `exp` and decide whether a refresh is worth attempting.
// The API is still the one source of truth for whether a token is
// actually valid; this is purely an optimization to refresh proactively
// instead of waiting for a page to get a 401.
function decodeJwtExp(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const parsed = JSON.parse(json);
    return typeof parsed.exp === "number" ? parsed.exp : null;
  } catch {
    return null;
  }
}

// Runs on every /admin request (except /admin/login). If the access token
// is missing or expiring within 30s and a refresh token is present, calls
// POST /auth/refresh and writes the new tokens onto the response — this is
// the only place in a Next.js app that can set cookies outside a Server
// Action, so it has to happen here rather than in adminFetch().
async function maybeRefreshSession(request: NextRequest, response: NextResponse) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) return response;

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const exp = accessToken ? decodeJwtExp(accessToken) : null;
  const expiringSoon = !exp || exp * 1000 < Date.now() + 30_000;
  if (!expiringSoon) return response;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return response; // let the page-level 401 handling redirect to login

    const data = await res.json();
    const isProd = process.env.NODE_ENV === "production";

    response.cookies.set(ACCESS_COOKIE, data.accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: 60 * 60 * 12, // matches the API's default JWT_EXPIRES_IN — see auth.module.ts
    });
    response.cookies.set(REFRESH_COOKIE, data.refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  } catch {
    // API unreachable — fall through and let the page-level 401 handling
    // (or the existing, possibly-expired cookie) decide what happens next.
  }

  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    return maybeRefreshSession(request, NextResponse.next());
  }

  const isExempt =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    /\.(.*)$/.test(pathname); // static files (images, etc.)

  if (isExempt) return NextResponse.next();

  const hasLocale = locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (hasLocale) return NextResponse.next();

  // TODO: read the Accept-Language header here to pick a smarter default
  // than `defaultLocale` for first-time visitors.
  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
