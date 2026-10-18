import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const workspace = read("src/app/workspace/page.tsx");
const orchestrator = read("src/app/api/elitze/route.ts");
const decision = read("src/app/api/security/decision/route.ts");
const ingest = read("src/app/api/data-bridge/ingest/route.ts");
const consoleHealth = read("src/app/api/console/health/route.ts");

assert.match(workspace, /getCurrentUser\(\)/, "workspace entry must verify the server session");
assert.match(workspace, /if \(!user\) redirect\("\/login/, "anonymous workspace access must require sign-in");
assert.match(workspace, /redirect\("\/console"\)/, "authenticated workspace entry must reach the security console");
assert.match(orchestrator, /getCurrentUser\(\)/, "orchestrator must require an authenticated actor");
assert.match(orchestrator, /assertSameOrigin\(request\)/, "orchestrator must enforce same-origin POSTs");
assert.match(orchestrator, /tenantId:\s*user\.tenantId/, "orchestrator tenant must come from the session");
assert.match(orchestrator, /actorId:\s*user\.id/, "orchestrator actor must come from the session");
assert.match(orchestrator, /agent_identity_unavailable/, "orchestrator must reject an unverified agent identity");
assert.match(decision, /authorizeInternalRequest/, "policy decisions must use the internal authorization boundary");
assert.match(decision, /security_audit_unavailable/, "policy decision must fail closed when audit persistence fails");
assert.match(ingest, /authenticateSource\(request\)/, "data ingestion must authenticate its source");
assert.match(ingest, /unauthorized_source/, "unauthenticated data sources must be rejected");
assert.match(consoleHealth, /getCurrentUser\(\)/, "operational health details must require a session");

console.log("ELITZE workspace platform boundary self-test: PASS");
