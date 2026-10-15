# ELITZE 2026 Acquisition, RIO and ROI Measurement

## Purpose

ELITZE uses acquisition measurement to improve discoverability and buyer conversion without inventing performance. The system measures real events when authorized measurement is configured and otherwise reports an unavailable state.

## Funnel

`Discover → Landing page → Qualified intent → Acquisition inquiry → Diligence → Transaction`

This measurement model is for the seller's acquisition process only. It is not a SaaS growth, subscription, renewal or customer-success program.

The public site may measure the first four stages. Diligence and transaction status are not inferred from page analytics.

## Search-intent architecture

Public content is organized around real buyer problems rather than keyword variants:

- Agent identity and non-human identity security.
- MCP runtime security.
- Agent reachability and tool authorization.
- AI security policy enforcement.
- Runtime security and evidence.
- Security graph and exposure validation.
- REO evidence and retesting.
- Enterprise acquisition / product asset acquisition.

Pages must add substantive information for the reader. ELITZE does not create near-duplicate doorway pages, keyword-stuffed pages, synthetic statistics, fabricated testimonials, or AI-generated pages whose primary purpose is search manipulation.

## Measurement events

The application can emit these consent-gated events:

- `sales_cta` — visitor selects an acquisition/sales CTA.
- `acquisition_inquiry` — visitor selects the private technical review / acquisition contact action.
- `repository_access_request` — visitor selects the controlled repository-access path.
- `console_open` — visitor selects a product-console CTA.
- `privacy_consent_granted` / `privacy_consent_denied` — privacy choice state.

Events contain page and destination context, not the contents of email messages or sensitive form fields.

No event is emitted to Google measurement until the visitor has granted optional analytics/advertising measurement consent.

## RIO

RIO means **Result / Impact / Outcome** for the ELITZE evidence model.

- **Result:** what the control path actually observed or decided.
- **Impact:** business/security significance supported by observed evidence and, where monetary, an approved customer assumption.
- **Outcome:** the verified post-remediation or post-control state.

A blocked action is not automatically a prevented financial loss. A closed ticket is not automatically verified remediation. A search impression is not a lead. A lead is not revenue.

The RIO implementation therefore returns explicit states rather than manufacturing a score:

- `MEASURABLE` — required observed security evidence exists; financial value is shown only when approved financial inputs also exist.
- `INSUFFICIENT_EVIDENCE` — required security evidence is missing.
- `UNMEASURABLE` — a financial result cannot be calculated because the approved financial basis is absent.

## ROI

ROI is calculated only from customer-approved financial inputs and evidence that supports the underlying security/business result.

`ROI = (approved benefit - approved ELITZE cost) / approved ELITZE cost`

The repository must not populate incident costs, savings, revenue, payback, conversion value, or ROI percentages from defaults, synthetic records, rankings, industry averages, or assumptions presented as facts.

## Search / paid acquisition sources

When connected and authorized, RIO can consume:

- Google Search Console: impressions, clicks, CTR, average position and query/page dimensions.
- GA4: landing-page sessions and configured key events.
- Google Ads: impressions, clicks, spend, conversions and cost metrics.
- Other reach sources: only when the source is authorized and the observation is reproducible.

Unavailable sources must remain unavailable.

## Google 2026 compliance boundary

Google's Terms of Service are effective July 30, 2026. Google Search spam policies prohibit attempts to manipulate Search systems, including machine-generated traffic and scaled low-value content. Google Ads policies prohibit misleading representation and unreliable claims.

ELITZE therefore does not promise search rankings, AI citations, traffic, ad approval, conversion rates, or acquisition outcomes. Search and advertising measurement is evidence collection, not a guarantee.

## Privacy measurement boundary

The public measurement design uses opt-in consent for optional analytics/advertising measurement and provides a reset path. This is consistent with the Canadian privacy principle that non-integral secondary collection/use should be optional and that consent should be meaningful and withdrawable. ELITZE does not treat analytics consent as a condition of accessing the public product information.

Reference basis: Office of the Privacy Commissioner of Canada guidance on meaningful consent and cookies: https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/p_principle/principles/p_consent/

## Human validation

Every business claim should be classified before publication:

1. **Observed** — directly supported by a connected record.
2. **Verified** — observed and independently checked/retested where applicable.
3. **Inferred** — a clearly labeled interpretation.
4. **Unavailable** — source or required evidence is missing.
5. **Planned** — not yet implemented.

Only the first two states support an unqualified measured product/security claim. Inferred statements must be labeled, and unavailable/planned states must not be marketed as outcomes.

## Release gate

Before declaring acquisition readiness:

- Confirm canonical origin and public URLs.
- Confirm robots and sitemap contain only intended public pages.
- Confirm metadata and structured data describe visible content.
- Confirm consent behavior matches the configured measurement model.
- Confirm event names are stable and do not contain PII.
- Confirm real GA4/Search Console/Ads sources are connected before reporting their metrics.
- Confirm RIO/ROI displays measured, insufficient, and unavailable states distinctly.
- Run typecheck, lint, tests, build and sale-readiness checks.
- Record the exact verified commit.
