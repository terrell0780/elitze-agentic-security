export type AgentExecutionIdentity = {
  tenantId: string;
  agentId: string;
  ownerId: string;
  sessionId: string;
  workflowId?: string;
  issuedAt: string;
  expiresAt: string;
  allowedActions: string[];
  allowedResources: string[];
};

export type ActionAuthorization = {
  action: string;
  resource: string;
  risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  ownerActive: boolean;
  deviceTrusted: boolean;
  identity: AgentExecutionIdentity;
};

export function continuouslyAuthorize(input: ActionAuthorization) {
  const now = Date.now();
  const expires = Date.parse(input.identity.expiresAt);
  const reasons: string[] = [];
  if (!input.ownerActive) reasons.push("owner inactive");
  if (!input.deviceTrusted) reasons.push("device risk");
  if (!Number.isFinite(expires) || expires <= now) reasons.push("execution identity expired");
  if (!input.identity.allowedActions.includes(input.action)) reasons.push("action outside capability");
  if (!input.identity.allowedResources.includes(input.resource)) reasons.push("resource outside capability");
  if (input.risk === "CRITICAL") reasons.push("critical risk requires separate approval");
  return { decision: reasons.length ? "BLOCK" as const : "ALLOW" as const, reasons };
}
