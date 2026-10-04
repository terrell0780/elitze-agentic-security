import pg from "pg";

const url = process.env.DATABASE_URL?.trim();
if (!url) throw new Error("DATABASE_URL is required.");

const client = new pg.Client({
  connectionString: url,
  ssl: url.includes(".neon.tech") ? { rejectUnauthorized: true } : undefined,
});

const started = Date.now();
await client.connect();
try {
  const result = await client.query("select current_database() as database, now() as server_time");
  console.log(JSON.stringify({
    ok: true,
    database: result.rows[0].database,
    serverTime: result.rows[0].server_time,
    latencyMs: Date.now() - started,
  }));
} finally {
  await client.end();
}
