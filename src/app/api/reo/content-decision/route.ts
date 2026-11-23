import { NextRequest } from "next/server";
import { assessContent, type ReoInput } from "@/lib/elitze-reo";
import { STATELESS_EVALUATOR, readEvaluatorBody } from "@/lib/security/stateless-evaluator";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = readEvaluatorBody(await request.json());
    if (!body) return Response.json({ error: "invalid_reo_request" }, { status: 400 });
    return Response.json({ ...assessContent(body as unknown as ReoInput), ...STATELESS_EVALUATOR });
  } catch {
    return Response.json({ error: "invalid_reo_request" }, { status: 400 });
  }
}
