import { enforceHardGates, type SecurityDecision } from "./decision.js";
import { PolicyEngine, type PolicyContext } from "./policy-engine.js";
import { AuditLedger } from "./audit-ledger.js";

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
