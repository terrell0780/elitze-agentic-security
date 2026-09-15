import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "src/lib/elitze-secure/deterministic-policy.ts",
  "src/lib/elitze-secure/evidence-receipt.ts",
  "src/app/api/security/policies/route.ts",
  "src/app/api/mcp-gateway/evidence/export/route.ts",
  "scripts/verify-evidence.mjs",
  "drizzle/0016_policy_and_evidence_ledger.sql",
  "docs/ELITZE-PHASE-3-4-POLICY-EVIDENCE.md",
];
for (const relative of required) {
  if (!fs.existsSync(path.join(root, relative))) throw new Error(`missing:${relative}`);
}
const policy = fs.readFileSync(path.join(root, "src/lib/elitze-secure/deterministic-policy.ts"), "utf8");
for (const term of ["ALLOW", "DENY", "REQUIRE_APPROVAL", "ALLOW_WITH_CONSTRAINTS", "humanOwner", "impactLevel", "timeWindow", "parsePolicyDocument", "evaluatePolicies"]) {
  if (!policy.includes(term)) throw new Error(`policy_feature_missing:${term}`);
}
const migration = fs.readFileSync(path.join(root, "drizzle/0016_policy_and_evidence_ledger.sql"), "utf8");
for (const term of ["security_policies", "evidence_state", "evidence_source", "freshness_at", "previous_evidence_hash", "evidence_signature", "append_only"]) {
  if (!migration.includes(term)) throw new Error(`evidence_feature_missing:${term}`);
}
const exportRoute = fs.readFileSync(path.join(root, "src/app/api/mcp-gateway/evidence/export/route.ts"), "utf8");
for (const term of ["application/pdf", "format", "evidenceEvent", "recordHash", "signature"]) {
  if (!exportRoute.includes(term)) throw new Error(`export_feature_missing:${term}`);
}
console.log(`ELITZE Phase 3/4 self-test passed: ${required.length} required artifacts verified.`);
