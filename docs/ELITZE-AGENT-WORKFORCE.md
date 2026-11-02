# ELITZE Agent Workforce and Patch Gauntlet

The agent workforce is ELITZE's lead-orchestrator model for dynamic, tenant-scoped agent hiring, plus a fail-closed verification gauntlet for agent-proposed patches.

## Model

- **Lead orchestrator** reads an implementation brief, infers the required specialty deterministically, and checks the tenant's active workforce. If no active agent holds the specialty, it hires one.
- **Hired identity** is deterministic and locked: a generated name, a seeded avatar, a specialty, and a zero-trust system prompt. The same seed always reproduces the same profile, preventing configuration drift during long-running tasks.
- **Zero-trust constraints are built into every identity prompt**: verify repository state before writing code, build incrementally inside isolated scaffolds, never invent success logs, never widen tenant scope, never self-grant permissions.

## Truth states

- A hired identity is a **DECLARED** catalog entry. Its runtime execution state is **UNKNOWN** until separate execution evidence exists.
- The gauntlet marks a patch **PASSED only when every recorded gate exit code is 0**. A patch without recorded gate evidence is never treated as verified.

## Patch gauntlet

```
[CrewAI Engineer Patch] ──> [Gauntlet Sandbox Node] ──(npm run typecheck + self-tests)──> [Success] ──> [GitHub PR]
                                       │
                                (Exit Code != 0)
                                       ▼
                       [Pipe Stack Trace to Obsidian]
```

- The **gauntlet record** stores each gate with its name, exit code, duration and a capped log excerpt (4,000 characters server-side). Evaluation is fail-closed: an empty gate list, a non-numeric exit code, or any non-zero exit code produces FAILED with the exact failing gate and trace.
- The **Obsidian-format export** carries the stack trace for failures and the standard `year: 2026` frontmatter parameter for cross-referencing secure builds.
- **PR boundary:** ELITZE never submits pull requests and never executes agent patches itself. A PASSED gauntlet produces a handoff record; opening a pull request stays with a human-approved process or the authorized, signed execution runner.

## Fail-closed gateways

Every persistence operation runs inside a transaction whose `app.tenant_id` is set transaction-locally (identical to the RAG isolation pattern in `0033_rag_tenant_rls.sql`). Missing environment configuration, missing tenant context, or any query error aborts the loop immediately: the transaction rolls back, the error propagates to the route layer as a 503, and the trace is logged server-side — never swallowed into a fabricated success.

## Isolation

`agent_workforce` and `agent_patch_gauntlets` are tenant-scoped tables with `FORCE ROW LEVEL SECURITY` (migration `0034_agent_workforce.sql`). Without transaction-local tenant context the tables return no rows and reject writes; application queries additionally filter by the authenticated session's tenant.

## API (authenticated, tenant-scoped)

- `POST /api/agent/workforce/hire` — body `{ brief, reason? }`; hires or returns the active specialist; response carries `catalogTruthState: DECLARED` and `runtimeTruthState: UNKNOWN`.
- `GET /api/agent/workforce` — lists the tenant workforce; `?format=obsidian` returns all profiles as Obsidian markdown.
- `POST /api/agent/workforce/gauntlet` — body `{ agentId, patchRef, gates: [{ name, exitCode, durationMs, logExcerpt }] }`; records and evaluates the run; response states `verificationBasis: recorded_gate_exit_codes`.
- `GET /api/agent/workforce/gauntlet?agentId=` — lists recorded gauntlet runs.

## Publisher handoff (GitHub PR boundary)

After a PASSED gauntlet, `POST /api/agent/workforce/publish` produces a runner handoff for the verified patch:

- **Fail-closed guard:** no handoff unless the gauntlet record for the agent is PASSED; missing GitHub token presence, missing bounty id or missing workspace reference abort with an explicit reason.
- **Execution plan:** branch provisioning (`bounty-fix/<safe-id>-<4-hex>`), staging, commit with an explicit message, and push — expressed as exact command steps for the **authorized runner tier**, never executed by the web application.
- **PR payload:** a **draft** pull request payload targeting the configured repository, with the verification basis stated in the body.
- **No fabricated outcomes:** the handoff is a plan, not an outcome. The response carries `publicationEvidence: runner_reportback_required` — a pull request only becomes a recorded fact when the runner reports back what actually happened.

## Dataview dashboard and pipeline train

`GET /api/agent/workforce?format=obsidian-dashboard` returns a paste-ready dashboard note with three Dataview panels querying the `Agents/` vault folder under the `year: 2026` profile contract:

- **Panel A — Active Agent Matrix:** avatar, identifier, specialty and operational status per agent.
- **Panel B — Core Competency Workforce Breakdown:** headcount grouped by specialty.
- **Panel C — Gauntlet Run History:** latest runs with result and failing gate.

The zero-trust evaluation train maps to the API surface as a linear gate:

```
EvaluateInfrastructure ──> RunGauntletSandbox ──> PublishVerifiedPatch ──> END
  POST .../hire             POST .../gauntlet      POST .../publish (handoff)
```

`GET /api/agent/workforce/pipeline?agentId=wf-…` renders an agent's current position in that train from recorded rows only: `hired`, the latest gauntlet `PASSED`/`FAILED`/`UNKNOWN`, and the publisher state (`handoff_ready`, `blocked_pending_gauntlet`, or `blocked_missing_token`).

Self-test: `npm run agent-workforce:self-test`.
