export type SecurityDomain =
  | "AI_SECURITY" | "IDENTITY" | "ENDPOINT" | "NETWORK" | "CLOUD"
  | "DATA" | "APPLICATION" | "EMAIL" | "EXPOSURE" | "SECOPS";

export type NormalizedSecurityEvent = {
  tenantId: string;
  eventId: string;
  occurredAt: string;
  domain: SecurityDomain;
  source: string;
  eventType: string;
  actorId?: string;
  assetId?: string;
  severity?: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence?: number;
  attributes: Record<string, unknown>;
};

export type ExposureInput = {
  exploitability: number;
  internetExposure: number;
  assetCriticality: number;
  identityPrivilege: number;
  dataSensitivity: number;
  attackPathReachability: number;
  activeThreatSignal: number;
};

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function calculateExposureScore(input: ExposureInput): number {
  return clamp(
    input.exploitability * 0.20 +
    input.internetExposure * 0.15 +
    input.assetCriticality * 0.20 +
    input.identityPrivilege * 0.10 +
    input.dataSensitivity * 0.10 +
    input.attackPathReachability * 0.15 +
    input.activeThreatSignal * 0.10,
  );
}

export type DetectionCandidate = {
  ruleId: string;
  eventIds: string[];
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: number;
  rationale: string;
};

export function correlateEvents(events: NormalizedSecurityEvent[], ruleId: string): DetectionCandidate | null {
  if (!events.length) return null;
  const relevant = events.filter((event) => event.tenantId === events[0].tenantId);
  const critical = relevant.some((event) => event.severity === "CRITICAL");
  return {
    ruleId,
    eventIds: relevant.map((event) => event.eventId),
    severity: critical ? "CRITICAL" : "HIGH",
    confidence: Math.min(1, 0.5 + relevant.length * 0.1),
    rationale: `Correlated ${relevant.length} normalized security event(s) under rule ${ruleId}.`,
  };
}

export type AIAction = {
  tenantId: string;
  actorId: string;
  actorType: "HUMAN" | "AGENT" | "WORKLOAD";
  channel: "LLM" | "MCP" | "A2A" | "API" | "BROWSER" | "SAAS";
  action: string;
  resource?: string;
  dataClasses?: string[];
  riskSignals?: string[];
  approvedTools?: string[];
};

export function enforceAIAction(input: AIAction) {
  const reasons: string[] = [];
  if (!input.tenantId) reasons.push("tenant boundary missing");
  if (!input.actorId) reasons.push("actor identity missing");
  if (input.actorType === "AGENT" && input.channel === "A2A" && !input.approvedTools) {
    reasons.push("agent action lacks an explicit capability boundary");
  }
  if ((input.riskSignals ?? []).some((s) => ["secret-exposure", "prompt-injection", "data-exfiltration", "critical"].includes(s))) {
    reasons.push("high-risk AI security signal");
  }
  if ((input.dataClasses ?? []).includes("RESTRICTED") && input.channel !== "LLM") {
    reasons.push("restricted data requires explicit policy authorization");
  }
  return { decision: reasons.length ? "BLOCK" as const : "ALLOW" as const, reasons };
}

export type CloudPostureFinding = {
  resourceId: string;
  control: "CSPM" | "CWPP" | "CIEM" | "IAC" | "CONTAINER" | "SERVERLESS";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  observed: boolean;
  evidenceRef?: string;
};

export type DataSecurityFinding = {
  assetId: string;
  classification: "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED";
  exposure: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  accessPath?: string;
  evidenceRef?: string;
};

export type IdentityRiskAssessment = {
  principalId: string;
  privilege: number;
  authenticationRisk: number;
  deviceRisk: number;
  behavioralRisk: number;
  agentDelegationRisk: number;
};

export function identityRiskScore(input: IdentityRiskAssessment): number {
  return clamp(
    input.privilege * 0.25 +
    input.authenticationRisk * 0.20 +
    input.deviceRisk * 0.20 +
    input.behavioralRisk * 0.20 +
    input.agentDelegationRisk * 0.15,
  );
}

export type SupplyChainArtifact = {
  artifactId: string;
  kind: "PACKAGE" | "MODEL" | "DATASET" | "CONTAINER" | "SKILL" | "PROMPT" | "PLUGIN";
  digest?: string;
  supplier?: string;
  provenanceRef?: string;
  dependencies?: string[];
};

export type ResponseAction = {
  incidentId: string;
  action: "ISOLATE" | "REVOKE" | "BLOCK" | "DISABLE_AGENT" | "DISABLE_TOKEN" | "QUARANTINE" | "ROLLBACK" | "RECOVER";
  target: string;
  requiresApproval: boolean;
};

export function responseGate(action: ResponseAction, approved: boolean) {
  if (action.requiresApproval && !approved) return { decision: "PENDING_APPROVAL" as const };
  return { decision: "EXECUTABLE" as const };
}
