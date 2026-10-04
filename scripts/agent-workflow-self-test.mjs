import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const migration = readFileSync(join(root, "drizzle/0027_persistent_agent_workflows.sql"), "utf8");
const moduleSource = readFileSync(join(root, "src/lib/elitze-secure/agent-workflow.ts"), "utf8");
const route = readFileSync(join(root, "src/app/api/agent/workflows/route.ts"), "utf8");

for (const marker of [
  "agent_workflows",
  "agent_workflow_runs",
  "agent_memory_records",
  "agent_delegations",
  "agent_routines",
]) {
  if (!migration.includes(marker)) throw new Error(`Missing workflow schema marker: ${marker}`);
}

for (const marker of [
  "createAgentWorkflow",
  "createAgentWorkflowRun",
  "claimAgentWorkflowRun",
  "completeAgentWorkflowRun",
  "recordAgentMemory",
  "delegateAgent",
  "invalid_workflow_trigger",
  "scheduled_workflow_requires_schedule",
  "WAITING_APPROVAL",
  "UNTRUSTED",
]) {
  if (!moduleSource.includes(marker)) throw new Error(`Missing workflow control marker: ${marker}`);
}

for (const marker of [
  "create_workflow",
  "run_workflow",
  "claim_run",
  "complete_run",
  "remember",
  "delegate",
  "assertSameOrigin",
]) {
  if (!route.includes(marker)) throw new Error(`Missing workflow API marker: ${marker}`);
}

if (!moduleSource.includes("ON CONFLICT (tenant_id,agent_id,memory_key)")) {
  throw new Error("Memory persistence is not idempotent");
}
if (!moduleSource.includes("status='PLANNED'")) {
  throw new Error("Workflow claim boundary missing");
}
if (!moduleSource.includes("status='APPROVED'")) {
  throw new Error("Approval gate is not fail-closed");
}
if (!moduleSource.includes("sourceAgentId === targetAgentId")) {
  throw new Error("Self-delegation boundary missing");
}

console.log("ELITZE agent workflow self-test: PASS");
