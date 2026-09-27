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
const staleCa = textFiles.filter((file) => /(^|[^a-z0-9])elitze\.ca([^a-z0-9]|$)/i.test(read(file)));

assert.equal(staleCa.length, 0, `stale ELITZE.CA references remain: ${staleCa.join(", ")}`);
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
assert.match(productionConfig, /Stale ELITZE\.CA production origin is forbidden/);

const workflow = read(".github/workflows/production-gates.yml");
assert.equal((workflow.match(/run: npm install/g) ?? []).length, 0, "production gates still contain npm install");
assert.ok((workflow.match(/run: npm ci/g) ?? []).length >= 2, "production gates must use npm ci");
assert.match(workflow, /production-config:self-test/);

assert.match(read(".gitignore"), /^tsconfig\.tsbuildinfo$/m);
assert.match(read("src/app/api/health/route.ts"), /build: "Elitze-Agentic-Security"/);
assert.match(read("src/app/api/public/health/route.ts"), /export \{ GET \}/);
assert.doesNotMatch(read("docs/ELITZE-AGENTIC-SECURITY-MERGED-FOUNDATION.md"), /ELITZE SECURE/);

console.log("ELITZE production configuration self-test: PASS");
