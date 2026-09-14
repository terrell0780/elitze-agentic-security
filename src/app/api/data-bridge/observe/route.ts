import { NextRequest, NextResponse } from "next/server";
import { authorizeInternalRequest } from "@/lib/security/policy";
import { observeEvents } from "@/lib/elitze-secure/data-bridge";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!authorizeInternalRequest(request.headers.get("x-elitze-api-key"), process.env.ELITZE_INTERNAL_API_KEY)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const tenantId = request.nextUrl.searchParams.get("tenantId")?.trim();
  if (!tenantId) return NextResponse.json({ ok: false, error: "tenant_id_required" }, { status: 400 });
  const sourceId = request.nextUrl.searchParams.get("sourceId")?.trim() || undefined;
  const limitValue = Number(request.nextUrl.searchParams.get("limit") ?? 50);
  try {
    const signals = await observeEvents({ tenantId, sourceId, limit: Number.isFinite(limitValue) ? limitValue : 50 });
    return NextResponse.json({ ok: true, tenantId, count: signals.length, signals });
  } catch {
    return NextResponse.json({ ok: false, error: "data_bridge_observe_failed" }, { status: 503 });
  }
}
