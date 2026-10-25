import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const appRoot = path.join(root, "src", "app");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const failures = [];
const pageFiles = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (entry.isFile() && entry.name === "page.tsx") pageFiles.push(absolute);
  }
}

walk(appRoot);

for (const absolute of pageFiles) {
  const relative = path.relative(root, absolute).split(path.sep).join("/");
  const source = fs.readFileSync(absolute, "utf8");
  const mainTags = [...source.matchAll(/<main\\b[^>]*>/g)].map((match) => match[0]);

  if (mainTags.length > 0) {
    for (const tag of mainTags) {
      if (!/id=["']main-content["']/.test(tag)) {
        failures.push(relative + ": main landmark must target id=\"main-content\"; found " + tag);
      }
      if (!/tabIndex=\\{-1\\}/.test(tag) && !/tabindex=["']-1["']/.test(tag)) {
        failures.push(relative + ": main landmark must be programmatically focusable; found " + tag);
      }
    }
    continue;
  }

  if (/\\bredirect\\s*\\(/.test(source)) continue;
  if (/\\bSeoFeaturePage\\b/.test(source)) continue;
  failures.push(relative + ": no main landmark, redirect, or shared SEO feature-page template detected");
}

const layout = read("src/app/layout.tsx");
if (!layout.includes('href="#main-content"')) failures.push("src/app/layout.tsx: global skip link target is missing");
if (!/<html[^>]*lang="en"/.test(layout)) failures.push("src/app/layout.tsx: document language is not set");
if (!read("src/app/globals.css").includes(":focus-visible")) failures.push("src/app/globals.css: visible keyboard focus styling is missing");

const feature = read("src/components/seo-feature-page.tsx");
if (!feature.includes('const Root = asMain ? "main" : "div";') ||
    !feature.includes('id={asMain ? "main-content" : undefined}') ||
    !feature.includes('tabIndex={asMain ? -1 : undefined}')) {
  failures.push("src/components/seo-feature-page.tsx: shared feature-page landmark contract is missing");
}

const config = read("next.config.ts");
for (const [label, token] of [
  ["HSTS", "Strict-Transport-Security"],
  ["Content Security Policy", "Content-Security-Policy"],
  ["MIME sniffing protection", "X-Content-Type-Options"],
  ["frame protection", "X-Frame-Options"],
  ["referrer policy", "Referrer-Policy"],
  ["permissions policy", "Permissions-Policy"],
]) {
  if (!config.includes(token)) failures.push("next.config.ts: " + label + " header is not configured");
}

if (failures.length) {
  console.error("Accessibility/security contract self-test: FAIL");
  for (const failure of failures) console.error(" - " + failure);
  process.exit(1);
}

console.log(
  "Accessibility/security contract self-test: PASS (" +
  pageFiles.length + " page templates checked; skip navigation, landmarks, focus styling, and security headers verified)"
);
