import { NextRequest } from "next/server";
import { enforceHardGates } from "@/lib/elitze-secure/decision";
import { PolicyEngine, requireTenantBoundary, restrictUnknownMcp } from "@/lib/elitze-secure/policy-engine";
import { AuditLedger } from "@/lib/elitze-secure/audit-ledger";

const audit = new AuditLedger();
const engine = new PolicyEngine([requireTenantBoundary, restrictUnknownMcp]);

export async function POST(request: NextRequest) {
  const body = await request.json();
  const failures = engine.evaluate(body);
  const event = audit.append(body.tenantId || "", "security.decision", body);
  const decision = enforceHardGates({
    subjectId: body.subjectId,
    subjectType: body.subjectType,
    trustScore: body.trustScore ?? null,
    hardPolicyFailures: failures,
    evidenceState: body.evidenceState ?? "UNKNOWN",
    observedAt: new Date().toISOString(),
    auditEventId: event.id,
  });
  return Response.json(decision, { status: decision.decision === "BLOCK" ? 403 : 200 });
}
