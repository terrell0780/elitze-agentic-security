import { randomUUID } from "node:crypto";
import { AuditLedger } from "@/lib/elitze-secure/audit-ledger";
import { createDefaultDefenseAdapters } from "@/lib/elitze-secure/adapter-registry";
import { DefenseFabric, type DefenseTaskContext, type ObservedSignal, type SecurityAdapter } from "@/lib/elitze-secure/defense-fabric";
import { evaluateGatewayRequest, type ElitzeGatewayChannel } from "@/lib/elitze-secure/gateway";
import { DEFAULT_SECURITY_POLICIES, PolicyEngine, type PolicyContext } from "@/lib/elitze-secure/policy-engine";
import { EnforcementPoint } from "@/lib/elitze-secure/runtime-enforcement";

export const ELITZE_AGENT_NAME = "ELITZE";
export const ELITZE_AGENT_ASSISTANT = "SARA";
export type ElitzeCapability = "SECOPS" | "INTELLIGENCE" | "MEMORY" | "REVIEW";
export type ElitzeTaskType = "THREAT_HUNT" | "VULNERABILITY_ANALYSIS" | "INCIDENT_RESPONSE" | "OSINT" | "CORPORATE_RESEARCH" | "FRAUD_ANALYSIS" | "MEMORY_CAPTURE" | "REPORT_REVIEW";
export type ElitzePlanDecision = "ALLOW" | "REVIEW" | "BLOCK";
export interface ElitzeTask { tenantId: string; actorId: string; agentId: string; objective: string; type: ElitzeTaskType; channel?: ElitzeGatewayChannel; toolId?: string; mcpServerId?: string; dataClassification?: PolicyContext["dataClassification"]; riskSignals?: string[]; evidenceIds?: string[]; requestedAction?: string; }
export interface ElitzeRoute { capability: ElitzeCapability; reason: string; priority: number; }
export interface ElitzePlan { id: string; task: ElitzeTask; routes: ElitzeRoute[]; controls: string[]; decision: ElitzePlanDecision; reasons: string[]; evidenceRequired: boolean; execution: "READ_ONLY" | "APPROVAL_REQUIRED" | "BLOCKED"; auditEventId: string; }
export type ElitzeExecutionResult = { ok: boolean; plan: ElitzePlan; result?: unknown; executionState: "NOT_EXECUTED" | "EXECUTED" | "REJECTED"; evidenceEventId: string; };
export interface ElitzeActionExecutor { execute(task: ElitzeTask, plan: ElitzePlan): Promise<unknown>; }
const TASK_ROUTES: Record<ElitzeTaskType, ElitzeRoute[]> = { THREAT_HUNT: [{ capability: "SECOPS", reason: "Hypothesis-driven hunt across authorized telemetry", priority: 100 }], VULNERABILITY_ANALYSIS: [{ capability: "SECOPS", reason: "Correlate exposure, reachability and affected assets", priority: 100 }], INCIDENT_RESPONSE: [{ capability: "SECOPS", reason: "Coordinate containment and investigation", priority: 100 }, { capability: "REVIEW", reason: "Require evidence-backed decision and reporting", priority: 80 }], OSINT: [{ capability: "INTELLIGENCE", reason: "Investigate authorized public intelligence sources", priority: 100 }], CORPORATE_RESEARCH: [{ capability: "INTELLIGENCE", reason: "Map public corporate and market signals", priority: 100 }], FRAUD_ANALYSIS: [{ capability: "INTELLIGENCE", reason: "Correlate identity, entity and behavioral indicators", priority: 100 }, { capability: "REVIEW", reason: "Validate claims before reporting or action", priority: 90 }], MEMORY_CAPTURE: [{ capability: "MEMORY", reason: "Store verified knowledge and evidence references", priority: 100 }], REPORT_REVIEW: [{ capability: "REVIEW", reason: "Validate evidence, provenance and impact before publication", priority: 100 }] };
function hasCriticalSignal(signals: readonly string[] = []) { return signals.some((signal) => signal.toLowerCase() === "critical"); }
function hasHighImpactAction(action = "") { const value = action.toLowerCase(); return ["delete", "disable", "isolate", "rotate", "revoke", "shutdown", "quarantine", "block"].some((term) => value.includes(term)); }
export class ElitzeAgent {
  private readonly audit: AuditLedger; private readonly enforcement: EnforcementPoint; private readonly defense: DefenseFabric;
  constructor(audit = new AuditLedger(), policies = new PolicyEngine(DEFAULT_SECURITY_POLICIES), adapters?: SecurityAdapter[]) { this.audit = audit; this.enforcement = new EnforcementPoint(policies, audit); this.defense = new DefenseFabric(adapters ?? createDefaultDefenseAdapters(), audit, policies); }
  registerAdapter(adapter: SecurityAdapter): void { this.defense.register(adapter); }
  defenseStatus() { return this.defense.status(); }
  async observe(tenantId: string, query?: string): Promise<ObservedSignal[]> { return this.defense.observe(tenantId, query); }
  async plan(task: ElitzeTask): Promise<ElitzePlan> {
    if (!task.tenantId?.trim() || !task.actorId?.trim() || !task.agentId?.trim()) throw new Error("tenant_actor_agent_identity_required");
    const gateway = evaluateGatewayRequest({ tenantId: task.tenantId, requestId: randomUUID(), channel: task.channel ?? "API", actorId: task.actorId, actorType: "AGENT", agentId: task.agentId, tool: task.toolId ? { name: task.toolId, server: task.mcpServerId } : undefined, riskSignals: task.riskSignals });
    const enforcementDecision = await this.enforcement.evaluate({ tenantId: task.tenantId, subjectId: task.agentId, action: task.requestedAction ?? `elitze.${task.type.toLowerCase()}`, toolId: task.toolId, mcpServerId: task.mcpServerId, dataClassification: task.dataClassification }, "AGENT_ACTION");
    const defenseAuthorization = this.defense.authorize({ tenantId: task.tenantId, actorId: task.actorId, agentId: task.agentId, channel: task.channel, toolId: task.toolId, mcpServerId: task.mcpServerId, dataClassification: task.dataClassification, requestedAction: task.requestedAction ?? `elitze.${task.type.toLowerCase()}`, riskSignals: task.riskSignals } satisfies DefenseTaskContext);
    const routes = [...TASK_ROUTES[task.type]].sort((a, b) => b.priority - a.priority);
    const reasons = [...gateway.reasons, ...enforcementDecision.hardPolicyFailures.map((failure) => failure.reason), ...defenseAuthorization.reasons];
    const finalDecision: ElitzePlanDecision = gateway.decision === "BLOCK" || enforcementDecision.decision === "BLOCK" || !defenseAuthorization.allowed ? "BLOCK" : hasCriticalSignal(task.riskSignals) || hasHighImpactAction(task.requestedAction) || defenseAuthorization.review ? "REVIEW" : "ALLOW";
    const execution = finalDecision === "BLOCK" ? "BLOCKED" : finalDecision === "REVIEW" ? "APPROVAL_REQUIRED" : "READ_ONLY";
    const event = await this.audit.append(task.tenantId, "elitze.plan", { taskId: task.agentId, type: task.type, routes, decision: finalDecision, execution, evidenceRequired: true, evidenceIds: task.evidenceIds ?? [], defenseAuthorization });
    return { id: event.id, task, routes, controls: [...new Set([...gateway.controls, "evidence", "approval-boundary", "audit-ledger", "defense-fabric", "connector-health"])], decision: finalDecision, reasons, evidenceRequired: true, execution, auditEventId: event.id };
  }
  async execute(task: ElitzeTask, executor: ElitzeActionExecutor): Promise<ElitzeExecutionResult> { const plan = await this.plan(task); if (plan.decision !== "ALLOW") { const event = await this.audit.append(task.tenantId, "elitze.execution.rejected", { planId: plan.id, decision: plan.decision, execution: plan.execution, reasons: plan.reasons }); return { ok: false, plan, executionState: "REJECTED", evidenceEventId: event.id }; } const result = await executor.execute(task, plan); const event = await this.audit.append(task.tenantId, "elitze.execution.completed", { planId: plan.id, taskType: task.type, resultRecorded: true }); return { ok: true, plan, result, executionState: "EXECUTED", evidenceEventId: event.id }; }
}
export function createElitzeAgent(adapters?: SecurityAdapter[]) { return new ElitzeAgent(undefined, undefined, adapters); }
