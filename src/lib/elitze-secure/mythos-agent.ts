import { randomUUID } from "node:crypto";
import { AuditLedger } from "./audit-ledger.js";
import { evaluateGatewayRequest, type ElitzeGatewayChannel } from "./gateway.js";
import { PolicyEngine, requireTenantBoundary, restrictUnknownMcp, type PolicyContext } from "./policy-engine.js";
import { EnforcementPoint } from "./runtime-enforcement.js";

export type MythosCapability =
  | "SECOPS"
  | "INTELLIGENCE"
  | "MEMORY"
  | "REVIEW";

export type MythosTaskType =
  | "THREAT_HUNT"
  | "VULNERABILITY_ANALYSIS"
  | "INCIDENT_RESPONSE"
  | "OSINT"
  | "CORPORATE_RESEARCH"
  | "FRAUD_ANALYSIS"
  | "MEMORY_CAPTURE"
  | "REPORT_REVIEW";

export type MythosRisk = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface MythosTask {
  tenantId: string;
  actorId: string;
  agentId: string;
  objective: string;
  type: MythosTaskType;
  channel?: ElitzeGatewayChannel;
  toolId?: string;
  mcpServerId?: string;
  dataClassification?: PolicyContext["dataClassification"];
  riskSignals?: string[];
  evidenceIds?: string[];
  requestedAction?: string;
}

export interface MythosRoute {
  capability: MythosCapability;
  reason: string;
  priority: number;
}

export interface MythosPlan {
  id: string;
  task: MythosTask;
  routes: MythosRoute[];
  controls: string[];
  decision: "ALLOW" | "REVIEW" | "BLOCK";
  reasons: string[];
  evidenceRequired: boolean;
  execution: "READ_ONLY" | "APPROVAL_REQUIRED" | "BLOCKED";
  auditEventId: string;
}

const TASK_ROUTES: Record<MythosTaskType, MythosRoute[]> = {
  THREAT_HUNT: [{ capability: "SECOPS", reason: "Hypothesis-driven hunt across authorized telemetry", priority: 100 }],
  VULNERABILITY_ANALYSIS: [{ capability: "SECOPS", reason: "Correlate exposure, reachability and affected assets", priority: 100 }],
  INCIDENT_RESPONSE: [
    { capability: "SECOPS", reason: "Coordinate containment and investigation", priority: 100 },
    { capability: "REVIEW", reason: "Require evidence-backed decision and reporting", priority: 80 },
  ],
  OSINT: [{ capability: "INTELLIGENCE", reason: "Investigate authorized public intelligence sources", priority: 100 }],
  CORPORATE_RESEARCH: [{ capability: "INTELLIGENCE", reason: "Map public corporate and market signals", priority: 100 }],
  FRAUD_ANALYSIS: [
    { capability: "INTELLIGENCE", reason: "Correlate identity, entity and behavioral indicators", priority: 100 },
    { capability: "REVIEW", reason: "Validate claims before reporting or action", priority: 90 },
  ],
  MEMORY_CAPTURE: [{ capability: "MEMORY", reason: "Store verified knowledge and evidence references", priority: 100 }],
  REPORT_REVIEW: [{ capability: "REVIEW", reason: "Validate evidence, provenance and impact before publication", priority: 100 }],
};

function hasCriticalSignal(signals: readonly string[] = []) {
  return signals.some((signal) => signal.toLowerCase() === "critical");
}

function hasHighImpactAction(action = "") {
  const value = action.toLowerCase();
  return ["delete", "disable", "isolate", "rotate", "revoke", "shutdown", "quarantine", "block"].some((term) => value.includes(term));
}

export class MythosAgent {
  private readonly audit: AuditLedger;
  private readonly enforcement: EnforcementPoint;

  constructor(audit = new AuditLedger(), policies = new PolicyEngine([requireTenantBoundary, restrictUnknownMcp])) {
    this.audit = audit;
    this.enforcement = new EnforcementPoint(policies, audit);
  }

  plan(task: MythosTask): MythosPlan {
    const gateway = evaluateGatewayRequest({
      tenantId: task.tenantId,
      requestId: randomUUID(),
      channel: task.channel ?? "API",
      actorId: task.actorId,
      actorType: "AGENT",
      agentId: task.agentId,
      tool: task.toolId ? { name: task.toolId, server: task.mcpServerId } : undefined,
      riskSignals: task.riskSignals,
    });

    const decision = this.enforcement.evaluate(
      {
        tenantId: task.tenantId,
        subjectId: task.agentId,
        action: task.requestedAction ?? `mythos.${task.type.toLowerCase()}`,
        toolId: task.toolId,
        mcpServerId: task.mcpServerId,
        dataClassification: task.dataClassification,
      },
      "AGENT_ACTION",
    );

    const routes = [...TASK_ROUTES[task.type]].sort((a, b) => b.priority - a.priority);
    const reasons = [...gateway.reasons, ...decision.hardPolicyFailures.map((failure) => failure.reason)];
    const critical = hasCriticalSignal(task.riskSignals) || reasons.length > 0 || decision.decision === "BLOCK";
    const highImpact = hasHighImpactAction(task.requestedAction);
    const finalDecision = gateway.decision === "BLOCK" || decision.decision === "BLOCK"
      ? "BLOCK"
      : highImpact || critical
        ? "REVIEW"
        : "ALLOW";

    const execution = finalDecision === "BLOCK"
      ? "BLOCKED"
      : finalDecision === "REVIEW"
        ? "APPROVAL_REQUIRED"
        : "READ_ONLY";

    const evidenceRequired = true;
    const event = this.audit.append(task.tenantId, "mythos.plan", {
      taskId: task.agentId,
      type: task.type,
      routes,
      decision: finalDecision,
      execution,
      evidenceRequired,
      evidenceIds: task.evidenceIds ?? [],
    });

    return {
      id: event.id,
      task,
      routes,
      controls: [...new Set([...gateway.controls, "evidence", "approval-boundary", "audit-ledger"])],
      decision: finalDecision,
      reasons,
      evidenceRequired,
      execution,
      auditEventId: event.id,
    };
  }
}

export function createMythosAgent() {
  return new MythosAgent();
}
