import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";

const migration = fs.readFileSync("drizzle/0011_data_bridge.sql", "utf8");
const service = fs.readFileSync("src/lib/elitze-secure/data-bridge.ts", "utf8");
const ingestRoute = fs.readFileSync("src/app/api/data-bridge/ingest/route.ts", "utf8");

assert.match(migration, /data_bridge_sources/);
assert.match(migration, /data_bridge_events/);
assert.match(migration, /UNIQUE \(tenant_id, source_id, event_id\)/);
assert.match(service, /tokenHash/);
assert.match(service, /contentHash/);
assert.match(service, /data_bridge\.ingested/);
assert.match(service, /toObservedSignal/);
assert.match(ingestRoute, /authenticateSource/);
assert.match(ingestRoute, /assertRequestSize/);

const token = crypto.randomBytes(48).toString("base64url");
const digest = crypto.createHash("sha256").update(token).digest("hex");
assert.equal(digest.length, 64);
assert.notEqual(token, digest);

console.log("ELITZE Data Bridge self-test: PASS");
