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
  unexpectedMigrations?: string[];
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
    const expectedSet = new Set(expected);
    const missing = expected.filter((file) => !applied.has(file));
    const unexpected = [...applied].filter((id) => !expectedSet.has(id)).sort();
    const version = String(versionResult.rows[0]?.version ?? "unknown");

    if (missing.length > 0 || unexpected.length > 0) {
      const drift = [
        missing.length ? `${missing.length} repository migration(s) missing from the ledger` : "",
        unexpected.length ? `${unexpected.length} ledger migration ID(s) not present in this repository` : "",
      ].filter(Boolean).join("; ");
      return {
        success: false,
        message: `Database connected, but migration ledger parity failed: ${drift}.`,
        version,
        expectedMigrations: expected.length,
        appliedMigrations: applied.size,
        missingMigrations: missing,
        unexpectedMigrations: unexpected,
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
      unexpectedMigrations: [],
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
