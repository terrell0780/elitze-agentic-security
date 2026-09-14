import { NextResponse } from "next/server";
import { authenticateSource, assertRequestSize, ingestEvents } from "@/lib/elitze-secure/data-bridge";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    assertRequestSize(request);
    const source = await authenticateSource(request);
    if (!source) return NextResponse.json({ ok: false, error: "unauthorized_source" }, { status: 401 });
    const body = await request.json();
    const result = await ingestEvents(source, body);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "data_bridge_ingest_failed";
    const status = message === "request_too_large" ? 413 : message.startsWith("invalid_bridge_payload") || message === "invalid_observed_at" ? 400 : 503;
    return NextResponse.json({ ok: false, error: status === 400 || status === 413 ? message : "data_bridge_ingest_failed" }, { status });
  }
}
