import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { enforcementEvents } from "@/db/schema";
import { authorizeInternalRequest } from "@/lib/security/policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY_BYTES = 32 * 1024;
const MAX_SCOPE_LENGTH = 200;
const MAX_REASON_LENGTH = 2000;

export async function POST(request: NextRequest) {
  if (!authorizeInternalRequest(request.headers.get("x-elitze-api-key"), process.env.ELITZE_INTERNAL_API_KEY)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "request_too_large" }, { status: 413 });
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
    typeof scope !== "string" || scope.trim() === "" || scope.length > MAX_SCOPE_LENGTH ||
    typeof reason !== "string" || reason.trim() === "" || reason.length > MAX_REASON_LENGTH
  ) {
    return NextResponse.json({ error: "scope_and_reason_required" }, { status: 400 });
  }

  const requestedAt = new Date().toISOString();
  try {
    await getDb().insert(enforcementEvents).values({
      agentSlug: scope.slice(0, 160),
      eventType: "killswitch_requested",
      severity: "critical",
      summary: reason,
      intentMismatch: false,
      latencyMs: 0,
    });
  } catch (error) {
    console.error("ELITZE kill-switch persistence failed", error);
    return NextResponse.json({ error: "containment_request_persistence_failed" }, { status: 503 });
  }

  const executorUrl = process.env.ELITZE_CONTAINMENT_EXECUTOR_URL?.trim();
  if (!executorUrl) {
    return NextResponse.json(
      {
        status: "recorded",
        scope,
        requested_at: requestedAt,
        executor: "not_configured",
        error: "containment_executor_not_configured",
      },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    const executorKey = process.env.ELITZE_CONTAINMENT_EXECUTOR_KEY?.trim();
    if (executorKey) headers["Authorization"] = `Bearer ${executorKey}`;

    const response = await fetch(executorUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ scope, reason, requestedAt }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error("ELITZE containment executor rejected request", response.status);
      return NextResponse.json(
        { status: "recorded", scope, requested_at: requestedAt, executor: "rejected", error: "containment_executor_rejected" },
        { status: 502, headers: { "cache-control": "no-store" } },
      );
    }
  } catch (error) {
    console.error("ELITZE containment executor unavailable", error);
    return NextResponse.json(
      { status: "recorded", scope, requested_at: requestedAt, executor: "unavailable", error: "containment_executor_unavailable" },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }

  return NextResponse.json(
    { status: "executed", scope, requested_at: requestedAt },
    { headers: { "cache-control": "no-store" } },
  );
}
