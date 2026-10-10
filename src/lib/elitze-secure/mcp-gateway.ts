import { createHash, createHmac, randomUUID } from "node:crypto";
import dns from "node:dns/promises";
import net from "node:net";

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

const DECISION_RANK: Record<GatewayDecision, number> = {
  ALLOW: 0,
  ALLOW_WITH_CONSTRAINTS: 1,
  REQUIRE_APPROVAL: 2,
  DENY: 3,
};

const MAX_UPSTREAM_RESPONSE_BYTES = 2 * 1024 * 1024;

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function stable(value: unknown): string {
  return JSON.stringify(value, (_, v) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return Object.fromEntries(Object.entries(v).sort());
    }
    return v;
  });
}

export function parseCapabilitySet(value: string): string[] {
  const raw = value.trim();
  if (!raw || raw === "*") return [];
  const values = raw.startsWith("[")
    ? (() => {
        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return [];
        }
      })()
    : raw.split(",");
  return [...new Set(
    values
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  )].slice(0, 64);
}

export function capabilityAllows(requestedCapability: string, toolName: string): boolean {
  const tool = toolName.trim().toLowerCase();
  if (!tool) return false;
  return parseCapabilitySet(requestedCapability).includes(tool);
}

export function moreRestrictiveDecision(
  left: GatewayDecision,
  right: GatewayDecision,
): GatewayDecision {
  return DECISION_RANK[left] >= DECISION_RANK[right] ? left : right;
}

function blockedIp(address: string): boolean {
  const normalized = address.toLowerCase();
  if (normalized === "::" || normalized === "::1" || normalized === "0.0.0.0") return true;
  if (net.isIPv4(normalized)) {
    const octets = normalized.split(".").map(Number);
    const [a, b] = octets;
    return (
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  if (net.isIPv6(normalized)) {
    return normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe8") ||
      normalized.startsWith("fe9") ||
      normalized.startsWith("fea") ||
      normalized.startsWith("feb");
  }
  return true;
}

export async function validateMcpUpstreamUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("mcp_upstream_invalid_url");
  }

  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("mcp_upstream_https_required");
  }

  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    net.isIP(host)
  ) {
    throw new Error("mcp_upstream_private_host_blocked");
  }

  const allowlist = (process.env.ELITZE_MCP_UPSTREAM_HOST_ALLOWLIST ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  // Controlled integrations only: an empty allowlist must never mean "allow any public host".
  if (!allowlist.length || !allowlist.includes(host)) {
    throw new Error("mcp_upstream_host_not_allowlisted");
  }

  const addresses = await dns.lookup(host, { all: true });
  if (!addresses.length || addresses.some(({ address }) => blockedIp(address))) {
    throw new Error("mcp_upstream_private_address_blocked");
  }

  return url;
}

export function maxUpstreamResponseBytes() {
  return MAX_UPSTREAM_RESPONSE_BYTES;
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
  const destructive =
    /^(delete|destroy|remove|revoke|drop|purge)/i.test(input.action) ||
    /(^|:)delete|(^|:)remove/i.test(input.toolName);

  if (reasons.length) {
    return { requestId, decision: "DENY", policyVersion: "mcp-gateway-v2", constraints: {}, approvalRequired: false, reasons };
  }
  if (sensitive && /slack|message|send|webhook/i.test(input.toolName)) {
    return { requestId, decision: "DENY", policyVersion: "mcp-gateway-v2", constraints: {}, approvalRequired: false, reasons: ["sensitive_egress_denied"] };
  }
  if (destructive) {
    return { requestId, decision: "REQUIRE_APPROVAL", policyVersion: "mcp-gateway-v2", constraints: {}, approvalRequired: true, reasons: ["destructive_action_requires_approval"] };
  }
  if (sensitive && /secret|credential|password|token/i.test(input.toolName)) {
    return { requestId, decision: "DENY", policyVersion: "mcp-gateway-v2", constraints: {}, approvalRequired: false, reasons: ["credential_access_denied"] };
  }
  if (input.dataClassification === "INTERNAL" && input.action === "write") {
    return { requestId, decision: "ALLOW_WITH_CONSTRAINTS", policyVersion: "mcp-gateway-v2", constraints: { scope: "tenant-bound", audit: true }, approvalRequired: false, reasons: ["tenant_scoped_write"] };
  }
  return { requestId, decision: "ALLOW", policyVersion: "mcp-gateway-v2", constraints: {}, approvalRequired: false, reasons: [] };
}

export function signGatewayEvidence(
  event: Record<string, unknown>,
  previousHash: string | null,
): { evidenceHash: string; signature: string; previousHash: string | null } {
  const evidenceHash = sha256(stable({ ...event, previousHash }));
  const secret = process.env.ELITZE_EVIDENCE_SIGNING_SECRET;
  if (!secret) throw new Error("ELITZE_EVIDENCE_SIGNING_SECRET is required; gateway cannot create signed evidence");
  const signature = createHmac("sha256", secret).update(evidenceHash).digest("base64url");
  return { evidenceHash, signature, previousHash };
}

export function verifyGatewayEvidence(input: {
  event: Record<string, unknown>;
  previousHash: string | null;
  evidenceHash: string;
  signature: string;
}): boolean {
  const secret = process.env.ELITZE_EVIDENCE_SIGNING_SECRET;
  if (!secret) return false;
  const expectedHash = sha256(stable({ ...input.event, previousHash: input.previousHash }));
  const expectedSignature = createHmac("sha256", secret).update(expectedHash).digest("base64url");
  return expectedHash === input.evidenceHash && expectedSignature === input.signature;
}

export function upstreamCredential(): string | undefined {
  return process.env.ELITZE_MCP_GATEWAY_CREDENTIAL;
}
