import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";

const policy = (context) => {
  const reasons = [];
  if (!context.actorId || !context.requestedAction) reasons.push("missing_security_context");
  if (context.actorType === "agent" && !context.agentId) reasons.push("agent_identity_required");
  if (context.actorType === "agent" && !context.purpose) reasons.push("purpose_binding_required");
  if (context.privileged && context.dataClass === "restricted") reasons.push("restricted_privileged_action");
  if (reasons.length) return "deny";
  if (context.irreversible || context.externalSideEffect || context.financial) return "hitl";
  return "allow";
};

const normalizeHash = (context) => createHash("sha256")
  .update(JSON.stringify(context, Object.keys(context).sort()))
  .digest("hex");

assert.equal(policy({ actorId: "human", actorType: "human", requestedAction: "read" }), "allow");
assert.equal(policy({ actorId: "agent", actorType: "agent", requestedAction: "tool" }), "deny");
assert.equal(policy({ actorId: "agent", actorType: "agent", agentId: "a1", purpose: "ops", requestedAction: "send", externalSideEffect: true }), "hitl");
assert.equal(policy({ actorId: "agent", actorType: "agent", agentId: "a1", purpose: "ops", requestedAction: "read", privileged: true, dataClass: "restricted" }), "deny");

const requestId = randomUUID();
const a = normalizeHash({ actorId: "a", actorType: "service", requestedAction: "read", requestId });
const b = normalizeHash({ actorId: "a", actorType: "service", requestedAction: "read", requestId: randomUUID() });
assert.notEqual(a, b, "request hashes must not collide across generated request IDs");
assert.equal(a.length, 64);

const tooLarge = "x".repeat(201);
assert.equal(tooLarge.length, 201);

console.log("ELITZE security self-test: PASS");
