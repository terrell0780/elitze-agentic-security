import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const allowedReferenceDocs = ["docs/legal/", "docs/2026-GOOGLE-", ".env.example"];
const prohibitedBrandTerms = [
  /\bAnthropic\b/,
  /\bOpenAI\b/,
  /\bGoogle AI Studio\b/i,
  /\bGemini\b/,
  /\bCopilot\b/,
  /\bCursor(?:\s+(?:AI|editor|IDE))?\b/,
  /\bCasky\b/i,
  /\bManus\b/,
  /\bSalts Team\b/i,
  /\bGod['’]s Eye\b/i,
];
const prohibitedDomains = [
  /\belitze\.ca\b/i,
];

const files = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" })
  .split(/\r?\n/).filter(Boolean)
  .filter((file) => /\.(ts|tsx|js|mjs|md|json|yml|yaml|css)$/.test(file));

const failures = [];
for (const rel of files) {
  const file = fs.readFileSync(path.join(root, rel), "utf8");
  if (allowedReferenceDocs.some((prefix) => rel.startsWith(prefix))) continue;
  if (rel === "scripts/brand-self-test.mjs") continue;
  for (const pattern of prohibitedBrandTerms) {
    if (pattern.test(file)) {
      failures.push(`${rel}: prohibited third-party product branding match (${pattern})`);
      break;
    }
  }
  for (const pattern of prohibitedDomains) {
    if (pattern.test(file)) {
      failures.push(`${rel}: obsolete ELITZE domain reference (${pattern})`);
      break;
    }
  }
}

const registerRoutePath = path.join(root, "src/app/api/auth/register/route.ts");
if (fs.existsSync(registerRoutePath)) {
  const registerRoute = fs.readFileSync(registerRoutePath, "utf8");
  if (!registerRoute.includes('process.env.NEXT_PUBLIC_SITE_URL || "https://elitze.info"')) {
    failures.push("src/app/api/auth/register/route.ts: canonical ELITZE fallback domain must be https://elitze.info");
  }
}

if (failures.length) {
  console.error("ELITZE brand self-test failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`ELITZE brand self-test passed for ${files.length} scanned text files.`);
