# ELITZE Global Security View — Decision Advantage Architecture

## Purpose

ELITZE Global Security View is not a decorative globe. It is the visual command surface over a continuously evaluated enterprise security world model. The objective is to let an operator move from **what is happening** to **what it means**, **what could happen next**, **what action is authorized**, and **whether the result was verified**.

## God’s Eye interaction model translated to enterprise security

The upstream God's Eye View project demonstrates why a multilayer world model is compelling: live layers can be turned on independently, contacts can be tracked, a focused object can be interrogated, the scene can change perspective, and the system can be controlled by natural language. Its own documentation emphasizes live contacts, click-to-track, trails, metadata, viewshed-style coverage, sensor looks, HUD, global context, scene direction, shareable state, and a reset-to-globe experience. ELITZE adopts these interaction principles for authorized security telemetry instead of surveillance of people or places.

## ELITZE sensor layers

### Layer 0 — World model

The base layer contains only connected, authorized enterprise entities:

- people and service identities
- agents and agent runtimes
- models
- MCP servers and tools
- APIs and applications
- source repositories and releases
- cloud resources
- data stores
- secrets and credentials
- vulnerabilities and exposures
- security controls
- evidence records
- business-critical assets

Every object carries provenance, freshness, tenant scope, and observation state.

### Layer 1 — Orbital / strategic view

A high-level view of the entire tenant. The visual language may resemble an orbital or satellite perspective, but it represents the **enterprise security topology**, not physical surveillance.

Use it to answer:

- Where are our highest-value assets?
- Where are the largest concentrations of privilege?
- Which agent families can reach sensitive systems?
- Where are the major trust-boundary crossings?
- Where are security controls weakest?
- Which regions of the security graph are poorly observed?

### Layer 2 — Reach / contact map

The equivalent of the upstream “Contacts” experience.

For any selected node, ELITZE computes a nearby relationship roster:

- upstream identities
- downstream identities
- reachable tools
- reachable APIs
- reachable data
- dependent services
- attack-path neighbors
- recent security events
- controls on the path

The operator can step through contacts without leaving the current investigation.

### Layer 3 — Track

Clicking an object creates a persistent tracked investigation target.

The UI shows:

- current state
- last observation
- evidence age
- path history
- related identities
- authorization boundaries
- recent actions
- security decisions
- changed relationships

Tracked relationships render as fading paths so the operator can understand movement through the security world without relying on a flat event list.

### Layer 4 — Viewshed / control coverage

The upstream project uses a viewshed concept to show where a camera can see and where it is blind. ELITZE should use the same idea for **security telemetry and control coverage**.

For the selected object or environment, render:

- telemetry coverage
- identity coverage
- policy coverage
- runtime enforcement coverage
- audit coverage
- vulnerability coverage
- detection coverage
- validation coverage

Show explicit blind spots instead of pretending that unobserved areas are safe.

### Layer 5 — Sensor modes

These are visual interpretation modes over the same evidence:

- NORMAL — evidence-first operating view
- TACTICAL — high-priority risks and active paths
- NVG — low-signal / hard-to-see relationships emphasized
- FLIR — abnormal activity and hot paths emphasized
- NOIR — sparse analytical mode for investigation focus
- CRT — forensic / historical-review aesthetic
- SNOW — degraded-data simulation view

These modes are visualization layers only. They must not alter the underlying security facts.

### Layer 6 — Detection overlay

The equivalent of object-detection boxes.

ELITZE overlays bounded markers for:

- high-value assets
- exposed assets
- privileged identities
- autonomous agents
- suspicious tool calls
- toxic permission combinations
- active attack paths
- weak controls
- evidence gaps
- unverifiable telemetry

Each marker opens an evidence-backed detail panel.

### Layer 7 — Security HUD

Persistent telemetry should expose:

- tenant
- selected object
- evidence freshness
- observation state
- risk score
- reach score
- privilege
- business criticality
- active control state
- attack-path count
- affected high-value assets
- latest security decision
- validation status

### Layer 8 — Global Context

One switch should stage the full security picture, then restore the previous investigation state when disabled.

Global Context should expose the relationship between:

**Business → Identity → Agent → Tool → API → Cloud → Data → Vulnerability → Control → Evidence → Action**

### Layer 9 — Decision cockpit

The equivalent of cockpit mode becomes an operator cockpit for a selected security subject.

For an agent, for example:

