import fs from "node:fs";
import assert from "node:assert/strict";

const source = fs.readFileSync("src/lib/elitze-super-agent.ts", "utf8");
const route = fs.readFileSync("src/app/api/super-agent/route.ts", "utf8");
const voice = fs.readFileSync("src/app/api/super-agent/realtime-token/route.ts", "utf8");
const image = fs.readFileSync("src/app/api/super-agent/image/route.ts", "utf8");
const page = fs.readFileSync("src/app/console/super-agent/page.tsx", "utf8");

for (const expected of [
  "ELITZE Super Agent",
  "get_agent_reach",
  "get_gods_eye_view",
  "list_security_skills",
  "agent_reachability",
  "security_graph_nodes",
  "security_graph_edges",
  "web_search",
  "x_search",
  "code_interpreter",
  "image_generation",
  "type: \"mcp\"",
]) assert.ok(source.includes(expected), "missing: " + expected);

assert.match(route, /authentication_required/);
assert.match(voice, /client_secrets/);
assert.match(voice, /grok-voice-latest/);
assert.match(image, /grok-imagine-image-2\\.0/);
assert.match(page, /Agent Reach/);
assert.match(page, /God.s Eye View/);

console.log("ELITZE Super Agent self-test: PASS");