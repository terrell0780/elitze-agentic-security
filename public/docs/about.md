# About ELITZE Agentic Security

ELITZE Agentic Security is an enterprise security control plane centered on agent identity, MCP runtime boundaries, reachability mapping, pre-execution policy, authorized testing, and evidence preservation.

The product's operating loop is:

**Discover → Identify → Map Reach → Evaluate Policy → Decide → Authorize Execution → Observe → Retest → Prove**

## Design rules

1. Source evidence remains attributable to a connector, record reference and timestamp.
2. Model-generated analysis is advisory. Deterministic policy and authorization controls govern execution.
3. Missing telemetry is never converted into synthetic security posture.
4. Real execution is distinguished from configured-but-unverified capability.
5. Tenant boundaries apply to stored evidence, integration status and analysis runs.
6. Human approval is required where policy says a response or action is sensitive.

## Technology direction

The platform uses a Next.js application and PostgreSQL-backed evidence; a LangGraph StateGraph coordinates the bounded security analyst; NVIDIA NIM can optionally provide a compatible model endpoint; MITRE ATT&CK Enterprise data provides current technique context; Obsidian-compatible Markdown exports preserve portable evidence notes.

## What the product does not claim

Source adapters, an available model or an installed scanner do not alone prove a live integration. An ATT&CK reference is not proof a technique was emulated. A scanner job that never reached an execution runner is not a scan result. ELITZE preserves those distinctions.

Canonical site: https://www.elitze.info
