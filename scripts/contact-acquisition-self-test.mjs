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

const mailtoFiles = tracked
  .filter((file) => publicTextExtensions.has(path.extname(file)))
  .filter((file) => file !== "scripts/contact-acquisition-self-test.mjs")
  .filter((file) => /mailto:\s*[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/i.test(read(file)));
for (const file of mailtoFiles) {
  const targets = [...read(file).matchAll(/mailto:\s*([^"')\s>]+@[^\"')\s>]+)/gi)].map((match) => match[1]);
  assert.ok(targets.length > 0, `mailto marker found without a target in ${file}`);
  assert.ok(
    targets.every((target) => target.toLowerCase() === "tsh_cook@hotmail.com"),
    `non-canonical contact mailto in ${file}: ${targets.join(", ")}`,
  );
}

const env = read(".env.example");
const contactRoute = read("src/app/api/acquisition/contact/route.ts");
const contactForm = read("src/components/acquisition-contact-form.tsx");
const sales = read("src/app/sales/page.tsx");
const access = read("src/app/sales/access/page.tsx");
const email = read("src/lib/auth-email.ts");

assert.match(env, /^ELITZE_CONTACT_EMAIL=tsh_cook@hotmail\.com$/m);
assert.match(env, /^NEXT_PUBLIC_SITE_URL=https:\/\/elitze\.info$/m);
assert.match(env, /ELITZE_WEBAUTHN_RP_ID=elitze\.info/);
assert.match(env, /ELITZE_WEBAUTHN_ORIGIN=https:\/\/elitze\.info,https:\/\/www\.elitze\.info/);
assert.match(env, /ELITZE_ALLOWED_ORIGINS=https:\/\/elitze\.info,https:\/\/www\.elitze\.info/);

assert.match(contactRoute, /ELITZE_CONTACT_EMAIL/);
assert.match(contactRoute, /tsh_cook@hotmail\.com/);
assert.doesNotMatch(contactRoute, /replyTo:\s*email/);
assert.match(contactRoute, /REQUESTS = 5/);
assert.match(contactRoute, /website/);
assert.match(contactForm, /\/api\/acquisition\/contact/);
assert.match(contactForm, /tsh_cook@hotmail\.com/);
assert.match(contactForm, /trackElitzeEvent/);
assert.match(sales, /<AcquisitionContactForm/);
assert.match(sales, /requestType="acquisition"/);
assert.match(access, /<AcquisitionContactForm/);
assert.match(access, /requestType="repository"/);
assert.match(email, /export async function sendEmail/);
assert.match(email, /reply_to/);
assert.match(email, /tsh_cook@hotmail\.com/);

assert.equal(
  mailtoFiles.filter((file) => file === "src/components/acquisition-contact-form.tsx").length,
  1,
  "the contact form must retain the direct-email fallback",
);

console.log("ELITZE contact/acquisition self-test: PASS — stale-domain removal, inbound routing, repository-contact path, anti-abuse markers, and fallback email verified");
