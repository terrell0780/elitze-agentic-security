import assert from "node:assert/strict";import { readFileSync } from "node:fs";
const read=p=>readFileSync(p,"utf8");const lib=read("src/lib/elitze-secure/google-ads-compliance.ts"),migration=read("drizzle/0023_google_ads_governance.sql"),route=read("src/app/api/google-ads/compliance/route.ts"),page=read("src/app/console/google-ads/page.tsx");
for(const id of ["identity.truthful","description.accuracy","claims.supported","offer.transparency","destination.consistency","privacy.collection","privacy.consent","targeting.personalized","targeting.sensitive","audience.customer_match","privacy.precise_location"])assert.match(lib,new RegExp(id.replace(".","\\.")));
for(const table of ["google_ads_compliance_checks","google_ads_policy_versions"])assert.match(migration,new RegExp("CREATE TABLE IF NOT EXISTS "+table));
assert.match(route,/getCurrentUser/);assert.match(route,/google_ads_compliance_checks/);assert.match(route,/evaluateGoogleAdsCompliance/);assert.match(page,/Google Ads Governance/);assert.match(page,/NOT_ASSESSED/);
console.log("google-ads-governance:self-test PASS");
