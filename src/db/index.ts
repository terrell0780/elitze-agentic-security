import { drizzle } from "drizzle-orm/node-postgres";
import { Pool, type PoolConfig } from "pg";
import { configureRuntimeRole } from "@/lib/database-runtime-role";

const globalForDb = globalThis as typeof globalThis & {
  __elitzePostgresqlPool?: Pool;
};

let databasePool: Pool | undefined;
let databaseClient: ReturnType<typeof drizzle> | undefined;

export type DatabaseSource = "DATABASE_URL" | "POSTGRES_URL" | "PG_VARS" | "NONE";

function parseSslSetting(): boolean | undefined {
  const raw = process.env.DATABASE_SSL?.trim().toLowerCase();
  if (raw === "disable" || raw === "false" || raw === "0") return false;
  if (raw === "require" || raw === "true" || raw === "1") return true;
  return undefined;
}

function normalizeConnectionString(value: string): string {
  try {
    const url = new URL(value);
    if (/\.neon\.tech$/i.test(url.hostname)) {
      url.searchParams.set("sslmode", "verify-full");
      return url.toString();
    }
  } catch {
    // Leave non-URL/legacy connection strings untouched so configuration
    // validation can report the original error.
  }
  return value;
}

function connectionConfig(): PoolConfig {
  const databaseUrl =
    process.env.DATABASE_URL?.trim() ||
    process.env.POSTGRES_URL?.trim() ||
    process.env.POSTGRES_URL_NON_POOLING?.trim();
  if (databaseUrl) return { connectionString: normalizeConnectionString(databaseUrl) };

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

  const explicitSsl = parseSslSetting();
  const ssl = explicitSsl ?? (/\.neon\.tech$/i.test(host) ? true : undefined);

  return {
    host,
    port,
    user,
    password,
    database,
    ...(ssl === undefined ? {} : { ssl }),
  };
}

export function isDatabaseConfigured(): boolean {
  try {
    connectionConfig();
    return true;
  } catch {
    return false;
  }
}

export function databaseConfigurationSource(): DatabaseSource {
  if (process.env.DATABASE_URL?.trim()) return "DATABASE_URL";
  if (process.env.POSTGRES_URL?.trim()) return "POSTGRES_URL";
  if (process.env.PGHOST?.trim() && process.env.PGUSER?.trim() && process.env.PGPASSWORD && process.env.PGDATABASE?.trim()) {
    return "PG_VARS";
  }
  return "NONE";
}

function getPool(): Pool {
  if (databasePool) return databasePool;

  databasePool =
    globalForDb.__elitzePostgresqlPool ??
    new Pool({
      ...connectionConfig(),
      max: Number(process.env.DATABASE_POOL_MAX ?? 10),
      idleTimeoutMillis: Number(process.env.DATABASE_IDLE_TIMEOUT_MS ?? 30_000),
      connectionTimeoutMillis: Number(process.env.DATABASE_CONNECTION_TIMEOUT_MS ?? 10_000),
      maxUses: Number(process.env.DATABASE_MAX_USES ?? 0) || undefined,
    });

  configureRuntimeRole(databasePool, process.env.ELITZE_DB_RUNTIME_ROLE);

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__elitzePostgresqlPool = databasePool;
  }

  return databasePool;
}

/** Raw PostgreSQL pool for infrastructure paths that require parameterized SQL. */
export function getPgPool(): Pool {
  return getPool();
}

export function getDb() {
  databaseClient ??= drizzle(getPool());
  return databaseClient;
}

export async function closeDb() {
  if (!databasePool) return;
  await databasePool.end();
  databasePool = undefined;
  databaseClient = undefined;
  if (globalForDb.__elitzePostgresqlPool) {
    delete globalForDb.__elitzePostgresqlPool;
  }
}