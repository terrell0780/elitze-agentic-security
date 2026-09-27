import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const tracked = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean);

const textFiles = tracked.filter((file) => /\.(ts|tsx|js|mjs|json|md|yml|yaml|sql|css|txt)$/.test(file));
const staleDomain = ["elitze", "ca"].join(".");
const staleCa = textFiles.filter((file) => read(file).toLowerCase().includes(staleDomain));

assert.equal(staleCa.length, 0, `stale domain references remain: ${staleCa.join(", ")}`);
assert.equal(fs.existsSync(path.join(root, "src/config/production.ts")), true);
assert.equal(fs.existsSync(path.join(root, "src/config/secrets-assert.ts")), true);
assert.equal(fs.existsSync(path.join(root, "src/lib/database-verify.ts")), true);

const env = read(".env.example");
assert.match(env, /^NEXT_PUBLIC_SITE_URL=https:\/\/elitze\.info$/m);
assert.match(env, /^ELITZE_SAML_SP_ENTITY_ID=https:\/\/elitze\.info\/api\/auth\/saml\/metadata$/m);
assert.match(env, /^ELITZE_SAML_ACS_URL=https:\/\/elitze\.info\/api\/auth\/saml\/callback$/m);
assert.match(env, /^ELITZE_WEBAUTHN_RP_ID=elitze\.info$/m);
assert.match(env, /^ELITZE_CONTACT_EMAIL=tsh_cook@hotmail\.com$/m);
assert.doesNotMatch(env, /^(?:CANONICAL_DOMAIN|ALLOWED_ORIGINS)=/m);

const productionConfig = read("src/config/production.ts");
assert.match(productionConfig, /DEFAULT_CANONICAL_ORIGIN = "https:\/\/elitze\.info"/);
assert.match(productionConfig, /ELITZE_ALLOWED_ORIGINS/);
assert.match(productionConfig, /Stale .* production origin is forbidden/);

const workflow = read(".github/workflows/production-gates.yml");
assert.equal((workflow.match(/run: npm install/g) ?? []).length, 0, "production gates still contain npm install");
assert.ok((workflow.match(/run: npm ci/g) ?? []).length >= 2, "production gates must use npm ci");
assert.match(workflow, /production-config:self-test/);

assert.match(read(".gitignore"), /^tsconfig\.tsbuildinfo$/m);
assert.match(read("src/app/api/health/route.ts"), /build: "Elitze-Agentic-Security"/);
assert.match(read("src/app/api/elitze/route.ts"), /agent: ELITZE_AGENT_NAME/);
assert.match(read("src/app/api/elitze/route.ts"), /assistant: ELITZE_AGENT_ASSISTANT/);
assert.match(read("src/lib/elitze-secure/elitze-agent.ts"), /ELITZE_AGENT_NAME = "ELITZE"/);
assert.match(read("src/lib/elitze-secure/elitze-agent.ts"), /ELITZE_AGENT_ASSISTANT = "SARA"/);
assert.match(read("src/app/api/public/health/route.ts"), /export \{ GET \}/);
assert.doesNotMatch(read("docs/ELITZE-AGENTIC-SECURITY-MERGED-FOUNDATION.md"), /ELITZE SECURE/);

console.log("ELITZE production configuration self-test: PASS");

const legacyIdentityFiles = tracked.filter((file) => !file.startsWith("drizzle/") && /mythos/i.test(file));
assert.equal(legacyIdentityFiles.length, 0, `legacy Mythos file names remain: ${legacyIdentityFiles.join(", ")}`);
const legacyIdentityContent = textFiles.filter((file) => !file.startsWith("drizzle/") && /mythos/i.test(read(file)));
assert.equal(legacyIdentityContent.length, 0, `legacy Mythos branding remains: ${legacyIdentityContent.join(", ")}`);
