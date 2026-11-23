import { NextRequest } from "next/server";
import { prioritizeExposure } from "@/lib/elitze-secure/exposure";
import { STATELESS_EVALUATOR, readEvaluatorBody } from "@/lib/security/stateless-evaluator";

export async function POST(request: NextRequest) {
  const body = readEvaluatorBody(await request.json().catch(() => null));
  if (!body) return Response.json({ error: "invalid_request_body" }, { status: 400 });
  const result = prioritizeExposure(body as unknown as Parameters<typeof prioritizeExposure>[0]);
  return Response.json({ ...result, ...STATELESS_EVALUATOR });
}
