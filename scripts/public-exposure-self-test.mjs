import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const walk = (directory) => {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
};
const tracked = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" }).split(/\r?\n/).filter(Boolean);
const sensitiveTracked = tracked.filter((file) =>
  ((/(^|\/)\.env(?:\..*)?$/.test(file) && !/\.example$/.test(file)) ||
   /\.(?:pem|p12|pfx|key)$/i.test(file) ||
   /(^|\/)(?:id_rsa|id_ed25519)$/i.test(file))
);
assert.deepEqual(sensitiveTracked, [], "credential/private-key files must never be tracked");

const isBrowserSource = (file) =>
  /^(?:src\/app|src\/components|public)\//.test(file) &&
  /\.(?:tsx?|jsx?|mjs|cjs|css|html|svg|json)$/i.test(file);

const secretPatterns = [
  ["private key", /-----BEGIN (?:[A-Z0-9 ]+ )?PRIVATE KEY-----/],
  ["database connection string", /postgres(?:ql)?:\/\/[^\s"'<>]+:[^\s"'<>]+@/i],
  ["GitHub access token", /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,})\b/],
  ["AWS access key identifier", /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/],
  ["Stripe live secret", /\b(?:sk|rk)_live_[A-Za-z0-9]{16,}\b/],
  ["Supabase service secret", /\bsb_secret_[A-Za-z0-9_-]{20,}\b/],
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
for (const file of tracked.filter(isBrowserSource)) {
  const content = read(file);
  checkNoSecrets(content, file + " browser-facing source");
  if (/^\s*["']use client["'];?/m.test(content)) {
    for (const match of content.matchAll(/process\.env\.([A-Z0-9_]+)/g)) {
      assert.ok(match[1].startsWith("NEXT_PUBLIC_"), "server-only environment variable " + match[1] + " referenced in client component " + file);
    }
  }
}

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
assert.match(nextConfig, /source:\s*"\/api\/:path\*"/, "API routes must have a separate response header rule");
assert.match(nextConfig, /X-Robots-Tag.*noindex, nofollow, nosnippet/, "API responses must instruct search engines not to index them");
assert.match(nextConfig, /Cache-Control.*private, no-store/, "API responses must default to private no-store caching");

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
  ["src/app/api/console/evidence-debugger/route.ts", /getCurrentUser\(\)/],
  ["src/app/api/console/security-fabric/route.ts", /getCurrentUser\(\)/],
  ["src/app/api/integrations/github/observe/route.ts", /authorizeInternalRequest\(/],
  ["src/app/api/elitze/route.ts", /getCurrentUser\(\)/],
  ["src/app/api/ops/readiness/route.ts", /getCurrentUser\(\)/],
  ["src/app/api/data-hub/route.ts", /getCurrentUser\(\)/],
  ["src/app/api/roi/route.ts", /getCurrentUser\(\)/],
  ["src/app/api/control-plane/route.ts", /getCurrentUser\(\)/],
  ["src/app/api/ai/connections/route.ts", /getCurrentUser\(\)/],
  ["src/app/api/integrations/teamspeak/route.ts", /getCurrentUser\(\)/],
  ["src/app/api/integrations/aws/observe/route.ts", /authorizeInternalRequest\(/],
  ["src/app/api/security/pentest/route.ts", /getCurrentUser\(\)/],
  ["src/app/api/data-bridge/sources/route.ts", /authorizeInternalRequest\(/],
  ["src/app/api/data-bridge/sources/[sourceId]/route.ts", /authorizeInternalRequest\(/],
  ["src/app/api/data-bridge/health/route.ts", /authorizeInternalRequest\(/],
  ["src/app/api/data-bridge/events/route.ts", /authorizeInternalRequest\(/],
  ["src/app/api/data-bridge/observe/route.ts", /authorizeInternalRequest\(/],
  ["src/app/api/data-bridge/adapters/route.ts", /authorizeInternalRequest\(/],
  ["src/app/api/security-graph/route.ts", /authorizeInternalRequest\(/],
  ["src/app/api/security/policies/route.ts", /authorizeInternalRequest\(/],
  ["src/app/api/approvals/route.ts", /authorizeInternalRequest\(/],
  ["src/app/api/soc/metrics/route.ts", /authorizeInternalRequest\(/],
  ["src/app/api/defense/status/route.ts", /authorizeInternalRequest\(/],
  ["src/app/api/defense/observe/route.ts", /authorizeInternalRequest\(/],
  ["src/app/api/mcp/route.ts", /async function guarded\(request: Request\)[\s\S]{0,150}if \(!authorized\(request\)\) return unauthorized\(\)/],
];
for (const [file, guard] of sensitiveRoutes) {
  const content = read(file);
  assert.match(content, guard, file + " must enforce a server-side access boundary");
  assert.doesNotMatch(content, /cache-control.*public/i, file + " must not allow public caching");
  checkNoSecrets(content, file + " source");
}
for (const [file, marker] of [
  ["src/app/api/console/overview/route.ts", /tenant_id=\$1/],
  ["src/app/api/console/security-graph/route.ts", /tenant_id=\$1/],
  ["src/app/api/console/evidence-snapshot/route.ts", /tenant_id=\$1/],
]) {
  assert.match(read(file), marker, file + " must scope data queries by tenant");
}
assert.doesNotMatch(read("src/app/api/console/security-graph/route.ts"), /tenantId:\s*user\.tenantId/, "security graph must not echo the tenant identifier in its response");
assert.match(read("src/app/console/layout.tsx"), /getCurrentUser\(\)/, "console server layout must authenticate before rendering");
assert.match(read("src/app/console/layout.tsx"), /if\s*\(!user\)\s*redirect\(["']\/login/, "anonymous console navigation must redirect to login");
assert.match(read("src/app/workspace/page.tsx"), /getCurrentUser\(\)/, "workspace entry must authenticate on the server");
assert.match(read("src/app/workspace/page.tsx"), /if\s*\(!user\)\s*redirect\(["']\/login/, "anonymous workspace navigation must redirect to login");
assert.match(read("src/app/api/elitze/route.ts"), /tenantId:\s*user\.tenantId/, "orchestrator must bind tenant identity to the authenticated session");
assert.match(read("src/app/api/elitze/route.ts"), /actorId:\s*user\.id/, "orchestrator must bind actor identity to the authenticated session");


const signupRoute = read("src/app/api/auth/signup/route.ts");
assert.doesNotMatch(signupRoute, /error:\s*duplicate\s*\?[^}]*:\s*message/, "signup must not expose raw exception messages");
assert.match(signupRoute, /invalidInput/, "signup must distinguish validation failures from server errors");
const controlPlaneRoute = read("src/app/api/control-plane/route.ts");
assert.doesNotMatch(controlPlaneRoute, /error:\s*message/, "control-plane must not return raw exception messages");
assert.match(controlPlaneRoute, /control_plane_operation_failed/, "control-plane must return a stable generic server error");
const internalGraphRoute = read("src/app/api/security-graph/route.ts");
assert.doesNotMatch(internalGraphRoute, /error:\s*error instanceof Error \? error\.message/, "security graph must not expose persistence errors");
const aiConnectionsRoute = read("src/app/api/ai/connections/route.ts");
assert.doesNotMatch(aiConnectionsRoute, /error:\s*error instanceof Error \? error\.message/, "AI connection handler must not expose storage errors");
assert.match(aiConnectionsRoute, /AI connection data plane unavailable/, "AI connection handler must return a safe storage error");
const v1SignupRoute = read("src/app/api/v1/auth/signup/route.ts");
assert.doesNotMatch(v1SignupRoute, /error:\s*message/, "versioned signup must not return raw exception messages");
assert.match(v1SignupRoute, /const invalidInput = error instanceof z\.ZodError/, "versioned signup must distinguish input errors from server errors");
const teamSpeakRoute = read("src/app/api/integrations/teamspeak/route.ts");
assert.doesNotMatch(teamSpeakRoute, /error:\s*error instanceof Error \? error\.message/, "TeamSpeak must not expose URL parser or storage errors");
assert.match(teamSpeakRoute, /TeamSpeak integration could not be configured/, "TeamSpeak must return a safe configuration error");
const awsObserveRoute = read("src/app/api/integrations/aws/observe/route.ts");
assert.doesNotMatch(awsObserveRoute, /error:\s*error instanceof Error \? error\.message/, "AWS observer must not expose provider or SDK errors");
assert.match(awsObserveRoute, /aws_observation_failed/, "AWS observer must return a stable failure code");
const policyRoute = read("src/app/api/security/policies/route.ts");
assert.doesNotMatch(policyRoute, /error:\s*error instanceof Error \? error\.message/, "policy validation must not echo parser errors");
assert.match(policyRoute, /error: "invalid_policy"/, "policy validation must return a stable failure code");
const evidenceDebuggerRoute = read("src/app/api/console/evidence-debugger/route.ts");
assert.doesNotMatch(evidenceDebuggerRoute, /error:\s*message, expression/, "evidence debugger must not echo raw evaluation exceptions");
assert.match(evidenceDebuggerRoute, /error: "invalid_expression"/, "evidence debugger must return a stable validation error");
const githubObserveRoute = read("src/app/api/integrations/github/observe/route.ts");
assert.doesNotMatch(githubObserveRoute, /error:\s*error instanceof Error \? error\.message/, "GitHub observer must not expose provider errors");
assert.match(githubObserveRoute, /github_observation_failed/, "GitHub observer must return a stable failure code");
const securityFabricRoute = read("src/app/api/console/security-fabric/route.ts");
assert.doesNotMatch(securityFabricRoute, /last_error=\$3[\s\S]{0,60}\[user\.tenantId, body\.connectorId, message\]/, "security fabric must not persist raw connector exception messages for user display");
assert.match(securityFabricRoute, /const errorCode = "connector_probe_failed"/, "security fabric must persist a safe connector error code");
const rootLayout = read("src/app/layout.tsx");
assert.match(rootLayout, /title: \{ default: "ELITZE Agentic Security \| See the threat\. Control the path\. Prove the fix\."/ , "global metadata must use the current ELITZE security positioning");
assert.match(rootLayout, /applicationCategory: "SecurityApplication"/, "SoftwareApplication structured data must declare its security category");
assert.match(rootLayout, /JSON.stringify\(softwareApplicationSchema\)/, "SoftwareApplication JSON-LD must be emitted");
assert.match(rootLayout, /identity-bound access/i, "structured data should describe security functionality");
assert.doesNotMatch(rootLayout, /AI safety|AI governance|guardrails/i, "general positioning must not lead with AI governance language");
const home = read("src/app/page.tsx");
assert.match(home, /getCurrentUser\(\)/, "root entry must resolve the server-side session");
assert.match(home, /if\s*\(!user\)\s*redirect\(["']\/login/, "anonymous root navigation must go to login");
assert.match(home, /redirect\(["']\/console/, "authenticated root navigation must go to the console");
const hero = read("src/components/home/hero-section.tsx");
assert.match(hero, /See the threat\./, "hero must use the current cybersecurity positioning");
assert.match(hero, /The model is not the security boundary\./);
const pillars = read("src/components/home/validation-section.tsx");
for (const item of ["Map exposure and reach", "Enforce identity and policy", "Verify remediation", "Identity-bound access", "Tenant-scoped records", "Evidence with provenance", "Unknown stays unknown"]) {
  assert.ok(pillars.includes(item), "homepage security/trust section must include " + item);
}
const securityPage = read("src/app/security/page.tsx");
assert.match(securityPage, /<Image[\s\S]{0,350}alt="[^"]+"/, "security architecture image must have descriptive alt text");
assert.match(securityPage, /sizes="100vw"/, "large security architecture image must declare responsive sizes");
const platformPage = read("src/app/platform/page.tsx");
assert.match(platformPage, /<Image[\s\S]{0,350}alt="[^"]+"/, "platform architecture image must have descriptive alt text");
assert.match(platformPage, /sizes="100vw"/, "large platform architecture image must declare responsive sizes");
assert.match(platformPage, /alternates: \{ canonical: "\/platform" \}/, "platform page must have a canonical URL");
for (const file of [
  "src/app/console/layout.tsx",
  "src/app/workspace/page.tsx",
  "src/app/login/layout.tsx",
  "src/app/register/layout.tsx",
  "src/app/forgot-password/layout.tsx",
  "src/app/reset-password/layout.tsx",
  "src/app/auth/verify/layout.tsx",
  "src/app/chat/layout.tsx",
]) {
  assert.match(read(file), /index:\s*false/, file + " must be marked noindex");
}
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
let liveCheckStatus = "SKIPPED";
const timeoutSignal = () => AbortSignal.timeout(12000);
const fetchLive = async (route, options = {}) => {
  const url = new URL(route, liveBase);
  const response = await fetch(url, {
    ...options,
    redirect: options.redirect ?? "follow",
    signal: timeoutSignal(),
    headers: { "user-agent": "ELITZE-public-exposure-check/1.0", ...(options.headers ?? {}) },
  });
  const body = await response.text();
  return { response, body, url: url.toString() };
};
if (liveBase) {
  const base = new URL(liveBase);
  const isLoopbackHttp = base.protocol === "http:" && ["127.0.0.1", "localhost"].includes(base.hostname);
  assert.ok(base.protocol === "https:" || isLoopbackHttp, "live exposure checks must target HTTPS except for a loopback HTTP test server");
  const publicRoutes = ["/platform", "/security"];
  const assetUrls = new Set();
  let edgeBlocked = false;
  for (const route of publicRoutes) {
    const { response, body, url } = await fetchLive(route);
    if ([403, 429].includes(response.status)) {
      checkNoSecrets(body, "edge protection response " + route);
      checkNoInternalEvidence(body, "edge protection response " + route);
      console.warn("ELITZE live public exposure checks: UNMEASURABLE; edge returned HTTP " + response.status + " for " + route + ". The application response was not inspected.");
      edgeBlocked = true;
      break;
    }
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
  if (!edgeBlocked) {
  assert.ok(assetUrls.size > 0, "public product pages should reference the expected JavaScript assets");
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
  for (const route of ["/", "/console", "/workspace"]) {
    const { response } = await fetchLive(route, { redirect: "manual" });
    assert.ok([301, 302, 303, 307, 308].includes(response.status), "protected page did not redirect anonymously: " + route + " (" + response.status + ")");
    assert.match(response.headers.get("location") ?? "", /\/login(?:\?|$)/, "protected page must direct anonymous traffic to login: " + route);
  }
  const privateApiRoutes = [
    ...[
      "/api/console/health",
      "/api/console/overview",
      "/api/console/security-graph",
      "/api/console/evidence-snapshot",
      "/api/console/evidence-debugger",
      "/api/elitze",
      "/api/control-plane",
      "/api/ai/connections",
      "/api/integrations/teamspeak",
      "/api/console/security-fabric",
      "/api/security/pentest",
      "/api/ops/readiness",
      "/api/data-hub",
      "/api/roi",
      "/api/data-bridge/sources",
      "/api/data-bridge/health",
      "/api/data-bridge/events",
      "/api/data-bridge/observe",
      "/api/data-bridge/adapters",
      "/api/security-graph",
      "/api/security/policies",
      "/api/approvals",
      "/api/soc/metrics",
      "/api/defense/status",
      "/api/defense/observe",
    ].map((path) => ({ path, method: "GET", acceptedStatuses: path === "/api/soc/metrics" ? [401, 503] : [401] })),
    { path: "/api/integrations/aws/observe", method: "POST", body: "{}", acceptedStatuses: [401] },
    { path: "/api/integrations/github/observe", method: "POST", body: "{}", acceptedStatuses: [401] },
    { path: "/api/mcp", method: "GET", acceptedStatuses: [401, 503] },
  ];
  for (const { path: route, method, body: requestBody, acceptedStatuses } of privateApiRoutes) {
    const { response, body } = await fetchLive(route, {
      redirect: "manual",
      method,
      ...(requestBody ? { body: requestBody, headers: { "content-type": "application/json" } } : {}),
    });
    assert.ok(acceptedStatuses.includes(response.status), "private API must deny anonymous access: " + route + " (" + response.status + ")");
    const cacheControl = response.headers.get("cache-control") ?? "";
    assert.match(cacheControl, /no-store/i, "private API responses must not be cached: " + route);
    assert.doesNotMatch(cacheControl, /public/i, "private API must not permit public caching: " + route);
    const robotsHeader = response.headers.get("x-robots-tag") ?? "";
    assert.match(robotsHeader, /noindex,\s*nofollow,\s*nosnippet/i, "private API must send a noindex response header: " + route);
    checkNoSecrets(body, "anonymous API response " + route);
    checkNoInternalEvidence(body, "anonymous API response " + route);
  }
for (const route of ["/api/health", "/api/public/health"]) {
    const { response: healthResponse, body: healthBody } = await fetchLive(route);
    assert.ok([200, 503].includes(healthResponse.status), "public health should return a known readiness status");
    assert.match(healthResponse.headers.get("cache-control") ?? "", /no-store/i, "public health must not be cached");
    assert.match(healthResponse.headers.get("x-robots-tag") ?? "", /noindex,\s*nofollow,\s*nosnippet/i, "public health endpoint must not be indexed");
    let health = null;
    try { health = JSON.parse(healthBody); } catch {}
    assert.ok(health && typeof health === "object", "public health must return JSON");
    assert.deepEqual(Object.keys(health).sort(), ["ok", "service", "status"].sort(), "public health must expose only its minimal public contract");
    assert.equal(health.service, "elitze-agentic-security");
    assert.ok(["ready", "unavailable"].includes(health.status));
  }
  liveCheckStatus = "PASS";
  console.log("ELITZE live public exposure checks: PASS (" + publicRoutes.length + " public pages, " + assetUrls.size + " assets, " + privateApiRoutes.length + " private APIs)");
  } else {
    liveCheckStatus = "UNMEASURABLE";
    console.error("ELITZE live checks are UNMEASURABLE because edge protection blocked the probe; release verification cannot pass without inspecting the application response.");
    process.exitCode = 1;
  }
} else {
  console.log("ELITZE live public exposure checks: SKIPPED (set ELITZE_PUBLIC_BASE_URL to enable)");
}
console.log("ELITZE public exposure static/build checks: PASS; live checks: " + liveCheckStatus);
