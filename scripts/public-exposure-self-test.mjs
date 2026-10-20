import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const read = (path) => readFileSync(path, "utf8");
const config = read("next.config.ts");
const packageJson = JSON.parse(read("package.json"));
const consoleLayout = read("src/app/console/layout.tsx");
const publicHealth = read("src/app/api/health/route.ts");
const consoleHealth = read("src/app/api/console/health/route.ts");
const sitemap = read("src/app/sitemap.ts");

assert.match(config, /productionBrowserSourceMaps:\s*false/, "production browser source maps must stay disabled");
assert.equal(packageJson.private, true, "the application package must remain private");
assert.match(consoleLayout, /getCurrentUser\(\)/, "console layout must resolve the server-side session");
assert.match(consoleLayout, /if\s*\(!user\)\s*redirect\(["']\/login["']\)/, "anonymous console requests must redirect to login");
assert.match(consoleLayout, /force-dynamic/, "authenticated console layout must not be statically cached");
assert.match(consoleHealth, /if\s*\(!user\)/, "console health endpoint must reject anonymous users");
assert.match(consoleHealth, /status:\s*401/, "console health endpoint must return 401 without a session");
assert.match(consoleHealth, /private, no-store/, "console health must not be shared-cacheable");
assert.match(publicHealth, /service:\s*["']elitze-agentic-security["']/, "public health should expose only the stable service identifier");
assert.match(publicHealth, /status:\s*ok\s*\?\s*["']ready["']\s*:\s*["']unavailable["']/, "public health should expose only coarse readiness");
assert.doesNotMatch(publicHealth, /missingMigrations|configurationSource|process\.env\.[A-Z0-9_]+\s*[,}]/, "public health must not serialize configuration or migration details");
assert.doesNotMatch(sitemap, /["']\/(?:api|console|workspace|login|register|forgot-password|reset-password)(?:\/|["'])/, "private routes must not be included in the public sitemap");

const mapFiles = [];
function walk(directory) {
  if (!existsSync(directory)) return;
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.name.endsWith(".map")) mapFiles.push(path);
  }
}
walk(".next/static");
assert.equal(mapFiles.length, 0, `production build must not emit browser source maps; found: ${mapFiles.join(", ")}`);

const baseUrl = process.env.ELITZE_PUBLIC_BASE_URL?.trim();
if (baseUrl) {
  const base = new URL(baseUrl);
  assert.ok(base.protocol === "https:" || base.hostname === "localhost", "public exposure smoke checks require HTTPS except localhost");
  const fetchRoute = async (path) => {
    const response = await fetch(new URL(path, base), { redirect: "manual", headers: { "cache-control": "no-cache" } });
    const body = await response.text();
    return { response, body };
  };

  const home = await fetchRoute("/");
  assert.equal(home.response.status, 200, "public homepage should return HTTP 200");
  assert.doesNotMatch(home.body, /sourceMappingURL=|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|(?:api[_-]?key|secret|password)\s*[:=]\s*["'][^"']{12,}/i, "homepage must not expose source-map references or obvious credential material");

  const sensitivePayload = /BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|gh[pousr]_[A-Za-z0-9]{30,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{20,}|ELITZE_(?:RUNNER|SECURITY_RUNNER)_HMAC_SECRET\s*[:=]|(?:DATABASE_URL|SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY)\s*[:=]|["'](?:tenantId|tenant_id|missingMigrations|configurationSource|connectionString)["']\s*:/i;
  assert.doesNotMatch(home.body, sensitivePayload, "homepage HTML must not contain credential patterns or serialized private diagnostic fields");

  const sitemapResult = await fetchRoute("/sitemap.xml");
  assert.equal(sitemapResult.response.status, 200, "public sitemap should return HTTP 200");
  const publicPaths = [...sitemapResult.body.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((match) => match[1] || "/");
  assert.ok(publicPaths.length > 0, "public sitemap should list public routes");
  assert.ok(publicPaths.every((path) => !/^\/(?:api|console|workspace|login|register|forgot-password|reset-password)(?:\/|$)/.test(path)), "sitemap must not advertise private routes");

  const scriptUrls = [...home.body.matchAll(/<script[^>]+src=["']([^"']+\.js(?:\?[^"']*)?)["']/g)].map((match) => match[1]);
  const uniqueScripts = [...new Set(scriptUrls)].filter((path) => path.startsWith("/") || new URL(path).origin === base.origin);
  for (const scriptPath of uniqueScripts) {
    const script = await fetchRoute(scriptPath);
    assert.equal(script.response.status, 200, `public script should load: ${scriptPath}`);
    assert.doesNotMatch(script.body, /sourceMappingURL=|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|gh[pousr]_[A-Za-z0-9]{30,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{20,}/i, `public script must not expose source maps or obvious credentials: ${scriptPath}`);
    const mapPath = scriptPath.replace(/\.js(?:\?.*)?$/, ".js.map");
    const sourceMap = await fetchRoute(mapPath);
    assert.notEqual(sourceMap.response.status, 200, `source map must not be publicly retrievable: ${mapPath}`);
  }

  for (const path of publicPaths) {
    const page = await fetchRoute(path);
    assert.ok(page.response.status >= 200 && page.response.status < 400, `sitemap route must not return a server error: ${path} returned ${page.response.status}`);
    assert.doesNotMatch(page.body, sensitivePayload, `public page must not expose credentials or serialized private diagnostic fields: ${path}`);
  }

  const health = await fetchRoute("/api/health");
  assert.ok([200, 503].includes(health.response.status), "public health endpoint should return only readiness status");
  const healthJson = JSON.parse(health.body);
  assert.deepEqual(Object.keys(healthJson).sort(), ["ok", "service", "status"], "public health response must remain allowlisted");

  const consoleResponse = await fetchRoute("/console");
  assert.ok(consoleResponse.response.status >= 200 && consoleResponse.response.status < 400, `console route should respond without server failure; got ${consoleResponse.response.status}`);
  assert.doesNotMatch(consoleResponse.body, sensitivePayload, "anonymous console response must not expose private tenant or diagnostic fields");
  if (consoleResponse.response.status === 200) assert.match(consoleResponse.body, /\/login|sign in|log in/i, "a streamed redirect response must direct anonymous visitors to login");
  const consoleHealthResponse = await fetchRoute("/api/console/health");
  assert.equal(consoleHealthResponse.response.status, 401, "anonymous console health API access must return 401");
  assert.doesNotMatch(consoleHealthResponse.body, /databaseUrl|connectionString|missingMigrations|private[_-]?key|api[_-]?key/i, "anonymous health API must not disclose privileged diagnostics");
}

console.log("ELITZE public exposure self-test: PASS");
if (!baseUrl) console.log("Live production smoke checks: SKIPPED (set ELITZE_PUBLIC_BASE_URL to enable).");
