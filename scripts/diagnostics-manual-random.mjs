import { execFileSync } from "node:child_process";
import { randomInt } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const startedAt = new Date();

if (!process.env.DATABASE_URL && process.env.NEON_PROJECT_ID) {
  const command = process.platform === "win32" ? process.env.ComSpec : "npx";
  const args = process.platform === "win32"
    ? ["/d", "/s", "/c", "npx neonctl connection-string --project-id " + process.env.NEON_PROJECT_ID]
    : ["neonctl", "connection-string", "--project-id", process.env.NEON_PROJECT_ID];
  const output = execFileSync(command, args, { cwd: root, encoding: "utf8", windowsHide: true });
  const url = output.split(/\r?\n/).map((line) => line.trim()).findLast((line) => line.startsWith("postgres"));
  if (!url) throw new Error("NEON_PROJECT_ID did not yield a PostgreSQL connection string.");
  process.env.DATABASE_URL = url;
}
const tests = [
  ["security:self-test", "Core security policy"],
  ["data-bridge:self-test", "Data bridge controls"],
  ["mcp-workload-identity:self-test", "MCP workload identity"],
  ["policy-evidence:self-test", "Policy/evidence"],
  ["phase5-6:self-test", "Real integration control"],
  ["global-compliance:self-test", "Global compliance catalog"],
  ["legal:control-self-test", "Legal control pack"],
  ["brand:self-test", "ELITZE public brand"],
  ["production-config:self-test", "Production identity/config"],
  ["tenant-overview:self-test", "Tenant isolation"],
  ["auth:security-self-test", "Authentication security"],
  ["progressive-proofing:self-test", "Progressive proofing"],
  ["evidence-expression:self-test", "Evidence expression"],
  ["pentest-request:self-test", "Pentest request controls"],
  ["security-fabric:self-test", "Security source fabric"],
  ["security-graph:self-test", "Security graph"],
  ["google-ads-governance:self-test", "Advertising governance"],
  ["contact-acquisition:self-test", "Contact/acquisition routing"],
  ["rag:self-test", "RAG/vector controls"],
  ["braces:self-test", "Dependency security patch"],
  ["agent-workflow:self-test", "Agent workflows"],
  ["trust-ownership:self-test", "Trust/ownership controls"],
  ["reo-market-intelligence:self-test", "REO market intelligence"],
  ["business-process:self-test", "Business process controls"],
];

const shuffled = [...tests];
for (let i = shuffled.length - 1; i > 0; i -= 1) {
  const j = randomInt(i + 1);
  [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
}

function run(name) {
  const started = Date.now();
  try {
    const command = process.platform === "win32" ? process.env.ComSpec : "npm";
    const args = process.platform === "win32"
      ? ["/d", "/s", "/c", "npm run " + name]
      : ["run", name];
    execFileSync(command, args, {
      cwd: root,
      env: process.env,
      stdio: "ignore",
      windowsHide: true,
    });
    return { name, ok: true, durationMs: Date.now() - started };
  } catch (error) {
    return {
      name,
      ok: false,
      durationMs: Date.now() - started,
      exitCode: error?.status ?? 1,
    };
  }
}

const results = [];
for (const [name] of shuffled) results.push(run(name));

const builtins = [
  ["typecheck", "TypeScript"],
  ["lint", "ESLint"],
  ["build", "Production build"],
];
for (const [name] of builtins) results.push(run(name));

const report = {
  suite: "ELITZE Agentic Security — manual randomized diagnostics",
  startedAt: startedAt.toISOString(),
  finishedAt: new Date().toISOString(),
  randomizedOrder: shuffled.map(([name, label]) => ({ name, label })),
  results,
  allGreen: results.every((item) => item.ok),
  hostname: process.env.COMPUTERNAME ?? "unknown",
};

const outDir = path.join(root, "docs", "diagnostics");
fs.mkdirSync(outDir, { recursive: true });
const stamp = startedAt.toISOString().replace(/[:.]/g, "-");
const jsonPath = path.join(outDir, `DIAGNOSTICS-${stamp}.json`);
const mdPath = path.join(outDir, `DIAGNOSTICS-${stamp}.md`);

fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + "\n", "utf8");
const lines = [
  "# ELITZE Agentic Security — Manual Randomized Diagnostics",
  "",
  `Started: ${report.startedAt}`,
  `Finished: ${report.finishedAt}`,
  `Overall: ${report.allGreen ? "GREEN" : "FAILED"}`,
  "",
  "## Randomized diagnostic order",
  ...report.randomizedOrder.map((item, index) => `${index + 1}. ${item.label} — \`${item.name}\``),
  "",
  "## Results",
  ...report.results.map((item) => `- ${item.ok ? "PASS" : "FAIL"} — \`${item.name}\` — ${item.durationMs} ms${item.exitCode ? ` — exit ${item.exitCode}` : ""}`),
  "",
  "## Evidence boundary",
  "This report records command outcomes only. It does not convert unavailable third-party integrations, customer evidence, revenue evidence, or legal title into verified claims.",
  "",
];
fs.writeFileSync(mdPath, lines.join("\n") + "\n", "utf8");

console.log(JSON.stringify({
  ok: report.allGreen,
  jsonPath: path.relative(root, jsonPath),
  mdPath: path.relative(root, mdPath),
  count: results.length,
  failed: results.filter((item) => !item.ok).map((item) => item.name),
}, null, 2));
if (!report.allGreen) process.exit(1);
