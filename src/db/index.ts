import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const globalForDb = globalThis as typeof globalThis & {
  __elitzePostgresqlPool?: Pool;
};

let databasePool: Pool | undefined;
let databaseClient: ReturnType<typeof drizzle> | undefined;

function getPool(): Pool {
  if (databasePool) return databasePool;

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
  }

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
