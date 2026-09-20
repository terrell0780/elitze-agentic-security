export type ProgressiveProofStage =
  | "UNMEASURABLE"
  | "OBSERVED"
  | "INTEGRITY_VERIFIED"
  | "RETESTED"
  | "PROVEN";

export type ProgressiveProofInput = {
  evidenceState?: string | null;
  sourceRef?: string | null;
  observedAt?: string | Date | null;
  recordHash?: string | null;
  retestStatus?: string | null;
  upstreamResultHash?: string | null;
  receiptVerified?: boolean;
};

export type ProgressiveProofResult = {
  stage: ProgressiveProofStage;
  nextAction: string;
  observed: boolean;
  integrityVerified: boolean;
  retested: boolean;
  proven: boolean;
};

const text = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  return null;
};

export function evaluateProgressiveProof(input: ProgressiveProofInput): ProgressiveProofResult {
  const observed =
    input.evidenceState === "OBSERVED" &&
    Boolean(text(input.sourceRef)) &&
    Boolean(text(input.observedAt)) &&
    Boolean(text(input.recordHash));

  if (!observed) {
    return {
      stage: "UNMEASURABLE",
      nextAction: "Capture a real observed evidence record with source reference, observation time and evidence hash.",
      observed: false,
      integrityVerified: false,
      retested: false,
      proven: false,
    };
  }

  const integrityVerified = input.receiptVerified === true;
  if (!integrityVerified) {
    return {
      stage: "OBSERVED",
      nextAction: "Verify the signed evidence receipt before treating the observation as proof.",
      observed: true,
      integrityVerified: false,
      retested: false,
      proven: false,
    };
  }

  const retested = input.retestStatus === "PASSED";
  if (!retested) {
    return {
      stage: "INTEGRITY_VERIFIED",
      nextAction: "Run an authorized retest of the affected path and record the actual result.",
      observed: true,
      integrityVerified: true,
      retested: false,
      proven: false,
    };
  }

  const proven = Boolean(text(input.upstreamResultHash));
  if (!proven) {
    return {
      stage: "RETESTED",
      nextAction: "Attach the observed upstream result hash before marking the condition proven.",
      observed: true,
      integrityVerified: true,
      retested: true,
      proven: false,
    };
  }

  return {
    stage: "PROVEN",
    nextAction: "No further proof step is required for this evidence record.",
    observed: true,
    integrityVerified: true,
    retested: true,
    proven: true,
  };
}
