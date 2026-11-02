import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  DEFAULT_SPECIALTY,
  PROFILE_YEAR,
  evaluateGauntlet,
  generateAgentIdentity,
  inferSpecialty,
  toObsidianGauntletRecord,
  toObsidianProfile,
  truncateLogExcerpt,
} from "../src/lib/elitze-secure/agent-workforce.ts";

// Specialty inference is deterministic from the brief.
assert.equal(inferSpecialty("cross-tenant rls policy regression"), "Multi-Tenant Isolation Guarding");
assert.equal(inferSpecialty("fix the typecheck module errors"), "TypeScript Optimization Engine");
assert.equal(inferSpecialty("fix the rust compiler bug in cargo workspace"), "Rust Compiler Optimization");
assert.equal(inferSpecialty("audit this solidity contract on the evm"), "EVM Security Auditing");
assert.equal(inferSpecialty("extend the next.js dashboard"), "Next.js Architecture");
assert.equal(inferSpecialty("python crewai worker for langgraph"), "Python Automation");
assert.equal(inferSpecialty("postgres query regression"), "Database Isolation Engineering");
assert.equal(inferSpecialty("pentest scope and vulnerability triage"), "Security Validation");
assert.equal(inferSpecialty("unclassified brief with no keywords"), DEFAULT_SPECIALTY);

// Identity is deterministic per seed and locked.
const identityA = generateAgentIdentity("Rust Compiler Optimization", "aaaaaaaaaaaaaaaa");
const identityA2 = generateAgentIdentity("Rust Compiler Optimization", "aaaaaaaaaaaaaaaa");
const identityB = generateAgentIdentity("Rust Compiler Optimization", "bbbbbbbbbbbbbbbb");
assert.deepEqual(identityA, identityA2, "same seed must reproduce the same locked identity");
assert.notEqual(identityA.agentId, identityB.agentId);
assert.match(identityA.name, /^[A-Z][a-z]+-[A-Z][a-z]+-\d{3}$/);
assert.ok(identityA.avatarUrl.startsWith("https://api.dicebear.com/9.x/bottts/svg?seed="));
assert.ok(identityA.systemPrompt.includes("Never invent passing tests"));
assert.ok(identityA.systemPrompt.includes("[Year 2026]"));
assert.ok(identityA.systemPrompt.includes("tenant boundary"));
assert.ok(identityA.systemPrompt.includes("cannot grant yourself permissions"));

// Gauntlet evaluation is fail-closed.
assert.equal(evaluateGauntlet([]).status, "FAILED");
assert.equal(evaluateGauntlet([]).failingGate, "no_gates_recorded");
assert.equal(evaluateGauntlet([{ name: "typecheck", exitCode: 1, durationMs: 5, logExcerpt: "error TS2304" }]).status, "FAILED");
assert.equal(evaluateGauntlet([{ name: "typecheck", exitCode: 1, durationMs: 5, logExcerpt: "error TS2304" }]).failingGate, "typecheck");
assert.equal(
  evaluateGauntlet([{ name: "typecheck", exitCode: 1, durationMs: 5, logExcerpt: "error TS2304" }]).logExcerpt,
  "error TS2304",
);
assert.equal(evaluateGauntlet([{ name: "typecheck", exitCode: 0, durationMs: 5, logExcerpt: "" }]).status, "PASSED");
assert.equal(
  evaluateGauntlet([
    { name: "typecheck", exitCode: 0, durationMs: 5, logExcerpt: "" },
    { name: "self-tests", exitCode: 0, durationMs: 9, logExcerpt: "" },
  ]).status,
  "PASSED",
);
assert.equal(evaluateGauntlet([{ name: "typecheck" }]).status, "FAILED");
assert.equal(truncateLogExcerpt("x".repeat(5000)).length, 4000);

// Frontmatter integrity: standard year parameter, declared vs runtime truth.
const profile = toObsidianProfile(identityA);
assert.ok(profile.includes(`year: ${PROFILE_YEAR}`));
assert.ok(profile.includes("type: agent-profile"));
assert.ok(profile.includes("catalog_truth_state: DECLARED"));
assert.ok(profile.includes("runtime_truth_state: UNKNOWN"));

const failedRecord = toObsidianGauntletRecord({
  agentId: identityA.agentId,
  patchRef: "patch-001",
  status: "FAILED",
  failingGate: "typecheck",
  logExcerpt: "error TS2304: cannot find name",
  createdAt: new Date().toISOString(),
});
assert.ok(failedRecord.includes(`year: ${PROFILE_YEAR}`));
assert.ok(failedRecord.includes("error TS2304"));
const passedRecord = toObsidianGauntletRecord({
  agentId: identityA.agentId,
  patchRef: "patch-001",
  status: "PASSED",
  failingGate: null,
  logExcerpt: null,
  createdAt: new Date().toISOString(),
});
assert.ok(passedRecord.includes("All recorded gates exited 0."));

