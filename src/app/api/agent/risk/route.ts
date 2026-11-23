import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { evaluateAgentRisk } from "@/lib/elitze-secure/agent-risk";
import { STATELESS_EVALUATOR } from "@/lib/security/stateless-evaluator";

const schema = z.object({
  autonomy: z.number().finite(),
  privilege: z.number().finite(),
  monitorability: z.number().finite(),
  delegationDepth: z.number().finite(),
  persistence: z.number().finite(),
  dataSensitivity: z.number().finite(),
});

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_agent_risk_input" },
      { status: 400 },
    );
  }

  try {
    return NextResponse.json({
      ok: true,
      result: evaluateAgentRisk(parsed.data),
      ...STATELESS_EVALUATOR,
    });
  } catch (error) {
    console.error("ELITZE agent risk evaluation failed", error);
    return NextResponse.json(
      { ok: false, error: "agent_risk_evaluation_failed" },
      { status: 400 },
    );
  }
}
