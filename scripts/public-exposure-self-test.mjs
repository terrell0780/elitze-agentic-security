import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const tracked = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" }).split(/\r?\n/).filter(Boolean);
const sensitiveTracked = tracked.filter((file) =>
  ((/(^|\/)\.env(?:\..*)?$/.test(file) && !/(^|\/)\.env\.example$/.test(file)) ||
   /\.(?:pem|p12|pfx|key)$/i.test(file) ||
   /(^|\/)(?:id_rsa|id_ed25519)$/i.test(file))
);
assert.deepEqual(sensitiveTracked, [], "credential and private-key files must never be tracked");

const credentialPatterns = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ["AWS access key", /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/],
  ["GitHub token", /\b(?:ghp|gho|ghu|ghs)_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{40,}\b/],
  ["Stripe live secret", /\b(?:sk|rk)_live_[A-Za-z0-9]{16,}\b/],
  ["Resend API key", /\bre_[A-Za-z0-9]{30,}\b/],
  ["OpenAI API key", /\bsk-(?:proj-)?[A-Za-z0-9_-]{32,}\b/],
  ["Supabase secret", /\bsb_secret_[A-Za-z0-9_-]{20,}\b/],
];
const privateConfigNames = /\b(?:DATABASE_URL|POSTGRES_URL|PGPASSWORD|RESEND_API_KEY|ELITZE_RUNNER_HMAC_SECRET|ELITZE_SECURITY_RUNNER_HMAC_SECRET|ELITZE_INTERNAL_API_KEY|ELITZE_EVIDENCE_SIGNING_SECRET|SUPABASE_SERVICE_ROLE_KEY)\b/;
const isBrowserSource = (file) =>
  /^(?:src\/app|src\/components|public)\//.test(file) &&
  /\.(?:tsx?|jsx?|mjs|cjs|css|html|svg|json)$/i.test(file);

