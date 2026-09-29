import { NextResponse } from "next/server";
import { adminFetch } from "@/lib/session";

export async function GET() {
  const res = await adminFetch("/notifications/unread-count");
  if (!res.ok) return NextResponse.json(0, { status: res.status === 401 ? 401 : 200 });
  return NextResponse.json(await res.json());
}
