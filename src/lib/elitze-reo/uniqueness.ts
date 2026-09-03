import type { UniquenessSignals } from "./types";

const values = (signals: UniquenessSignals): number[] => [
  signals.semanticSimilarity,
  signals.lexicalSimilarity,
  signals.structuralSimilarity,
  signals.headingSimilarity,
  signals.entityOverlap,
  signals.ctaSimilarity,
  signals.internalLinkPatternSimilarity,
  signals.crossDomainSimilarity,
].filter((value): value is number => value !== null);

export function uniquenessScore(signals: UniquenessSignals): number | null {
  const available = values(signals);
  if (available.length === 0 || signals.templateFingerprintMatch === null) return null;
  const average = available.reduce((sum, value) => sum + value, 0) / available.length;
  const templatePenalty = signals.templateFingerprintMatch ? 30 : 0;
  return Math.max(0, Math.min(100, 100 - average - templatePenalty));
}

export function requiresHumanReview(signals: UniquenessSignals): boolean {
  const score = uniquenessScore(signals);
  if (score === null) return true;
  return score < 70 || signals.templateFingerprintMatch === true || signals.clusterId !== null;
}
