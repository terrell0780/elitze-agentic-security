import assert from "node:assert/strict";
import fs from "node:fs";

const required = [
  "docs/legal/ELITZE-PRIVACY-NOTICE-2026.md",
  "docs/legal/ELITZE-TERMS-OF-SERVICE-2026.md",
  "docs/legal/ELITZE-AI-TRANSPARENCY-AND-USE-2026.md",
  "docs/legal/ELITZE-DATA-PROCESSING-ADDENDUM-2026.md",
  "docs/legal/ELITZE-SECURITY-ADDENDUM-2026.md",
  "docs/legal/ELITZE-SUBPROCESSOR-REGISTER-2026.md",
  "docs/legal/ELITZE-ACCEPTABLE-USE-POLICY-2026.md",
  "docs/legal/ELITZE-VULNERABILITY-DISCLOSURE-2026.md",
  "docs/legal/ELITZE-INCIDENT-RESPONSE-FRAMEWORK-2026.md",
  "docs/legal/ELITZE-ENTERPRISE-LEGAL-CONTROL-PACK-2026.md",
];

for (const path of required) {
  assert.ok(fs.existsSync(path), path);
  assert.ok(fs.statSync(path).size > 500, path);
}

for (const path of required) {
  const content = fs.readFileSync(path, "utf8").toLowerCase();
  assert.ok(!content.includes("fully compliant"), path);
  assert.ok(!content.includes("guaranteed secure"), path);
}

console.log("ELITZE legal-control pack self-test: PASS");
