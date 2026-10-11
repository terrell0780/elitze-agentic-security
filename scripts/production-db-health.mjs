import pg from "pg";

function normalizeConnectionString(value) {
  try {
    const url = new URL(value);
    if (/\.neon\.tech$/i.test(url.hostname)) {
      url.searchParams.set("sslmode", "verify-full");
      return url.toString();
    }
  } catch {
    // Preserve the original value for pg to diagnose.
  }
  return value;
}

const rawUrl = process.env.DATABASE_URL?.trim();
if (!rawUrl) throw new Error("DATABASE_URL is required.");
const url = normalizeConnectionString(rawUrl);

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
