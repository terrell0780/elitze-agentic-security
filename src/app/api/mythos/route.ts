import { NextRequest } from "next/server";
import { z } from "zod";
import { createMythosAgent } from "@/lib/elitze-secure/mythos-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const taskSchema = z.object({
  tenantId: z.string().min(1),
  actorId: z.string().min(1),
  agentId: z.string().min(1),
  objective: z.string().min(1),
  type: z.enum([
    "THREAT_HUNT",
    "VULNERABILITY_ANALYSIS",
    "INCIDENT_RESPONSE",
    "OSINT",
    "CORPORATE_RESEARCH",
    "FRAUD_ANALYSIS",
    "MEMORY_CAPTURE",
    "REPORT_REVIEW",
  ]),
  channel: z.enum(["LLM", "MCP", "A2A", "API", "BROWSER", "SAAS"]).optional(),
  toolId: z.string().optional(),
  mcpServerId: z.string().optional(),
  dataClassification: z.enum(["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"]).optional(),
  riskSignals: z.array(z.string()).optional(),
  evidenceIds: z.array(z.string()).optional(),
  requestedAction: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const parsed = taskSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "invalid Mythos task", issues: parsed.error.issues },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }

  const plan = createMythosAgent().plan(parsed.data);
  return Response.json(
    { ok: true, plan },
    { headers: { "cache-control": "no-store" } },
  );
}
