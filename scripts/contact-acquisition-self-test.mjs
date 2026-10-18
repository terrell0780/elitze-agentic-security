import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const tracked = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" })
  .split(/\r?\n/)
  .filter(Boolean);

const publicTextExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".json", ".md", ".yml", ".yaml", ".sql", ".css", ".txt"]);
const staleDomain = ["elitze", "ca"].join(".");
const staleDomainFiles = tracked.filter((file) => publicTextExtensions.has(path.extname(file)))
  .filter((file) => read(file).toLowerCase().includes(staleDomain) || read(file).toLowerCase().includes(`www.${staleDomain}`));

assert.equal(staleDomainFiles.length, 0, `stale domain reference found: ${staleDomainFiles.join(", ")}`);

const mailtoTargets = new Map();
for (const file of tracked.filter((file) => publicTextExtensions.has(path.extname(file)))) {
  if (file === "scripts/contact-acquisition-self-test.mjs") continue;
  const source = read(file);
  const lower = source.toLowerCase();
  const targets = [];
  let offset = 0;
  while (true) {
    const marker = lower.indexOf("mailto:", offset);
    if (marker === -1) break;
    const rest = source.slice(marker + 7);
    const delimiters = ['"', "'", " ", "\n", "\r", ">"]
      .map((delimiter) => rest.indexOf(delimiter))
      .filter((index) => index >= 0);
    const endIndex = delimiters.length ? Math.min(...delimiters) : rest.length;
    const target = rest.slice(0, endIndex).trim();
    if (target.includes("@")) targets.push(target);
    offset = marker + 7;
  }
  if (targets.length) mailtoTargets.set(file, targets);
}

for (const [file, targets] of mailtoTargets) {
  assert.ok(
    targets.every((target) => target.toLowerCase() === "tsh_cook@hotmail.com"),
    `non-canonical contact mailto in ${file}: ${targets.join(", ")}`,
  );
}

const mailtoFiles = [...mailtoTargets.keys()];

const env = read(".env.example");
const contactRoute = read("src/app/api/acquisition/contact/route.ts");
const contactForm = read("src/components/acquisition-contact-form.tsx");
const sales = read("src/app/sales/page.tsx");
const access = read("src/app/sales/access/page.tsx");
const email = read("src/lib/auth-email.ts");

assert.match(env, /^ELITZE_CONTACT_EMAIL=tsh_cook@hotmail\.com$/m);
assert.match(env, /^NEXT_PUBLIC_SITE_URL=https:\/\/elitze\.info$/m);
assert.equal((env.match(/^NEXT_PUBLIC_SITE_URL=/gm) ?? []).length, 1);
assert.match(env, /^ELITZE_SAML_SP_ENTITY_ID=https:\/\/elitze\.info\/api\/auth\/saml\/metadata$/m);
assert.match(env, /^ELITZE_SAML_ACS_URL=https:\/\/elitze\.info\/api\/auth\/saml\/callback$/m);
assert.match(env, /ELITZE_WEBAUTHN_RP_ID=elitze\.info/);
assert.match(env, /ELITZE_WEBAUTHN_ORIGIN=https:\/\/elitze\.info,https:\/\/www\.elitze\.info/);
assert.match(env, /ELITZE_ALLOWED_ORIGINS=https:\/\/elitze\.info,https:\/\/www\.elitze\.info/);

assert.match(contactRoute, /ELITZE_CONTACT_EMAIL/);
assert.match(contactRoute, /tsh_cook@hotmail\.com/);
assert.doesNotMatch(contactRoute, /replyTo:\s*email/);
assert.match(contactRoute, /consumeRateLimit\(key, 5, 60 \* 60\)/);
assert.match(contactRoute, /getRateLimitKey\("acquisition-contact", email\)/);
assert.doesNotMatch(contactRoute, /const buckets = new Map/);
assert.match(contactRoute, /website/);
assert.match(contactForm, /\/api\/acquisition\/contact/);
assert.match(contactForm, /tsh_cook@hotmail\.com/);
assert.match(contactForm, /trackElitzeEvent/);
assert.match(sales, /redirect\("\/workspace"\)/);
assert.match(access, /redirect\("\/workspace"\)/);
assert.match(read("src/app/workspace/page.tsx"), /redirect\("\/console"\)/);
assert.doesNotMatch(read("src/app/page.tsx"), /href="\/sales"|>\s*Acquisition\s*</i);
assert.doesNotMatch(read("src/app/platform/page.tsx"), /href="\/sales"|Enterprise \/ Acquisition/i);
assert.doesNotMatch(read("src/components/seo-feature-page.tsx"), /href="\/sales"|Acquisition and technical review/i);
assert.doesNotMatch(read("src/app/sitemap.ts"), /"\/sales"/);
assert.doesNotMatch(read("src/app/sales/access/page.tsx"), /previously public|was public/i);
assert.match(email, /export async function sendEmail/);
assert.match(email, /reply_to/);
assert.match(email, /tsh_cook@hotmail\.com/);

assert.equal(
  mailtoFiles.filter((file) => file === "src/components/acquisition-contact-form.tsx").length,
  1,
  "the contact form must retain the direct-email fallback",
);

console.log("ELITZE contact self-test: PASS — canonical contact routing, anti-abuse markers, workspace access entry, legacy commercial-route redirects, and fallback email verified");

const businessProcessMigration = fs.readFileSync(path.join(root, "drizzle/0028_acquisition_pipeline.sql"), "utf8");
const businessProcessRoute = fs.readFileSync(path.join(root, "src/app/api/acquisition/leads/route.ts"), "utf8");
const acquisitionContactRoute = fs.readFileSync(path.join(root, "src/app/api/acquisition/contact/route.ts"), "utf8");

assert.match(businessProcessMigration, /acquisition_leads/);
assert.match(businessProcessMigration, /acquisition_lead_events/);
assert.match(businessProcessMigration, /CLOSED_WON/);
assert.match(businessProcessMigration, /CLOSED_LOST/);
assert.match(businessProcessRoute, /acquisition_manager_required/);
assert.match(businessProcessRoute, /UPDATE acquisition_leads/);
assert.match(acquisitionContactRoute, /INSERT INTO acquisition_leads/);
assert.match(acquisitionContactRoute, /leadRecorded/);
assert.doesNotMatch(sales, /SAP SECURITY|SAP applications|SAP AI|SAP-changing actions/i);

console.log("ELITZE business-process handoff controls: PASS");
