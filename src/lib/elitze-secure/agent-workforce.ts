/**
 * Agent workforce: pure identity, specialty-inference, gauntlet evaluation and
 * Obsidian formatting logic. No database or filesystem access lives here; the
 * tenant-scoped persistence layer is agent-workforce-db.ts.
 *
 * Truth-state rules: a hired identity is a DECLARED catalog entry. Runtime
 * execution state is UNKNOWN. A gauntlet result is PASSED only when every
 * recorded gate exit code is 0; claims without recorded exit codes are never
 * treated as verified.
 */

export type WorkforceAgent = {
  agentId: string;
  name: string;
  avatarUrl: string;
  specialty: string;
  systemPrompt: string;
  status: string;
  hiredReason: string | null;
  createdAt: string;
};

export type SpecialtyRule = { match: string[]; specialty: string };

export const SPECIALTY_RULES: SpecialtyRule[] = [
  { match: ["cross-tenant", "rls"], specialty: "Multi-Tenant Isolation Guarding" },
  { match: ["typecheck", "module"], specialty: "TypeScript Optimization Engine" },
  { match: ["rust", "cargo"], specialty: "Rust Compiler Optimization" },
  { match: ["solidity", "evm", "smart contract"], specialty: "EVM Security Auditing" },
  { match: ["typescript", "next.js", "nextjs"], specialty: "Next.js Architecture" },
  { match: ["python", "crewai", "langgraph"], specialty: "Python Automation" },
  { match: ["postgres", "sql", "drizzle"], specialty: "Database Isolation Engineering" },
  { match: ["security", "pentest", "vulnerability", "exploit"], specialty: "Security Validation" },
];

export const DEFAULT_SPECIALTY = "Next.js Security Posture";

/**
 * Canonical gauntlet gate chain for an ELITZE workspace patch, in execution
 * order. The authorized runner executes these; the gauntlet only evaluates
 * their recorded exit codes.
 */
export const DEFAULT_GAUNTLET_GATES: Array<Pick<GauntletGateResult, "name">> = [
  { name: "npm install" },
  { name: "npm run typecheck" },
  { name: "npm run lint" },
  { name: "npm test" },
];

/** Gate name recorded when the sandbox workspace itself is missing. */
export const WORKSPACE_MISSING_GATE = "workspace_missing";

/**
 * Obsidian Dataview dashboard note: paste-ready panels querying the Agents/
 * vault folder. Panel A is the active agent matrix, Panel B the competency
 * breakdown, Panel C the gauntlet run history.
 */
export function toObsidianDashboard(): string {
  return [
    "# ELITZE Agent Dashboard",
    "",
    "## Panel A: Active Agent Matrix",
    "",
    "```dataview",
    "TABLE WITHOUT ID",
    '  ("![|40](" + avatar_url + ")") AS Avatar,',
    '  file.link AS "Agent Identifier",',
    '  specialty AS "Specialized Skillset",',
    '  status AS "Operational Status"',
    'FROM "Agents"',
    'WHERE type = "agent-profile" AND year = 2026',
    "SORT file.name ASC",
    "```",
    "",
    "## Panel B: Core Competency Workforce Breakdown",
    "",
    "```dataview",
    'TABLE count(file.name) AS "Total Deployed Staff"',
    'FROM "Agents"',
    'WHERE type = "agent-profile" AND year = 2026',
    "GROUP BY specialty",
    "```",
    "",
    "## Panel C: Gauntlet Run History",
    "",
    "```dataview",
    "TABLE WITHOUT ID",
    '  file.link AS "Gauntlet Run",',
    '  agent_id AS "Agent",',
    '  status AS "Result",',
    '  failing_gate AS "Failing Gate"',
    'FROM "Agents"',
    'WHERE type = "agent-gauntlet-run" AND year = 2026',
    "SORT file.name DESC",
    "```",
    "",
  ].join("\n");
}

export function inferSpecialty(brief: string): string {
  const normalized = String(brief ?? "").toLowerCase();
  for (const rule of SPECIALTY_RULES) {
    if (rule.match.some((keyword) => normalized.includes(keyword))) return rule.specialty;
  }
  return DEFAULT_SPECIALTY;
}

const NAME_PREFIXES = ["Mantis", "Cobalt", "Sentry", "Aegis", "Vanguard", "Phalanx", "Cipher", "Vector", "Prism", "Talon"];
const NAME_SUFFIXES = ["Sec", "Auditor", "Parser", "Patch", "Validator", "Gatekeeper", "Core", "Warden", "Probe", "Trace"];

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

