# Internal Dashboard Benchmark

## Reviewed competitive patterns (reference only)

1. Wiz: Clean, low-clutter cloud security surfaces. Visibility first: asset and risk context, data flow, and prioritization over dense decoration.
2. CrowdStrike Falcon: Enterprise platform posture with strong authority signals, compact metrics, and fast path from alert to investigation.
3. SentinelOne Singularity: Storyline-style incident timelines, AI-assisted summaries, clear status and containment states.
4. Palo Alto Networks Cortex XSOAR: Case-centric workflows, playbooks, evidence, and collaboration across SOC analysts.

## Applied ELITZE internal direction

- Keep the dashboard evidence-bound: every prominent metric says "tenant data available" or "UNMEASURABLE".
- Use a left-side operational navigation with grouped control surfaces.
- Layer deeper panels on a fixed background: gradient panels, controlled shadows, and border hierarchy.
- Prefer operational density and next actions over decorative tiles.
- Avoid fabricated dashboards; live-state labels only reflect fetched API data.
- Keep animations subtle and compatible with `prefers-reduced-motion`.

## Product constraint

The public landing page remains untouched. Visual and functional changes are limited to authenticated workspace routes.
