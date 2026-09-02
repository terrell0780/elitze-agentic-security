import { NextRequest } from "next/server";
import { evaluateGatewayRequest } from "@/lib/elitze-secure/gateway";

export async function POST(request: NextRequest) {
  return Response.json(evaluateGatewayRequest(await request.json()));
}
