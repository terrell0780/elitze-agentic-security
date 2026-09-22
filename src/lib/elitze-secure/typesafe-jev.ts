import { choice, TypeSafeClient, type ChoiceQuestion, type EntryType } from "@typesafe-ai/sdk";

export type JevAvailability = "ENABLED" | "DISABLED" | "ERROR";
export interface JevDecision<T extends string = string> { availability: JevAvailability; answer?: T; confidence?: number; probabilities?: Record<string, number>; model?: string; errorCode?: string; }
export interface JevDecisionContext { tenantId: string; state: Record<string, unknown>; }

const SENSITIVE_KEY = /(password|passwd|secret|token|api[_-]?key|private[_-]?key|authorization|cookie|credential)/i;
export function sanitizeJevState(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[TRUNCATED]";
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => sanitizeJevState(item, depth + 1));
  if (value === null || typeof value !== "object") return value;
  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>).slice(0, 100)) output[key] = SENSITIVE_KEY.test(key) ? "[REDACTED]" : sanitizeJevState(entry, depth + 1);
  return output;
}

export class JevDecisionPlane {
  private readonly client: TypeSafeClient | null;
  private readonly model: string;
  constructor(config?: { apiKey?: string; model?: string; timeout?: number }) {
    const apiKey = config?.apiKey?.trim() || process.env.TYPESAFE_API_KEY?.trim();
    this.model = config?.model?.trim() || process.env.TYPESAFE_DEFAULT_MODEL?.trim() || "jev-latest";
    this.client = apiKey ? new TypeSafeClient({ apiKey, defaultModel: this.model, timeout: config?.timeout ?? 10_000, logLevel: "error" }) : null;
  }
  get availability(): JevAvailability { return this.client ? "ENABLED" : "DISABLED"; }
  private async choose<T extends string>(context: JevDecisionContext, question: ChoiceQuestion<Record<T, string | null>>): Promise<JevDecision<T>> {
    if (!this.client) return { availability: "DISABLED", errorCode: "typesafe_api_key_missing", model: this.model };
    try {
      const result = await this.client.systemOne({
        model: this.model,
        state: sanitizeJevState({ tenant: context.tenantId, ...context.state }) as EntryType,
        questions: { decision: question },
      });
      const answer = result.answers.decision;
      return { availability: "ENABLED", answer: answer.choice as T, confidence: answer.confidence, probabilities: { ...answer.probabilities }, model: result.model };
    } catch (error) {
      return { availability: "ERROR", errorCode: error instanceof Error ? error.name : "typesafe_request_failed", model: this.model };
    }
  }
  async remediationApproval(context: JevDecisionContext) {
    return this.choose(context, choice("What is the safest approval path for this bounded remediation?", {
      AUTO: "Low-risk, reversible, well-validated remediation with bounded blast radius.",
      POLICY_APPROVAL: "Policy-controlled change within explicitly permitted automation scope.",
      HUMAN_APPROVAL: "Production or identity-impacting change requiring a human decision.",
      DUAL_APPROVAL: "High-blast-radius, shared-control-plane, or destructive change requiring two approvers.",
      HOLD: "Evidence, authorization, rollback capability, or validation is insufficient.",
    }));
  }
  async vulnerabilityTriage(context: JevDecisionContext) {
    return this.choose(context, choice("What should ELITZE do next with this vulnerability?", {
      MONITOR: "Current evidence does not justify active remediation.",
      VALIDATE: "Exposure or exploitability needs additional validation.",
      CONTAIN: "An active or likely attack path should be restricted immediately.",
      REMEDIATE: "Evidence supports an authorized remediation workflow.",
      ESCALATE: "High-impact uncertainty or risk requires human intervention.",
    }));
  }
  async emergingThreatResponse(context: JevDecisionContext) {
    return this.choose(context, choice("What is the appropriate bounded response to this emerging threat?", {
      INVESTIGATE: "Collect additional threat and asset evidence before changing controls.",
      INCREASE_MONITORING: "Increase telemetry and validation without changing production behavior.",
      VALIDATE_EXPOSURE: "Direct ELITZE to validate whether affected assets are actually reachable.",
      CONTAIN: "Restrict the suspected attack path using authorized controls.",
      VIRTUAL_PATCH: "Apply a reversible compensating security control while a permanent fix is prepared.",
      EMERGENCY_RESPONSE: "Active exploitation or severe evidence warrants the emergency containment path.",
    }));
  }
  async redTeamCampaign(context: JevDecisionContext) {
    return this.choose(context, choice("Which controlled red-team campaign should run next?", {
      API_ABUSE: "API discovery, authorization and abuse-path testing.",
      AUTHORIZATION: "BOLA/BFLA, privilege and access-control validation.",
      PROMPT_INJECTION: "Indirect/direct instruction and goal-hijacking validation.",
      MCP_TOOL_ABUSE: "MCP server, tool poisoning and unauthorized tool-use validation.",
      AGENT_PRIVILEGE: "Agent identity, delegation and privilege-escalation validation.",
      SECRET_EXFILTRATION: "Secret discovery and controlled exfiltration-path validation.",
      SSRF: "Server-side request forgery and internal reachability validation.",
      INJECTION: "SQL, command, template and related injection-path validation.",
      SUPPLY_CHAIN: "Dependency, artifact, skill and package compromise validation.",
      CLOUD_IDENTITY: "Cloud identity, entitlement and control-plane attack-path validation.",
    }));
  }
  async runtimeAnomaly(context: JevDecisionContext) {
    return this.choose(context, choice("How should ELITZE classify this runtime anomaly?", {
      BENIGN: "Behavior consistent with expected activity and available context.",
      SUSPICIOUS: "Unexpected behavior warrants monitoring or additional evidence.",
      SECURITY_RELEVANT: "Behavior meaningfully changes the security posture.",
      ACTIVE_ATTACK: "Evidence indicates an active attack or exploitation path.",
      UNKNOWN: "Evidence is insufficient or conflicting.",
    }));
  }
  async evidenceClassification(context: JevDecisionContext) {
    return this.choose(context, choice("How strong is the supplied security evidence?", {
      DIRECTLY_OBSERVED: "Direct telemetry or test output establishes the fact.",
      STRONGLY_SUPPORTED: "Multiple independent signals strongly support the fact.",
      INFERRED: "The conclusion is inferred from indirect evidence.",
      INSUFFICIENT: "There is not enough evidence to support the conclusion.",
      CONTRADICTORY: "Available evidence conflicts.",
      UNKNOWN: "Evidence quality or provenance cannot be established.",
    }));
  }
}
export function createJevDecisionPlane(config?: { apiKey?: string; model?: string; timeout?: number }): JevDecisionPlane { return new JevDecisionPlane(config); }