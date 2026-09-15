# ELITZE Security View — Operational Architecture

## Purpose

ELITZE Security View is the visual command surface over authorized, connected enterprise security data. It is an operator interface for identity, agent/MCP reachability, policy, runtime activity, evidence, and retesting.

The visual layer does not create security facts. Every operational state must resolve to a real tenant-scoped record or an explicit unavailable state.

## Evidence-first visual model

The world model contains only connected, authorized enterprise entities such as:

- workload and service identities;
- agents and agent runtimes;
- models;
- MCP servers and tools;
- APIs and applications;
- data stores and secrets;
- security controls;
- evidence records;
- authorized runtime events.

Every operational object must carry provenance, tenant scope, observation state, and freshness where applicable.

## Control layers

### Identity

Show the observed identity bound to the selected agent, workload, MCP server, or tool.

### Reach

Show observed relationships to tools, APIs, secrets, and data. Unobserved reach is never presented as confirmed reach.

### Policy

Show the enabled policy governing the requested action and the resulting enforcement decision.

### Activity

Show only authorized runtime/security events received from connected sources.

### Evidence

Show observed evidence, plus explicit `UNKNOWN`, `UNMEASURABLE`, or `INSUFFICIENT_REACH` states where the source path is incomplete.

### Retest

Show authorized validation evidence for the affected path and whether the condition remained, changed, or was removed.

## Operator workflow

For a selected workload or agent, the operator should be able to inspect:

- what it is;
- which identity is bound to it;
- which MCP servers and tools are associated with it;
- what resources it is observed to reach;
- what policy governs a requested action;
- whether an action was allowed, blocked, or placed into review;
- what execution result was observed;
- what evidence was retained;
- what retest was performed.

## Production truth boundary

The visual layer must not contain:

- mock records;
- fake telemetry;
- synthetic operational metrics;
- simulated security events represented as real;
- copied or hypothetical security graphs represented as live state;
- invented customers, assets, agents, findings, reachability, remediation, or savings.

No green or healthy state is displayed solely because a component is rendered. The state must be supported by an actual connected record.

## Security boundary

Visual interaction does not bypass authorization. Selecting or inspecting an object does not grant execution authority. Sensitive actions continue through ELITZE identity, policy, approval, and separately authorized execution controls.

## Initial commercial category

**Agent Identity and MCP Runtime Security.**

The visual surface exists to demonstrate the initial product promise:

> Discover every agent and MCP server, map what each identity can reach, enforce policy before sensitive tool execution, and preserve verifiable evidence of every decision.

Broader security domains can remain in the architecture, but they are not treated as simultaneously proven product scope without the relevant live connected control path.
