# ELITZE Security Skill Architecture

ELITZE uses a governed, proprietary skill architecture for agentic security workflows.

## Brand and ownership rule

The product, user experience, skill registry structure, policy model, evidence workflow, ROI model, and ELITZE-specific implementations are presented as ELITZE assets. No third-party product name, logo, vendor identity, or community library is used as ELITZE product branding.

External standards may appear only as reference mappings or legal/compliance disclosures. A reference mapping does not transfer ownership, imply endorsement, or grant execution authority.

## Rule

A skill describes **what can be done**. ELITZE determines **whether it may be done**, under what authorization, against which scope, and what evidence is required.

## Skill lifecycle

`Discover → Authorize → Execute/Assess → Verify → Evidence → Remediate → Retest → ROI`

## Registry fields

Each ELITZE skill has a stable identifier, domain, prerequisites, authorization level, verification requirements, evidence requirements, reference mappings, and implementation/dependency status.

## Reference mappings

ELITZE may map a capability to recognized security or AI-risk frameworks when useful for customer governance. These mappings are metadata only; they are not claims that ELITZE owns those standards or that a mapping by itself proves control effectiveness.

## Safety boundary

Execute-capable skills require explicit authorization and an auditable scope. The existence of a skill never grants execution authority to an agent.
