import { NextRequest, NextResponse } from "next/server";
import { getBuiltInDataBridgeConnectors, validateConnectorManifest } from "@/lib/elitze-secure/data-bridge-adapter";
import { getProductionIntegrationConnectors } from "@/lib/elitze-secure/production-integrations";
import { authorizeInternalRequest } from "@/lib/security/policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!authorizeInternalRequest(request.headers.get("x-elitze-api-key"), process.env.ELITZE_INTERNAL_API_KEY)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const connectors = [...getBuiltInDataBridgeConnectors(), ...getProductionIntegrationConnectors()].map((connector) =>
    validateConnectorManifest(connector),
  );

  return NextResponse.json({ ok: true, connectors });
}
