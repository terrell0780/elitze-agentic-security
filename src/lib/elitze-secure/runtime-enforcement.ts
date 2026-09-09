import { enforceHardGates, type SecurityDecision } from "@/lib/elitze-secure/decision";
import { PolicyEngine, type PolicyContext } from "@/lib/elitze-secure/policy-engine";
import { AuditLedger } from "@/lib/elitze-secure/audit-ledger";

export class EnforcementPoint {
  constructor(private readonly policies: PolicyEngine, private readonly audit: AuditLedger) {}

  evaluate(context: PolicyContext, subjectType: SecurityDecision["subjectType"], trustScore: number | null = null) {
    const failures = this.policies.evaluate(context);
    const base = {
      subjectId: context.subjectId,
      subjectType,
      trustScore,
      hardPolicyFailures: failures,
      evidenceState: "OBSERVED" as const,
      observedAt: new Date().toISOString(),
      auditEventId: ""
    };
    const event = this.audit.append(context.tenantId, "security.decision", base);
    return enforceHardGates({ ...base, auditEventId: event.id });
  }
}
