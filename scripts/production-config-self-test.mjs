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
assert.match(env, /^NEXT_PUBLIC_SITE_URL=https:\/\/(?:www\.)?elitze\.info$/m);
assert.match(env, /^ELITZE_SAML_SP_ENTITY_ID=https:\/\/elitze\.info\/api\/auth\/saml\/metadata$/m);
assert.match(env, /^ELITZE_SAML_ACS_URL=https:\/\/elitze\.info\/api\/auth\/saml\/callback$/m);
assert.match(env, /^ELITZE_WEBAUTHN_RP_ID=elitze\.info$/m);
assert.match(env, /^ELITZE_CONTACT_EMAIL=tsh_cook@hotmail\.com$/m);
assert.doesNotMatch(env, /^(?:CANONICAL_DOMAIN|ALLOWED_ORIGINS)=/m);

const productionConfig = read("src/config/production.ts");
assert.match(productionConfig, /DEFAULT_CANONICAL_ORIGIN = "https:\/\/(?:www\.)?elitze\.info"/);
assert.match(productionConfig, /ELITZE_ALLOWED_ORIGINS/);
assert.match(productionConfig, /Stale .* production origin is forbidden/);

const workflow = read(".github/workflows/production-gates.yml");
assert.equal((workflow.match(/run: npm install/g) ?? []).length, 0, "production gates still contain npm install");
assert.ok((workflow.match(/run: npm ci/g) ?? []).length >= 2, "production gates must use npm ci");
assert.match(workflow, /production-config:self-test/);

