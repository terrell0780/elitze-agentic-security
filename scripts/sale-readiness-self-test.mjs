import assert from "node:assert/strict";

const topMarketingClaimPattern = /((?<!-)\btop[- ]?(?:1|3|5|five)\b)(?![./\d])/i;

assert.doesNotMatch("className=\"top-1/2\"", topMarketingClaimPattern);
assert.match("Top 5 attack paths", topMarketingClaimPattern);

console.log("ELITZE sale-readiness self-test: PASS — top-claim guard avoids Tailwind utility false positives");