// Fail-closed persistence and tenant scoping exist in the DB layer and migration.
const root = process.cwd();
const dbLayer = readFileSync(path.join(root, "src/lib/elitze-secure/agent-workforce-db.ts"), "utf8");
assert.ok(dbLayer.includes("set_config('app.tenant_id'"), "tenant context must be set transaction-locally");
assert.ok(dbLayer.includes("ROLLBACK"), "fail-closed rollback required");
assert.ok(dbLayer.includes("throw error"), "errors must propagate, never be swallowed");

const migration = readFileSync(path.join(root, "drizzle/0034_agent_workforce.sql"), "utf8");
assert.equal((migration.match(/FORCE ROW LEVEL SECURITY/g) ?? []).length, 2, "both tables must force RLS");
assert.ok(migration.includes("agent_workforce_tenant_isolation"));
assert.ok(migration.includes("agent_patch_gauntlets_tenant_isolation"));

const schema = readFileSync(path.join(root, "src/db/schema.ts"), "utf8");
assert.ok(schema.includes('pgTable("agent_workforce"'));
assert.ok(schema.includes('pgTable("agent_patch_gauntlets"'));

// Routes authenticate, validate, rate-limit and scope by tenant.
const hireRoute = readFileSync(path.join(root, "src/app/api/agent/workforce/hire/route.ts"), "utf8");
assert.ok(hireRoute.includes("getCurrentUser"));
assert.ok(hireRoute.includes("assertSameOrigin"));
assert.ok(hireRoute.includes("consumeRateLimit"));
assert.ok(hireRoute.includes("safeParse"));
assert.ok(hireRoute.includes("runtimeTruthState"));
const gauntletRoute = readFileSync(path.join(root, "src/app/api/agent/workforce/gauntlet/route.ts"), "utf8");
assert.ok(gauntletRoute.includes("getCurrentUser"));
assert.ok(gauntletRoute.includes("assertSameOrigin"));
assert.ok(gauntletRoute.includes("verificationBasis"));
const listRoute = readFileSync(path.join(root, "src/app/api/agent/workforce/route.ts"), "utf8");
assert.ok(listRoute.includes("user.tenantId") || listRoute.includes("getCurrentUser"));

console.log("ELITZE agent workforce self-test: PASS (identity, gauntlet fail-closed, tenant scoping, frontmatter year)");

// Publisher handoff is fail-closed on gauntlet status, token presence and inputs.
const publisher = await import("../src/lib/elitze-secure/agent-publisher.ts");
const base = { gauntletStatus: "PASSED", githubTokenConfigured: true, bountyId: "ALG-42", workspaceRef: "patch-001", seed: "12ab34cd56ef" };
const ready = publisher.evaluatePublisherGuard(base);
assert.ok(ready.ready, "passed gauntlet + token must produce a handoff");
assert.match(ready.branchName, /^bounty-fix\/alg-42-[0-9a-f]{4}$/);
assert.deepEqual(ready.gitSteps.map((step) => step.step), ["branch_provisioning", "stage_changes", "commit", "push"]);
assert.deepEqual(ready.gitSteps[0].command, ["git", "checkout", "-b", ready.branchName]);
assert.equal(ready.prPayload.draft, true);
assert.equal(ready.autoSubmitted, false);
assert.equal(ready.executionTier, "authorized_runner");
assert.ok(ready.runnerChecks.some((check) => check.includes("GITHUB_TOKEN")));
assert.ok(publisher.evaluatePublisherGuard({ ...base, gauntletStatus: "FAILED" }).ready === false);
assert.equal(publisher.evaluatePublisherGuard({ ...base, gauntletStatus: "FAILED" }).reason, "publisher_bypassed_failed_sandbox_gates");
assert.equal(publisher.evaluatePublisherGuard({ ...base, githubTokenConfigured: false }).reason, "missing_github_authentication_token");
assert.equal(publisher.evaluatePublisherGuard({ ...base, bountyId: "  " }).reason, "missing_bounty_id");
assert.equal(publisher.evaluatePublisherGuard({ ...base, workspaceRef: "" }).reason, "workspace_missing");
assert.equal(publisher.publisherBranchName("bounty with spaces/SLASH", "zzzz1111"), "bounty-fix/bounty-with-spaces-slash-1111");
console.log("ELITZE agent publisher self-test: PASS (fail-closed guard, runner handoff, no auto-submission)");
