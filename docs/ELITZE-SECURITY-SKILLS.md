# ELITZE Security Skill Architecture

ELITZE uses a governed skill architecture for agentic security workflows.

## Rule

A skill describes **what can be done**. ELITZE determines **whether it may be done**, under what authorization, against which scope, and what evidence is required.

## Skill lifecycle

`Discover → Authorize → Execute/Assess → Verify → Evidence → Remediate → Retest → ROI`

## Registry fields

Each ELITZE skill has a stable identifier, domain, prerequisites, authorization level, verification requirements, evidence requirements, framework mappings, and implementation/dependency status.

## Third-party boundary

The public Anthropic Cybersecurity Skills repository is not copied wholesale into ELITZE. Its progressive-disclosure and structured-skill concepts are useful architectural references, but ELITZE retains its own proprietary control-plane model and only adds third-party material where separately reviewed, license-compliant, attributed, and necessary.

## Framework mappings

Skills can map to MITRE ATT&CK, MITRE ATLAS, MITRE D3FEND, NIST CSF, NIST AI RMF and other customer-required control sets. A mapping is metadata, not proof that a control is effective. Effectiveness requires observed ELITZE evidence and verification.

## Safety boundary

Execute-capable skills require explicit authorization and an auditable scope. The existence of a skill never grants execution authority to an agent.
