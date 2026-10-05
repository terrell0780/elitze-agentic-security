import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "@/db/production-schema";

let pool: Pool | undefined;
let productionDb: NodePgDatabase<typeof schema> | undefined;

function connectionString() {
  return process.env.DATABASE_URL?.trim()
    || process.env.POSTGRES_URL?.trim()
    || process.env.POSTGRES_URL_NON_POOLING?.trim();
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
