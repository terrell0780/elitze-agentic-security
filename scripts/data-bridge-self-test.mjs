import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";

const migration = fs.readFileSync("drizzle/0011_data_bridge.sql", "utf8");
const service = fs.readFileSync("src/lib/elitze-secure/data-bridge.ts", "utf8");
const adapter = fs.readFileSync("src/lib/elitze-secure/data-bridge-adapter.ts", "utf8");
const ingestRoute = fs.readFileSync("src/app/api/data-bridge/ingest/route.ts", "utf8");
const adapterRoute = fs.readFileSync("src/app/api/data-bridge/adapters/route.ts", "utf8");
const integrationContract = fs.readFileSync("docs/ELITZE-DATA-BRIDGE-INTEGRATION-CONTRACT.md", "utf8");

assert.match(migration, /data_bridge_sources/);
assert.match(migration, /data_bridge_events/);
assert.match(migration, /UNIQUE \(tenant_id, source_id, event_id\)/);
assert.match(service, /tokenHash/);
assert.match(service, /contentHash/);
assert.match(service, /data_bridge\.ingested/);
assert.match(service, /toObservedSignal/);
assert.match(ingestRoute, /authenticateSource/);
assert.match(ingestRoute, /assertRequestSize/);
assert.match(adapter, /DataBridgeConnector/);
assert.match(adapter, /WEBHOOK/);
assert.match(adapter, /REST_PULL/);
assert.match(adapter, /EVENT_STREAM/);
assert.match(adapter, /MCP/);
assert.match(adapter, /generic-http-json/);
assert.match(adapterRoute, /getBuiltInDataBridgeConnectors/);
assert.match(integrationContract, /vendor-neutral/i);
assert.match(integrationContract, /must not imply partnership/i);

const token = crypto.randomBytes(48).toString("base64url");
const digest = crypto.createHash("sha256").update(token).digest("hex");
assert.equal(digest.length, 64);
assert.notEqual(token, digest);

console.log("ELITZE Data Bridge self-test: PASS");
