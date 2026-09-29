import { NextResponse } from "next/server";
import { adminFetch } from "@/lib/session";

export async function PATCH() {
  const res = await adminFetch("/notifications/mark-all-read", { method: "PATCH" });
  return NextResponse.json(res.ok ? { read: true } : { read: false }, { status: res.ok ? 200 : res.status });
}
