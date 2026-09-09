import type { PolicyFailure } from "@/lib/elitze-secure/decision";

export interface PolicyContext {
  tenantId: string; subjectId: string; action: string; modelId?: string; providerId?: string; toolId?: string; mcpServerId?: string;
  dataClassification?: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED";
}
export interface Policy { id: string; evaluate(context: PolicyContext): PolicyFailure | null; }
export class PolicyEngine {
  constructor(private readonly policies: readonly Policy[]) {}
  evaluate(context: PolicyContext): PolicyFailure[] { return this.policies.map((policy) => policy.evaluate(context)).filter((failure): failure is PolicyFailure => failure !== null); }
}
export const requireTenantBoundary: Policy = { id: "elitze.tenant.boundary.required", evaluate(context) { return context.tenantId.trim() ? null : { policyId: "elitze.tenant.boundary.required", severity: "CRITICAL", reason: "Tenant boundary is required", hardGate: true }; } };
export const requireSubjectIdentity: Policy = { id: "elitze.subject.identity.required", evaluate(context) { return context.subjectId.trim() ? null : { policyId: "elitze.subject.identity.required", severity: "CRITICAL", reason: "Execution requires a subject identity", hardGate: true }; } };
export const requireAction: Policy = { id: "elitze.action.required", evaluate(context) { return context.action.trim() ? null : { policyId: "elitze.action.required", severity: "CRITICAL", reason: "Execution requires an explicit action", hardGate: true }; } };
export const restrictUnknownMcp: Policy = { id: "elitze.mcp.known-server.required", evaluate(context) { if (!context.action.startsWith("mcp.")) return null; return context.mcpServerId?.trim() ? null : { policyId: "elitze.mcp.known-server.required", severity: "HIGH", reason: "MCP execution requires a known server identity", hardGate: true }; } };
export const requireToolIdentity: Policy = { id: "elitze.tool.identity.required", evaluate(context) { if (!context.action.startsWith("mcp.") && !context.action.startsWith("tool.")) return null; return context.toolId?.trim() ? null : { policyId: "elitze.tool.identity.required", severity: "HIGH", reason: "Tool execution requires a tool identity", hardGate: true }; } };
export const restrictedDataModelBinding: Policy = { id: "elitze.restricted-data.model-binding", evaluate(context) { if (context.dataClassification !== "RESTRICTED") return null; return context.modelId?.trim() && context.providerId?.trim() ? null : { policyId: "elitze.restricted-data.model-binding", severity: "HIGH", reason: "Restricted data requires an explicit model and provider binding", hardGate: true }; } };

export const DEFAULT_SECURITY_POLICIES: readonly Policy[] = [requireTenantBoundary, requireSubjectIdentity, requireAction, restrictUnknownMcp, requireToolIdentity, restrictedDataModelBinding];
