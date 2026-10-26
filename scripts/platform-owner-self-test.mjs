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
  assert.equal(isPlatformOwner({ email: "other@example.org" }), false);

  const layout = fs.readFileSync("src/app/console/layout.tsx", "utf8");
  const sidebar = fs.readFileSync("src/components/security-workbench-sidebar.tsx", "utf8");
  const readinessLayout = fs.readFileSync("src/app/console/readiness/layout.tsx", "utf8");
  const readinessApi = fs.readFileSync("src/app/api/ops/readiness/route.ts", "utf8");
  const consoleHealth = fs.readFileSync("src/app/api/console/health/route.ts", "utf8");
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
  assert.match(envExample, /^ELITZE_PLATFORM_OWNER_EMAILS=$/m);
  assert.match(docs, /platform owner/i);
  console.log("ELITZE platform-owner boundary self-test: PASS");
} finally {
  if (prior === undefined) delete process.env.ELITZE_PLATFORM_OWNER_EMAILS;
  else process.env.ELITZE_PLATFORM_OWNER_EMAILS = prior;
}
