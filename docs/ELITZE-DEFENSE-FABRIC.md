# ELITZE + ELITZE orchestration Defense Fabric

ELITZE orchestration is the orchestration layer inside ELITZE. It does not pretend that an external security product, telemetry stream, SIEM, endpoint sensor, or response system exists when it has not been connected.

## Operating model

`Observe → Discover → Correlate → Hunt → Analyze → Authorize → Respond → Contain → Patch → Retest → Verify → Evidence`

ELITZE orchestration decides **what should happen**. The ELITZE Defense Fabric decides **whether it is allowed**. A connected security adapter decides **how the operation is performed**. The evidence layer records **what actually happened**.

## Adapter contract

Security adapters are tenant-aware integration points with an explicit domain, integration state, and health state. They can provide verified observations and/or authorized execution.

Supported security domains:

- AI
- Identity
- Cloud
- Endpoint
- Network
- Application
- Data
- SaaS
- Email
- Threat Intelligence
- SecOps

The adapter model uses these truth states:

- `OBSERVED` — backed by a received or stored signal.
- `INFERRED` — derived from observed evidence.
- `UNKNOWN` — not established.
- `UNMEASURABLE` — the system cannot currently establish the condition.

Adapter health is explicit:

- `CONNECTED`
- `NOT_CONFIGURED`
- `UNAVAILABLE`
- `ERROR`

There is no synthetic telemetry path.

## Authorization boundary

Every ELITZE orchestration plan passes through the existing ELITZE gateway and policy enforcement before execution. High-impact actions remain approval-gated. Missing tenant identity, agent identity, or required tool identity is never silently upgraded to allow.

The Defense Fabric also refuses to execute an action when no connected adapter exists for the requested domain. It returns an evidence-backed unavailable result instead of fabricating a successful action.

## Current implementation

Implemented in this branch:

- `src/lib/elitze-secure/defense-fabric.ts`
- `src/lib/elitze-secure/elitze-agent.ts`
- `src/app/api/elitze/route.ts`

The API exposes the current integration health and the truth-model states so the product surface can distinguish implemented control-plane capability from unconnected external telemetry.

External collectors and response systems can be added behind the adapter contract without changing ELITZE orchestration task routing or the ELITZE policy boundary.
