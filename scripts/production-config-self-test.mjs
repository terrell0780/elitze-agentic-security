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
assert.match(env, /^ELITZE_AUTH_ENCRYPTION_KEY_ACTIVE=.+$/m, "environment template must document active auth encryption key");
assert.match(env, /^ELITZE_TEAM_SESSION_SECRET_ACTIVE=.+$/m, "environment template must document active session secret");
assert.match(env, /^ELITZE_INTERNAL_API_KEY_ACTIVE=.+$/m, "environment template must document active internal API key");
assert.match(env, /^ELITZE_EMAIL_PROVIDER=resend$/m);
assert.match(env, /^RESEND_API_KEY=$/m);
assert.match(env, /^ELITZE_MCP_GATEWAY_ENABLED=false$/m, "MCP gateway must default off in the environment template");
assert.match(env, /^ELITZE_MCP_GATEWAY_EXECUTION_ENABLED=false$/m, "MCP tool execution must default off in the environment template");
const workspaceEntry = read("src/app/workspace/page.tsx");
const homePage = [
  "src/app/page.tsx",
  "src/components/home/site-header.tsx",
  "src/components/home/hero-section.tsx",
  "src/components/home/brand-marquee.tsx",
  "src/components/home/control-model-section.tsx",
  "src/components/home/endpoint-integration-section.tsx",
  "src/components/home/about-promo-section.tsx",
  "src/components/home/validation-section.tsx",
  "src/components/home/workspace-cta-section.tsx",
  "src/components/home/site-footer.tsx",
].map(read).join("\n");
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
const robotsLines = read("public/robots.txt").trimEnd().split(/\r?\n/);
assert.deepEqual(robotsLines, ["User-agent: *", "Allow: /", "Sitemap: https://www.elitze.info/sitemap.xml"], "robots.txt must contain exactly the minimal three-line policy");
const sitemap = read("src/app/sitemap.ts");
assert.match(sitemap, /productionConfig\.canonicalOrigin/, "sitemap must use the canonical origin");
assert.doesNotMatch(sitemap, /["']\/(?:api|console|workspace|login|register|forgot-password|reset-password|auth)(?:\/|["'])/, "private routes must not appear in the sitemap");
assert.doesNotMatch(sitemap, /["']\/["']\s*,?/, "the authenticated root redirect must not be listed as an indexable public URL");
assert.doesNotMatch(read("src/db/schema.ts"), /marketGaps|market_gaps/, "unused commercial market-gap schema must stay removed");
assert.doesNotMatch(read("src/db/schema.ts"), /crmContacts|crmActions|crm-schema/, "retired CRM schema must not be exported");
assert.equal(fs.existsSync(path.join(root, "src/app/api/crm/route.ts")), false, "retired CRM API route must stay deleted");
assert.equal(fs.existsSync(path.join(root, "src/db/crm-schema.ts")), false, "retired CRM schema file must stay deleted");
assert.equal(fs.existsSync(path.join(root, "sales")), false, "obsolete sales directory must remain removed");
assert.doesNotMatch(read("scripts/migrate.mjs"), /"crm_contacts"|"crm_actions"/, "migration verification must not require retired CRM tables");
const readinessMigration = read("drizzle/0035_expand_security_readiness_evidence.sql");
assert.match(readinessMigration, /DELETE FROM production_readiness_evidence WHERE category = 'customer_pilot'/, "legacy customer-pilot evidence must be purged from the security workspace");
assert.match(readinessMigration, /authentication_e2e[\s\S]*transactional_email_delivery[\s\S]*runner_handshake[\s\S]*tenant_isolation[\s\S]*security_validation[\s\S]*runtime_monitoring/, "readiness evidence categories must support all security release gates");
const readinessCategoryList = readinessMigration.split("CHECK (category IN (")[1] ?? "";
assert.ok(readinessCategoryList && !/customer_pilot/.test(readinessCategoryList), "new readiness category constraint must exclude customer-pilot state");
assert.match(read("drizzle/0036_remove_legacy_crm_tables.sql"), /DROP TABLE IF EXISTS crm_actions;[\s\S]*DROP TABLE IF EXISTS crm_contacts;/, "legacy CRM tables must be removed with a forward migration");

assert.doesNotMatch(read("scripts/migrate.mjs"), /"market_gaps"/, "migration verifier must not require the retired commercial table");
assert.match(read("drizzle/0034_remove_legacy_market_gaps.sql"), /DROP TABLE IF EXISTS market_gaps;/, "retired market-gap table must be removed through a forward migration");
const readinessRoute = read("src/app/api/ops/readiness/route.ts");
assert.match(readinessRoute, /user\.role !== "owner" && user\.role !== "admin"/, "production readiness must be restricted to owners and admins");
assert.match(readinessRoute, /"cache-control": "private, no-store"/, "production readiness must not be cached");
assert.match(readinessRoute, /"x-robots-tag": "noindex, nofollow, nosnippet"/, "production readiness must not be indexed");
assert.match(readinessRoute, /readiness_unavailable/, "production readiness errors must be sanitized");
const readinessRuntime = read("src/lib/production-readiness.ts");
assert.doesNotMatch(readinessRuntime, /crm_contacts|crm_actions|authorizedLeadSources|realCustomerPilotData|customer-pilot|lead source/i, "production readiness must not depend on commercial CRM/lead-pipeline state");
assert.match(readinessRuntime, /"runner_handshake"/, "release readiness must require actual runner handshake evidence");
assert.match(readinessRuntime, /"tenant_isolation"/, "release readiness must require actual tenant-isolation evidence");
assert.match(readinessRuntime, /"security_validation"/, "release readiness must require actual security-validation evidence");
assert.match(readinessRuntime, /"runtime_monitoring"/, "release readiness must require actual monitoring evidence");
assert.match(readinessRuntime, /"ELITZE_AUTH_ENCRYPTION_KEY_ACTIVE"/, "readiness must require the active auth-encryption secret");
assert.match(readinessRuntime, /"ELITZE_TEAM_SESSION_SECRET_ACTIVE"/, "readiness must require the active team-session secret");
assert.match(readinessRuntime, /"ELITZE_INTERNAL_API_KEY_ACTIVE"/, "readiness must require the active internal API secret");
assert.match(readinessRuntime, /ELITZE_SECURITY_RUNNER_URL.*ELITZE_RUNNER_URL/, "readiness must accept the documented control-plane runner URL name");
assert.match(readinessRuntime, /"authentication_e2e"/, "release readiness must require executed authentication evidence");
assert.match(readinessRuntime, /"transactional_email_delivery"/, "release readiness must require real email-delivery evidence");
assert.match(readinessRuntime, /state === "BLOCKED" \|\| state === "UNMEASURABLE"/, "unknown required security proof must block release readiness");
const readinessPage = read("src/app/console/readiness/page.tsx");
assert.doesNotMatch(readinessPage, /Buyer-verifiable|authorized lead sources|real customer pilot|CRM/i, "readiness UI must be security-only");
for (const item of ["Security runner handshake", "Tenant-isolation proof", "Authorized security validation", "Backup and restore proof"]) {
  assert.ok(readinessPage.includes(item), "readiness UI must display " + item);
}

const packageJson = JSON.parse(read("package.json"));
assert.equal(Object.keys(packageJson.scripts).some(name => /sale:readiness|contact-acquisition|business-process:self-test/i.test(name)), false);
console.log("ELITZE production configuration self-test: PASS");

const legacyIdentity = ["myt", "hos"].join("");
const legacyIdentityFiles = tracked.filter((file) => !file.startsWith("drizzle/") && new RegExp(legacyIdentity, "i").test(file));
assert.equal(legacyIdentityFiles.length, 0, "legacy orchestration file names remain");
const legacyIdentityContent = textFiles.filter((file) => !file.startsWith("drizzle/") && new RegExp(legacyIdentity, "i").test(read(file)));
assert.equal(legacyIdentityContent.length, 0, "legacy orchestration branding remains");
