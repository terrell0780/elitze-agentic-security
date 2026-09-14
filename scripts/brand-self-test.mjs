import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const allowedDocs = ["docs/legal/", "docs/2026-GOOGLE-", "sales/"];
const prohibitedBrandTerms = [
  /anthropic/i,
  /openai/i,
  /google ai studio/i,
  /gemini/i,
  /copilot/i,
  /cursor/i,
  /casky/i,
  /manus/i,
  /salts team/i,
  /god'?s eye/i,
];

const files = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" })
  .split(/\r?\n/).filter(Boolean)
  .filter((file) => /\.(ts|tsx|js|mjs|md|json|yml|yaml|css)$/.test(file));

const failures = [];
for (const rel of files) {
  const file = fs.readFileSync(path.join(root, rel), "utf8");
  if (allowedDocs.some((prefix) => rel.startsWith(prefix))) continue;
  for (const pattern of prohibitedBrandTerms) {
    if (pattern.test(file)) {
      failures.push(`${rel}: prohibited third-party product branding match (${pattern})`);
      break;
    }
  }
}

if (failures.length) {
  console.error("ELITZE brand self-test failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`ELITZE brand self-test passed for ${files.length} scanned text files.`);
