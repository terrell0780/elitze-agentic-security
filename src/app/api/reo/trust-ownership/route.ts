import { NextRequest } from "next/server";
import { evaluateTrustOwnership, type TrustOwnershipInput } from "@/lib/elitze-reo/trust-ownership";

export const dynamic="force-dynamic";
export const runtime="nodejs";

export async function POST(request: NextRequest) {
  try {
    const input=(await request.json()) as TrustOwnershipInput;
    if (!input || typeof input.contentId !== "string") {
      return Response.json({error:"invalid_trust_ownership_request"},{status:400});
    }
    return Response.json(evaluateTrustOwnership(input));
  } catch {
    return Response.json({error:"invalid_trust_ownership_request"},{status:400});
  }
}
