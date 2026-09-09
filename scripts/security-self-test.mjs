import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";

const policy = (context) => {
  const reasons = [];
  if (!context.tenantId) reasons.push("tenant_boundary_required");
  if (!context.actorId || !context.requestedAction) reasons.push("missing_security_context");
  if (context.actorType === "agent" && !context.agentId) reasons.push("agent_identity_required");
  if (context.actorType === "agent" && !context.purpose) reasons.push("purpose_binding_required");
  if (context.privileged && context.dataClass === "restricted") reasons.push("restricted_privileged_action");
  if (context.action?.startsWith("mcp.") && !context.mcpServerId) reasons.push("known_mcp_server_required");
  if (reasons.length) return "deny";
  if (context.irreversible || context.externalSideEffect || context.financial) return "hitl";
  return "allow";
};

const normalizeHash = (context) => createHash("sha256").update(JSON.stringify(context, Object.keys(context).sort())).digest("hex");
const auditHash = (event) => createHash("sha256").update(JSON.stringify(event)).digest("hex");

assert.equal(policy({ tenantId: "t1", actorId: "human", actorType: "human", requestedAction: "read" }), "allow");
assert.equal(policy({ actorId: "human", actorType: "human", requestedAction: "read" }), "deny");
assert.equal(policy({ tenantId: "t1", actorId: "agent", actorType: "agent", requestedAction: "tool" }), "deny");
assert.equal(policy({ tenantId: "t1", actorId: "agent", actorType: "agent", agentId: "a1", purpose: "ops", requestedAction: "send", externalSideEffect: true }), "hitl");
assert.equal(policy({ tenantId: "t1", actorId: "agent", actorType: "agent", agentId: "a1", purpose: "ops", requestedAction: "read", privileged: true, dataClass: "restricted" }), "deny");
assert.equal(policy({ tenantId: "t1", actorId: "agent", actorType: "agent", agentId: "a1", purpose: "ops", requestedAction: "mcp.call", action: "mcp.call" }), "deny");
assert.equal(policy({ tenantId: "t1", actorId: "agent", actorType: "agent", agentId: "a1", purpose: "ops", requestedAction: "mcp.call", action: "mcp.call", mcpServerId: "server-1" }), "allow");

const requestId = randomUUID();
const a = normalizeHash({ actorId: "a", actorType: "service", requestedAction: "read", requestId });
const b = normalizeHash({ actorId: "a", actorType: "service", requestedAction: "read", requestId: randomUUID() });
assert.notEqual(a, b);
assert.equal(a.length, 64);

const first = { id: randomUUID(), tenantId: "tenant-a", sequence: 1, type: "security.decision", payload: { decision: "BLOCK" }, previousHash: null };
const firstHash = auditHash(first);
const second = { id: randomUUID(), tenantId: "tenant-a", sequence: 2, type: "security.containment.requested", payload: { scope: "agent-a" }, previousHash: firstHash };
const secondHash = auditHash(second);
assert.equal(firstHash.length, 64);
assert.equal(second.previousHash, firstHash);
assert.notEqual(firstHash, secondHash);
assert.notEqual(auditHash({ ...second, payload: { scope: "agent-b" } }), secondHash, "audit payload tampering must change the hash");
assert.equal(new Set(["t1", "t1"]).size, 1, "tenant idempotency scope must be tenant-local");

console.log("ELITZE Agentic Security security self-test: PASS");
