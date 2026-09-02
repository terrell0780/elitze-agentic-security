import { NextRequest, NextResponse } from "next/server";
import { authorizeInternalRequest } from "@/lib/security/policy";

export async function POST(request: NextRequest) {
  if (!authorizeInternalRequest(request.headers.get("x-elitze-api-key"), process.env.ELITZE_INTERNAL_API_KEY)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { scope?: string; reason?: string } | null;
  if (!body?.scope || !body.reason) {
    return NextResponse.json({ error: "scope_and_reason_required" }, { status: 400 });
  }

  return NextResponse.json({
    status: "requested",
    scope: body.scope,
    reason: body.reason,
    requires_executor: true,
    note: "The API records an intent to contain. An infrastructure executor must perform the actual isolation/revocation action.",
    requested_at: new Date().toISOString(),
  }, { headers: { "cache-control": "no-store" } });
}
