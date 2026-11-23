import { NextRequest } from "next/server";
import { continuouslyAuthorize, type ActionAuthorization } from "@/lib/elitze-secure/continuous-identity";
import { STATELESS_EVALUATOR, readEvaluatorBody } from "@/lib/security/stateless-evaluator";

export async function POST(request: NextRequest) {
  const body = readEvaluatorBody(await request.json().catch(() => null));
  if (!body) return Response.json({ error: "invalid_request_body" }, { status: 400 });
  return Response.json({ ...continuouslyAuthorize(body as unknown as ActionAuthorization), ...STATELESS_EVALUATOR });
}
