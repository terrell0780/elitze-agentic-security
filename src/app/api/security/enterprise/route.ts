import { NextRequest } from "next/server";
import {
  calculateExposureScore,
  correlateEvents,
  enforceAIAction,
  identityRiskScore,
  responseGate,
} from "@/lib/elitze-secure/enterprise-controls";
import { STATELESS_EVALUATOR, readEvaluatorBody } from "@/lib/security/stateless-evaluator";

export async function POST(request: NextRequest) {
  const body = readEvaluatorBody(await request.json().catch(() => null));
  if (!body) return Response.json({ error: "invalid_request_body" }, { status: 400 });
  const input = body as Record<string, any>;
  const result: Record<string, unknown> = {};

  if (input.exposure) result.exposureScore = calculateExposureScore(input.exposure);
  if (Array.isArray(input.events)) result.detection = correlateEvents(input.events, input.ruleId || "unassigned");
  if (input.aiAction) result.aiDecision = enforceAIAction(input.aiAction);
  if (input.identity) result.identityRisk = identityRiskScore(input.identity);
  if (input.response) result.response = responseGate(input.response, input.approved === true);

  return Response.json({ ...result, ...STATELESS_EVALUATOR });
}