assert.match(read(".gitignore"), /^tsconfig\.tsbuildinfo$/m);
const publicHealth = read("src/app/api/health/route.ts");
assert.doesNotMatch(publicHealth, /missingMigrations|configurationSource|canonicalOrigin|malformedCount|version:/, "public health must not expose internal diagnostics");
assert.match(read("src/app/api/console/health/route.ts"), /getCurrentUser/);
assert.match(read("src/app/console/page.tsx"), /fetch\("\/api\/console\/health"/);
assert.match(read("src/app/api/elitze/route.ts"), /agent: ELITZE_AGENT_NAME/);
assert.match(read("src/app/api/elitze/route.ts"), /assistant: ELITZE_AGENT_ASSISTANT/);
const orchestrationRoute = read("src/app/api/elitze/route.ts");
assert.match(orchestrationRoute, /getCurrentUser\(\)/, "ELITZE orchestrator must require an authenticated user");
assert.match(orchestrationRoute, /assertSameOrigin\(request\)/, "ELITZE orchestrator POST must enforce same-origin requests");
assert.match(orchestrationRoute, /tenantId:\s*user\.tenantId/, "ELITZE orchestrator must bind tenant to the authenticated session");
assert.match(orchestrationRoute, /actorId:\s*user\.id/, "ELITZE orchestrator must bind actor to the authenticated session");
assert.match(orchestrationRoute, /SELECT id FROM agent_identities WHERE id=\$1::uuid AND tenant_id=\$2::uuid AND kind='AGENT' AND active=true/i, "ELITZE orchestrator must verify an active agent identity in the same tenant");
assert.doesNotMatch(orchestrationRoute, /tenantId:\s*z\.string|actorId:\s*z\.string/, "ELITZE orchestrator must not trust client-supplied tenant or actor identities");
const mergeManifest = read("docs/ELITZE-AGENTIC-SECURITY-MERGE-MANIFEST.md");
const orchestrationManifest = read("docs/ELITZE-ORCHESTRATION-DEFENSE.md");
assert.match(mergeManifest, /ELITZE runtime orchestrator/);
assert.match(mergeManifest, /Sentinel security layer[^\n]*not a separate product or separate control plane/);
assert.match(mergeManifest, /generated\/elitze_orchestrator\.py` is a bounded CI self-test\/evidence wrapper/);
assert.match(orchestrationManifest, /Sentinel is the integrated security-protection layer within this platform, not a separate product or control plane/);
assert.match(orchestrationManifest, /src\/lib\/elitze-secure\/elitze-agent\.ts` — ELITZE runtime planning\/orchestration/);
assert.match(read("src/lib/elitze-secure/elitze-agent.ts"), /ELITZE_AGENT_NAME = "ELITZE"/);
assert.match(read("src/lib/elitze-secure/elitze-agent.ts"), /ELITZE_AGENT_ASSISTANT = "SARA"/);
assert.match(read("src/app/api/public/health/route.ts"), /export \{ GET \}/);
assert.doesNotMatch(read("docs/ELITZE-AGENTIC-SECURITY-MERGED-FOUNDATION.md"), /ELITZE SECURE/);

const productionSecrets = read("src/config/secrets-assert.ts");
assert.match(productionSecrets, /ELITZE_EMAIL_PROVIDER:\s*z\.literal\("resend"\)/);
assert.match(productionSecrets, /RESEND_API_KEY:\s*z\.string\(\)\.trim\(\)\.min\(10\)/);
assert.doesNotMatch(productionSecrets, /POSTMARK_SERVER_TOKEN/);
const authEmail = read("src/lib/auth-email.ts");
assert.match(authEmail, /https:\/\/api\.resend\.com\/emails/);
assert.match(authEmail, /RESEND_API_KEY/);
assert.doesNotMatch(authEmail, /POSTMARK_SERVER_TOKEN/);
assert.match(env, /^ELITZE_EMAIL_PROVIDER=resend$/m);
assert.match(env, /^RESEND_API_KEY=$/m);
assert.match(env, /^ELITZE_MCP_GATEWAY_ENABLED=false$/m, "MCP gateway must default off in the environment template");
assert.match(env, /^ELITZE_MCP_GATEWAY_EXECUTION_ENABLED=false$/m, "MCP tool execution must default off in the environment template");
const workspaceEntry = read("src/app/workspace/page.tsx");
const homePage = read("src/app/page.tsx");
const platformPage = read("src/app/platform/page.tsx");
const featurePage = read("src/components/seo-feature-page.tsx");
assert.match(workspaceEntry, /getCurrentUser/, "workspace entry must verify authentication");
assert.match(workspaceEntry, /if \(!user\) redirect\("\/login/, "anonymous visitors must be sent to sign-in");
assert.match(workspaceEntry, /redirect\("\/console"\)/, "authenticated visitors must enter the console");
assert.match(homePage, /\["Workspace", "\/workspace"\]/, "workspace must be in primary navigation");
assert.match(homePage, /Open workspace/i, "homepage must expose a clear workspace action");
assert.doesNotMatch(homePage, /\/sales|Acquisition|acquisition/i, "homepage must be security-workspace product copy");
assert.doesNotMatch(platformPage, /\/sales|Acquisition|acquisition/i, "platform page must be security product copy");
assert.doesNotMatch(featurePage, /\/sales|Acquisition|acquisition/i, "feature template must be security product copy");
assert.match(read("src/app/robots.ts"), /"\/workspace"/, "workspace must be excluded from indexing");
for (const removedPath of [
  "sales",
  "src/app/sales/page.tsx",
  "src/app/sales/access/page.tsx",
  "src/app/acquisition/page.tsx",
  "src/app/api/acquisition",
  "src/app/buyers/page.tsx",
  "src/components/acquisition-contact-form.tsx",
  "src/components/acquisition-cta.tsx",
  "drizzle/0028_acquisition_pipeline.sql",
  "scripts/sale-readiness.mjs",
  "scripts/sale-readiness-self-test.mjs",
  "scripts/contact-acquisition-self-test.mjs",
  "scripts/business-process-self-test.mjs"
]) {
  assert.equal(fs.existsSync(path.join(root, removedPath)), false, "obsolete commercial module must be deleted: " + removedPath);
}
const packageJson = JSON.parse(read("package.json"));
assert.equal(Object.keys(packageJson.scripts).some(name => /sale:readiness|contact-acquisition|business-process:self-test/i.test(name)), false);
assert.doesNotMatch(read("src/lib/analytics-events.ts"), /sales_cta|acquisition_inquiry|repository_access_request/);
assert.match(read("drizzle/0029_remove_legacy_lead_pipeline.sql"), /DROP TABLE IF EXISTS acquisition_lead_events/i);
assert.match(read("drizzle/0029_remove_legacy_lead_pipeline.sql"), /DROP TABLE IF EXISTS acquisition_leads/i);
console.log("ELITZE production configuration self-test: PASS");

const legacyIdentity = ["myt", "hos"].join("");
const legacyIdentityFiles = tracked.filter((file) => !file.startsWith("drizzle/") && new RegExp(legacyIdentity, "i").test(file));
assert.equal(legacyIdentityFiles.length, 0, "legacy orchestration file names remain");
const legacyIdentityContent = textFiles.filter((file) => !file.startsWith("drizzle/") && new RegExp(legacyIdentity, "i").test(read(file)));
assert.equal(legacyIdentityContent.length, 0, "legacy orchestration branding remains");
