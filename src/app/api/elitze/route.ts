import { NextRequest } from "next/server";
import { z } from "zod";
import { getPgPool } from "@/db";
import { assertSameOrigin, getCurrentUser } from "@/lib/auth";
import { createElitzeAgent, ELITZE_AGENT_ASSISTANT, ELITZE_AGENT_NAME } from "@/lib/elitze-secure/elitze-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const taskSchema = z.object({
  agentId: z.string().uuid(),
  objective: z.string().min(1).max(4000),
  type: z.enum(["THREAT_HUNT", "VULNERABILITY_ANALYSIS", "INCIDENT_RESPONSE", "OSINT", "CORPORATE_RESEARCH", "FRAUD_ANALYSIS", "MEMORY_CAPTURE", "REPORT_REVIEW"]),
  channel: z.enum(["LLM", "MCP", "A2A", "API", "BROWSER", "SAAS"]).optional(),
  toolId: z.string().max(200).optional(),
  mcpServerId: z.string().max(200).optional(),
  dataClassification: z.enum(["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"]).optional(),
  riskSignals: z.array(z.string().max(200)).max(50).optional(),
  evidenceIds: z.array(z.string().max(200)).max(100).optional(),
  requestedAction: z.string().max(500).optional(),
}).strict();

const privateHeaders = { "cache-control": "private, no-store" };

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401, headers: privateHeaders });
  }

  try {
    const agent = createElitzeAgent();
    return Response.json({
      ok: true,
      product: "ELITZE Agentic Security",
      build: "Elitze-Agentic-Security",
      agent: ELITZE_AGENT_NAME,
      assistant: ELITZE_AGENT_ASSISTANT,
      status: agent.defenseStatus(),
      truthModel: ["OBSERVED", "INFERRED", "UNKNOWN", "UNMEASURABLE"],
    }, { headers: privateHeaders });
  } catch (error) {
    console.error("ELITZE agent status failed", error);
    return Response.json({ ok: false, error: "security_enforcement_unavailable" }, { status: 503, headers: privateHeaders });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401, headers: privateHeaders });
  }
  if (!(await assertSameOrigin(request))) {
    return Response.json({ ok: false, error: "csrf_rejected" }, { status: 403, headers: privateHeaders });
  }

  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return Response.json({ ok: false, error: "invalid_json" }, { status: 400, headers: privateHeaders });
  }

  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "invalid ELITZE agent task", issues: parsed.error.issues },
      { status: 400, headers: privateHeaders },
    );
  }

  try {
    const identity = await getPgPool().query(
      "SELECT id FROM agent_identities WHERE id=$1::uuid AND tenant_id=$2::uuid AND kind='AGENT' AND active=true LIMIT 1",
      [parsed.data.agentId, user.tenantId],
    );
    if (!identity.rows[0]) {
      return Response.json({ ok: false, error: "agent_identity_unavailable" }, { status: 403, headers: privateHeaders });
    }

    // Tenant and human actor identity come from the authenticated session, never request JSON.
    const agent = createElitzeAgent();
    const plan = await agent.plan({
      ...parsed.data,
      tenantId: user.tenantId,
      actorId: user.id,
    });
    return Response.json({
      ok: true,
      plan,
      defense: agent.defenseStatus(),
      agent: ELITZE_AGENT_NAME,
      assistant: ELITZE_AGENT_ASSISTANT,
    }, { headers: privateHeaders });
  } catch (error) {
    console.error("ELITZE agent enforcement failed", error);
    return Response.json({ ok: false, error: "security_enforcement_unavailable" }, { status: 503, headers: privateHeaders });
  }
}
