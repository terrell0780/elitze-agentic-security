const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const decision = (context) => {
  const reasons = [];
  if (!context.actorId || !context.requestedAction) reasons.push("missing_security_context");
  if (context.actorType === "agent" && !context.agentId) reasons.push("agent_identity_required");
  if (context.actorType === "agent" && !context.purpose) reasons.push("purpose_binding_required");
  if (context.privileged && context.dataClass === "restricted") reasons.push("restricted_privileged_action");
  if (reasons.length) return "deny";
  if (context.irreversible || context.externalSideEffect || context.financial) return "hitl";
  return "allow";
};

assert(decision({ actorId: "human", actorType: "human", requestedAction: "read" }) === "allow", "basic allow failed");
assert(decision({ actorId: "agent", actorType: "agent", requestedAction: "tool" }) === "deny", "agent identity gate failed");
assert(decision({ actorId: "agent", actorType: "agent", agentId: "a1", purpose: "ops", requestedAction: "send", externalSideEffect: true }) === "hitl", "HITL gate failed");
assert(decision({ actorId: "agent", actorType: "agent", agentId: "a1", purpose: "ops", requestedAction: "read", privileged: true, dataClass: "restricted" }) === "deny", "privileged restricted gate failed");

console.log("ELITZE security self-test: PASS");
