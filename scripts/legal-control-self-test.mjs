import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "docs/ELITZE-GLOBAL-SECURITY-COMPLIANCE.md",
  "docs/legal/ELITZE-PRIVACY-NOTICE-2026.md",
  "docs/legal/ELITZE-TERMS-OF-SERVICE-2026.md",
  "docs/legal/ELITZE-AI-TRANSPARENCY-AND-USE-2026.md",
  "docs/legal/2026-AI-TERMS-CHANGELOG.md",
  "src/lib/elitze-secure/compliance-catalog.ts",
];

for (const relative of required) {
  assert.equal(fs.existsSync(path.join(root, relative)), true, "missing legal/compliance control asset: " + relative);
}

const globalCompliance = fs.readFileSync(path.join(root, "docs/ELITZE-GLOBAL-SECURITY-COMPLIANCE.md"), "utf8");
for (const requiredText of [
  "No evidence, no claim.",
  "PIPEDA",
  "EU GDPR",
  "EU AI Act",
  "SOC 2",
  "ISO/IEC 27001",
  "External legal counsel",
]) {
  assert.equal(globalCompliance.includes(requiredText), true, "missing control language: " + requiredText);
}

const catalog = fs.readFileSync(path.join(root, "src/lib/elitze-secure/compliance-catalog.ts"), "utf8");
for (const requiredId of ["CA-PIPEDA", "EU-GDPR", "EU-AI-ACT", "SOC2", "ISO-27001", "NIST-AI-RMF"]) {
  assert.equal(catalog.includes('id: "' + requiredId + '"'), true, "missing compliance catalog entry: " + requiredId);
}

const publicRoot = path.join(root, "src", "app");
function walk(directory) {
  const results = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...walk(absolute));
    else if (/\.(ts|tsx)$/.test(entry.name)) results.push(absolute);
  }
  return results;
}

const forbiddenPublicClaims = [
  /globally\s+compliant/i,
  /SOC\s*2\s+certified/i,
  /ISO\/?IEC\s*27001\s+certified/i,
];
for (const filePath of walk(publicRoot)) {
  const relative = path.relative(root, filePath);
  const source = fs.readFileSync(filePath, "utf8");
  for (const pattern of forbiddenPublicClaims) {
    assert.doesNotMatch(source, pattern, "unsupported public legal/compliance claim in " + relative + ": " + pattern);
  }
}

console.log("ELITZE legal control self-test: PASS");
