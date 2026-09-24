import fs from "node:fs/promises";
import path from "node:path";
import { getDb, databaseConfigurationSource } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function migrationStatus() {
  const migrationDir = path.join(process.cwd(), "drizzle");
  const expected = (await fs.readdir(migrationDir)).filter((file) => /^\d+_.*\.sql$/.test(file)).sort();
  const result = await getDb().execute(sql`select id from _elitze_migrations order by id`);
  const applied = new Set(result.rows.map((row) => String((row as Record<string, unknown>).id)));
  const missing = expected.filter((file) => !applied.has(file));
  return { expected: expected.length, applied: applied.size, missing: missing.length };
}

export async function GET() {
  const databaseConfiguration = databaseConfigurationSource();
  if (databaseConfiguration === "NONE") return Response.json({ ok: false, service: "elitze-agentic-security", checks: { database: "unconfigured", schema: "unknown" }, databaseConfiguration }, { status: 503, headers: { "cache-control": "no-store" } });
  try {
    await getDb().execute(sql`select 1`);
    const migrations = await migrationStatus();
    const schema = migrations.missing === 0 ? "ok" : "migration_incomplete";
    const ok = schema === "ok";
    return Response.json({ ok, service: "elitze-agentic-security", checks: { database: "ok", schema }, migrations, databaseConfiguration }, { status: ok ? 200 : 503, headers: { "cache-control": "no-store" } });
  } catch (error) {
    const databaseError = error instanceof Error ? error.message : "database_unavailable";
    const schema = databaseError.includes("_elitze_migrations") ? "migration_table_missing" : "unknown";
    return Response.json({ ok: false, service: "elitze-agentic-security", checks: { database: "unavailable", schema }, databaseConfiguration }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}