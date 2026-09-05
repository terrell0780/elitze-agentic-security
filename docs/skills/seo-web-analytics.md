# ELITZE REO — SEO Web Analytics Skill

## Purpose

Use live search and web analytics data to measure organic visibility, diagnose search-performance changes, and connect acquisition data to on-site outcomes without inventing metrics.

## Core pillars

- Technical analytics: crawlability, indexation, mobile usability, performance signals and search coverage.
- On-page analytics: queries, pages, search appearance, metadata/content opportunities and engagement where first-party analytics is connected.
- Off-page analytics: referring-domain and backlink data only when an authorized external source is connected; do not infer backlink facts from Search Console Search Analytics alone.
- Performance analytics: clicks, impressions, CTR and average position from Google Search Console; sessions and other configured metrics from GA4.

## Live Google sources

### Google Search Console

The Search Console API exposes Search Analytics, Sitemaps, Sites and URL Inspection services. Search Analytics can be grouped and filtered by query, page, country, device, search appearance and date. The API requires authorization for the property and can return only the data Google makes available through the service.

### Google Analytics 4

The Google Analytics Data API provides `runReport` for configured GA4 properties. The ELITZE MCP uses live authorized data and does not synthesize missing values.

## ELITZE decision rules

1. No credentials or property authorization: return an explicit configuration/authorization error.
2. No source data: report no source data; never create replacement metrics.
3. Search Console and GA4 totals may differ because they measure different systems; do not force reconciliation.
4. Recent Search Console data may be incomplete when requesting fresh data; the production tool requests finalized data by default.
5. Any recommendation must identify the underlying measured source and date range.

## MCP tools

- `search_performance`: live Google Search Console Search Analytics query.
- `ga4_report`: live Google Analytics Data API report.
- `seo_data_requirements`: declares required live-data connections and supported Search Console dimensions.

## Security boundary

The MCP endpoint requires `ELITZE_MCP_TOKEN`. Google data access requires `GOOGLE_ACCESS_TOKEN`. Secrets are environment variables and must never be committed to the repository or displayed in the UI.
