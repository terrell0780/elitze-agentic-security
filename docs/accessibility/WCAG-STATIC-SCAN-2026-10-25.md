# ELITZE WCAG 2.2 static scan record

**Assessment date:** 2026-10-25 (UTC)  
**Production origin:** https://www.elitze.info/  
**Checker:** Foomworks public WCAG 2.2 static-HTML scanner  
**Scope:** 23 publicly scannable routes  
**Result:** 23/23 routes returned zero findings across 12 automated static checks each.

## Routes and results

Each listed route was submitted individually to the checker. Each response reported `rulesChecked: 12`, `rulesWithIssues: 0`, `rulesPassed: 12`, `totalInstances: 0`, and an empty findings array.

| Route | Static result |
|---|---|
| `/` | 0 findings / 12 checks passed |
| `/about` | 0 findings / 12 checks passed |
| `/platform` | 0 findings / 12 checks passed |
| `/accessibility` | 0 findings / 12 checks passed |
| `/security` | 0 findings / 12 checks passed |
| `/integrations` | 0 findings / 12 checks passed |
| `/contact` | 0 findings / 12 checks passed |
| `/faq` | 0 findings / 12 checks passed |
| `/compare` | 0 findings / 12 checks passed |
| `/compliance` | 0 findings / 12 checks passed |
| `/orchestration` | 0 findings / 12 checks passed |
| `/adversary-emulation` | 0 findings / 12 checks passed |
| `/agentic-soc` | 0 findings / 12 checks passed |
| `/recursive-agents` | 0 findings / 12 checks passed |
| `/threat-detection` | 0 findings / 12 checks passed |
| `/contributing` | 0 findings / 12 checks passed |
| `/docs` | 0 findings / 12 checks passed |
| `/privacy` | 0 findings / 12 checks passed |
| `/terms` | 0 findings / 12 checks passed |
| `/legal` | 0 findings / 12 checks passed |
| `/use-cases` | 0 findings / 12 checks passed |
| `/reo` | 0 findings / 12 checks passed |
| `/security-disclosure` | 0 findings / 12 checks passed |

## Rules covered

The checker reported these rules as passed: image alternative text, HTML language, document title, input labels, heading order, link names, button names, positive `tabindex`, viewport zoom, iframe title, meta refresh, and duplicate IDs.

## Routes the external crawler did not scan

The external scanner returned HTTP 403 because of the site's `robots.txt` policy for its user-agent on `/login`, `/register`, `/forgot-password`, and `/reset-password`. These routes were therefore **not counted** among the 23 passes. Repository and production HTML checks confirmed the shared skip-link target and focusable main landmark on the sampled authentication pages; a separate browser-based authenticated test is still needed for their interactive flows.

## AudioEye checker attempt

The requested AudioEye scanner landing page returned HTTP 429 to the automated inspection request, including a retry with browser-style request headers. No AudioEye report or AudioEye finding set was obtained, and this record does not claim otherwise.

## Limits and follow-up

This is a **static-HTML subset scan**, not a determination of WCAG 2.2 AA conformance, an accessibility certification, or a legal compliance opinion. It does not evaluate color contrast, complete keyboard operation, focus order/management under JavaScript, screen-reader behavior, responsive zoom/reflow, dynamic state changes, or whether content makes sense. Continue with the configured Axe + Lighthouse workflow and manual keyboard/screen-reader review, including authenticated states. The source-level CI contract test passed during Vercel's production prebuild for all 46 Next.js page templates; GitHub Actions browser jobs have not yet executed steps because their jobs fail before a runner is assigned.
