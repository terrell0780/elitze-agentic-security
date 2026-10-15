import assert from "node:assert/strict";
import { isBlockedMcpAddress } from "../src/lib/elitze-secure/mcp-gateway.ts";

const blocked = [
  "0.1.2.3",
  "10.0.0.1",
  "100.64.0.1",
  "127.0.0.1",
  "169.254.169.254",
  "172.16.0.1",
  "192.0.0.1",
  "192.0.2.10",
  "192.168.1.1",
  "198.18.0.1",
  "198.51.100.5",
  "203.0.113.5",
  "224.0.0.1",
  "255.255.255.255",
  "::",
  "::1",
  "::ffff:127.0.0.1",
  "::ffff:7f00:1",
  "0:0:0:0:0:ffff:7f00:1",
  "::ffff:169.254.169.254",
  "fc00::1",
  "fd12:3456::1",
  "fe80::1",
  "fec0::1",
  "ff02::1",
  "2001:db8::1",
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

console.log(`MCP upstream address hardening self-test: PASS (${blocked.length} blocked, ${allowed.length} public)`);
