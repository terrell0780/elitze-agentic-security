import { createMythosAgent } from "@/lib/elitze-secure/mythos-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
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
