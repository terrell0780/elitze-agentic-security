#!/usr/bin/env node
import fs from "node:fs";
import crypto from "node:crypto";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/verify-evidence.mjs <evidence.json>");
  process.exit(2);
}
const secret = process.env.ELITZE_EVIDENCE_SIGNING_SECRET;
if (!secret) {
  console.error("ELITZE_EVIDENCE_SIGNING_SECRET is required");
  process.exit(2);
}

function stable(value) {
  return JSON.stringify(value, (_, current) => {
    if (current && typeof current === "object" && !Array.isArray(current)) return Object.fromEntries(Object.entries(current).sort(([a], [b]) => a.localeCompare(b)));
    return current;
  });
}
function hashEvidence(event, previousRecordHash) {
  return crypto.createHash("sha256").update(stable({ ...event, previousRecordHash })).digest("hex");
}
function signature(recordHash) {
  return crypto.createHmac("sha256", secret).update(recordHash).digest("base64url");
}
const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
const records = Array.isArray(parsed) ? parsed : parsed.evidence;
if (!Array.isArray(records)) throw new Error("evidence_array_required");

let previous = null;
let checked = 0;
for (const record of records) {
  if (!record.recordHash || !record.signature) throw new Error(`missing_signature:${record.decisionId ?? "unknown"}`);
  if ((record.previousRecordHash ?? null) !== previous) throw new Error(`hash_chain_failure:${record.decisionId ?? "unknown"}`);
  const event = record.evidenceEvent && typeof record.evidenceEvent === "object" ? record.evidenceEvent : {
    decisionId: record.requestId ?? record.decisionId,
    tenantId: record.tenantId,
    humanOwnerId: record.humanOwnerId,
    applicationId: record.applicationId,
    agentId: record.agentId,
    workloadSessionId: record.workloadSessionId,
    delegationSource: record.delegationSource,
    purpose: record.purpose,
    requestedCapability: record.requestedCapability,
    tool: record.tool,
    action: record.action,
    resource: record.resource ?? null,
    decision: record.decision,
    policyId: record.policyId,
    policyVersion: record.policyVersion,
    requestedAt: record.requestedAt,
    evidenceSource: record.evidenceSource,
    evidenceState: record.evidenceState,
    sourceRef: record.sourceRef,
    freshnessAt: record.freshnessAt,
  };
  const expectedHash = hashEvidence(event, previous);
  if (expectedHash !== record.recordHash) throw new Error(`record_hash_failure:${record.decisionId ?? "unknown"}`);
  if (signature(record.recordHash) !== record.signature) throw new Error(`signature_failure:${record.decisionId ?? "unknown"}`);
  previous = record.recordHash;
  checked += 1;
}
console.log(JSON.stringify({ ok: true, checked, finalRecordHash: previous }, null, 2));
