# ELITZE SOC, Chat and Team Collaboration Controls

## Purpose

ELITZE Agentic Security should operate as an evidence-first security control plane. Human analysts can collaborate around decisions, evidence, incidents and governed actions without turning AI output into an unreviewable black box.

## Explainability

Every security decision exposes its request hash, actor, agent, action, decision, policy version, recorded reasons, and linked evidence where evidence exists. A missing evidence link is shown explicitly rather than replaced with generated justification.

## Analyst feedback

Analysts can record malicious, benign, uncertain, confirmed-malicious and confirmed-benign verdicts with optional comments. Feedback is retained as data and can be used for workflow improvement; it is not silently treated as a model-training claim.

## Team command

The collaboration surface provides database-backed channels and messages. Messages can reference a security decision or evidence record, allowing teams to discuss the exact object under investigation rather than copying security conclusions into an unrelated chat system.

## AI chat

ELITZE Governed Chat evaluates a security context before generation. The request is refused when the team session is missing, when policy denies it, or when the configured AI gateway is unavailable. No synthetic assistant response is produced.

AI generation requires an explicitly configured `ELITZE_AI_GATEWAY_URL`. The repository does not claim a model provider is available when that setting is absent.

## Operational metrics

Metrics are derived from recorded ELITZE data. When there are insufficient observations, the UI returns `UNMEASURABLE` rather than manufacturing a percentage. This includes autonomy rate, analyst feedback coverage and other derived operational measurements.

## Enterprise identity boundary

The collaboration bootstrap/session mechanism is an application boundary for this feature; it is not a replacement for enterprise OIDC, MFA or passkeys. Production identity should be supplied by the organization's authorized identity provider and mapped to ELITZE actor IDs.

## Integration boundary

Security integrations remain adapter-driven. Configured integration URLs/tokens are held outside the repository. ELITZE must not describe an integration as connected unless the corresponding authorized service actually confirms connectivity and data availability.
