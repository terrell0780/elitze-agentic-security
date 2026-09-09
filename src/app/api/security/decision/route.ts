import { NextRequest } from "next/server";
import { enforceHardGates } from "@/lib/elitze-secure/decision";
import { DEFAULT_SECURITY_POLICIES, PolicyEngine } from "@/lib/elitze-secure/policy-engine";
import { AuditLedger } from "@/lib/elitze-secure/audit-ledger";

export const dynamic = "force-dynamic";
const audit = new AuditLedger();
const engine = new PolicyEngine(DEFAULT_SECURITY_POLICIES);
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return Response.json({ error: "invalid_json" }, { status: 400 }); }
  if (typeof body.tenantId !== "string" || !body.tenantId.trim() || typeof body.subjectId !== "string" || !body.subjectId.trim()) return Response.json({ error: "tenant_and_subject_required" }, { status: 400 });
  const failures = engine.evaluate(body as never);
  let event;
  try { event = await audit.append(body.tenantId, "security.decision", body); } catch (error) { console.error("ELITZE audit persistence failed", error); return Response.json({ error: "security_audit_unavailable" }, { status: 503 }); }
  const decision = enforceHardGates({ subjectId: body.subjectId, subjectType: body.subjectType, trustScore: body.trustScore ?? null, hardPolicyFailures: failures, evidenceState: body.evidenceState ?? "UNKNOWN", observedAt: new Date().toISOString(), auditEventId: event.id });
  return Response.json(decision, { status: decision.decision === "BLOCK" ? 403 : 200 });
}
