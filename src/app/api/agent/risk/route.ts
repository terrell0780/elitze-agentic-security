import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { evaluateAgentRisk } from "@/lib/elitze-secure/agent-risk";

const agentRiskSchema = z.object({
  autonomy: z.number().finite().min(0).max(100),
  privilege: z.number().finite().min(0).max(100),
  monitorability: z.number().finite().min(0).max(100),
  delegationDepth: z.number().finite().min(0).max(5),
  persistence: z.number().finite().min(0).max(100),
  dataSensitivity: z.number().finite().min(0).max(100),
}).strict();

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > 4096) {
    return NextResponse.json({ ok: false, error: "request_too_large" }, { status: 413 });
  }

  try {
    const parsed = agentRiskSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "invalid_agent_risk_input" }, { status: 400 });
    }

    const result = evaluateAgentRisk(parsed.data);
    return NextResponse.json(result, {
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_agent_risk_input" }, { status: 400 });
  }
}
