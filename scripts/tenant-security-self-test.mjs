import assert from "node:assert/strict";
import fs from "node:fs";
import { authorizeTenantAction, buildPrincipal, normalizeTenantRole } from "../src/lib/elitze-secure/tenant-security.ts";

assert.equal(normalizeTenantRole("owner"), "OWNER");
assert.equal(normalizeTenantRole("ADMIN"), "SECURITY_ADMIN");
assert.equal(normalizeTenantRole("security-admin"), "SECURITY_ADMIN");
assert.equal(normalizeTenantRole("member"), "ANALYST");
assert.equal(normalizeTenantRole("viewer"), "VIEWER");
assert.equal(normalizeTenantRole("unknown-role"), null);

const owner = buildPrincipal({ tenantId: "tenant-a", subjectId: "owner-1", roles: ["owner"] });
assert.ok(owner);
assert.equal(authorizeTenantAction(owner, { tenantId: "tenant-a", permission: "integrations:manage" }).allowed, true);
assert.equal(authorizeTenantAction(owner, { tenantId: "tenant-b", permission: "security:read" }).reason, "tenant_scope_mismatch");

const analyst = buildPrincipal({ tenantId: "tenant-a", subjectId: "member-1", roles: ["member"] });
assert.ok(analyst);
assert.equal(authorizeTenantAction(analyst, { tenantId: "tenant-a", permission: "security:read" }).allowed, true);
assert.equal(authorizeTenantAction(analyst, { tenantId: "tenant-a", permission: "security:write" }).allowed, true);
assert.equal(authorizeTenantAction(analyst, { tenantId: "tenant-a", permission: "integrations:manage" }).reason, "permission_denied");

const viewer = buildPrincipal({ tenantId: "tenant-a", subjectId: "viewer-1", roles: ["VIEWER"] });
assert.ok(viewer);
assert.equal(authorizeTenantAction(viewer, { tenantId: "tenant-a", permission: "security:read" }).allowed, true);
assert.equal(authorizeTenantAction(viewer, { tenantId: "tenant-a", permission: "security:write" }).allowed, false);
assert.equal(buildPrincipal({ tenantId: "tenant-a", subjectId: "empty-role", roles: ["unknown"] }), null);
assert.equal(buildPrincipal({ tenantId: "", subjectId: "owner-1", roles: ["owner"] }), null);

const auth = fs.readFileSync("src/lib/auth.ts", "utf8");
const signup = fs.readFileSync("src/app/api/auth/signup/route.ts", "utf8");
const v1Signup = fs.readFileSync("src/app/api/v1/auth/signup/route.ts", "utf8");
const controlPlane = fs.readFileSync("src/app/api/control-plane/route.ts", "utf8");
const membersRoute = fs.readFileSync("src/app/api/console/members/route.ts", "utf8");
const organizationRoute = fs.readFileSync("src/app/api/console/organization/route.ts", "utf8");
const acceptRoute = fs.readFileSync("src/app/api/auth/invitations/accept/route.ts", "utf8");
const invitationMigration = fs.readFileSync("drizzle/0032_auth_tenant_invitations.sql", "utf8");
const organizationPage = fs.readFileSync("src/app/console/organization/page.tsx", "utf8");
const invitationPage = fs.readFileSync("src/app/accept-invitation/page.tsx", "utf8");
const invitationForm = fs.readFileSync("src/components/accept-invitation-form.tsx", "utf8");
const organizationUi = fs.readFileSync("src/components/organization-members-console.tsx", "utf8");
const routeManifest = JSON.parse(fs.readFileSync("public/elitze-routes.json", "utf8"));

assert.match(auth, /display_name,role\)\s*SELECT id,\$3,\$3,\$4,\$5,'owner'/);
for (const [name, route] of [["signup", signup], ["v1 signup", v1Signup]]) {
  assert.match(route, /consumeRateLimit/);
  assert.match(route, /getRateLimitKey\("register", normalizedEmail\)/);
  assert.match(route, /Retry-After/);
}
assert.match(controlPlane, /buildPrincipal\(\{ tenantId: user\.tenantId, subjectId: user\.id, roles: \[user\.role\] \}\)/);
assert.match(auth, /pg_advisory_xact_lock\(hashtext\(\$1\)\)/);
assert.match(auth, /email_already_registered/);
assert.match(membersRoute, /getCurrentUser/);
assert.match(membersRoute, /normalizeTenantRole/);
assert.match(membersRoute, /parsed\.data\.role === "admin"/);
assert.match(membersRoute, /auth_tenant_invitations/);
assert.match(membersRoute, /assertSameOrigin/);
assert.match(organizationRoute, /isOwner\(user\.role\)/);
assert.match(organizationRoute, /organization_slug_already_in_use/);
assert.match(acceptRoute, /pg_advisory_xact_lock/);
assert.match(acceptRoute, /FOR UPDATE/);
assert.match(acceptRoute, /accepted_at=now\(\)/);
assert.match(acceptRoute, /expires_at>now\(\)/);
assert.match(invitationMigration, /CREATE TABLE IF NOT EXISTS auth_tenant_invitations/);
assert.match(invitationMigration, /CHECK \(role IN \('admin', 'member', 'approver', 'viewer'\)\)/);
assert.match(organizationPage, /normalizeTenantRole/);
assert.match(invitationPage, /AcceptInvitationForm/);
assert.match(invitationPage, /<main id="main-content" tabIndex=\{-1\}/);
assert.doesNotMatch(invitationForm, /<main\b/, "invitation form must not render a nested main landmark");
assert.match(organizationUi, /Send invitation/);
assert.match(organizationUi, /Business profile/);
assert.ok(routeManifest.routes.some((route) => route.path === "/console/organization"));
assert.ok(routeManifest.routes.some((route) => route.path === "/accept-invitation"));

console.log("ELITZE tenant roles, owner/business onboarding, invitation, and signup rate-limit self-test: PASS");
