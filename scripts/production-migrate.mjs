import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const url = process.env.DATABASE_URL?.trim();
if (!url) throw new Error("DATABASE_URL is required for production migration.");

const client = new pg.Client({
  connectionString: url,
  ssl: url.includes(".neon.tech") ? { rejectUnauthorized: true } : undefined,
});

await client.connect();
try {
  await client.query("SELECT pg_advisory_lock(hashtext($1))", ["elitze:production-foundation"]);
  const file = "0030_elitze_production_foundation.sql";
  const sql = await fs.readFile(path.join(process.cwd(), "drizzle", file), "utf8");
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }

  const required = [
    "organizations",
    "users",
    "sessions",
    "auth_tokens",
    "production_security_policies",
    "production_security_decisions",
    "production_security_evidence",
    "production_audit_events",
  ];

  const result = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = ANY($1::text[])",
    [required],
  );
  const present = new Set(result.rows.map((row) => row.table_name));
  const missing = required.filter((name) => !present.has(name));
  if (missing.length) throw new Error(`Production migration verification failed: ${missing.join(", ")}`);

  console.log(JSON.stringify({
    ok: true,
    migration: file,
    verifiedTables: required,
  }));
} finally {
  await client.query("SELECT pg_advisory_unlock(hashtext($1))", ["elitze:production-foundation"]).catch(() => undefined);
  await client.end();
}
