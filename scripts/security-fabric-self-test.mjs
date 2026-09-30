import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const migration = fs.readFileSync(path.join(root,"drizzle/0022_security_fabric_autonomous_analyst.sql"),"utf8");
const fabric = fs.readFileSync(path.join(root,"src/lib/elitze-secure/security-source-fabric-types.ts"),"utf8");
const analyst = fs.readFileSync(path.join(root,"src/lib/elitze-secure/autonomous-analyst.ts"),"utf8");
const dashboard = fs.readFileSync(path.join(root,"src/app/console/analyst/page.tsx"),"utf8");
const ingest = fs.readFileSync(path.join(root,"src/app/api/integrations/security-fabric/ingest/route.ts"),"utf8");
const analystRoute = fs.readFileSync(path.join(root,"src/app/api/console/autonomous-analyst/route.ts"),"utf8");
const sourceFabric = fs.readFileSync(path.join(root,"src/lib/elitze-secure/security-source-fabric.ts"),"utf8");
const consolePage = fs.readFileSync(path.join(root,"src/app/console/page.tsx"),"utf8");
const envExample = fs.readFileSync(path.join(root,".env.example"),"utf8");

for (const connector of [
  "opencti","misp","thehive","wazuh","velociraptor","suricata","zeek","osquery","fleetdm",
  "greenbone","nuclei","cisa-kev","epss","nvd","github-advisories","mitre-attack","sigma","yara",
]) {
  assert.match(fabric,new RegExp('"' + connector + '"'));
}

for (const table of [
  "security_fabric_sources","security_fabric_events",
  "autonomous_analyst_runs","autonomous_analyst_findings",
]) {
  assert.match(migration,new RegExp("CREATE TABLE IF NOT EXISTS " + table));
}

assert.match(analyst,/No observed security-fabric events are available/);
assert.match(analyst,/APPROVAL_REQUIRED/);
assert.match(dashboard,/Executive Dashboard/);
assert.match(dashboard,/Threat Feeds & Detection Fabric/);
assert.match(dashboard,/Live World Map/);
assert.match(dashboard,/AI Investigation Timeline/);
assert.match(dashboard,/UNMEASURABLE/);
assert.doesNotMatch(dashboard,/metrics\.(activeThreats|criticalAssets|kev)\s*\?\?\s*0/);
assert.doesNotMatch(dashboard,/graph\.nodes\s*\?\?\s*0/);
assert.doesNotMatch(dashboard,/activeCampaigns\s*\?\?\s*0/);
assert.match(ingest,/x-elitze-api-key/);
assert.match(ingest,/ELITZE_INGEST_HMAC_SECRET/);
assert.match(ingest,/ELITZE_INGEST_TENANT_ID/);
assert.match(ingest,/tenant_binding_mismatch/);
assert.match(ingest,/body\.tenantId !== tenantId/);
assert.match(ingest,/ingestSecurityFabricEvent\(tenantId,/);
assert.match(ingest,/ingest_tenant_not_configured/);
assert.match(ingest,/if \(!authenticated\).*status:401/s);
assert.match(ingest,/status:403/);
assert.match(analystRoute,/AND run_id=\$2/);
assert.match(analystRoute,/latestRun\.id/);
assert.match(analystRoute,/const latestRun = run\.rows\[0\] \?\? null/);
assert.match(analystRoute,/const findings = latestRun\s*\?/s);
assert.match(analyst,/return "event:" \+ row\.id/);
assert.doesNotMatch(analyst,/return row\.event_type/);
assert.match(analyst,/row\.subject_key\?\.trim\(\)/);
assert.match(sourceFabric,/integration_state='INTEGRATED',health_state='CONNECTED'/);
assert.equal((consolePage.match(/<header\b/g) ?? []).length,1);
assert.equal((consolePage.match(/import Link from "next\/link";/g) ?? []).length,1);
assert.match(consolePage,/href="\/console\/analyst"/);
assert.equal((envExample.match(/^NEXT_PUBLIC_SITE_URL=/gm) ?? []).length,1);
assert.match(envExample,/ELITZE_SAML_SP_ENTITY_ID=https:\/\/elitze\.info/);
assert.match(envExample,/ELITZE_SAML_ACS_URL=https:\/\/elitze\.info/);
assert.match(envExample,/ELITZE_WEBAUTHN_RP_ID=elitze\.info/);
assert.match(envExample,/ELITZE_WEBAUTHN_ORIGIN=https:\/\/elitze\.info,https:\/\/www\.elitze\.info/);
assert.match(envExample,/ELITZE_ALLOWED_ORIGINS=https:\/\/elitze\.info,https:\/\/www\.elitze\.info/);

console.log("ELITZE security source fabric + autonomous analyst self-test: PASS");
