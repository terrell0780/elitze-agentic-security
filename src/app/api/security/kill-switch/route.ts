import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { enforcementEvents } from "@/db/schema";
import { authorizeInternalRequest } from "@/lib/security/policy";

export async function POST(request: NextRequest) {
  if (
    !authorizeInternalRequest(
      request.headers.get("x-elitze-api-key"),
      process.env.ELITZE_INTERNAL_API_KEY,
    )
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { scope, reason } = body as { scope?: unknown; reason?: unknown };
  if (
    typeof scope !== "string" ||
    scope.trim() === "" ||
    scope.length > 200 ||
    typeof reason !== "string" ||
    reason.trim() === "" ||
    reason.length > 2000
  ) {
    return NextResponse.json({ error: "scope_and_reason_required" }, { status: 400 });
  }

  try {
    await db.insert(enforcementEvents).values({
      agentSlug: scope.slice(0, 160),
      eventType: "killswitch_requested",
      severity: "critical",
      summary: reason,
      intentMismatch: false,
      latencyMs: 0,
    });
  } catch (error) {
    console.error("ELITZE kill-switch request persistence failed", error);
    return NextResponse.json({ error: "containment_request_persistence_failed" }, { status: 503 });
  }

  return NextResponse.json(
    {
      status: "requested",
      scope,
      reason,
      requires_executor: true,
      note: "The API records a containment request. A separately authorized infrastructure executor must perform workload isolation and credential revocation.",
      requested_at: new Date().toISOString(),
    },
    { headers: { "cache-control": "no-store" } },
  );
}
