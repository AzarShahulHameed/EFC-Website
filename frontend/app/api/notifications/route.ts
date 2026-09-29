import { NextRequest, NextResponse } from "next/server";
import { adminFetch } from "@/lib/session";

// A thin same-origin proxy in front of the API's /notifications — needed
// because the Topbar bell (a client component) polls this from the
// browser, and the admin session's JWT lives in an httpOnly cookie scoped
// to *this* Next.js origin. A direct browser fetch to the separate NestJS
// API origin would never carry that cookie; a Server Action can't run on
// an interval either. Routing through this Route Handler lets the client
// component call a same-origin path with ordinary cookies while the
// Authorization header still gets attached server-side via adminFetch.
export async function GET(request: NextRequest) {
  const limit = request.nextUrl.searchParams.get("limit") ?? "20";
  const res = await adminFetch(`/notifications?limit=${encodeURIComponent(limit)}`);
  if (!res.ok) return NextResponse.json([], { status: res.status === 401 ? 401 : 200 });
  return NextResponse.json(await res.json());
}
