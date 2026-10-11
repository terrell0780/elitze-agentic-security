import assert from "node:assert/strict";

const topMarketingClaimPattern = /((?<!-)\btop[- ]?(?:1|3|5|five)\b)(?![./\d])/i;

assert.doesNotMatch("className=\"top-1/2\"", topMarketingClaimPattern);
assert.match("Top 5 attack paths", topMarketingClaimPattern);

const fs = await import("node:fs");
const saleReadinessSource = fs.readFileSync(new URL("./sale-readiness.mjs", import.meta.url), "utf8");
assert.equal(saleReadinessSource.includes(`God['’]s Eye`), false, "God’s Eye is a current ELITZE module name, not obsolete branding");

console.log("ELITZE sale-readiness self-test: PASS — top-claim guard avoids Tailwind utility false positives");
