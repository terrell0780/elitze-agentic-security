import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ error: "not_found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
}

export function POST() {
  return NextResponse.json({ error: "not_found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
}
