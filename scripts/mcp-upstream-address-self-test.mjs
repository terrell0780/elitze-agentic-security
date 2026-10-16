import assert from "node:assert/strict";
import fs from "node:fs";
import { createPinnedLookup, isBlockedMcpAddress } from "../src/lib/elitze-secure/mcp-gateway.ts";

const blocked = [
  "0.0.0.0",
  "0.1.2.3",
  "10.0.0.1",
  "100.64.0.1",
  "127.0.0.1",
  "169.254.169.254",
  "172.16.0.1",
  "192.0.0.1",
  "192.0.2.10",
  "192.88.99.10",
  "192.168.1.1",
  "198.18.0.1",
  "198.51.100.5",
  "203.0.113.5",
  "224.0.0.1",
  "240.0.0.1",
  "255.255.255.255",
  "::",
  "::1",
  "::ffff:127.0.0.1",
  "::ffff:7f00:1",
  "0:0:0:0:0:ffff:7f00:1",
  "::ffff:169.254.169.254",
  "::ffff:192.0.2.10",
  "::8.8.8.8",
  "fc00::1",
  "fd12:3456::1",
  "fe80::1",
  "fec0::1",
  "ff02::1",
  "2001:db8::1",
  "2001::1",
  "2001:20::1",
  "2002:c000:0201::1",
  "3ffe::1",
  "3fff::1",
  "4000::1",
  "64:ff9b::8.8.8.8",
  "not-an-ip",
];

const allowed = [
  "8.8.8.8",
  "1.1.1.1",
  "2606:4700:4700::1111",
  "2001:4860:4860::8888",
  "::ffff:8.8.8.8",
];

for (const address of blocked) {
  assert.equal(isBlockedMcpAddress(address), true, `must block non-public address: ${address}`);
}
for (const address of allowed) {
  assert.equal(isBlockedMcpAddress(address), false, `must allow public address: ${address}`);
}

const pinnedAddresses = [
  { address: "127.0.0.1", family: 4 },
  { address: "8.8.8.8", family: 4 },
  { address: "2606:4700:4700::1111", family: 6 },
];
const expectedPinnedAddresses = pinnedAddresses.slice(1);
const pinnedLookup = createPinnedLookup(pinnedAddresses);

const allResults = await new Promise((resolve, reject) => {
  pinnedLookup("attacker-controlled.example", { all: true }, (error, addresses) => {
    if (error) reject(error);
    else resolve(addresses);
  });
});
assert.deepEqual(allResults, expectedPinnedAddresses, "all-address lookup must return only the validated pinned answers");

const firstResult = await new Promise((resolve, reject) => {
  pinnedLookup("attacker-controlled.example", 4, (error, address, family) => {
    if (error) reject(error);
    else resolve({ address, family });
  });
});
assert.deepEqual(firstResult, expectedPinnedAddresses[0], "single-address lookup must return a validated pinned answer");

const ipv6Result = await new Promise((resolve, reject) => {
  pinnedLookup("attacker-controlled.example", 6, (error, address, family) => {
    if (error) reject(error);
    else resolve({ address, family });
  });
});
assert.deepEqual(ipv6Result, expectedPinnedAddresses[1], "single-address lookup must honor the requested IPv6 family");

const ipv6AllResults = await new Promise((resolve, reject) => {
  pinnedLookup("attacker-controlled.example", { all: true, family: 6 }, (error, addresses) => {
    if (error) reject(error);
    else resolve(addresses);
  });
});
assert.deepEqual(ipv6AllResults, [expectedPinnedAddresses[1]], "all-address lookup must filter to the requested family");

const familyMismatchLookup = createPinnedLookup([{ address: "2606:4700:4700::1111", family: 6 }]);
await assert.rejects(
  new Promise((resolve, reject) => {
    familyMismatchLookup("attacker-controlled.example", 4, (error, address, family) => {
      if (error) reject(error);
      else resolve({ address, family });
    });
  }),
  { code: "ENOTFOUND" },
  "lookup must fail closed when no pinned address matches the requested family",
);

const blockedOnlyLookup = createPinnedLookup([{ address: "127.0.0.1", family: 4 }]);
await assert.rejects(
  new Promise((resolve, reject) => {
    blockedOnlyLookup("attacker-controlled.example", 4, (error, address, family) => {
      if (error) reject(error);
      else resolve({ address, family });
    });
  }),
  { code: "ENOTFOUND" },
  "lookup must fail closed when no public pinned address remains",
);

const route = fs.readFileSync(new URL("../src/app/api/mcp-gateway/route.ts", import.meta.url), "utf8");
assert.match(route, /lookup:\s*createPinnedLookup\(validated\.addresses\)/, "upstream HTTPS request must pin validated DNS answers");
assert.match(route, /https\.request\(/, "upstream calls must use the pinned HTTPS transport");
assert.doesNotMatch(route, /fetch\(url/, "upstream calls must not perform a second DNS resolution through fetch");

console.log(`MCP upstream address hardening self-test: PASS (${blocked.length} blocked, ${allowed.length} public, DNS pinning verified)`);
