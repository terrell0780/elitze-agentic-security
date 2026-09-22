import assert from "node:assert/strict";
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");

const dockerfile = read("Dockerfile");
const ignore = read(".dockerignore");
const compose = read("compose.yaml");
const enterprise = read("docker-compose.enterprise.yml");
const chat = read("src/app/api/chat/route.ts");

assert.match(dockerfile, /ARG NODE_IMAGE=node:22\.23\.2-alpine3\.24/);
assert.match(dockerfile, /FROM \$\{NODE_IMAGE\} AS deps/);
assert.match(dockerfile, /FROM \$\{NODE_IMAGE\} AS builder/);
assert.match(dockerfile, /FROM \$\{NODE_IMAGE\} AS runner/);
assert.match(dockerfile, /npm run build/);
assert.match(dockerfile, /USER nextjs/);
assert.match(dockerfile, /HEALTHCHECK/);
assert.doesNotMatch(dockerfile, /--privileged/);

assert.match(ignore, /\.env(?:\.\*|$)/);
assert.match(ignore, /\.secrets/);
assert.match(ignore, /node_modules/);
assert.match(ignore, /\.git/);

for (const [name, text] of [["compose.yaml", compose], ["docker-compose.enterprise.yml", enterprise]]) {
  assert.doesNotMatch(text, /docker\.sock|\/var\/run\/docker\.sock/);
  assert.doesNotMatch(text, /network_mode:\s*host/);
  assert.doesNotMatch(text, /privileged:\s*true/);
  assert.match(text, /read_only:\s*true/);
  assert.match(text, /cap_drop:\s*\n\s+- ALL/);
  assert.match(text, /no-new-privileges:true/);
  assert.match(text, /pids_limit:/);
  assert.match(text, /mem_limit:/);
  assert.match(text, /cpus:/);
  assert.match(text, /DATABASE_URL_FILE:\s*\/run\/secrets\/database_url/);
  assert.match(text, /secrets:/);
  assert.match(text, /healthcheck:/);
  assert.match(text, /condition: service_completed_successfully/);
  assert.match(text, /sbom:\s*true/);
  assert.match(text, /provenance:\s*mode=max/);
  if (name === "compose.yaml") assert.match(text, /internal:\s*true/);
}

assert.match(compose, /image: postgres:18\.6-alpine3\.23/);
assert.match(compose, /POSTGRES_PASSWORD_FILE: \/run\/secrets\/postgres_password/);
assert.match(compose, /condition: service_healthy/);
assert.doesNotMatch(compose, /POSTGRES_PASSWORD:/);
assert.match(enterprise, /NEXT_PUBLIC_SITE_URL:\s*\$\{NEXT_PUBLIC_SITE_URL:\?Set NEXT_PUBLIC_SITE_URL/);
assert.match(enterprise, /ELITZE_BIND_ADDRESS:-127\.0\.0\.1/);
assert.match(enterprise, /ELITZE_AI_GATEWAY_URL/);
assert.match(enterprise, /ELITZE_AI_MODEL/);
assert.match(enterprise, /ELITZE_AI_GATEWAY_REQUIRE_AUTH/);
assert.match(enterprise, /ELITZE_AI_GATEWAY_TOKEN_FILE: \/run\/secrets\/ai_gateway_token/);
assert.match(enterprise, /ai_gateway_token:/);
assert.match(chat, /ELITZE_AI_GATEWAY_TOKEN_FILE/);
assert.match(chat, /ELITZE_AI_GATEWAY_REQUIRE_AUTH/);
assert.match(chat, /GATEWAY_AUTH_NOT_CONFIGURED/);
assert.match(chat, /\/run\/secrets\//);
assert.match(chat, /requestedAction: "chat\.generate"/);
assert.match(chat, /No model response was generated/);
assert.match(chat, /decision\.decision !== "allow"/);



console.log("ELITZE Docker security self-test: PASS — two deployment layers enforce container least privilege, secret-file injection, health/migration ordering, and hardened filesystem/runtime settings.");
