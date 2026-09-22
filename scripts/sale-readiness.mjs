import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const tracked = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" })
  .split(/\r?\n/).filter(Boolean);

for (const forbidden of [".env", ".env.local", ".env.production"]) {
  if (tracked.includes(forbidden)) failures.push(`tracked secret-bearing file: ${forbidden}`);
}

const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/i,
  /(?:api[_-]?key|secret|token|password)\s*[:=]\s*["']?[A-Za-z0-9_\-]{32,}["']?/i,
  /postgres(?:ql)?:\/\/[^\s"']+:[^\s"']+@/i,
];

const publicCodeExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".css"]);
const textExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".md", ".yml", ".yaml", ".sql", ".css"]);
const publicCodeForbidden = [
  /God['’]s Eye/i,
  /salts team/i,
  /\btop[- ]?(?:1|3|5|five)\b/i,
  /\b(?:#1|number one|best in class|industry[- ]leading)\b/i,
  /fabricated (?:customer|review|statistic|benchmark)/i,
];

for (const rel of tracked) {
  if (!textExtensions.has(path.extname(rel))) continue;
  if (rel === ".env.example") continue;
  const file = fs.readFileSync(path.join(root, rel), "utf8");
  for (const pattern of secretPatterns) {
    if (pattern.test(file)) {
      failures.push(`possible secret pattern in ${rel}`);
      break;
    }
  }

  if (rel.startsWith("src/app/") || rel.startsWith("src/components/")) {
    if (publicCodeExtensions.has(path.extname(rel))) {
      for (const pattern of publicCodeForbidden) {
        if (pattern.test(file)) {
          failures.push(`unsupported/obsolete public claim or branding in ${rel}: ${pattern}`);
        }
      }
    }
  }
}

for (const required of [
  "docs/ELITZE-ROI.md",
  "docs/2026-ACQUISITION-MEASUREMENT.md",
  "docs/2026-GOOGLE-REO-RIO-READINESS.md",
  "docs/ELITZE-SECURITY-SKILLS.md",
  "docs/ELITZE-BRAND-AND-IP-POLICY.md",
  "docs/SALE-READINESS.md",
  "docs/BUYER-HANDOFF-CHECKLIST.md",
  "scripts/brand-self-test.mjs",
]) {
  if (!fs.existsSync(path.join(root, required))) failures.push(`missing sale-readiness asset: ${required}`);
}

if (failures.length) {
  console.error("ELITZE sale-readiness check failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`ELITZE sale-readiness check passed for ${tracked.length} tracked files.`);
