import { NextRequest } from "next/server";
import { createMythosAgent } from "@/lib/elitze-secure/mythos-agent";
import { authorizeInternalRequest } from "@/lib/security/policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!authorizeInternalRequest(request.headers.get("x-elitze-api-key"), process.env.ELITZE_INTERNAL_API_KEY)) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401, headers: { "cache-control": "no-store" } });
  }
  const status = createMythosAgent().defenseStatus();
  return Response.json(
    {
      ok: true,
      product: "ELITZE",
      controlPlane: "Mythos Defense Fabric",
      status,
      truth: "Only CONNECTED adapters are treated as connected telemetry or execution paths; unconfigured systems are never presented as live.",
    },
    { headers: { "cache-control": "no-store" } },
  );
}
