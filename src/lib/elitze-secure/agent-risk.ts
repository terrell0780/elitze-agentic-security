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

const normalize = (value: number) => Math.max(0, Math.min(100, value));

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
    throw new Error("invalid_agent_risk_input");
  }

  const exposure =
    normalize(x.autonomy) * 0.2 +
    normalize(x.privilege) * 0.2 +
    (100 - normalize(x.monitorability)) * 0.2 +
    normalize(x.delegationDepth * 20) * 0.15 +
    normalize(x.persistence) * 0.1 +
    normalize(x.dataSensitivity) * 0.15;

  const score = Math.round(exposure);

  return {
    score,
    action:
      score >= 85
        ? "BLOCK"
        : score >= 65
          ? "RESTRICT"
          : score >= 40
            ? "REVIEW"
            : "ALLOW",
  };
}
