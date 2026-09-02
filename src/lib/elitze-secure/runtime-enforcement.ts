import { enforceHardGates, SecurityDecision } from "../core/decision.js";
import { PolicyEngine, PolicyContext } from "../policy/engine.js";
import { AuditLedger } from "../audit/ledger.js";
export class EnforcementPoint {
  constructor(private policies:PolicyEngine,private audit:AuditLedger){}
  evaluate(context:PolicyContext, subjectType:SecurityDecision["subjectType"], trustScore:number|null= null){
    const failures=this.policies.evaluate(context);
    const base= {subjectId:context.subjectId,subjectType,trustScore,hardPolicyFailures:failures,evidenceState:"OBSERVED" as const,observedAt:new Date().toISOString(),auditEventId:""};
    const event=this.audit.append(context.tenantId,"security.decision",base);
    return enforceHardGates({...base,auditEventId:event.id});
  }
}