import { createHash, timingSafeEqual } from "node:crypto";

export type SecurityDecision = "allow" | "deny" | "quarantine" | "hitl";

export type SecurityContext = {
  actorId: string;
  actorType: "human" | "agent" | "service";
  agentId?: string;
  purpose?: string;
  requestedAction: string;
  resource?: string;
  dataClass?: "public" | "internal" | "confidential" | "restricted";
  irreversible?: boolean;
  externalSideEffect?: boolean;
  financial?: boolean;
  privileged?: boolean;
};

export type PolicyEvaluation = {
  decision: SecurityDecision;
  reasons: string[];
  policyVersion: string;
  evaluatedAt: string;
  requestHash: string;
};

export function evaluatePolicy(context: SecurityContext): PolicyEvaluation {
  const reasons: string[] = [];

  if (!context.actorId || !context.requestedAction) {
    reasons.push("missing_security_context");
  }

  if (context.actorType === "agent" && !context.agentId) {
    reasons.push("agent_identity_required");
  }

  if (context.actorType === "agent" && !context.purpose) {
    reasons.push("purpose_binding_required");
  }

  if (context.privileged && context.dataClass === "restricted") {
    reasons.push("restricted_privileged_action");
  }

  const highImpact = Boolean(
    context.irreversible || context.externalSideEffect || context.financial,
  );

  const decision: SecurityDecision = reasons.length
    ? "deny"
    : highImpact
      ? "hitl"
      : "allow";

  const normalized = JSON.stringify(context, Object.keys(context).sort());
  const requestHash = createHash("sha256").update(normalized).digest("hex");

  return {
    decision,
    reasons,
    policyVersion: "2026-09-02",
    evaluatedAt: new Date().toISOString(),
    requestHash,
  };
}

export function authorizeInternalRequest(
  supplied: string | null,
  expected: string | undefined,
): boolean {
  if (!supplied || !expected) return false;
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}
