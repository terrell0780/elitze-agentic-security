import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { securityDecisions } from "@/db/schema";
import {
  authorizeInternalRequest,
  evaluatePolicy,
  type SecurityContext,
} from "@/lib/security/policy";

export async function POST(request: NextRequest) {
  if (
    !authorizeInternalRequest(
      request.headers.get("x-elitze-api-key"),
      process.env.ELITZE_INTERNAL_API_KEY,
    )
  ) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let context: SecurityContext;
  try {
    context = (await request.json()) as SecurityContext;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const evaluation = evaluatePolicy(context);

  try {
    await db.insert(securityDecisions).values({
      requestHash: evaluation.requestHash,
      actorId: context.actorId,
      agentId: context.agentId,
      action: context.requestedAction,
      decision: evaluation.decision,
      reasons: evaluation.reasons,
      policyVersion: evaluation.policyVersion,
    });
  } catch (error) {
    console.error("ELITZE security decision persistence failed", error);
    return NextResponse.json({ error: "decision_persistence_failed" }, { status: 503 });
  }

  return NextResponse.json(evaluation, {
    status: evaluation.decision === "deny" ? 403 : 200,
    headers: { "cache-control": "no-store" },
  });
}
