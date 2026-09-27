import { getDb, databaseConfigurationSource } from "@/db";
import { sql } from "drizzle-orm";
import { productionConfig } from "@/config/production";
import { validateProductionSecrets } from "@/config/secrets-assert";
import { verifyProductionDatabase } from "@/lib/database-verify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const secretStatus = validateProductionSecrets();
  const database = await verifyProductionDatabase();
  const databaseConfigured = database.configurationSource !== "NONE";
  const schema = database.success ? "ok" : databaseConfigured ? "migration_or_connection_error" : "unknown";
  const configurationReady = secretStatus.ok;
  const ok = database.success && configurationReady;

  if (database.success) {
    await getDb().execute(sql`select 1`);
  }

  return Response.json(
    {
      ok,
      service: "elitze-agentic-security",
      build: "Elitze-Agentic-Security",
      brand: "ELITZE",
      canonicalOrigin: productionConfig.canonicalOrigin,
      checks: {
        database: database.success ? "ok" : databaseConfigured ? "unhealthy" : "unconfigured",
        schema,
        productionConfiguration: configurationReady ? "ok" : "blocked",
      },
      database: {
        configurationSource: database.configurationSource,
        version: database.version,
        expectedMigrations: database.expectedMigrations,
        appliedMigrations: database.appliedMigrations,
        missingMigrations: database.missingMigrations ?? [],
        message: database.message,
      },
      configuration: {
        databaseConfigured: secretStatus.databaseConfigured,
        missingCount: secretStatus.missing.length,
        malformedCount: secretStatus.malformed.length,
      },
    },
    {
      status: ok ? 200 : 503,
      headers: { "cache-control": "no-store" },
    },
  );
}
