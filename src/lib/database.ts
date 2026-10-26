import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@/db/production-schema";

let pool: Pool | undefined;
let productionDb: NodePgDatabase<typeof schema> | undefined;

function connectionString() {
  const value =
    process.env.DATABASE_URL?.trim()
    || process.env.POSTGRES_URL?.trim()
    || process.env.POSTGRES_URL_NON_POOLING?.trim();
  if (!value) return "";
  try {
    const url = new URL(value);
    if (/\.neon\.tech$/i.test(url.hostname)) {
      url.searchParams.set("sslmode", "verify-full");
      return url.toString();
    }
  } catch {
    // Keep the original value so pg can report a precise connection error.
  }
  return value;
}

function configureRuntimeRole(targetPool: Pool): void {
  const role = process.env.ELITZE_DB_RUNTIME_ROLE?.trim();
  if (!role) return;
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(role)) {
    throw new Error("ELITZE_DB_RUNTIME_ROLE must be a valid PostgreSQL role identifier.");
  }
  // pg-pool emits "connect" before handing a new client to its waiter. Queue
  // SET ROLE first so application queries cannot run before least privilege is active.
  targetPool.on("connect", (client) => {
    client.query(`SET ROLE "${role}"`, (error) => {
      if (error) client.release(error);
    });
  });
}

function getPool() {
  if (pool) return pool;
  const url = connectionString();
  if (!url) throw new Error("DATABASE_URL or PostgreSQL connection settings are required.");
  pool = new Pool({
    connectionString: url,
    max: Number(process.env.DB_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: process.env.DATABASE_SSL === "disable"
      ? false
      : url.includes(".neon.tech")
        ? { rejectUnauthorized: true }
        : undefined,
  });
  configureRuntimeRole(pool);
  return pool;
}

export function getProductionDb() {
  productionDb ??= drizzle(getPool(), { schema });
  return productionDb;
}

export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, property) {
    const current = getProductionDb();
    const value = Reflect.get(current, property);
    return typeof value === "function" ? value.bind(current) : value;
  },
});

export async function verifyDatabaseConnection(): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query("select 1 as ok");
  } finally {
    client.release();
  }
}

export { getPool as getProductionPool };
