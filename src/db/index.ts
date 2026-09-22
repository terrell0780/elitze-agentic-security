import fs from "node:fs";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const globalForDb = globalThis as typeof globalThis & {
  __elitzePostgresqlPool?: Pool;
};

let databasePool: Pool | undefined;
let databaseClient: ReturnType<typeof drizzle> | undefined;

function databaseConnectionString() {
  const direct = process.env.DATABASE_URL?.trim();
  if (direct) return direct;

  const secretFile = process.env.DATABASE_URL_FILE?.trim();
  if (!secretFile) {
    throw new Error("DATABASE_URL is required");
  }
  if (!secretFile.startsWith("/run/secrets/")) {
    throw new Error("DATABASE_URL_FILE must point to a Docker secret under /run/secrets");
  }

  let value = "";
  try {
    value = fs.readFileSync(secretFile, "utf8").trim();
  } catch {
    throw new Error("DATABASE_URL_FILE could not be read");
  }
  if (!value) throw new Error("DATABASE_URL_FILE is empty");
  return value;
}

function getPool(): Pool {
  if (databasePool) return databasePool;

  const databaseUrl = databaseConnectionString();

  databasePool =
    globalForDb.__elitzePostgresqlPool ??
    new Pool({
      connectionString: databaseUrl,
      max: Number(process.env.DATABASE_POOL_MAX ?? 10),
      idleTimeoutMillis: Number(process.env.DATABASE_IDLE_TIMEOUT_MS ?? 30_000),
      connectionTimeoutMillis: Number(process.env.DATABASE_CONNECTION_TIMEOUT_MS ?? 10_000),
    });

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
