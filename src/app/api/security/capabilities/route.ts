import { ELITZE_CAPABILITY_REGISTRY, capabilitySummary } from "@/lib/elitze-secure/capability-registry";

export async function GET() {
  return Response.json({ summary: capabilitySummary(), capabilities: ELITZE_CAPABILITY_REGISTRY });
}
