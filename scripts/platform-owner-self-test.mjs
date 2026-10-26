import assert from "node:assert/strict";
import fs from "node:fs";
import { isPlatformOwner } from "../src/lib/platform-owner.ts";

const prior = process.env.ELITZE_PLATFORM_OWNER_EMAILS;
try {
  delete process.env.ELITZE_PLATFORM_OWNER_EMAILS;
  assert.equal(isPlatformOwner({ email: "owner@example.com" }), false, "platform ownership must fail closed when unconfigured");
  assert.equal(isPlatformOwner(null), false);
  assert.equal(isPlatformOwner({ email: " " }), false);

  process.env.ELITZE_PLATFORM_OWNER_EMAILS = "owner@example.com, OPS@example.net ";
  assert.equal(isPlatformOwner({ email: "OWNER@example.com" }), true);
  assert.equal(isPlatformOwner({ email: "ops@example.net" }), true);
  assert.equal(isPlatformOwner({ email: "tenant-owner@example.com" }), false);
  assert.equal(isPlatformOwner({ email: "tenant-owner@example.com", role: "owner" }), false, "tenant OWNER role must not imply platform ownership");
  assert.equal(isPlatformOwner({ email: "other@example.org" }), false);

  const layout = fs.readFileSync("src/app/console/layout.tsx", "utf8");
  const sidebar = fs.readFileSync("src/components/security-workbench-sidebar.tsx", "utf8");
  const readinessLayout = fs.readFileSync("src/app/console/readiness/layout.tsx", "utf8");
  const readinessApi = fs.readFileSync("src/app/api/ops/readiness/route.ts", "utf8");
  const consoleHealth = fs.readFileSync("src/app/api/console/health/route.ts", "utf8");
  const consolePage = fs.readFileSync("src/app/console/page.tsx", "utf8");
  const sessionApi = fs.readFileSync("src/app/api/auth/session/route.ts", "utf8");
  const organizationPage = fs.readFileSync("src/app/console/organization/page.tsx", "utf8");
  const organizationApi = fs.readFileSync("src/app/api/console/organization/route.ts", "utf8");
  const membersApi = fs.readFileSync("src/app/api/console/members/route.ts", "utf8");
  const tenantOverview = fs.readFileSync("src/app/api/console/overview/route.ts", "utf8");
  const envExample = fs.readFileSync(".env.example", "utf8");
  const docs = fs.readFileSync("docs/ORGANIZATION-ADMINISTRATION.md", "utf8");

  assert.match(layout, /isPlatformOwner\(user\)/);
  assert.match(layout, /platformOwner=\{isPlatformOwner\(user\)\}/);
  assert.match(sidebar, /platformOwnerOnly/);
  assert.match(sidebar, /Organization & Members/);
  assert.match(readinessLayout, /isPlatformOwner\(user\)/);
  assert.match(readinessApi, /isPlatformOwner\(user\)/);
  assert.match(readinessApi, /platform_owner_required/);
  assert.match(consoleHealth, /isPlatformOwner\(user\)/);
  const healthOwnerGate = consoleHealth.indexOf("if (isPlatformOwner(user))");
  const detailedChecks = consoleHealth.indexOf("response.checks =");
  assert.ok(healthOwnerGate >= 0 && detailedChecks > healthOwnerGate, "global schema and configuration details must be inside the platform-owner gate");
  assert.match(sessionApi, /platformOwner:isPlatformOwner\(user\)/, "session API must expose the server-derived platform-owner UI flag");
  assert.match(consolePage, /includePlatformHealth \? fetch\("\/api\/console\/health"/, "tenant console must not request global diagnostics");
  assert.match(consolePage, /\{platformOwner === true && <Link href="\/console\/readiness"/, "direct global readiness link must only appear for platform owners");
  assert.match(consolePage, /label:"Tenant data"/, "ordinary tenant owners should see tenant data status, not global schema status");
  assert.match(organizationPage, /role !== "OWNER" && role !== "SECURITY_ADMIN"/, "organization page must restrict access to tenant administrators");
  assert.match(organizationApi, /WHERE id=\$1 LIMIT 1[\s\S]*?\[user\.tenantId\]/, "organization reads must use the authenticated tenant id");
  assert.match(organizationApi, /WHERE id=\$3[\s\S]*?user\.tenantId/, "organization writes must use the authenticated tenant id");
  assert.ok(membersApi.includes("FROM auth_users WHERE tenant_id=$1 ORDER BY created_at ASC LIMIT 500"), "member listing must be tenant-scoped");
  assert.ok(membersApi.includes("WHERE tenant_id=$1 AND email_normalized=$2 AND accepted_at IS NULL"), "invitations must be tenant-scoped");
  assert.match(tenantOverview, /const tenantId = user\.tenantId/, "console overview must derive tenant scope from the signed-in user");
  assert.match(tenantOverview, /WHERE tenant_id=\$1/, "console overview queries must apply tenant scope");
  assert.match(envExample, /^ELITZE_PLATFORM_OWNER_EMAILS=$/m);
  assert.match(docs, /platform owner/i);
  console.log("ELITZE platform-owner boundary self-test: PASS");
} finally {
  if (prior === undefined) delete process.env.ELITZE_PLATFORM_OWNER_EMAILS;
  else process.env.ELITZE_PLATFORM_OWNER_EMAILS = prior;
}
