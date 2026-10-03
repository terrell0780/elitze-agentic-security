import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

assert.match(read("drizzle/0028_acquisition_pipeline.sql"), /acquisition_leads/);
assert.match(read("drizzle/0028_acquisition_pipeline.sql"), /acquisition_lead_events/);
assert.match(read("src/app/api/acquisition/contact/route.ts"), /INSERT INTO acquisition_leads/);
assert.match(read("src/app/api/acquisition/leads/route.ts"), /acquisition_manager_required/);
assert.match(read("src/app/api/acquisition/leads/route.ts"), /UPDATE acquisition_leads/);
assert.doesNotMatch(read("src/app/sales/page.tsx"), /SAP SECURITY|SAP applications|SAP AI|SAP-changing actions/i);
assert.match(read(".env.example"), /^ELITZE_ACQUISITION_ADMIN_EMAIL=/m);

console.log("ELITZE business-process self-test: PASS");
