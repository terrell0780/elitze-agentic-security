import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const databaseUrl =
  process.env.DATABASE_MIGRATION_URL?.trim() ||
  process.env.DATABASE_URL?.trim() ||
  process.env.POSTGRES_URL?.trim() ||
  process.env.POSTGRES_URL_NON_POOLING?.trim();
const explicitSsl = (() => {
  const raw = process.env.DATABASE_SSL?.trim().toLowerCase();
  if (raw === "disable" || raw === "false" || raw === "0") return false;
  if (raw === "require" || raw === "true" || raw === "1") return true;
  return undefined;
})();

const connectionConfig = databaseUrl
  ? { connectionString: databaseUrl }
  : (() => {
      const host = process.env.PGHOST?.trim();
      const user = process.env.PGUSER?.trim();
      const password = process.env.PGPASSWORD ?? "";
      const database = process.env.PGDATABASE?.trim();
      const port = Number(process.env.PGPORT ?? 5432);
      if (!host || !user || !password || !database) {
        throw new Error("DATABASE_URL or PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE is required");
      }
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("PGPORT must be a valid TCP port");
      }
      const ssl = explicitSsl ?? (/\.neon\.tech$/i.test(host) ? true : undefined);
      return { host, port, user, password, database, ...(ssl === undefined ? {} : { ssl }) };
    })();
const client = new pg.Client(connectionConfig);
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
    const exists = await client.query("SELECT 1 FROM _elitze_migrations WHERE id = $1", [file]);
    if (exists.rowCount) continue;

    const sql = await fs.readFile(path.join(migrationDir, file), "utf8");
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO _elitze_migrations (id) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`Applied ${file}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }

  const runtimeRole = process.env.DATABASE_RUNTIME_ROLE?.trim();
  if (runtimeRole) {
    if (!/^[a-z_][a-z0-9_]{0,62}$/i.test(runtimeRole)) {
      throw new Error("DATABASE_RUNTIME_ROLE is not a valid PostgreSQL role identifier");
    }
    await client.query("BEGIN");
    try {
      await client.query(`GRANT USAGE ON SCHEMA public TO "${runtimeRole}"`);
      await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "${runtimeRole}"`);
      await client.query(`GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO "${runtimeRole}"`);
      await client.query(`GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO "${runtimeRole}"`);
      await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "${runtimeRole}"`);
      await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO "${runtimeRole}"`);
      await client.query(`ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO "${runtimeRole}"`);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }

  const requiredTables = [
    "agents", "discoveries", "hitl_approvals", "asi_controls", "enforcement_events", "market_gaps",
    "security_identities", "security_policies", "security_decisions", "attack_paths", "red_team_runs",
    "evidence_records", "security_approvals", "security_integration_events", "audit_ledger_events",
    "containment_actions", "decision_evidence", "analyst_feedback", "team_channels", "team_messages",
    "team_channel_members", "data_bridge_sources", "data_bridge_events",
    "auth_tenants", "auth_users", "auth_sessions", "auth_tokens", "auth_rate_limits",
    "auth_mfa_factors", "auth_recovery_codes", "auth_webauthn_credentials", "auth_challenges",
    "auth_refresh_tokens", "auth_api_keys", "auth_privileged_reauth",
    "security_test_requests", "security_test_findings", "security_validation_events", "security_validation_schedules",
    "security_fabric_sources", "security_fabric_events", "autonomous_analyst_runs", "autonomous_analyst_findings",
    "production_readiness_evidence", "rag_documents", "rag_chunks",
    "mcp_gateway_servers", "mcp_gateway_decisions", "mcp_gateway_request_nonces", "mcp_gateway_rate_limits",
    "chat_attachments", "team_message_attachments", "ai_connections",
    "team_voice_presence", "team_voice_signals", "teamspeak_integrations",
  ];

  const requiredColumns = [
    ["security_policies", "id", "int4"],
    ["security_policies", "tenant_id", "uuid"],
    ["security_policies", "name", "text"],
    ["security_policies", "definition", "jsonb"],
    ["security_policies", "active", "bool"],
    ["security_policies", "created_by", "text"],
    ["security_policies", "expires_at", "timestamptz"],
    ["mcp_gateway_decisions", "policy_id", "int4"],
    ["workload_sessions", "gateway_server_id", "uuid"],
    ["workload_delegations", "tool_name", "text"],
  ];
  const columnCheck = await client.query(
    `SELECT table_name, column_name, udt_name
     FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND (table_name, column_name) IN (${requiredColumns.map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`).join(", ")})`,
    requiredColumns.flatMap(([table, column]) => [table, column]),
  );
  const columns = new Map(columnCheck.rows.map((row) => [`${row.table_name}.${row.column_name}`, row.udt_name]));
  for (const [table, column, expectedType] of requiredColumns) {
    const actualType = columns.get(`${table}.${column}`);
    if (actualType !== expectedType) {
      throw new Error(`ELITZE migration verification failed; ${table}.${column} expected ${expectedType}, found ${actualType ?? "missing"}`);
    }
  }

  const vectorCheck = await client.query("SELECT 1 FROM pg_extension WHERE extname = 'vector'");
  if (!vectorCheck.rowCount) throw new Error("ELITZE migration verification failed; pgvector extension is missing");

  const tableCheck = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = ANY($1::text[])",
    [requiredTables],
  );
  const present = new Set(tableCheck.rows.map((row) => row.table_name));
  const missing = requiredTables.filter((table) => !present.has(table));
  if (missing.length) {
    throw new Error(`ELITZE migration verification failed; missing tables: ${missing.join(", ")}`);
  }
} finally {
  if (lockAcquired) {
    await client.query("SELECT pg_advisory_unlock(hashtext($1))", [migrationLock]).catch(() => undefined);
  }
  await client.end();
}
