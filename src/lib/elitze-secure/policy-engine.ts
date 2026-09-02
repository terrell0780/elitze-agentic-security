import { PolicyFailure } from "../core/decision.js";

export interface PolicyContext {
  tenantId: string;
  subjectId: string;
  action: string;
  modelId?: string;
  providerId?: string;
  toolId?: string;
  mcpServerId?: string;
  dataClassification?: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED";
}

export interface Policy {
  id: string;
  evaluate(context: PolicyContext): PolicyFailure | null;
}

export class PolicyEngine {
  constructor(private readonly policies: readonly Policy[]) {}

  evaluate(context: PolicyContext): PolicyFailure[] {
    return this.policies
      .map(policy => policy.evaluate(context))
      .filter((failure): failure is PolicyFailure => failure !== null);
  }
}

export const requireTenantBoundary: Policy = {
  id: "elitze.tenant.boundary.required",
  evaluate(context) {
    return context.tenantId.trim()
      ? null
      : { policyId: "elitze.tenant.boundary.required", severity: "CRITICAL", reason: "Tenant boundary is required", hardGate: true };
  }
};

export const restrictUnknownMcp: Policy = {
  id: "elitze.mcp.known-server.required",
  evaluate(context) {
    if (!context.action.startsWith("mcp.")) return null;
    return context.mcpServerId
      ? null
      : { policyId: "elitze.mcp.known-server.required", severity: "HIGH", reason: "MCP execution requires a known server identity", hardGate: true };
  }
};