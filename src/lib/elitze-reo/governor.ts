import { verifyEvidence, verifyProvenance } from "./provenance";
import { uniquenessScore } from "./uniqueness";
import type { ReoAssessment, ReoInput, RiskDimension } from "./types";

function trustScore(risk: RiskDimension, uniqueness: number | null): number | null {
  const positive = [uniqueness, risk.factuality === null ? null : 100 - risk.factuality, risk.staleness === null ? null : 100 - risk.staleness]
    .filter((value): value is number => value !== null);
  if (positive.length === 0) return null;
  const provenance = risk.provenance === null ? null : 100 - risk.provenance;
  const reputation = risk.reputation === null ? null : 100 - risk.reputation;
  const values = [...positive, provenance, reputation].filter((value): value is number => value !== null);
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
}

export function assessContent(input: ReoInput): ReoAssessment {
  const provenanceVerified = verifyProvenance(input.provenance, input.content);
  const evidenceVerified = verifyEvidence(input.evidence);
  const uniqueness = input.uniqueness ? uniquenessScore(input.uniqueness) : null;
  const risk: RiskDimension = {
    scale: input.risk?.scale ?? null,
    duplication: input.risk?.duplication ?? null,
    thinness: input.risk?.thinness ?? null,
    factuality: input.risk?.factuality ?? null,
    staleness: input.risk?.staleness ?? null,
    policy: input.risk?.policy ?? null,
    provenance: input.risk?.provenance ?? null,
    reputation: input.risk?.reputation ?? null,
  };

  const hardPolicyFailures = [...(input.policyFailures ?? [])];
  if (!provenanceVerified) hardPolicyFailures.push("PROVENANCE_REQUIRED");

  let decision: ReoAssessment["decision"] = "REVIEW";
  if (hardPolicyFailures.length > 0) decision = "BLOCK";
  else if (!evidenceVerified || uniqueness === null) decision = "REVIEW";
  else if (input.queueRequested) decision = "QUEUE";
  else if (requiresApproval(risk, uniqueness)) decision = "REVIEW";
  else decision = "APPROVE";

  return {
    contentId: input.provenance.contentId,
    decision,
    trustScore: trustScore(risk, uniqueness),
    hardPolicyFailures,
    riskDimensions: risk,
    provenanceVerified,
    evidenceVerified,
    uniqueness,
    semanticClusterId: input.uniqueness?.clusterId ?? null,
    auditEventId: null,
  };
}

function requiresApproval(risk: RiskDimension, uniqueness: number): boolean {
  if (uniqueness < 70) return true;
  return [risk.scale, risk.duplication, risk.thinness, risk.factuality, risk.staleness, risk.policy, risk.provenance, risk.reputation]
    .some((value) => value !== null && value >= 60);
}
