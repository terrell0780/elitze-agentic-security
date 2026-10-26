import { spawnSync } from "node:child_process";

const gates = [
  ["typecheck", ["run", "typecheck"]],
  ["lint", ["run", "lint"]],
  ["production dependency audit", ["audit", "--omit=dev", "--audit-level=high"]],
  ["production configuration self-test", ["run", "production-config:self-test"]],
  ["security self-test", ["run", "test"]],
  ["authentication security self-test", ["run", "auth:security-self-test"]],
  ["Data Bridge self-test", ["run", "data-bridge:self-test"]],
  ["MCP workload identity self-test", ["run", "mcp-workload-identity:self-test"]],
  ["authentication E2E safety self-test", ["run", "auth:e2e-safety-self-test"]],
  ["production build", ["run", "build"]],
];

for (const [name, args] of gates) {
  console.log(`\n=== ${name} ===`);
  const result = spawnSync("npm", args, {
    stdio: "inherit",
    env: { ...process.env, CI: "true" },
  });

  if (result.error) {
    console.error(`FAILED: ${name}: ${result.error.message}`);
    process.exit(result.status ?? 1);
  }
  if (result.status !== 0) {
    console.error(`FAILED: ${name} (exit code ${result.status ?? "unknown"})`);
    process.exit(result.status ?? 1);
  }
  console.log(`PASSED: ${name}`);
}

console.log("\nAll configured build and security gates passed.");
