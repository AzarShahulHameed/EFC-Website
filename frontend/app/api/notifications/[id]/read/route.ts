import { NextResponse } from "next/server";
import { adminFetch } from "@/lib/session";

export async function PATCH(_request: Request, { params }: { params: { id: string } }) {
  const res = await adminFetch(`/notifications/${params.id}/read`, { method: "PATCH" });
  return NextResponse.json(res.ok ? { read: true } : { read: false }, { status: res.ok ? 200 : res.status });
}