- what it can do
- what it has recently done
- which identities it can assume
- which tools it can invoke
- what data it can reach
- what policy governs it
- what happens if compromised
- what controls interrupt that path
- what actions are staged or authorized

### Layer 10 — Command layer

Voice or typed commands should operate the investigative state, not bypass authorization.

Examples:

- “Track the highest-risk agent.”
- “Show every path from this agent to production data.”
- “Show me the weakest chokepoint.”
- “Switch to tactical mode.”
- “Show blind spots.”
- “What changed since yesterday?”
- “What would happen if this tool were allowed?”
- “Compare the current state with the last validated state.”

### Layer 11 — Time machine

This is the core ELITZE differentiator.

The operator can move through time:

- before an incident
- at the incident
- after remediation
- before a deployment
- after a deployment
- before an agent policy change
- after an agent policy change

The system should reconstruct the best-known security graph for each point using observed evidence and explicit uncertainty.

## Security Counterfactual Twin

The system should support a bounded counterfactual simulation against a copied security graph.

The operator can stage a proposed action such as:

- grant an agent a permission
- expose an API
- deploy a release
- rotate or revoke a credential
- change a policy
- isolate a workload
- disable a control
- approve a tool
- allow an MCP method

ELITZE calculates:

- newly reachable assets
- additional attack paths
- new trust-boundary crossings
- affected identities
- affected data
- expected blast radius
- controls that would interrupt the path
- business-critical resources affected
- safer alternative actions

The simulation is explicitly labeled **SIMULATED**, never OBSERVED.

## Novel capability: Security Inversion

ELITZE should be able to invert a security decision.

Instead of asking:

> “What risk does this asset have?”

ask:

> **“What single control change would remove the greatest amount of real reachable risk right now?”**

The engine searches candidate controls and estimates **risk removed per unit of operational disruption**.

Examples:

- remove one permission rather than patching ten low-value findings
- isolate one workload that breaks 23 reachable paths
- revoke one dormant trust relationship rather than triaging dozens of dependent alerts
- require approval only for the high-impact action that creates the dangerous path

This is a remediation-leverage calculation, not an alert count.

## Novel capability: Security Weather

ELITZE should expose a live “security weather” layer that combines:

- newly reachable paths
- vulnerability pressure
- privilege changes
- agent autonomy changes
- telemetry degradation
- policy failures
- external threat intelligence
- business criticality
- evidence freshness

The output is not a generic score. It describes **where the environment is getting more dangerous, why, and whether the organization can actually see it**.

## Novel capability: Blind-Spot Debt

Every area of the security graph can accumulate measurable observation debt.

Blind-Spot Debt increases when:

- telemetry expires
- a connector disconnects
- an identity cannot be attributed
- a tool call is not observable
- an enforcement path cannot be verified
- a critical asset is outside validation coverage

Blind-Spot Debt decreases when coverage is restored and validation evidence is produced.

The system should never translate missing evidence into safety.

## Novel capability: Trust Budget

Each autonomous actor receives a bounded operational trust budget derived from:

- authorization scope
- business criticality
- autonomy
- privilege
- monitorability
- evidence quality
- recent behavior
- policy history
- validation history

High-impact actions consume more budget. A risky or poorly observed action can automatically force review or restriction. Recovery of trust requires fresh evidence and successful validation.

The concept is intentionally not a universal “AI score”; it is a runtime control primitive with explicit boundaries.

## Novel capability: Blast-Radius Forecast

For every proposed or observed action, show:

**Current blast radius → projected blast radius → controllable blast radius**

This distinguishes:

- what is already reachable
- what becomes reachable if the action occurs
- what remains unreachable because a control interrupts the chain

## Novel capability: Evidence Weather / Confidence Topology

Security confidence should be rendered as a topology over the graph rather than a single dashboard number.

Every relationship can expose:

- observed
- inferred
- simulated
- stale
- unknown
- unmeasurable

This allows operators to see where a conclusion is strong and where the organization is operating on assumptions.

## Decision loop

Every high-impact investigation follows:

**Detect → Explain → Simulate → Authorize → Act → Retest → Evidence → Learn**

The resulting decision lineage records the relevant data, logic, authorization, action, outcome, and evidence state.

## Security boundary

ELITZE Global Security View may be visually inspired by intelligence and satellite interfaces, but it must remain an authorized enterprise-security system. It must not imply access to private cameras, satellites, physical surveillance systems, private communications, or data sources that are not explicitly connected and authorized by the customer.

No synthetic events, locations, camera feeds, attacks, or telemetry may be presented as live facts.