for (const file of tracked.filter(isBrowserSource)) {
  const content = read(file);
  for (const [label, pattern] of credentialPatterns) {
    assert.equal(pattern.test(content), false, label + " format detected in browser-facing source: " + file);
  }
  if (/^\s*["']use client["'];?/m.test(content)) {
    for (const match of content.matchAll(/process\.env\.([A-Z0-9_]+)/g)) {
      assert.ok(match[1].startsWith("NEXT_PUBLIC_"), "server-only environment variable " + match[1] + " referenced in client component " + file);
    }
  }
}

const nextConfig = read("next.config.ts");
assert.match(nextConfig, /productionBrowserSourceMaps:\s*false/, "production browser source maps must remain disabled");
assert.match(nextConfig, /poweredByHeader:\s*false/, "framework-identifying powered-by header must remain disabled");
const graphRoute = read("src/app/api/console/security-graph/route.ts");
assert.match(graphRoute, /getCurrentUser\(\)/, "security graph must require an authenticated session");
assert.match(graphRoute, /user\.tenantId/, "security graph data must be tenant scoped to the server session");
assert.match(graphRoute, /cache-control["']?\s*:\s*["']private,\s*no-store/i, "security graph responses must not be shared-cached");
assert.doesNotMatch(graphRoute, /tenantId:\s*user\.tenantId/, "do not echo tenant identifiers in security graph response payloads");

const protectedRoutes = [
  ["src/app/api/console/health/route.ts", /getCurrentUser\(\)/],
  ["src/app/api/console/overview/route.ts", /getCurrentUser\(\)/],
  ["src/app/api/console/security-graph/route.ts", /getCurrentUser\(\)/],
  ["src/app/api/console/evidence-snapshot/route.ts", /getCurrentUser\(\)/],
  ["src/app/api/console/evidence-debugger/route.ts", /getCurrentUser\(\)/],
  ["src/app/api/ops/readiness/route.ts", /getCurrentUser\(\)/],
  ["src/app/api/data-hub/route.ts", /getCurrentUser\(\)/],
  ["src/app/api/elitze/route.ts", /getCurrentUser\(\)/],
  ["src/app/api/crm/route.ts", /getCurrentUser\(\)/],
  ["src/app/api/roi/route.ts", /getCurrentUser\(\)/],
];
for (const [file, guard] of protectedRoutes) {
  const source = read(file);
  assert.match(source, guard, file + " must resolve the authenticated server identity");
  assert.match(source, /status:\s*401|authentication_required|unauthorized/, file + " must reject unauthenticated requests");
}
const dataBridge = read("src/app/api/data-bridge/sources/route.ts");
assert.match(dataBridge, /authorizeInternalRequest/, "internal data-bridge reads must require server-side API-key authorization");

function walk(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}
const staticMaps = walk(path.join(root, ".next/static")).filter((file) => file.endsWith(".map"));
assert.deepEqual(staticMaps, [], "production client build must not contain source-map files");

console.log("Public exposure audit: static source, credential patterns, source maps, and server authorization contracts PASS");

const configuredBase = process.env.ELITZE_PUBLIC_AUDIT_URL?.trim();
if (!configuredBase) {
  console.log("Public exposure audit: live HTTP checks SKIPPED (ELITZE_PUBLIC_AUDIT_URL is unset)");
  process.exit(0);
}
const base = new URL(configuredBase);
assert.ok(base.protocol === "https:" || base.hostname === "127.0.0.1" || base.hostname === "localhost", "live audit requires HTTPS outside loopback");
const fetchWithTimeout = async (url, options = {}) => fetch(url, { ...options, signal: AbortSignal.timeout(12000) });
const liveSecretPatterns = credentialPatterns;
const privateMarkers = privateConfigNames;
const assertCleanPublicBody = (body, label) => {
  for (const [name, pattern] of liveSecretPatterns) assert.equal(pattern.test(body), false, name + " format exposed in " + label);
  assert.equal(privateMarkers.test(body), false, "server-only environment variable name exposed in " + label);
  assert.equal(/["']tenantId["']\s*:\s*["'][0-9a-f-]{36}["']/i.test(body), false, "tenant identifier exposed in " + label);
};

const publicPages = ["/", "/platform", "/security", "/privacy", "/terms"];
const scriptUrls = new Set();
for (const route of publicPages) {
  const url = new URL(route, base);
  const response = await fetchWithTimeout(url);
  assert.equal(response.status, 200, "public route " + route + " must return HTTP 200");
  const body = await response.text();
  assertCleanPublicBody(body, route);
  const h1Count = [...body.matchAll(/<h1\b/gi)].length;
  assert.equal(h1Count, 1, "public page " + route + " must have exactly one primary heading");
  for (const imageMatch of body.matchAll(/<img\b[^>]*>/gi)) {
    assert.match(imageMatch[0], /\balt\s*=/i, "image on " + route + " must define alternative text");
  }
  if (route === "/") {
    assert.match(body, /<title>Enterprise Cybersecurity Platform<\/title>/i, "homepage title must lead with cybersecurity");
    const canonicalLink = [...body.matchAll(/<link\\b[^>]*>/gi)]
      .map((match) => match[0])
      .find((tag) => /\\brel=["']canonical["']/i.test(tag));
    assert.ok(canonicalLink && /\\bhref=["']https:\\/\\/www\\.elitze\\.info\\//i.test(canonicalLink), "homepage canonical must point at https://www.elitze.info/");
    assert.match(body, /name=["']description["'][^>]*content=["'][^"']*cybersecurity/i, "homepage description must lead with cybersecurity");
    const schemaJson = [...body.matchAll(/<script type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi)]
      .map((match) => JSON.parse(match[1]));
    assert.ok(schemaJson.some((schema) => schema["@type"] === "SoftwareApplication" &&
      schema.applicationCategory === "SecurityApplication" &&
      typeof schema.description === "string" &&
      schema.description.toLowerCase().includes("cybersecurity") &&
      typeof schema.keywords === "string"), "homepage SoftwareApplication JSON-LD must include category, description, and keywords");
  }
  for (const header of ["content-security-policy", "x-content-type-options", "x-frame-options", "strict-transport-security"]) {
    assert.ok(response.headers.get(header), "security header " + header + " missing from " + route);
  }
  if (route === "/") {
    assert.equal(response.headers.get("x-content-type-options")?.toLowerCase(), "nosniff");
    assert.equal(response.headers.get("x-frame-options")?.toUpperCase(), "DENY");
    assert.match(response.headers.get("strict-transport-security") ?? "", /max-age=/i);
  }
  for (const match of body.matchAll(/<script[^>]+src=["']([^"']+\.js(?:\?[^"']*)?)["']/gi)) {
    const script = new URL(match[1].replace(/&amp;/g, "&"), base);
    if (script.origin === base.origin) scriptUrls.add(script.toString());
  }
}
assert.ok(scriptUrls.size > 0, "public HTML should reference compiled JavaScript assets");
for (const scriptUrl of [...scriptUrls].slice(0, 30)) {
  const response = await fetchWithTimeout(scriptUrl);
  assert.equal(response.status, 200, "client asset must load: " + scriptUrl);
  const source = await response.text();
  assertCleanPublicBody(source, scriptUrl);
  const suffixMap = await fetchWithTimeout(scriptUrl + ".map", { method: "HEAD" });
  assert.ok([404, 405].includes(suffixMap.status), "unexpectedly exposed source-map URL: " + scriptUrl + ".map (HTTP " + suffixMap.status + ")");
  const sourceMapRef = source.match(/sourceMappingURL=([^\s*]+)/);
  if (sourceMapRef && !sourceMapRef[1].startsWith("data:")) {
    const mapUrl = new URL(sourceMapRef[1], scriptUrl);
    const mapResponse = await fetchWithTimeout(mapUrl, { method: "HEAD" });
    assert.ok([404, 405].includes(mapResponse.status), "source-map reference is publicly reachable: " + mapUrl + " (HTTP " + mapResponse.status + ")");
  }
}

const privateApiPaths = [
  "/api/console/health",
  "/api/console/overview",
  "/api/console/security-graph",
  "/api/console/evidence-snapshot",
  "/api/console/evidence-debugger",
  "/api/ops/readiness",
  "/api/data-hub",
  "/api/elitze",
  "/api/crm",
  "/api/roi",
  "/api/data-bridge/sources",
];
for (const route of privateApiPaths) {
  const response = await fetchWithTimeout(new URL(route, base), { headers: { accept: "application/json" }, redirect: "manual" });
  assert.ok([401, 403].includes(response.status), "unauthenticated access to " + route + " was not denied (HTTP " + response.status + ")");
  const body = await response.text();
  assertCleanPublicBody(body, "unauthenticated API " + route);
  assert.equal(/(?:tenantId|tenant_id|security_graph_nodes|security_graph_edges|mcp_gateway_decisions|security_test_findings)\s*["':]/i.test(body), false, "internal data fields exposed by unauthenticated " + route);
}
console.log("Public exposure audit: live public routes, browser bundles, source-map paths, security headers, and unauthenticated API checks PASS");
