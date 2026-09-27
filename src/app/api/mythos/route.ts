import { NextRequest } from "next/server";
import { z } from "zod";
import { createMythosAgent, ELITZE_AGENT_ASSISTANT, ELITZE_AGENT_NAME } from "@/lib/elitze-secure/mythos-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const taskSchema = z.object({
  tenantId: z.string().min(1).max(200), actorId: z.string().min(1).max(200), agentId: z.string().min(1).max(200), objective: z.string().min(1).max(4000),
  type: z.enum(["THREAT_HUNT", "VULNERABILITY_ANALYSIS", "INCIDENT_RESPONSE", "OSINT", "CORPORATE_RESEARCH", "FRAUD_ANALYSIS", "MEMORY_CAPTURE", "REPORT_REVIEW"]),
  channel: z.enum(["LLM", "MCP", "A2A", "API", "BROWSER", "SAAS"]).optional(), toolId: z.string().max(200).optional(), mcpServerId: z.string().max(200).optional(),
  dataClassification: z.enum(["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"]).optional(), riskSignals: z.array(z.string().max(200)).max(50).optional(), evidenceIds: z.array(z.string().max(200)).max(100).optional(), requestedAction: z.string().max(500).optional(),
});
export async function GET() {
  const agent = createMythosAgent();
  return Response.json(
    {
      ok: true,
      product: "ELITZE Agentic Security",
      build: "Elitze-Agentic-Security",
      agent: ELITZE_AGENT_NAME,
      assistant: ELITZE_AGENT_ASSISTANT,
      status: agent.defenseStatus(),
      truthModel: ["OBSERVED", "INFERRED", "UNKNOWN", "UNMEASURABLE"],
    },
    { headers: { "cache-control": "no-store" } },
  );
}
export async function POST(request: NextRequest) {
  let input: unknown;
  try { input = await request.json(); } catch { return Response.json({ ok: false, error: "invalid_json" }, { status: 400 }); }
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) return Response.json({ ok: false, error: "invalid ELITZE agent task", issues: parsed.error.issues }, { status: 400, headers: { "cache-control": "no-store" } });
  try {
    const agent = createMythosAgent();
    const plan = await agent.plan(parsed.data);
    return Response.json({ ok: true, plan, defense: agent.defenseStatus(), agent: ELITZE_AGENT_NAME, assistant: ELITZE_AGENT_ASSISTANT }, { headers: { "cache-control": "no-store" } });
  }
  catch (error) {
    console.error("ELITZE agent enforcement failed", error);
    return Response.json({ ok: false, error: "security_enforcement_unavailable" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
