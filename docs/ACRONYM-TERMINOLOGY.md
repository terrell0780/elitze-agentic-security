# ELITZE Agentic Security — Acronym Terminology Standard

## Purpose

This is the canonical terminology standard for ELITZE product, security, sales, acquisition, and publishing materials.

## ROE — Rules of Engagement

**ROE** is the standard cybersecurity meaning **Rules of Engagement**.

Use ROE for an authorized security test, penetration test, red-team exercise, or other controlled validation activity. It defines the detailed guidelines and constraints for the testing operation, including scope, authorized activity, timing, safety limits, approvals, evidence handling, escalation, and stop/containment procedures.

ROE is a security-testing authorization concept. It is **not** a revenue, marketing, valuation, ranking, or acquisition-performance metric.

## ROI — Return on Investment

**ROI** is the standard business meaning **Return on Investment**.

Use ROI for a financial/business return calculation. ELITZE may calculate ROI only when the underlying observed result and the financial inputs are actually available and appropriately approved.

ELITZE must not invent incident costs, savings, avoided losses, engineering value, customer results, revenue, payback, conversion value, or ROI percentages.

## RIO — ELITZE internal Result / Impact / Outcome model

**RIO** is **not presented as a standard cybersecurity acronym**.

ELITZE may use **RIO = Result / Impact / Outcome** as an internal measurement model when the term is explicitly introduced as ELITZE-specific.

- **Result:** what the controlled system actually observed or decided.
- **Impact:** the security or business significance supported by evidence; monetary impact requires an approved financial basis.
- **Outcome:** the verified post-control or post-remediation state.

RIO must remain distinct from ROI. RIO describes an evidence model; ROI is the financial return calculation.

RIO should not be used as a substitute for ordinary terms such as result, impact, outcome, reach, visibility, conversion, revenue, or return when ordinary language is clearer.

## REO — Do not use as a public or sales acronym

**REO is not a standard cybersecurity acronym with a single generally accepted ELITZE meaning.**

Earlier ELITZE materials used REO for multiple incompatible concepts, including reachability/exploitability/observation and reputation/content integrity. That creates avoidable ambiguity.

Effective immediately, ELITZE public, product, sales, acquisition, legal, and publishing copy should **not expand or market REO as an industry-standard acronym**.

Use the underlying plain-language terms instead:

- reachability
- exploitability
- evidence
- content integrity
- provenance
- publishing governance
- verified outcome

The existing `/reo` route and `src/lib/elitze-reo/` implementation may remain as internal compatibility identifiers until separately refactored. Their public presentation must use descriptive language rather than an invented industry meaning.

## Sales and acquisition rule

For buyer-facing acquisition material:

- **ROE** = Rules of Engagement for any authorized technical security testing performed during diligence or validation.
- **ROI** = Return on Investment, only when supported by real and approved financial evidence.
- **RIO** = optional ELITZE-specific evidence model; define it on first use and keep it secondary to plain-language commercial terms.
- **REO** = omit from buyer-facing copy and use descriptive evidence/reachability language instead.

No acronym may be used to imply customer success, rankings, revenue, valuation, market position, adoption, or technical efficacy that has not been independently supported.

## Writing rule

Spell out an acronym on first substantive use in each standalone document unless the document is a controlled technical artifact whose title and purpose already establish the term.

When in doubt, prefer plain language over an unexplained acronym.
