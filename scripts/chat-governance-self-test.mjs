import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import pg from "pg";

const root = process.cwd();
const envLocalPath = path.resolve(root, ".env.local");
if (fs.existsSync(envLocalPath)) process.loadEnvFile?.(envLocalPath);

let databaseUrl = process.env.DATABASE_URL || "";
if (!databaseUrl && process.env.NEON_PROJECT_ID) {
  const { execFileSync } = await import("node:child_process");
  const output = execFileSync(process.platform === "win32" ? process.env.ComSpec : "npx",
    process.platform === "win32"
      ? ["/d", "/s", "/c", "npx neonctl connection-string --project-id " + process.env.NEON_PROJECT_ID]
      : ["neonctl", "connection-string", "--project-id", process.env.NEON_PROJECT_ID],
    { encoding: "utf8", windowsHide: true });
  databaseUrl = output.split(/\r?\n/).map((line) => line.trim()).findLast((line) => line.startsWith("postgres")) || "";
}
if (!databaseUrl) throw new Error("DATABASE_URL is required");

function assert(ok, message) { if (!ok) throw new Error(message); }

const integrationKey = crypto.randomBytes(32).toString("hex");
process.env.ELITZE_INTEGRATION_ENCRYPTION_KEY = integrationKey;
const { encryptIntegrationSecret, decryptIntegrationSecret, validateExternalHttpsUrl } =
  await import("../src/lib/secure-integration-secrets.ts");

const secret = "chat-governance-self-test";
const encrypted = encryptIntegrationSecret(secret);
assert(encrypted.split(".").length === 3, "encrypted secret format invalid");
assert(decryptIntegrationSecret(encrypted) === secret, "secret encryption round trip failed");
assert(validateExternalHttpsUrl("https://example.com/path").protocol === "https:", "HTTPS URL validation failed");
for (const invalid of ["http://example.com", "https://localhost:1234", "https://127.0.0.1/test"]) {
  let rejected = false;
  try { validateExternalHttpsUrl(invalid); } catch { rejected = true; }
  assert(rejected, "unsafe external URL was accepted: " + invalid);
}

for (const rel of [
  "src/app/api/chat/route.ts",
  "src/app/api/chat/files/route.ts",
  "src/app/api/chat/files/[id]/route.ts",
  "src/app/api/team/voice/route.ts",
  "src/app/api/integrations/teamspeak/route.ts",
  "src/app/api/ai/connections/route.ts",
]) assert(fs.existsSync(path.join(root, rel)), "missing runtime route: " + rel);

assert(fs.existsSync(path.join(root, "drizzle/0027_chat_voice_integrations.sql")), "missing chat/voice migration");
assert(fs.existsSync(path.join(root, "src/app/chat/page.tsx")), "missing chat workspace");
assert(fs.existsSync(path.join(root, "src/app/help/page.tsx")), "missing help surface");
assert(fs.existsSync(path.join(root, "src/app/contact/page.tsx")), "missing contact surface");

const uploadRoute = fs.readFileSync(path.join(root, "src/app/api/chat/files/route.ts"), "utf8");
const downloadRoute = fs.readFileSync(path.join(root, "src/app/api/chat/files/[id]/route.ts"), "utf8");
assert(!uploadRoute.includes("teamChannelMembers"), "file upload still requires channel membership");
assert(!downloadRoute.includes("teamChannelMembers"), "file download still requires channel membership");
assert(downloadRoute.includes("chat.file.download"), "download policy gate is missing");
assert(downloadRoute.includes("chat.file.downloaded"), "download audit event is missing");

const { Client } = pg;
const db = new Client({ connectionString: databaseUrl });
await db.connect();
try {
  const tables = await db.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name = ANY($1::text[])",
    [[
      "chat_attachments",
      "team_message_attachments",
      "ai_connections",
      "team_voice_presence",
      "team_voice_signals",
      "teamspeak_integrations",
    ]],
  );
  const names = new Set(tables.rows.map((row) => row.table_name));
  for (const name of ["chat_attachments","team_message_attachments","ai_connections","team_voice_presence","team_voice_signals","teamspeak_integrations"]) {
    assert(names.has(name), "required database table missing: " + name);
  }

  const migration = await db.query(
    "SELECT id FROM _elitze_migrations WHERE id='0027_chat_voice_integrations.sql'",
  );
  assert(migration.rowCount === 1, "migration 0027 is not recorded as applied");

  const column = await db.query(
    "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='team_messages' AND column_name='metadata'",
  );
  assert(column.rowCount === 1, "team_messages.metadata is missing");
} finally {
  await db.end();
}

console.log("ELITZE chat/governance self-test: PASS — encrypted integration secret round-trip, SSRF-safe HTTPS validation, route/surface presence, and Neon schema/migration verification");
