export type Decision = "APPROVE" | "REVIEW" | "QUEUE" | "BLOCK";
export type EvidenceState = "OBSERVED" | "INFERRED" | "UNKNOWN" | "UNMEASURABLE";

export interface PolicyFailure {
  policyId: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  reason: string;
  hardGate: boolean;
}

export interface SecurityDecision {
  subjectId: string;
  subjectType: "CONTENT" | "AGENT_ACTION" | "TOOL_CALL" | "MCP_CALL" | "DEPLOYMENT";
  decision: Decision;
  trustScore: number | null;
  hardPolicyFailures: PolicyFailure[];
  evidenceState: EvidenceState;
  observedAt: string;
  auditEventId: string;
}

export function enforceHardGates(input: Omit<SecurityDecision, "decision">): SecurityDecision {
  const hardFailure = input.hardPolicyFailures.some(f => f.hardGate);
  const decision: Decision = hardFailure
    ? "BLOCK"
    : input.evidenceState === "UNKNOWN" || input.evidenceState === "UNMEASURABLE"
      ? "REVIEW"
      : "APPROVE";
  return { ...input, decision };
}