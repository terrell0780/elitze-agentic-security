import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("DATABASE_URL is required");
const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();
const migrationLock = "elitze:migrations";
let lockAcquired = false;
try {
  await client.query("SELECT pg_advisory_lock(hashtext($1))", [migrationLock]);
  lockAcquired = true;
  await client.query(`CREATE TABLE IF NOT EXISTS _elitze_migrations (id text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
  const migrationDir = path.join(process.cwd(), "drizzle");
  const files = (await fs.readdir(migrationDir)).filter((file) => /^\d+_.*\.sql$/.test(file)).sort();
  if (files.length === 0) throw new Error("No ELITZE SQL migrations found");
  for (const file of files) {
    const id = file;
    const exists = await client.query("SELECT 1 FROM _elitze_migrations WHERE id = $1", [id]);
    if (exists.rowCount) continue;
    const sql = await fs.readFile(path.join(migrationDir, file), "utf8");
    await client.query("BEGIN");
    try { await client.query(sql); await client.query("INSERT INTO _elitze_migrations (id) VALUES ($1)", [id]); await client.query("COMMIT"); console.log(`Applied ${file}`); }
    catch (error) { await client.query("ROLLBACK"); throw error; }
  }
  const requiredTables = [
    "agents", "discoveries", "hitl_approvals", "asi_controls", "enforcement_events", "market_gaps",
    "security_identities", "security_policies", "security_decisions", "attack_paths", "red_team_runs",
    "evidence_records", "security_approvals", "security_integration_events", "audit_ledger_events",
    "containment_actions", "decision_evidence", "analyst_feedback", "team_channels", "team_messages",
    "team_channel_members", "data_bridge_sources", "data_bridge_events",\n    "auth_tenants", "auth_users", "auth_sessions", "auth_tokens", "auth_rate_limits",
    "auth_mfa_factors", "auth_recovery_codes", "auth_webauthn_credentials", "auth_challenges",
    "auth_refresh_tokens", "auth_api_keys", "auth_privileged_reauth",
    "team_channel_members", "data_bridge_sources", "data_bridge_events",
    "auth_tenants", "auth_users", "auth_sessions", "auth_tokens", "auth_rate_limits",
  ];
  const tableCheck = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = ANY($1::text[])", [requiredTables]);
  const present = new Set(tableCheck.rows.map((row) => row.table_name));
  const missing = requiredTables.filter((table) => !present.has(table));
  if (missing.length) throw new Error(`ELITZE migration verification failed; missing tables: ${missing.join(", ")}`);
} finally {
  if (lockAcquired) await client.query("SELECT pg_advisory_unlock(hashtext($1))", [migrationLock]).catch(() => undefined);
  await client.end();
}
