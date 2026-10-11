import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const lock = JSON.parse(fs.readFileSync(path.join(root, "package-lock.json"), "utf8"));
const rows = [];

for (const [packagePath, lockEntry] of Object.entries(lock.packages ?? {})) {
  if (!packagePath.startsWith("node_modules/")) continue;
  let manifest = lockEntry;
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(root, packagePath, "package.json"), "utf8"));
  } catch {}
  let license = manifest.license ?? manifest.licenses ?? lockEntry.license ?? "UNKNOWN";
  if (Array.isArray(license)) {
    license = license.map((entry) => typeof entry === "string" ? entry : entry?.type).filter(Boolean).join(" OR ");
  } else if (license && typeof license === "object") {
    license = license.type ?? JSON.stringify(license);
  }
  license = typeof license === "string" && license.trim() ? license.trim() : "UNKNOWN";
  rows.push({
    name: packagePath.replace(/^node_modules\//, ""),
    version: manifest.version ?? lockEntry.version ?? "UNKNOWN",
    license,
  });
}

rows.sort((a, b) => a.name.localeCompare(b.name));
const counts = new Map();
for (const row of rows) counts.set(row.license, (counts.get(row.license) ?? 0) + 1);
const countRows = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
const restrictedReview = rows.filter((row) => /LGPL|GPL|AGPL|SSPL|BUSL|Commons Clause|UNKNOWN|UNLICENSED|SEE LICENSE/i.test(row.license));
const escapeCell = (value) => String(value).replaceAll("|", "\\|");

const output = [
  "# Third-Party Dependency License Inventory",
  "",
  "**Snapshot date:** 11 October 2026",
  "**Source:** installed package manifests resolved by the root package lockfile.",
  "**Scope:** declared metadata for direct and transitive npm packages. This is a screening inventory, not legal advice or proof of redistribution compliance.",
  "",
  "## Summary",
  "",
  "| Check | Result |",
  "|---|---:|",
  "| Package manifests inspected | " + rows.length + " |",
  "| Dependencies with a declared license field | " + rows.filter((row) => row.license !== "UNKNOWN").length + " |",
  "| Dependencies requiring focused license/legal review | " + restrictedReview.length + " |",
  "| Root-level ELITZE project LICENSE | Not found |",
  "",
  "### Declared license-field counts",
  "",
  "| Declared license expression | Packages |",
  "|---|---:|",
  ...countRows.map(([license, count]) => "| " + escapeCell(license) + " | " + count + " |"),
  "",
  "## Focused review list",
  "",
  "These entries are not automatically prohibited. Their exact license texts, usage paths, binary distribution, notices and any applicable conditions must be reviewed before a proprietary acquisition transfer.",
  "",
  "| Package | Version | Declared license expression |",
  "|---|---|---|",
  ...restrictedReview.map((row) => "| " + escapeCell(row.name) + " | " + escapeCell(row.version) + " | " + escapeCell(row.license) + " |"),
  "",
  "## Full dependency inventory",
  "",
  "| Package | Version | Declared license expression |",
  "|---|---|---|",
  ...rows.map((row) => "| " + escapeCell(row.name) + " | " + escapeCell(row.version) + " | " + escapeCell(row.license) + " |"),
  "",
  "## Limits and next legal checks",
  "",
  "- License fields in package metadata can be incomplete or inaccurate; inspect authoritative license texts and publisher notices.",
  "- Confirm whether optional platform binaries are shipped in production artifacts and review each applicable LGPL/MIT/Apache or combined-license obligation.",
  "- Review the project's prior public distribution and full contributor history; a private repository and this inventory do not establish exclusive title.",
  "- Produce the definitive third-party notices bundle and have counsel verify transfer/redistribution rights before signing an asset sale.",
  "- Re-run this inventory after dependency changes and regenerate the CycloneDX SBOM from the same lockfile.",
  "",
].join("\n");

const outputPath = path.join(root, "sales", "THIRD-PARTY-LICENSE-INVENTORY-2026-10-11.md");
fs.writeFileSync(outputPath, output, "utf8");
console.log("Wrote " + path.relative(root, outputPath) + ": " + rows.length + " packages; " + restrictedReview.length + " need focused license review.");
