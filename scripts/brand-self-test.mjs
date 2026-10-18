import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const allowedReferenceDocs = ["docs/legal/", "docs/2026-GOOGLE-"];
const legacyBrand = ["myt", "hos"].join("");
const prohibitedBrandTerms = [
  /anthropic/i,
  /openai/i,
  /google ai studio/i,
  /gemini/i,
  /copilot/i,
  /\bcursor\b(?![-_])/i,
  /casky/i,
  /manus/i,
  /salts team/i,
  /god'?s eye/i,
  new RegExp("\\b" + legacyBrand + "\\b", "i"),
  /\\bELITZE[-\\s]SECURE\\b/,
  new RegExp("\\b" + ["f", "able"].join("") + "\\b", "i"),
  new RegExp("\\b" + ["l", "indy"].join("") + "\\b", "i"),
];

const files = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean)
  .filter((file) => /\.(tsx|md|json|css)$/.test(file))
  .filter((file) =>
    file.startsWith("src/app/") ||
    file.startsWith("src/components/") ||
    file.startsWith("docs/") ||
    file.startsWith("sales/") ||
    file === "README.md"
  )
  .filter((file) => file !== "scripts/brand-self-test.mjs")
  // A CycloneDX SBOM records real third-party package names; those are inventory metadata, not ELITZE branding claims.
  .filter((file) => !/^(?:sales|docs\/security)\/ELITZE-SBOM-.*\.cdx\.json$/.test(file));

const failures = [];
for (const rel of files) {
  const file = fs.readFileSync(path.join(root, rel), "utf8");
  if (allowedReferenceDocs.some((prefix) => rel.startsWith(prefix))) continue;
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

console.log(`ELITZE brand self-test passed for ${files.length} public/reference text files.`);
