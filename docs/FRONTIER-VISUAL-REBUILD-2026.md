# ELITZE Agentic Security — Frontier Visual Rebuild (2026)

## Scope

This rebuild replaces the prior hero/security visuals with two source-backed interactive control-plane surfaces:

1. **Threat Surface** — relationship map for external surface, identity, cloud, APIs/MCP, AI agents and runtime.
2. **Global Security View** — spatial command surface for the security graph, Agent Reach, policy, runtime and evidence layers.

## Visual standard

- ELITZE Agentic Security branding only.
- Dark obsidian/black foundation with restrained cyan/indigo accents.
- No competitor/vendor branding.
- No synthetic customer, threat, telemetry or effectiveness claims.
- Unknown/unavailable data remains explicitly unknown/unavailable.
- Visuals are interactive React/SVG components rather than raster mockups so the product retains real UI behavior and accessibility.
- The visual language is designed to support a mature enterprise-security presentation rather than a generic startup dashboard.

## Product truth boundary

The visual layer consumes the existing `/api/market` state and surfaces unavailable state instead of manufacturing records. The Global Security View uses live database-backed agent/approval values when available and otherwise displays `UNKNOWN`.

## Rebuild sequence position

- 1. Protect source — repository confirmed private.
- 2. Audit repository — in progress.
- 3. Fix product architecture — next.
- 4. Rebuild Frontier visual layer — implemented on `rebuild/frontier-2026-09-12`.
- 5. Mature `elitze.ca` — pending architecture audit.
- 6. Acquisition/sales package — pending.
- 7. Final security verification — pending.

## Verification note

These visual changes are isolated to the rebuild branch. `main` and Vercel were not modified by this visual pass.
