export interface AgentRiskInput {
  autonomy: number;
  privilege: number;
  monitorability: number;
  delegationDepth: number;
  persistence: number;
  dataSensitivity: number;
}

export interface AgentRiskResult {
  score: number;
  action: "ALLOW" | "REVIEW" | "RESTRICT" | "BLOCK";
}

const clamp = (value: number): number => Math.max(0, Math.min(100, value));

export function evaluateAgentRisk(x: AgentRiskInput): AgentRiskResult {
  const values = [
    x.autonomy,
    x.privilege,
    x.monitorability,
    x.delegationDepth,
    x.persistence,
    x.dataSensitivity,
  ];

  if (values.some((value) => !Number.isFinite(value))) {
    throw new TypeError("agent_risk_inputs_must_be_finite");
  }

  const exposure =
    clamp(x.autonomy) * 0.2 +
    clamp(x.privilege) * 0.2 +
    (100 - clamp(x.monitorability)) * 0.2 +
    clamp(x.delegationDepth * 20) * 0.15 +
    clamp(x.persistence) * 0.1 +
    clamp(x.dataSensitivity) * 0.15;

  const score = Math.round(exposure);
  return {
    score,
    action: score >= 85 ? "BLOCK" : score >= 65 ? "RESTRICT" : score >= 40 ? "REVIEW" : "ALLOW",
  };
}
