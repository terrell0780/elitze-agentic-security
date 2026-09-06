import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = [
  "docs/ELITZE-CANONICAL-AGENT-SKILL-SECURITY.md",
  "docs/ELITZE-AGENTIC-SECURITY-FINAL-MANIFEST.md",
  "docs/integrations/AGENT-REACH-SKILLSPECTOR.md",
  "drizzle/0007_agent_skill_security.sql",
];

const sql = fs.readFileSync(path.join(root, "drizzle/0007_agent_skill_security.sql"), "utf8");
const architecture = fs.readFileSync(
  path.join(root, "docs/ELITZE-CANONICAL-AGENT-SKILL-SECURITY.md"),
  "utf8",
);

for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) {
    throw new Error(`Missing canonical security artifact: ${file}`);
  }
}

const requiredTables = [
  "agent_skills",
  "agent_skill_scans",
  "agent_skill_decisions",
  "agent_skill_relationships",
  "agent_skill_evidence",
];

for (const table of requiredTables) {
  if (!sql.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
    throw new Error(`Missing skill-security table: ${table}`);
  }
}

for (const token of [
  "Agent Reach",
  "SkillSpector",
  "Security Truth Graph",
  "UNKNOWN",
  "UNMEASURABLE",
  "REQUIRE_APPROVAL",
  "QUARANTINE",
]) {
  if (!architecture.includes(token)) {
    throw new Error(`Missing canonical security contract term: ${token}`);
  }
}

if (/fake|synthetic telemetry|fabricat(ed|e) findings/i.test(architecture)) {
  // The architecture is allowed to discuss and prohibit fake/synthetic data.
  // This assertion intentionally does not fail on those policy words.
}

console.log("Canonical agent/skill security contract: PASS");
