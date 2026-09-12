# ELITZE Agent Skills Security Integration — 2026

## Status

This document defines the ELITZE security-control treatment for the Agent Skills ecosystem. The ecosystem registry is evidence-backed from the Agent Skills client showcase; it does **not** claim that ELITZE has completed integrations with every listed client.

## Source of truth

Agent Skills publishes a documentation index at `https://agentskills.io/llms.txt`. The index identifies the Agent Skills specification and the client showcase as canonical documentation sources.

The supplied Agent Skills client showcase identifies a broad set of products supporting the Agent Skills format, including ChatGPT & Codex, GitHub Copilot, Claude Code, Cursor, OpenHands, Factory, Qodo, Kiro, OpenCode, Goose and many others.

ELITZE records these clients as ecosystem evidence only. Integration status must be established independently from observed ELITZE implementation and telemetry.

## ELITZE control boundary

```text
Agent / Agent Client
        |
        v
Agent Skills capability
        |
        v
Agent Reach / acquisition
        |
        v
ELITZE provenance + identity
        |
        v
Policy + REO admission
        |
        +--> ALLOW
        +--> DENY
        +--> REQUIRE_APPROVAL
        +--> QUARANTINE
        +--> RESCAN_REQUIRED
        +--> UNKNOWN
        |
        v
Runtime tool / MCP / API controls
        |
        v
Evidence + Security Truth Graph
```

The model or agent client is not the security boundary. External skill content is untrusted input until it passes ELITZE-controlled authorization and admission.

## Required truth handling

ELITZE must not manufacture support claims, scan results, client integrations, versions, hashes, vulnerabilities, rankings, telemetry or customer outcomes.

Use:

- `OBSERVED` for evidence actually collected.
- `INFERRED` only when the inference is explicitly represented as such.
- `UNKNOWN` when the fact cannot be verified.
- `UNMEASURABLE` when the measurement cannot currently be performed.
- `null` when a field is unavailable and no stronger state is appropriate.

## Client registry

`config/agent-skills-client-registry.json` contains the client names and source/documentation references from the supplied Agent Skills showcase. It is deliberately a reference registry, not a list of claimed ELITZE integrations.

The registry can be used by Agent Reach/RIO workflows to identify potential ecosystem targets while keeping actual ELITZE implementation status separate.

## Security treatment of a skill

For every skill that enters an ELITZE-controlled environment:

1. Identify the exact source reference.
2. Capture immutable version/content identity when available.
3. Record provenance and acquisition time.
4. Inspect the skill before authorization.
5. Run the configured security analysis where available.
6. Preserve scanner identity, version, mode and result reference.
7. Normalize findings without changing their factual meaning.
8. Apply ELITZE policy and REO admission rules.
9. Register only after an explicit authorization decision.
10. Map the skill to the agent, model, MCP server/tool, API, data/resource and action relationships actually observed.
11. Monitor runtime behavior independently of the pre-install assessment.
12. Rescan when the material source/version changes.
13. Revoke when policy, provenance, findings or runtime behavior require it.
14. Retest and retain evidence after remediation.

## Security claim boundary

The presence of a client in the Agent Skills showcase means the source identifies that client as supporting the Agent Skills format. It does **not** establish:

- that ELITZE integrates with that client;
- that ELITZE can inspect every skill used by that client;
- that a client exposes all required telemetry;
- that a skill is safe;
- that a scan is clean;
- that runtime behavior is compliant.

Those claims require separate evidence.

## RIO / REO relationship

**REO** governs provenance, evidence integrity, uniqueness and publication trust for Agent Skills-related content.

**RIO** can measure discovery, reach, referral and ecosystem visibility around Agent Skills, but must not convert ecosystem presence into fabricated product-support or ranking claims.

Agent Reach can acquire or route capabilities, but external results remain untrusted until they cross the ELITZE provenance, policy and REO boundary.

## Acceptance criteria

- The Agent Skills ecosystem is represented without fabricated support claims.
- Client evidence is separated from ELITZE implementation status.
- Skill acquisition crosses an ELITZE trust boundary.
- Admission is policy-controlled.
- Runtime behavior is evaluated separately from static/pre-install analysis.
- Provenance and evidence remain attached to imported facts.
- Missing evidence cannot become a positive security claim.
- Registry updates can be made without changing the security boundary.
