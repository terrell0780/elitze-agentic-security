# ELITZE ROI

ELITZE Agentic Security treats ROI as a measurable security outcome, not a marketing estimate.

## Model

Annual benefit is calculated as:

`incident cost avoided + engineering value recovered + AI/cloud spend avoided + audit/evidence cost avoided`

Net benefit is:

`annual benefit - annual ELITZE cost`

ROI is:

`net benefit / annual ELITZE cost`

Payback is:

`annual ELITZE cost / annual benefit * 12 months`

## Evidence policy

Observed ELITZE records provide the operational signals: security decisions, denied actions, high-impact enforcement events, resolved attack paths, completed red-team runs, evidence records and enforcement activity.

Those records do **not** automatically become monetary savings. Customer-approved financial assumptions are required to assign dollar value.

ELITZE must display `UNMEASURABLE` when the required observation or financial assumption is unavailable. It must not fabricate incident costs, prevented losses, engineering savings or ROI percentages.

## Product surface

The executive ROI surface is available at `/console/roi` and reads observed signals from `GET /api/roi`.

The ROI model is implemented in `src/lib/roi.ts` so the same calculation can be reused in future reports, exports and executive views without duplicating formulas.

## ROI categories

- Risk reduction and incident-cost avoidance
- Engineering time recovered through enforcement, triage, remediation and validation
- AI/model/tool/cloud spend controlled or avoided
- Audit and evidence-production cost reduced
- Remediation velocity and verified closure

The intent is to connect ELITZE's security control plane to business value while preserving the platform's observed-versus-inferred evidence boundary.
