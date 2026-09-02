import { createHash, randomUUID, timingSafeEqual } from "node:crypto";

export type SecurityDecision = "allow" | "deny" | "quarantine" | "hitl";

export type SecurityContext = {
  requestId?: string;
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
  requestId: string;
  decision: SecurityDecision;
  reasons: string[];
  policyVersion: string;
  evaluatedAt: string;
  requestHash: string;
};

const POLICY_VERSION = "2026-09-02";
const MAX_ID = 200;
const MAX_ACTION = 200;
const MAX_PURPOSE = 1000;
const MAX_RESOURCE = 1000;

export function isSecurityContext(value: unknown): value is SecurityContext {
  if (!value || typeof value !== "object") return false;
  const context = value as Record<string, unknown>;

  if (context.requestId !== undefined && (typeof context.requestId !== "string" || context.requestId.length > 100)) return false;
  if (typeof context.actorId !== "string" || context.actorId.trim() === "" || context.actorId.length > MAX_ID) return false;
  if (!["human", "agent", "service"].includes(context.actorType as string)) return false;
  if (typeof context.requestedAction !== "string" || context.requestedAction.trim() === "" || context.requestedAction.length > MAX_ACTION) return false;

  const optionalStrings: Array<[string, number]> = [
    ["agentId", MAX_ID],
    ["purpose", MAX_PURPOSE],
    ["resource", MAX_RESOURCE],
  ];
  for (const [key, maxLength] of optionalStrings) {
    if (context[key] !== undefined && (typeof context[key] !== "string" || (context[key] as string).length > maxLength)) return false;
  }

  const dataClasses = ["public", "internal", "confidential", "restricted"];
  if (context.dataClass !== undefined && !dataClasses.includes(context.dataClass as string)) return false;

  const booleans = ["irreversible", "externalSideEffect", "financial", "privileged"];
  for (const key of booleans) {
    if (context[key] !== undefined && typeof context[key] !== "boolean") return false;
  }

  return true;
}

export function evaluatePolicy(context: SecurityContext): PolicyEvaluation {
  const requestId = context.requestId?.trim() || randomUUID();
  const reasons: string[] = [];

  if (!context.actorId || !context.requestedAction) reasons.push("missing_security_context");
  if (context.actorType === "agent" && !context.agentId) reasons.push("agent_identity_required");
  if (context.actorType === "agent" && !context.purpose) reasons.push("purpose_binding_required");
  if (context.privileged && context.dataClass === "restricted") reasons.push("restricted_privileged_action");

  const highImpact = Boolean(context.irreversible || context.externalSideEffect || context.financial);
  const decision: SecurityDecision = reasons.length ? "deny" : highImpact ? "hitl" : "allow";

  const normalized = JSON.stringify({ ...context, requestId }, Object.keys({ ...context, requestId }).sort());
  const requestHash = createHash("sha256").update(normalized).digest("hex");

  return {
    requestId,
    decision,
    reasons,
    policyVersion: POLICY_VERSION,
    evaluatedAt: new Date().toISOString(),
    requestHash,
  };
}

export function authorizeInternalRequest(supplied: string | null, expected: string | undefined): boolean {
  if (!supplied || !expected) return false;
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}
