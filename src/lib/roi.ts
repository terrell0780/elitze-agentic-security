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

export function calculateRoi(inputs: RoiInputs) {
  const preventionValue = Math.max(0, inputs.annualIncidentCostAvoided);
  const engineeringValue = Math.max(0, inputs.engineeringHoursSaved) * Math.max(0, inputs.engineeringHourlyCost);
  const aiSpendValue = Math.max(0, inputs.annualAiSpendAvoided);
  const auditValue = Math.max(0, inputs.annualAuditCostAvoided);
  const annualBenefit = preventionValue + engineeringValue + aiSpendValue + auditValue;
  const investment = Math.max(0, inputs.annualElitzeCost);
  const netBenefit = annualBenefit - investment;
  const roiPercent = investment > 0 ? (netBenefit / investment) * 100 : null;
  const paybackMonths = annualBenefit > 0 && investment > 0 ? (investment / annualBenefit) * 12 : null;

  return {
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

export function roiMeasurementState(observed: RoiObserved) {
  const totalObservations = Object.values(observed).reduce((sum, value) => sum + Math.max(0, value), 0);
  return totalObservations > 0 ? "MEASURABLE" : "UNMEASURABLE";
}
