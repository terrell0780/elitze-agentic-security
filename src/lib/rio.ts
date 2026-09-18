export type RioObserved = {
  resultSignals: number;
  evidenceRecords: number;
  verifiedOutcomes: number;
};

export type RioFinancialInputs = {
  approvedImpactValue: number;
  approvedCostBasis: number;
};

export type RioStatus = "MEASURABLE" | "INSUFFICIENT_EVIDENCE" | "UNMEASURABLE";

export function evaluateRio(observed: RioObserved, financial?: RioFinancialInputs) {
  const hasSecurityEvidence =
    observed.resultSignals > 0 &&
    observed.evidenceRecords > 0 &&
    observed.verifiedOutcomes > 0;

  if (!hasSecurityEvidence) {
    return {
      status: "INSUFFICIENT_EVIDENCE" as const,
      impactValue: null,
      costBasis: null,
      netImpact: null,
      roiPercent: null,
    };
  }

  if (!financial || financial.approvedImpactValue <= 0 || financial.approvedCostBasis <= 0) {
    return {
      status: "MEASURABLE" as const,
      impactValue: null,
      costBasis: null,
      netImpact: null,
      roiPercent: null,
    };
  }

  const impactValue = financial.approvedImpactValue;
  const costBasis = financial.approvedCostBasis;
  const netImpact = impactValue - costBasis;

  return {
    status: "MEASURABLE" as const,
    impactValue,
    costBasis,
    netImpact,
    roiPercent: (netImpact / costBasis) * 100,
  };
}
