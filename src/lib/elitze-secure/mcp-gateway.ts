import { createHash, createHmac, randomUUID } from "node:crypto";

export type GatewayDecision = "ALLOW" | "DENY" | "REQUIRE_APPROVAL" | "ALLOW_WITH_CONSTRAINTS";

export type McpGatewayRequest = {
  tenantId: string;
  agentIdentityId: string;
  gatewayServerId: string;
  toolName: string;
  action: string;
  dataClassification?: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED";
  arguments?: unknown;
  purpose?: string;
  requestId?: string;
  requestedCapability?: string;
  resource?: string;
  environment?: string;
  impactLevel?: string;
};

export type GatewayEvaluation = {
  requestId: string;
  decision: GatewayDecision;
  policyVersion: string;
  constraints: Record<string, unknown>;
  approvalRequired: boolean;
  reasons: string[];
};

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value: unknown): string {
  return JSON.stringify(value, (_, v) => {
    if (v && typeof v === "object" && !Array.isArray(v)) return Object.fromEntries(Object.entries(v).sort());
    return v;
  });
}

export function evaluateMcpCall(input: McpGatewayRequest): GatewayEvaluation {
  const requestId = input.requestId ?? randomUUID();
  const reasons: string[] = [];

  if (!input.tenantId) reasons.push("tenant_boundary_required");
  if (!input.agentIdentityId) reasons.push("agent_identity_required");
  if (!input.gatewayServerId) reasons.push("gateway_server_required");
  if (!input.toolName) reasons.push("tool_identity_required");
  if (!input.action) reasons.push("action_required");

  const sensitive = input.dataClassification === "CONFIDENTIAL" || input.dataClassification === "RESTRICTED";
  const destructive = /^(delete|destroy|remove|revoke|drop|purge)/i.test(input.action) || /(^|:)delete|(^|:)remove/i.test(input.toolName);

  if (reasons.length) return { requestId, decision: "DENY", policyVersion: "mcp-gateway-v1", constraints: {}, approvalRequired: false, reasons };
  if (sensitive && /slack|message|send|webhook/i.test(input.toolName)) return { requestId, decision: "DENY", policyVersion: "mcp-gateway-v1", constraints: {}, approvalRequired: false, reasons: ["sensitive_egress_denied"] };
  if (destructive) return { requestId, decision: "REQUIRE_APPROVAL", policyVersion: "mcp-gateway-v1", constraints: {}, approvalRequired: true, reasons: ["destructive_action_requires_approval"] };
  if (sensitive && /secret|credential|password|token/i.test(input.toolName)) return { requestId, decision: "DENY", policyVersion: "mcp-gateway-v1", constraints: {}, approvalRequired: false, reasons: ["credential_access_denied"] };
  if (input.dataClassification === "INTERNAL" && input.action === "write") return { requestId, decision: "ALLOW_WITH_CONSTRAINTS", policyVersion: "mcp-gateway-v1", constraints: { scope: "tenant-bound", audit: true }, approvalRequired: false, reasons: ["tenant_scoped_write"] };
  return { requestId, decision: "ALLOW", policyVersion: "mcp-gateway-v1", constraints: {}, approvalRequired: false, reasons: [] };
}

export function signGatewayEvidence(event: Record<string, unknown>, previousHash: string | null): { evidenceHash: string; signature: string; previousHash: string | null } {
  const evidenceHash = sha256(stable({ ...event, previousHash }));
  const secret = process.env.ELITZE_EVIDENCE_SIGNING_SECRET;
  if (!secret) throw new Error("ELITZE_EVIDENCE_SIGNING_SECRET is required; gateway cannot create signed evidence");
  const signature = createHmac("sha256", secret).update(evidenceHash).digest("base64url");
  return { evidenceHash, signature, previousHash };
}

export function verifyGatewayEvidence(input: { event: Record<string, unknown>; previousHash: string | null; evidenceHash: string; signature: string }): boolean {
  const secret = process.env.ELITZE_EVIDENCE_SIGNING_SECRET;
  if (!secret) return false;
  const expectedHash = sha256(stable({ ...input.event, previousHash: input.previousHash }));
  const expectedSignature = createHmac("sha256", secret).update(expectedHash).digest("base64url");
  return expectedHash === input.evidenceHash && expectedSignature === input.signature;
}

export function upstreamCredential(): string | undefined {
  return process.env.ELITZE_MCP_GATEWAY_CREDENTIAL;
}
