import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const migration = fs.readFileSync(path.join(root,"drizzle/0022_security_fabric_autonomous_analyst.sql"),"utf8");
const fabric = fs.readFileSync(path.join(root,"src/lib/elitze-secure/security-source-fabric-types.ts"),"utf8");
const analyst = fs.readFileSync(path.join(root,"src/lib/elitze-secure/autonomous-analyst.ts"),"utf8");
const dashboard = fs.readFileSync(path.join(root,"src/app/console/analyst/page.tsx"),"utf8");
const ingest = fs.readFileSync(path.join(root,"src/app/api/integrations/security-fabric/ingest/route.ts"),"utf8");

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
assert.match(ingest,/x-elitze-api-key/);
assert.match(ingest,/ELITZE_INGEST_HMAC_SECRET/);

console.log("ELITZE security source fabric + autonomous analyst self-test: PASS");
