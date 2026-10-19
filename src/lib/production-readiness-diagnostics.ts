export type ReadinessSecretStatus = {
  missing: string[];
  malformed: string[];
  databaseConfigured: boolean;
};

export type ReadinessDatabaseStatus = {
  success: boolean;
  message: string;
  configurationSource: string;
  expectedMigrations?: number;
  appliedMigrations?: number;
  missingMigrations?: string[];
  unexpectedMigrations?: string[];
};

export function classifyDatabaseFailure(message: string): string {
  const value = message.toLowerCase();

  if (value.includes("not configured")) return "DATABASE_UNCONFIGURED";
  if (value.includes("migration") && (value.includes("missing") || value.includes("ledger parity"))) {
    return "MIGRATIONS_MISSING";
  }
  if (/password authentication failed|no password supplied|authentication failed/.test(value)) {
    return "DATABASE_AUTHENTICATION_FAILED";
  }
  if (/permission denied|insufficient privilege|must be owner/.test(value)) {
    return "DATABASE_PERMISSION_DENIED";
  }
  if (/certificate|ssl|tls|self signed/.test(value)) return "DATABASE_TLS_FAILED";
  if (/timeout|timed out|etimedout/.test(value)) return "DATABASE_TIMEOUT";
  if (/enotfound|eai_again|getaddrinfo|could not translate host/.test(value)) {
    return "DATABASE_DNS_FAILED";
  }
  if (/relation .*_elitze_migrations.* does not exist/.test(value)) {
    return "MIGRATION_LEDGER_MISSING";
  }
  if (/database .* does not exist/.test(value)) return "DATABASE_NAME_INVALID";

  return "DATABASE_VERIFY_FAILED";
}

/**
 * Produce operational diagnostics suitable for server logs.
 * Never include environment variable values, connection URLs, or raw driver errors.
 */
export function buildSanitizedReadinessDiagnostic(
  secrets: ReadinessSecretStatus,
  database: ReadinessDatabaseStatus,
) {
  return {
    event: "elitze_production_readiness_failed",
    configuration: {
      missing: [...secrets.missing],
      malformed: [...secrets.malformed],
      databaseConfigured: secrets.databaseConfigured,
    },
    database: {
      success: database.success,
      configurationSource: database.configurationSource,
      failureCode: database.success ? "NONE" : classifyDatabaseFailure(database.message),
      expectedMigrations: database.expectedMigrations ?? null,
      appliedMigrations: database.appliedMigrations ?? null,
      missingMigrationCount: database.missingMigrations?.length ?? null,
      unexpectedMigrationCount: database.unexpectedMigrations?.length ?? null,
    },
  };
}
