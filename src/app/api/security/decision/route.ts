import { NextRequest } from "next/server";
import { enforceHardGates, type SecurityDecision } from "@/lib/elitze-secure/decision";
import { DEFAULT_SECURITY_POLICIES, PolicyEngine, type PolicyContext } from "@/lib/elitze-secure/policy-engine";
import { AuditLedger } from "@/lib/elitze-secure/audit-ledger";

export const dynamic = "force-dynamic";
const audit = new AuditLedger();
const engine = new PolicyEngine(DEFAULT_SECURITY_POLICIES);
const subjectTypes: SecurityDecision["subjectType"][] = ["CONTENT", "AGENT_ACTION", "TOOL_CALL", "MCP_CALL", "DEPLOYMENT"];
const evidenceStates = ["OBSERVED", "INFERRED", "UNKNOWN", "UNMEASURABLE"] as const;

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return Response.json({ error: "invalid_json" }, { status: 400 }); }
  if (typeof body.tenantId !== "string" || !body.tenantId.trim() || typeof body.subjectId !== "string" || !body.subjectId.trim() || typeof body.action !== "string" || !body.action.trim()) return Response.json({ error: "tenant_subject_and_action_required" }, { status: 400 });
  if (typeof body.subjectType !== "string" || !subjectTypes.includes(body.subjectType as SecurityDecision["subjectType"])) return Response.json({ error: "invalid_subject_type" }, { status: 400 });
  const context = body as unknown as PolicyContext;
  const failures = engine.evaluate(context);
  let event;
  try { event = await audit.append(body.tenantId, "security.decision", body); } catch (error) { console.error("ELITZE audit persistence failed", error); return Response.json({ error: "security_audit_unavailable" }, { status: 503 }); }
  const evidenceState = typeof body.evidenceState === "string" && evidenceStates.includes(body.evidenceState as typeof evidenceStates[number]) ? body.evidenceState as typeof evidenceStates[number] : "UNKNOWN";
  const decision = enforceHardGates({ subjectId: body.subjectId, subjectType: body.subjectType as SecurityDecision["subjectType"], trustScore: typeof body.trustScore === "number" ? body.trustScore : null, hardPolicyFailures: failures, evidenceState, observedAt: new Date().toISOString(), auditEventId: event.id });
  return Response.json(decision, { status: decision.decision === "BLOCK" ? 403 : 200 });
}
