export type ReoDecision = "APPROVE" | "REVIEW" | "QUEUE" | "BLOCK";

export type RiskDimension = {
  scale: number | null;
  duplication: number | null;
  thinness: number | null;
  factuality: number | null;
  staleness: number | null;
  policy: number | null;
  provenance: number | null;
  reputation: number | null;
};

export type ContentProvenance = {
  contentId: string;
  tenantId: string;
  authorId: string;
  modelId: string | null;
  modelProvider: string | null;
  sourceIds: string[];
  generationTimestamp: string | null;
  revisionChain: string[];
  humanContributors: string[];
  evidenceHashes: string[];
  mediaHashes: string[];
  contentHash: string;
};

export type UniquenessSignals = {
  semanticSimilarity: number | null;
  lexicalSimilarity: number | null;
  structuralSimilarity: number | null;
  headingSimilarity: number | null;
  entityOverlap: number | null;
  templateFingerprintMatch: boolean | null;
  ctaSimilarity: number | null;
  internalLinkPatternSimilarity: number | null;
  crossDomainSimilarity: number | null;
  clusterId: string | null;
};

export type ReoAssessment = {
  contentId: string;
  decision: ReoDecision;
  trustScore: number | null;
  hardPolicyFailures: string[];
  riskDimensions: RiskDimension;
  provenanceVerified: boolean;
  evidenceVerified: boolean;
  uniqueness: number | null;
  semanticClusterId: string | null;
  auditEventId: string | null;
};

export type ReoInput = {
  provenance: ContentProvenance;
  content: string;
  evidence: Array<{ id: string; contentHash: string; verified: boolean }>;
  uniqueness?: UniquenessSignals;
  risk?: Partial<RiskDimension>;
  policyFailures?: string[];
  queueRequested?: boolean;
};
