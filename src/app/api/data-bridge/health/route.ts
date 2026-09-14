import { NextRequest, NextResponse } from "next/server";
import { authorizeInternalRequest } from "@/lib/security/policy";
import { health } from "@/lib/elitze-secure/data-bridge";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!authorizeInternalRequest(request.headers.get("x-elitze-api-key"), process.env.ELITZE_INTERNAL_API_KEY)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const tenantId = request.nextUrl.searchParams.get("tenantId")?.trim() || undefined;
  try {
    return NextResponse.json({ ok: true, bridge: await health(tenantId) });
  } catch {
    return NextResponse.json({ ok: false, error: "data_bridge_unavailable" }, { status: 503 });
  }
}
