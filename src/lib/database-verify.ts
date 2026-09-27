import fs from "node:fs/promises";
import path from "node:path";
import { getPgPool, databaseConfigurationSource } from "@/db";

export type ProductionDatabaseVerification = {
  success: boolean;
  message: string;
  version?: string;
  expectedMigrations?: number;
  appliedMigrations?: number;
  missingMigrations?: string[];
  configurationSource: string;
};

export async function verifyProductionDatabase(): Promise<ProductionDatabaseVerification> {
  const configurationSource = databaseConfigurationSource();

  if (configurationSource === "NONE") {
    return {
      success: false,
      message: "Production database is not configured.",
      configurationSource,
    };
  }

  try {
    const pool = getPgPool();
    const versionResult = await pool.query("SELECT current_setting('server_version') AS version");
    const migrationResult = await pool.query("SELECT id FROM _elitze_migrations ORDER BY id");
    const migrationDir = path.join(process.cwd(), "drizzle");
    const expected = (await fs.readdir(migrationDir))
      .filter((file) => /^\d+_.*\.sql$/.test(file))
      .sort();
    const applied = new Set(migrationResult.rows.map((row) => String(row.id)));
    const missing = expected.filter((file) => !applied.has(file));
    const version = String(versionResult.rows[0]?.version ?? "unknown");

    if (missing.length > 0) {
      return {
        success: false,
        message: `Database connected, but ${missing.length} migration(s) are missing.`,
        version,
        expectedMigrations: expected.length,
        appliedMigrations: applied.size,
        missingMigrations: missing,
        configurationSource,
      };
    }

    return {
      success: true,
      message: "Production database connection and repository migration ledger verified.",
      version,
      expectedMigrations: expected.length,
      appliedMigrations: applied.size,
      missingMigrations: [],
      configurationSource,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Production database verification failed.",
      configurationSource,
    };
  }
}
