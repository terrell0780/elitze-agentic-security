import { NextRequest } from "next/server";
import { evaluateGatewayRequest, type GatewayRequest } from "@/lib/elitze-secure/gateway";
import { STATELESS_EVALUATOR, readEvaluatorBody } from "@/lib/security/stateless-evaluator";

export async function POST(request: NextRequest) {
  const body = readEvaluatorBody(await request.json().catch(() => null));
  if (!body) return Response.json({ error: "invalid_request_body" }, { status: 400 });
  return Response.json({ ...evaluateGatewayRequest(body as unknown as GatewayRequest), ...STATELESS_EVALUATOR });
}