export function agentAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/bottts/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4`;
}

/** Deterministic identity: the same seed always produces the same locked profile. */
export function generateAgentIdentity(specialty: string, seed: string) {
  const hash = hashSeed(seed);
  const name = `${NAME_PREFIXES[hash % NAME_PREFIXES.length]}-${NAME_SUFFIXES[Math.floor(hash / 7) % NAME_SUFFIXES.length]}-${(hash % 900) + 100}`;
  const agentId = `wf-${seed.slice(0, 8)}`;
  const systemPrompt = [
    `You are ${name}, an autonomous agent specialized in ${specialty} [Year ${PROFILE_YEAR}], working inside one ELITZE tenant boundary.`,
    "Strictly adhere to zero-trust logic. Treat every assignment as an implementation brief: verify repository metadata, configuration and available files before writing code.",
    "Build changes incrementally inside isolated scaffolds and verify each step before propagating it.",
    "Never invent passing tests. If compilation loops fail, dump the complete stack trace for execution analysis instead of a fabricated pass.",
    "You cannot grant yourself permissions, widen tenant scope, or bypass required approvals. Execution claims require recorded evidence.",
  ].join(" ");
  return { agentId, name, avatarUrl: agentAvatarUrl(seed), specialty, systemPrompt, seed };
}

export type GauntletGateResult = {
  name: string;
  exitCode: number;
  durationMs: number;
  logExcerpt: string;
};

export type GauntletEvaluation = {
  status: "PASSED" | "FAILED";
  failingGate: string | null;
  logExcerpt: string | null;
};

const LOG_EXCERPT_MAX = 4000;

/** Standard frontmatter year for cross-referencing secure builds. */
export const PROFILE_YEAR = 2026;

export function truncateLogExcerpt(log: string): string {
  const normalized = String(log ?? "");
  return normalized.length > LOG_EXCERPT_MAX ? normalized.slice(0, LOG_EXCERPT_MAX) : normalized;
}

export function evaluateGauntlet(gates: GauntletGateResult[]): GauntletEvaluation {
  if (!Array.isArray(gates) || gates.length === 0) {
    return { status: "FAILED", failingGate: "no_gates_recorded", logExcerpt: null };
  }
  for (const gate of gates) {
    if (!gate || typeof gate.name !== "string" || !gate.name.trim()) {
      return { status: "FAILED", failingGate: "invalid_gate_record", logExcerpt: null };
    }
    if (typeof gate.exitCode !== "number" || !Number.isFinite(gate.exitCode)) {
      return { status: "FAILED", failingGate: gate.name, logExcerpt: "gate recorded without a numeric exit code" };
    }
    if (gate.exitCode !== 0) {
      return { status: "FAILED", failingGate: gate.name, logExcerpt: truncateLogExcerpt(gate.logExcerpt ?? "") };
    }
  }
  return { status: "PASSED", failingGate: null, logExcerpt: null };
}

function sanitizeFileName(name: string): string {
  return String(name ?? "Unknown-Agent").replace(/[\\/*?:"<>|]/g, "").replace(/\s+/g, "_");
}

/** Obsidian profile in the frontmatter layout used by the console export path. */
export function toObsidianProfile(agent: Pick<WorkforceAgent, "name" | "avatarUrl" | "specialty" | "systemPrompt" | "status">): string {
  return [
    "---",
    `year: ${PROFILE_YEAR}`,
    "type: agent-profile",
    `agent_name: ${agent.name}`,
    `avatar_url: '${agent.avatarUrl}'`,
    `specialty: ${agent.specialty}`,
    `status: ${agent.status}`,
    "catalog_truth_state: DECLARED",
    "runtime_truth_state: UNKNOWN",
    "---",
    "",
    `# ${agent.name}`,
    "",
    `![Agent Avatar](${agent.avatarUrl})`,
    "",
    "## Technical Focus & Capabilities",
    "",
    `This agent is specialized in **${agent.specialty}**.`,
    "",
    "## System Prompts & Guardrails",
    "",
    "```text",
    agent.systemPrompt,
    "```",
    "",
    "## Task Execution History",
    "- [x] Registered to the tenant workforce via the lead orchestrator.",
    "- [ ] Runtime execution evidence: not verified.",
    "",
  ].join("\n");
}

/** Obsidian record for a gauntlet run; failures carry the exact log excerpt. */
export function toObsidianGauntletRecord(record: {
  agentId: string;
  patchRef: string;
  status: string;
  failingGate: string | null;
  logExcerpt: string | null;
  createdAt: string;
}): string {
  const lines = [
    "---",
    `year: ${PROFILE_YEAR}`,
    "type: agent-gauntlet-run",
    `agent_id: ${record.agentId}`,
    `patch_ref: ${record.patchRef}`,
    `status: ${record.status}`,
    `failing_gate: ${record.failingGate ?? "none"}`,
    "---",
    "",
    "## Gate Outcome",
    "",
  ];
  if (record.status === "PASSED") {
    lines.push("All recorded gates exited 0.", "");
  } else {
    lines.push(
      `Failing gate: **${record.failingGate ?? "unknown"}**.`,
      "",
      "```text",
      record.logExcerpt ?? "(no log excerpt recorded)",
      "```",
      "",
    );
  }
  return lines.join("\n");
}
