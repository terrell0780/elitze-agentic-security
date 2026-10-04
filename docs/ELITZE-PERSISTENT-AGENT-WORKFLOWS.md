# ELITZE Persistent Agent Workflow Control

## Purpose

ELITZE now has a concrete control-plane foundation for persistent, governed agent workflows.

The design incorporates the useful workflow primitives seen in modern persistent-agent systems:

- named, long-lived agent identities;
- persistent workflow definitions and runs;
- reusable ELITZE security skills;
- explicit human approval boundaries;
- agent-to-agent delegation with scope, expiry, and depth limits;
- tenant-scoped memory with provenance and trust state;
- scheduled/event/manual workflow triggers;
- resumable workflow state;
- claim/complete execution boundaries;
- evidence and retest state;
- auditable state transitions.

This is an ELITZE implementation of those control patterns, not a claim of reproducing another product.

## Control path

`Define → Validate Skills → Establish Agent Identity → Map Reach → Plan Run → Request Approval → Claim → Execute Through Authorized Adapter → Observe → Verify → Retest → Preserve Evidence`

A workflow cannot acquire authority merely by existing.

## Persistent agents

Agent identity remains the security boundary. Workflow persistence stores responsibility and state; it does not grant access.

Each workflow run is bound to:

- tenant;
- agent identity;
- workflow;
- trigger;
- objective;
- requested action;
- approval state;
- evidence state;
- retest state.

## Memory

Memory is tenant- and agent-scoped.

New memory is stored as `UNTRUSTED` and receives a SHA-256 content hash. Source references and evidence references are preserved. Memory is not treated as an authorization source.

Changing facts should be re-read from their authoritative source before consequential decisions. Expired or revoked memory must not be treated as current evidence.

## Skills

ELITZE security skills remain governed capabilities. A workflow may reference only skills present in the ELITZE registry.

Execute-capable skills still require authorization and their own execution boundary.

## Delegation

Agent-to-agent delegation is explicit and time-bounded.

Controls include:

- tenant binding;
- source and target agent identity;
- workflow scope;
- purpose;
- maximum delegation depth;
- expiration;
- revocation state.

A delegated agent does not inherit unrestricted authority.

## Approvals

High-impact actions and non-autonomous workflows create an approval record before a run can be claimed.

The claim operation is fail-closed while the referenced approval is not approved.

## Routines and schedules

Workflows support manual, scheduled, and event triggers. The schema stores schedule and timezone, while a deployment scheduler/worker is responsible for invoking due work.

No scheduler is represented as operational merely because a schedule exists in the database.

## Execution and evidence

The control plane separates:

- planned;
- running;
- waiting for approval;
- completed;
- failed;
- blocked.

Completion records evidence state and retest state. External execution remains adapter-bound and must return verifiable results.

## Security boundary

Persistent agents do not bypass:

- tenant isolation;
- identity;
- policy;
- approvals;
- tool/MCP restrictions;
- network restrictions;
- data controls;
- evidence requirements;
- containment and rollback boundaries.

No synthetic agent activity, telemetry, memory, findings, or execution results are inserted by this implementation.
