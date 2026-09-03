import { createHash } from "node:crypto";
import type { ContentProvenance } from "./types";

export function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function buildContentHash(content: string): string {
  return sha256(content);
}

export function verifyProvenance(provenance: ContentProvenance, content: string): boolean {
  if (!provenance.contentId || !provenance.tenantId || !provenance.authorId) return false;
  if (!provenance.contentHash || provenance.contentHash !== buildContentHash(content)) return false;
  if (!Array.isArray(provenance.sourceIds) || !Array.isArray(provenance.revisionChain)) return false;
  if (!Array.isArray(provenance.humanContributors) || !Array.isArray(provenance.evidenceHashes)) return false;
  if (!Array.isArray(provenance.mediaHashes)) return false;
  return true;
}

export function verifyEvidence(
  evidence: Array<{ id: string; contentHash: string; verified: boolean }>,
): boolean {
  return evidence.length > 0 && evidence.every((item) => Boolean(item.id && item.contentHash && item.verified));
}
