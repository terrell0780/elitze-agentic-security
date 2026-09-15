# ELITZE MCP Enforcement Gateway — Phase 1

## Single production outcome

Prove one real security control path:

> **Discover an MCP agent → map its access → intercept a tool call → evaluate policy → allow/deny/approve → record signed evidence → verify the outcome.**

No broad feature expansion is part of this milestone. No mock data, fake telemetry, simulated production events, placeholder success states, or invented evidence.

## Gateway position

The ELITZE MCP Gateway sits between an authorized agent/client and its MCP servers.

`Agent → ELITZE MCP Gateway → MCP Server → Tool`

The gateway is the enforcement point. ELITZE policy evaluation is the decision point. Credentials for downstream systems remain outside the agent context and are held by the gateway/runtime boundary.

## Required capabilities

1. **Register identities and capabilities**
   - MCP clients
   - MCP servers
   - tools
   - agent identities
   - workload identity binding

2. **Proxy MCP operations**
   - tool discovery
   - tool invocation
   - request/response correlation
   - upstream error propagation

3. **Authenticate every workload**
   - verify gateway caller identity
   - bind requests to tenant and agent identity
   - reject missing/invalid identity

4. **Evaluate every sensitive tool call**
   - tenant boundary
   - agent identity
   - MCP server identity
   - tool identity
   - requested action
   - data classification
   - purpose/context where required
   - policy version

5. **Return one explicit enforcement result**
   - `ALLOW`
   - `DENY`
   - `REQUIRE_APPROVAL`
   - `ALLOW_WITH_CONSTRAINTS`

6. **Record complete decision evidence**
   - request identifier
   - tenant
   - agent identity
   - MCP client/server
   - tool
   - action
   - policy decision
   - policy version/hash
   - constraints/approval reference
   - upstream result
   - timestamps
   - evidence hash/signature reference

7. **Keep credentials outside agent context**
   - agent receives capability metadata, not downstream secrets
   - gateway injects/uses protected credentials only for authorized execution
   - secrets never returned in normal tool responses or decision evidence

8. **Fail closed**
   - unavailable policy engine
   - unavailable identity verifier
   - unavailable critical evidence writer
   - unavailable required authorization dependency
   - invalid policy state

   These conditions must prevent sensitive execution rather than silently bypass the gateway.

## Initial demonstration environment

The first verified environment contains an authorized agent with access paths to:

- GitHub
- database
- Slack
- local filesystem

The demonstration is valid only when each resource is backed by a real authorized connection. No fabricated providers, accounts, repositories, databases, Slack destinations, files, or credentials may be used.

## Required demonstration cases

### Case A — public repository read

Input: agent requests a read of a repository/resource explicitly classified public.

Expected:
- identity verified
- reachability observed
- policy evaluated
- `ALLOW`
- request executed through gateway
- result observed
- signed evidence recorded
- verification confirms decision/result linkage

### Case B — production secret read

Input: agent requests access to a production secret.

Expected:
- request identified as sensitive
- policy denies access
- `DENY`
- downstream secret is never returned to agent
- signed evidence records the decision
- verification confirms no authorized secret result was produced

### Case C — branch deletion

Input: agent requests deletion of a branch.

Expected:
- identity and target verified
- action classified irreversible/destructive
- `REQUIRE_APPROVAL`
- no deletion before approval
- approval decision bound to the request
- execution only after valid approval
- signed evidence records request, approval, execution and result

### Case D — sensitive data sent to Slack

Input: agent attempts to send protected/sensitive data to Slack.

Expected:
- data classification detected from real policy/context
- egress destination and action identified
- `DENY`
- no send occurs
- signed evidence records the denial and reason

### Case E — normal issue creation

Input: agent creates a normal GitHub issue within authorized scope.

Expected:
- identity verified
- action allowed by policy
- `ALLOW`
- issue creation occurs through gateway
- upstream result observed
- signed evidence recorded
- verification confirms the recorded result matches the observed provider outcome

## Evidence verification

The verification step must independently establish:

1. the request existed;
2. the request was bound to the authenticated agent/tenant;
3. the policy decision existed for that exact request;
4. the decision was made before execution;
5. the gateway enforced the decision;
6. the upstream outcome matches the recorded result;
7. the evidence chain/signature verifies;
8. no credential was exposed to the agent;
9. approval was required and present before destructive execution where applicable.

A successful database insert alone is not proof of enforcement.

## Acceptance gate

Phase 1 is complete only when all five demonstration cases have real evidence and can be independently verified from exported records.

Any case that lacks a real provider connection, real observed result, valid evidence signature, or successful verification remains `BLOCKED` or `UNMEASURABLE`.

## Explicit exclusions

This milestone does not add:

- broad dashboards
- globe visualizations
- additional marketing pages
- speculative integrations
- simulated security outcomes
- category/ranking claims
- synthetic benchmark claims
- customer claims
- certification claims

The only product objective is the real MCP enforcement path above.
