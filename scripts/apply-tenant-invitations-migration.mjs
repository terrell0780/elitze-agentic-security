import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const rawUrl =
  process.env.DATABASE_MIGRATION_URL?.trim() ||
  process.env.DATABASE_URL?.trim();

if (!rawUrl) {
  throw new Error(
    "DATABASE_MIGRATION_URL or DATABASE_URL is required to apply the auth tenant invitation migration.",
  );
}

function normalizedConnectionString(value) {
  const url = new URL(value);
  if (/\.neon\.tech$/i.test(url.hostname)) {
    url.searchParams.set("sslmode", "verify-full");
  }
  return { connectionString: url.toString(), isNeon: /\.neon\.tech$/i.test(url.hostname) };
}

const normalized = normalizedConnectionString(rawUrl);
const client = new pg.Client({
  connectionString: normalized.connectionString,
  ...(normalized.isNeon ? { ssl: { rejectUnauthorized: true } } : {}),
});

const migrationFile = "0032_auth_tenant_invitations.sql";
const migrationLock = "elitze:auth-tenant-invitations";
let connected = false;
let lockAcquired = false;

try {
  await client.connect();
  connected = true;
  await client.query("SELECT pg_advisory_lock(hashtext($1))", [migrationLock]);
  lockAcquired = true;

  const sql = await fs.readFile(
    path.join(process.cwd(), "drizzle", migrationFile),
    "utf8",
  );

  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }

  const expectedColumns = [
    ["id", "uuid"],
    ["tenant_id", "uuid"],
    ["email", "text"],
    ["email_normalized", "text"],
    ["role", "text"],
    ["invited_by_user_id", "uuid"],
    ["token_hash", "text"],
    ["expires_at", "timestamptz"],
    ["accepted_at", "timestamptz"],
    ["revoked_at", "timestamptz"],
    ["created_at", "timestamptz"],
  ];

  const columnsResult = await client.query(
    `SELECT column_name, udt_name
     FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND table_name = 'auth_tenant_invitations'`,
  );
  const actualColumns = new Map(
    columnsResult.rows.map((row) => [row.column_name, row.udt_name]),
  );

  const invalidColumns = expectedColumns.filter(
    ([name, type]) => actualColumns.get(name) !== type,
  );
  if (invalidColumns.length > 0) {
    throw new Error(
      `Invitation migration verification failed for columns: ${invalidColumns
        .map(([name, type]) => `${name} (expected ${type}, found ${actualColumns.get(name) ?? "missing"})`)
        .join(", ")}`,
    );
  }

  const requiredIndexes = [
    "auth_tenant_invitations_tenant_idx",
    "auth_tenant_invitations_pending_idx",
    "auth_tenant_invitations_token_hash_key",
  ];
  const indexesResult = await client.query(
    `SELECT indexname
     FROM pg_indexes
     WHERE schemaname = current_schema()
       AND tablename = 'auth_tenant_invitations'
       AND indexname = ANY($1::text[])`,
    [requiredIndexes],
  );
  const actualIndexes = new Set(indexesResult.rows.map((row) => row.indexname));
  const missingIndexes = requiredIndexes.filter((name) => !actualIndexes.has(name));
  if (missingIndexes.length > 0) {
    throw new Error(
      `Invitation migration verification failed; missing indexes: ${missingIndexes.join(", ")}`,
    );
  }

  const foreignKeys = await client.query(
    `SELECT COUNT(*)::int AS count
     FROM pg_constraint
     WHERE conrelid = to_regclass(current_schema() || '.auth_tenant_invitations')
       AND contype = 'f'`,
  );
  if (foreignKeys.rows[0]?.count !== 2) {
    throw new Error(
      "Invitation migration verification failed; expected tenant and inviter foreign keys.",
    );
  }

  console.log(
    `ELITZE additive database migration verified: ${migrationFile}`,
  );
} finally {
  if (lockAcquired) {
    await client.query("SELECT pg_advisory_unlock(hashtext($1))", [migrationLock]).catch(() => undefined);
  }
  if (connected) await client.end();
}
