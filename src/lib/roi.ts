export type RoiInputs = {
  annualIncidentCostAvoided: number;
  engineeringHoursSaved: number;
  engineeringHourlyCost: number;
  annualAiSpendAvoided: number;
  annualAuditCostAvoided: number;
  annualElitzeCost: number;
};

export type RoiObserved = {
  securityDecisions: number;
  deniedDecisions: number;
  highImpactEvents: number;
  resolvedAttackPaths: number;
  completedRedTeamRuns: number;
  evidenceRecords: number;
  enforcementEvents: number;
};

export type RoiStatus = "MEASURABLE" | "INSUFFICIENT_EVIDENCE" | "UNMEASURABLE";

export function roiMeasurementState(observed: RoiObserved | null | undefined): RoiStatus {
  if (!observed) return "INSUFFICIENT_EVIDENCE";
  const totalObservations = Object.values(observed).reduce((sum, value) => sum + Math.max(0, value), 0);
  return totalObservations > 0 ? "MEASURABLE" : "INSUFFICIENT_EVIDENCE";
}

export function calculateRoi(inputs: RoiInputs, observed: RoiObserved | null | undefined) {
  const securityStatus = roiMeasurementState(observed);
  if (securityStatus !== "MEASURABLE") {
    return {
      status: securityStatus,
      preventionValue: null,
      engineeringValue: null,
      aiSpendValue: null,
      auditValue: null,
      annualBenefit: null,
      investment: null,
      netBenefit: null,
      roiPercent: null,
      paybackMonths: null,
    };
  }

  const preventionValue = Math.max(0, inputs.annualIncidentCostAvoided);
  const engineeringValue = Math.max(0, inputs.engineeringHoursSaved) * Math.max(0, inputs.engineeringHourlyCost);
  const aiSpendValue = Math.max(0, inputs.annualAiSpendAvoided);
  const auditValue = Math.max(0, inputs.annualAuditCostAvoided);
  const annualBenefit = preventionValue + engineeringValue + aiSpendValue + auditValue;
  const investment = Math.max(0, inputs.annualElitzeCost);

  if (annualBenefit <= 0 || investment <= 0) {
    return {
      status: "UNMEASURABLE" as const,
      preventionValue: null,
      engineeringValue: null,
      aiSpendValue: null,
      auditValue: null,
      annualBenefit: null,
      investment: null,
      netBenefit: null,
      roiPercent: null,
      paybackMonths: null,
    };
  }

  const netBenefit = annualBenefit - investment;
  const roiPercent = (netBenefit / investment) * 100;
  const paybackMonths = (investment / annualBenefit) * 12;

  return {
    status: "MEASURABLE" as const,
    preventionValue,
    engineeringValue,
    aiSpendValue,
    auditValue,
    annualBenefit,
    investment,
    netBenefit,
    roiPercent,
    paybackMonths,
  };
}
