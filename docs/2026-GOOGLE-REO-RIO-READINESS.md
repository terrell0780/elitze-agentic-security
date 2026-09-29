# ELITZE 2026 Search and Content-Integrity Readiness Contract

## Status

This document defines the production visibility contract for ELITZE. It is an implementation standard, not a claim that Google rankings, traffic, AI citations, reviews, or ad performance already exist.

## 1. Google Search readiness

ELITZE follows current Google Search Essentials and avoids tactics intended to manipulate ranking systems. Content must be useful to people first, crawlable, indexable, canonicalized, and supported by accurate structured data where the schema genuinely describes the visible page.

Required controls:

- Canonical public origin: `https://elitze.info`.
- `robots.txt` allows public pages and blocks application/API surfaces.
- XML sitemap contains only intended public URLs.
- Page metadata has a stable title, description, canonical URL and social metadata.
- Organization and WebSite JSON-LD describe the actual product and organization.
- `SoftwareApplication` structured data is used only when the public page visibly supports the required Google properties, including a real offer/price where required for the Google-supported software-app rich result. It must not be added merely to chase a rich result.
- Structured data is not used to claim ratings, reviews, offers, awards, rankings or other facts that are not visibly supported.
- No doorway pages, keyword stuffing, cloaking, scaled low-value content, fabricated testimonials, fabricated statistics or synthetic performance claims.
- Public product pages explain capabilities and implementation status accurately.

Google's current guidance emphasizes helpful, reliable, people-first content and compliance with Search spam policies. Structured data must describe visible, relevant content; correct markup does not guarantee a rich result or ranking.

## 2. Content integrity and publishing governance

ELITZE's content-integrity layer is the trust layer around published content and machine-readable claims.

REO must preserve:

1. Provenance — where a claim came from.
2. Evidence — what supports the claim.
3. Integrity — content hashes and audit history.
4. Uniqueness — detection of duplicated or low-value material.
5. Decision state — never present an unverified claim as verified.
6. Auditability — retain the policy and evidence context behind decisions.

The existing content-integrity persistence layer is evidence-first and explicitly rejects synthetic content, scores and audit records. This remains the required behavior.

## 3. RIO / measurement layer

RIO is the ELITZE reach and visibility operating layer. It connects technical discoverability, search demand, AI/agent reach, referral visibility and measurable business outcomes.

RIO must measure rather than invent:

- Search impressions, clicks, CTR and average position from authorized Search Console data.
- Landing-page sessions and configured key events from GA4.
- Paid acquisition impressions, clicks, spend, conversions and cost metrics only from authorized Google Ads data.
- AI/agent visibility only from observed, reproducible query tests or connected provider data.
- Referral and third-party authority only from an authorized source.
- Conversion outcomes only when a real event has been observed.

No RIO score may be displayed as a measured fact when its source is unavailable.

## 4. Google Ads readiness

Google Ads must use clear, relevant ads and functional landing pages. Campaigns must target the same canonical ELITZE domain and must not use misleading claims, fabricated rankings, unsupported customer results or policy-evasion tactics.

Do not imply Google affiliation, endorsement, partnership, preferred placement, guaranteed ranking, guaranteed traffic, guaranteed conversion, or special access unless that relationship is real and authorized. Do not make claims that ELITZE is “top rated,” “#1,” “top five,” or similarly ranked unless there is current, independently verifiable evidence and the wording is permitted for the placement.

Recommended measurement events are business outcomes such as qualified demo requests, contact submissions and completed product-intent actions. Exact Google Ads conversion IDs and labels must be supplied from the real Google Ads account; the repository never invents them.

## 5. Analytics and consent contract

The application supports optional GA4 and Google Ads instrumentation through deployment environment variables:

- `NEXT_PUBLIC_GA4_MEASUREMENT_ID`
- `NEXT_PUBLIC_GOOGLE_ADS_ID`
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
- `NEXT_PUBLIC_SITE_URL`

When IDs are absent, no Google tracking script is emitted. This prevents the product from claiming that analytics are active when they are not configured. The public banner uses a basic consent-gated model: Google tags do not load until the visitor grants optional measurement consent. The granted state is then communicated through the consent-mode API before measurement configuration runs.

Authorized Search Console/GA4 API access remains server-side and must use real credentials outside source control. Missing authorization must produce an explicit no-data/configuration state, never a fabricated metric.

## 6. Visibility KPI hierarchy

### Tier 1 — business outcomes

Qualified leads, demo requests, opportunities and attributable revenue.

### Tier 2 — acquisition

Organic clicks, paid clicks, conversion rate, cost per qualified lead and branded/non-branded demand.

### Tier 3 — search visibility

Impressions, CTR, average position, indexed pages and query coverage.

### Tier 4 — machine reach

Observed citations/mentions, crawler accessibility, entity consistency and source references where measurable.

A higher-tier outcome cannot be inferred from a lower-tier metric. Impressions are not leads. Rankings are not revenue. AI mentions are not customers.

## 7. Release gate

Before declaring ELITZE product/business ready, verify:

- `https://elitze.info` resolves to the intended production experience.
- Canonical URLs point to the chosen production origin.
- `/robots.txt` and `/sitemap.xml` are reachable.
- Search Console property is verified and sitemap submitted.
- GA4 is receiving real traffic.
- Google Ads conversion actions are configured only after the actual Ads account supplies the IDs/labels.
- Public pages contain no fabricated reviews, ratings, customer counts, rankings or performance statistics.
- Content-integrity decisions are evidence-bound.
- RIO dashboards clearly distinguish measured, unavailable and inferred state.
- Production CI passes typecheck, lint, tests and build.

## 8. Important limitation

No code change can guarantee a Google ranking, an AI citation, a top-five market position, an ad approval, or a particular traffic level. Those outcomes depend on Google's systems, competition, real-world demand, account history, content quality, external authority and measured user behavior. The correct product standard is to make the site technically eligible, trustworthy, measurable and commercially useful, then optimize from real evidence.

## 9. Current 2026 policy basis

Google's current Terms of Service are effective July 30, 2026. Current Google Ads guidance requires accurate business/product representation and prohibits misleading or unreliable claims. Current consent-mode guidance distinguishes basic and advanced implementations; ELITZE's public implementation intentionally uses the basic, tag-blocking model until consent is granted. Google Search policies also prohibit machine-generated traffic and scaled low-value content used to manipulate Search.

The repository therefore treats search visibility, paid acquisition and business outcomes as measured evidence sources, not guarantees.

## 10. Policy references

- Google Search Essentials: https://developers.google.com/search/docs/essentials
- Google helpful, reliable, people-first content: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google structured-data guidelines: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- Google SoftwareApplication structured data: https://developers.google.com/search/docs/appearance/structured-data/software-app
- Google Ads policies: https://support.google.com/adspolicy/answer/6008942
- Google Ads misrepresentation policy: https://support.google.com/adspolicy/answer/6020955
- Google Ads trademark policy: https://support.google.com/adspolicy/answer/6118
- Google Terms of Service (effective July 30, 2026): https://policies.google.com/terms
- Google Ads consent mode: https://support.google.com/google-ads/answer/14009635
- Google Ads misleading representation: https://support.google.com/adspolicy/answer/6020955
- Google Search spam policies: https://developers.google.com/search/docs/essentials/spam-policies
