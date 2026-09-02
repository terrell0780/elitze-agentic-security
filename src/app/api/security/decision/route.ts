import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { securityDecisions } from "@/db/schema";
import { getDb } from "@/db";
import {
  authorizeInternalRequest,
  evaluatePolicy,
  isSecurityContext,
  type SecurityContext,
} from "@/lib/security/policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY_BYTES = 64 * 1024;

export async function POST(request: NextRequest) {
  if (!authorizeInternalRequest(request.headers.get("x-elitze-api-key"), process.env.ELITZE_INTERNAL_API_KEY)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "request_too_large" }, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!isSecurityContext(payload)) {
    return NextResponse.json({ error: "invalid_security_context" }, { status: 400 });
  }

  const context = payload as SecurityContext;
  const evaluation = evaluatePolicy(context);

  try {
    const database = getDb();
    await database
      .insert(securityDecisions)
      .values({
        requestHash: evaluation.requestHash,
        actorId: context.actorId,
        agentId: context.agentId,
        action: context.requestedAction,
        decision: evaluation.decision,
        reasons: evaluation.reasons,
        policyVersion: evaluation.policyVersion,
      })
      .onConflictDoNothing({ target: securityDecisions.requestHash });

    const persisted = await database
      .select()
      .from(securityDecisions)
      .where(eq(securityDecisions.requestHash, evaluation.requestHash))
      .limit(1);

    if (!persisted[0]) {
      return NextResponse.json({ error: "decision_persistence_failed" }, { status: 503 });
    }
  } catch (error) {
    console.error("ELITZE security decision persistence failed", error);
    return NextResponse.json({ error: "decision_persistence_failed" }, { status: 503 });
  }

  const status = evaluation.decision === "deny" ? 403 : evaluation.decision === "hitl" ? 202 : 200;
  return NextResponse.json(evaluation, {
    status,
    headers: { "cache-control": "no-store" },
  });
}
