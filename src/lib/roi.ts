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

function validNonNegative(value: number) {
  return Number.isFinite(value) && value >= 0;
}

export function roiMeasurementState(observed: RoiObserved | null | undefined): RoiStatus {
  if (!observed) return "INSUFFICIENT_EVIDENCE";
  const values = Object.values(observed);
  if (!values.every(validNonNegative)) return "INSUFFICIENT_EVIDENCE";
  const totalObservations = values.reduce((sum, value) => sum + value, 0);
  return totalObservations > 0 ? "MEASURABLE" : "INSUFFICIENT_EVIDENCE";
}

export function calculateRoi(inputs: RoiInputs, observed: RoiObserved | null | undefined) {
  const securityStatus = roiMeasurementState(observed);
  const validFinancialInputs = Object.values(inputs).every(validNonNegative);

  if (securityStatus !== "MEASURABLE" || !validFinancialInputs) {
    return {
      status: securityStatus === "MEASURABLE" && !validFinancialInputs ? "UNMEASURABLE" as const : securityStatus,
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

  const preventionValue = inputs.annualIncidentCostAvoided;
  const engineeringValue = inputs.engineeringHoursSaved * inputs.engineeringHourlyCost;
  const aiSpendValue = inputs.annualAiSpendAvoided;
  const auditValue = inputs.annualAuditCostAvoided;
  const annualBenefit = preventionValue + engineeringValue + aiSpendValue + auditValue;
  const investment = inputs.annualElitzeCost;

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
