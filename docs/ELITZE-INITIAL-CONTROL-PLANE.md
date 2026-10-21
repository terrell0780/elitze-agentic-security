# ELITZE Initial Product Boundary: Agent Identity and MCP Runtime Security

## Initial category

**Agent Identity and MCP Runtime Security**

## Initial product promise

> Discover every agent and MCP server, map what each identity can reach, enforce policy before sensitive tool execution, and preserve verifiable evidence of every decision.

This is the initial proof boundary for ELITZE. Broader capabilities such as general cloud security, API security, vulnerability operations, SOC automation, counterfactual simulation, and enterprise-wide data security remain supporting domains rather than simultaneous top-level promises.

## Required end-to-end control loop

1. Discover an agent, model, MCP server, or tool.
2. Issue a tenant-scoped workload identity with a stored cryptographic fingerprint and non-recoverable token digest.
3. Record observed reachability for tools, MCP servers, APIs, secrets, and data with an explicit evidence state.
4. Evaluate a requested action against the ELITZE policy engine before execution.
5. Return an explicit decision: `APPROVE`, `BLOCK`, `REVIEW`, or `QUEUE`; optional constraints are persisted with the request.
6. Append a hash-chained audit event containing the decision context and evidence state.
7. Execute only through a separately authorized runtime/gateway boundary.
8. Record the runtime result as `EXECUTED`, `DENIED`, `FAILED`, or `CONSTRAINED`.
9. Retest the affected request/path and persist `PASSED`, `FAILED`, or `UNMEASURABLE`.
10. Report only evidence-backed state to production UI surfaces.

## Production UI rule

No production console card may invent operational metrics. A displayed value must resolve to a current database record, an authenticated runtime observation, or a clearly labeled `UNMEASURABLE` / `INSUFFICIENT REACH` state.

No synthetic agents, fake incidents, simulated reachability, fabricated policy counts, or invented performance numbers may be shown as production telemetry.

## Repository implementation

The control-plane foundation is implemented in:

- `drizzle/0012_agent_mcp_control_plane.sql`
- `src/lib/elitze-secure/agent-mcp-control-plane.ts`
- `src/app/api/control-plane/route.ts`

The authenticated API provides snapshot, identity registration, reachability observation, pre-execution action evaluation, result recording, and retesting operations.

## Evidence boundary

- `OBSERVED`: directly recorded from an authorized source or runtime path.
- `INFERRED`: derived from observed relationships but not directly observed.
- `UNKNOWN`: evidence is expected but unavailable.
- `UNMEASURABLE`: required evidence cannot currently be obtained.

The product must not convert `UNKNOWN` or `UNMEASURABLE` into a positive security claim.

## Security verification path

Validation should focus on one real path:

**agent identity → MCP/tool reachability → policy decision → evidence → authorized execution → result → retest**

Everything beyond that path is secondary until the complete loop can be demonstrated with real records.
