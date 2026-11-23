import { NextRequest } from "next/server";
import { evaluateTrustOwnership, type TrustOwnershipInput } from "@/lib/elitze-reo/trust-ownership";
import { STATELESS_EVALUATOR, readEvaluatorBody } from "@/lib/security/stateless-evaluator";

export const dynamic="force-dynamic";
export const runtime="nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = readEvaluatorBody(await request.json());
    if (!body || typeof body.contentId !== "string") {
      return Response.json({error:"invalid_trust_ownership_request"},{status:400});
    }
    return Response.json({ ...evaluateTrustOwnership(body as unknown as TrustOwnershipInput), ...STATELESS_EVALUATOR });
  } catch {
    return Response.json({error:"invalid_trust_ownership_request"},{status:400});
  }
}
