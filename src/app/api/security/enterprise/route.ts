import { NextRequest } from "next/server";
import {
  calculateExposureScore,
  correlateEvents,
  enforceAIAction,
  identityRiskScore,
  responseGate,
} from "@/lib/elitze-secure/enterprise-controls";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result: Record<string, unknown> = {};

  if (body.exposure) result.exposureScore = calculateExposureScore(body.exposure);
  if (Array.isArray(body.events)) result.detection = correlateEvents(body.events, body.ruleId || "unassigned");
  if (body.aiAction) result.aiDecision = enforceAIAction(body.aiAction);
  if (body.identity) result.identityRisk = identityRiskScore(body.identity);
  if (body.response) result.response = responseGate(body.response, body.approved === true);

  return Response.json(result);
}
