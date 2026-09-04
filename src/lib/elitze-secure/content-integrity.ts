import { Decision, EvidenceState } from "./decision.js";

export interface ContentAssessment {
  provenanceVerified: boolean;
  evidenceVerified: boolean;
  uniqueness: number | null;
  factuality: number | null;
  staleness: number | null;
  evidenceState: EvidenceState;
  hardFailure: boolean;
}

export function decideContent(a: ContentAssessment): Decision {
  if (a.hardFailure || !a.provenanceVerified) return "BLOCK";
  if (a.evidenceState === "UNKNOWN" || a.evidenceState === "UNMEASURABLE" || !a.evidenceVerified) return "REVIEW";
  const scores = [a.uniqueness, a.factuality, a.staleness].filter((v): v is number => v !== null);
  if (scores.length < 3) return "REVIEW";
  const min = Math.min(...scores);
  return min >= 70 ? "APPROVE" : min >= 40 ? "REVIEW" : "BLOCK";
}
