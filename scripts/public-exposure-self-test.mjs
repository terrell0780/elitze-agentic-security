import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));
const walk = (directory) => {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
};
const secretPatterns = [
  ["private key", /-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----/],
  ["database connection string", /postgres(?:ql)?:\/\/[^\s"'<>]+:[^\s"'<>]+@/i],
  ["GitHub access token", /\bgh[pousr]_[A-Za-z0-9]{20,}\b/],
  ["AWS access key identifier", /\bAKIA[0-9A-Z]{16}\b/],
  ["Resend API token", /\bre_[A-Za-z0-9_-]{20,}\b/],
  ["Vercel token", /\bvercel_[A-Za-z0-9]{20,}\b/i],
  ["OpenAI-style secret token", /\bsk-[A-Za-z0-9]{32,}\b/],
  ["signed JWT", /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/],
  ["literal private environment value", /\b(?:DATABASE_URL|RESEND_API_KEY|ELITZE_SECURITY_RUNNER_HMAC_SECRET|ELITZE_RUNNER_HMAC_SECRET|ELITZE_INTERNAL_API_KEY)\s*[:=]\s*["'][^"'\r\n]{8,}["']/],
];
const checkNoSecrets = (text, label) => {
  for (const [name, pattern] of secretPatterns) {
    assert.equal(pattern.test(text), false, label + ": possible " + name + " exposure");
  }
};
const checkNoInternalEvidence = (text, label) => {
  const patterns = [
    ["serialized tenant UUID", /["'](?:tenantId|tenant_id|organizationId|organization_id)["']\s*:\s*["'][0-9a-f]{8}-[0-9a-f-]{27,}["']/i],
    ["serialized evidence snapshot", /elitze\.evidence-snapshot\.v1/i],
    ["database table names", /\b(?:security_graph_nodes|security_graph_edges|security_test_findings|security_validation_events)\b/i],
    ["server filesystem path", /(?:\/home\/[^\s"'<>]+\/src\/app\/|\/var\/task\/[^\s"'<>]+|node_modules\/next\/dist\/)/i],
  ];
  for (const [name, pattern] of patterns) {
    assert.equal(pattern.test(text), false, label + ": possible " + name + " exposure");
  }
};

const nextConfig = read("next.config.ts");
assert.match(nextConfig, /productionBrowserSourceMaps:\s*false/, "production browser source maps must stay disabled");
assert.match(nextConfig, /poweredByHeader:\s*false/, "Next.js powered-by header must stay disabled");
assert.match(nextConfig, /Content-Security-Policy/, "security headers must include a content security policy");
assert.match(nextConfig, /Strict-Transport-Security/, "security headers must include HSTS");
assert.match(nextConfig, /X-Content-Type-Options/, "security headers must include nosniff");
assert.match(nextConfig, /X-Frame-Options/, "security headers must prevent framing");

const publicHealth = read("src/app/api/health/route.ts");
assert.match(publicHealth, /cache-control.*no-store/i, "public health responses must not be cached");
assert.doesNotMatch(publicHealth, /missingMigrations|configurationSource|canonicalOrigin|malformedCount|version:/, "public health must not return internal readiness diagnostics");
assert.match(publicHealth, /service:\s*"elitze-agentic-security"/);
assert.match(publicHealth, /status:\s*ok\s*\?\s*"ready"\s*:\s*"unavailable"/);

const sensitiveRoutes = [
  ["src/app/api/console/health/route.ts", /getCurrentUser\(\)/],
  ["src/app/api/console/overview/route.ts", /getCurrentUser\(\)/],
  ["src/app/api/console/security-graph/route.ts", /getCurrentUser\(\)/],
  ["src/app/api/console/evidence-snapshot/route.ts", /getCurrentUser\(\)/],
  ["src/app/api/elitze/route.ts", /getCurrentUser\(\)/],
  ["src/app/api/data-bridge/sources/route.ts", /authorizeInternalRequest\(/],
];
for (const [file, guard] of sensitiveRoutes) {
  const content = read(file);
  assert.match(content, guard, file + " must enforce a server-side access boundary");
  assert.match(content, /privateHeaders|cache-control.*(?:private,\s*)?no-store/i, file + " must mark responses non-cacheable");
  checkNoSecrets(content, file + " source");
}
for (const [file, marker] of [
  ["src/app/api/console/overview/route.ts", /tenant_id=\$1/],
  ["src/app/api/console/security-graph/route.ts", /tenant_id=\$1/],
  ["src/app/api/console/evidence-snapshot/route.ts", /tenant_id=\$1/],
]) {
  assert.match(read(file), marker, file + " must scope data queries by tenant");
}
assert.match(read("src/app/console/layout.tsx"), /getCurrentUser\(\)/, "console server layout must authenticate before rendering");
assert.match(read("src/app/console/layout.tsx"), /if\s*\(!user\)\s*redirect\(["']\/login/, "anonymous console navigation must redirect to login");
assert.match(read("src/app/workspace/page.tsx"), /getCurrentUser\(\)/, "workspace entry must authenticate on the server");
assert.match(read("src/app/workspace/page.tsx"), /if\s*\(!user\)\s*redirect\(["']\/login/, "anonymous workspace navigation must redirect to login");
assert.match(read("src/app/api/elitze/route.ts"), /tenantId:\s*user\.tenantId/, "orchestrator must bind tenant identity to the authenticated session");
assert.match(read("src/app/api/elitze/route.ts"), /actorId:\s*user\.id/, "orchestrator must bind actor identity to the authenticated session");

const publicFiles = walk(path.join(root, "public"));
for (const file of publicFiles) {
  const rel = path.relative(root, file);
  assert.equal(file.endsWith(".map"), false, rel + " must not be a published source map");
  if (/\.(?:html?|js|mjs|cjs|json|xml|txt|css|svg|webmanifest)$/i.test(file)) {
    const content = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(content, /sourceMappingURL\s*=/i, rel + " must not reference a source map");
    checkNoSecrets(content, rel);
  }
}
const generatedStatic = path.join(root, ".next", "static");
if (fs.existsSync(generatedStatic)) {
  for (const file of walk(generatedStatic)) {
    const rel = path.relative(root, file);
    assert.equal(file.endsWith(".map"), false, rel + " must not ship as a public source map");
    if (/\.(?:js|mjs|cjs|css|html|json)$/i.test(file)) {
      const content = fs.readFileSync(file, "utf8");
      assert.doesNotMatch(content, /sourceMappingURL\s*=/i, rel + " must not reference a source map");
      checkNoSecrets(content, rel);
    }
  }
}

const liveBase = process.env.ELITZE_PUBLIC_BASE_URL?.trim();
const timeoutSignal = () => AbortSignal.timeout(12000);
const fetchLive = async (route, options = {}) => {
  const url = new URL(route, liveBase);
  const response = await fetch(url, { redirect: options.redirect ?? "follow", signal: timeoutSignal(), headers: { "user-agent": "ELITZE-public-exposure-check/1.0" } });
  const body = await response.text();
  return { response, body, url: url.toString() };
};
if (liveBase) {
  const base = new URL(liveBase);
  assert.equal(base.protocol, "https:", "live exposure checks must target HTTPS");
  const publicRoutes = ["/", "/platform", "/security"];
  const assetUrls = new Set();
  for (const route of publicRoutes) {
    const { response, body, url } = await fetchLive(route);
    assert.equal(response.status, 200, "public route unavailable: " + route + " (" + response.status + ")");
    assert.match(response.headers.get("content-type") ?? "", /text\/html/i, "public route must return HTML: " + route);
    for (const [header, pattern] of [
      ["content-security-policy", /default-src/i],
      ["strict-transport-security", /max-age=/i],
      ["x-content-type-options", /nosniff/i],
      ["x-frame-options", /DENY/i],
      ["referrer-policy", /strict-origin-when-cross-origin/i],
    ]) assert.match(response.headers.get(header) ?? "", pattern, "missing/weak " + header + " on " + route);
    assert.equal(response.headers.get("x-powered-by"), null, "X-Powered-By must not be exposed on " + route);
    checkNoSecrets(body, "live public HTML " + route);
    checkNoInternalEvidence(body, "live public HTML " + route);
    for (const match of body.matchAll(/<(?:script)[^>]+src=["']([^"']+\.js(?:\?[^"']*)?)["']/gi)) {
      assetUrls.add(new URL(match[1], url).toString());
    }
  }
  assert.ok(assetUrls.size > 0, "homepage should reference the expected JavaScript assets");
  for (const assetUrl of assetUrls) {
    const { response, body } = await fetchLive(assetUrl);
    assert.equal(response.status, 200, "public JavaScript asset unavailable: " + new URL(assetUrl).pathname);
    assert.doesNotMatch(body, /sourceMappingURL\s*=/i, "public JavaScript references a source map: " + new URL(assetUrl).pathname);
    checkNoSecrets(body, "live JavaScript asset " + new URL(assetUrl).pathname);
    const mapUrl = assetUrl + ".map";
    const mapResponse = await fetch(mapUrl, { redirect: "follow", signal: timeoutSignal(), headers: { "user-agent": "ELITZE-public-exposure-check/1.0" } });
    if (mapResponse.ok && /(?:json|javascript)/i.test(mapResponse.headers.get("content-type") ?? "")) {
      const mapBody = await mapResponse.text();
      let map = null;
      try { map = JSON.parse(mapBody); } catch {}
      assert.equal(Boolean(map && Array.isArray(map.sources) && (Array.isArray(map.sourcesContent) || typeof map.mappings === "string")), false, "public source map is reachable: " + new URL(mapUrl).pathname);
    }
  }
  for (const route of ["/console", "/workspace"]) {
    const { response } = await fetchLive(route, { redirect: "manual" });
    assert.ok([301, 302, 303, 307, 308].includes(response.status), "protected page did not redirect anonymously: " + route + " (" + response.status + ")");
    assert.match(response.headers.get("location") ?? "", /\/login(?:\?|$)/, "protected page must direct anonymous traffic to login: " + route);
  }
  const privateApiRoutes = [
    "/api/console/health",
    "/api/console/overview",
    "/api/console/security-graph",
    "/api/console/evidence-snapshot",
    "/api/elitze",
    "/api/data-bridge/sources",
  ];
  for (const route of privateApiRoutes) {
    const { response, body } = await fetchLive(route, { redirect: "manual" });
    assert.equal(response.status, 401, "private API must deny anonymous access: " + route + " (" + response.status + ")");
    assert.match(response.headers.get("cache-control") ?? "", /no-store/i, "private API must prevent caching: " + route);
    checkNoSecrets(body, "anonymous API response " + route);
    checkNoInternalEvidence(body, "anonymous API response " + route);
  }
  const { response: healthResponse, body: healthBody } = await fetchLive("/api/health");
  assert.ok([200, 503].includes(healthResponse.status), "public health should return a known readiness status");
  assert.match(healthResponse.headers.get("cache-control") ?? "", /no-store/i, "public health must not be cached");
  let health = null;
  try { health = JSON.parse(healthBody); } catch {}
  assert.ok(health && typeof health === "object", "public health must return JSON");
  assert.deepEqual(Object.keys(health).sort(), ["ok", "service", "status"].sort(), "public health must expose only its minimal public contract");
  assert.equal(health.service, "elitze-agentic-security");
  assert.ok(["ready", "unavailable"].includes(health.status));
  console.log("ELITZE live public exposure checks: PASS (" + publicRoutes.length + " public pages, " + assetUrls.size + " assets, " + privateApiRoutes.length + " private APIs)");
} else {
  console.log("ELITZE live public exposure checks: SKIPPED (set ELITZE_PUBLIC_BASE_URL to enable)");
}
console.log("ELITZE public exposure self-test: PASS");
