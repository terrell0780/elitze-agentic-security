import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) throw new Error("DATABASE_URL is required");

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();

try {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _elitze_migrations (
      id text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const migrationDir = path.join(process.cwd(), "drizzle");
  const files = (await fs.readdir(migrationDir))
    .filter((file) => /^\d+_.*\.sql$/.test(file))
    .sort();

  if (files.length === 0) throw new Error("No ELITZE SQL migrations found");

  for (const file of files) {
    const id = file;
    const exists = await client.query("SELECT 1 FROM _elitze_migrations WHERE id = $1", [id]);
    if (exists.rowCount) continue;

    const sql = await fs.readFile(path.join(migrationDir, file), "utf8");
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO _elitze_migrations (id) VALUES ($1)", [id]);
      await client.query("COMMIT");
      console.log(`Applied ${file}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }
} finally {
  await client.end();
}
