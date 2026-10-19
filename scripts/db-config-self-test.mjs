import fs from "node:fs";

const runtimeSources = [
  fs.readFileSync("src/db/index.ts", "utf8"),
  fs.readFileSync("src/lib/database.ts", "utf8"),
].join("\n");
for (const marker of ["DATABASE_URL","POSTGRES_URL","POSTGRES_URL_NON_POOLING","PGHOST","PGPORT","PGUSER","PGPASSWORD","PGDATABASE","isDatabaseConfigured","databaseConfigurationSource",".neon\\.tech"]) {
  if (!runtimeSources.includes(marker)) throw new Error(`database_config_contract_missing:${marker}`);
}
if (runtimeSources.includes("DATABASE_MIGRATION_URL")) {
  throw new Error("database_runtime_must_not_read_migration_credentials");
}

const migrationSources = [
  fs.readFileSync("scripts/migrate.mjs", "utf8"),
  fs.readFileSync("scripts/production-migrate.mjs", "utf8"),
  fs.readFileSync("drizzle.config.ts", "utf8"),
].join("\n");
for (const marker of ["DATABASE_MIGRATION_URL", "DATABASE_RUNTIME_ROLE", "ALTER DEFAULT PRIVILEGES", "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES"]) {
  if (!migrationSources.includes(marker)) throw new Error(`database_role_separation_contract_missing:${marker}`);
}
if (!fs.readFileSync(".env.example", "utf8").includes("DATABASE_MIGRATION_URL=")) {
  throw new Error("database_migration_url_missing_from_env_example");
}
console.log("ELITZE database configuration and runtime/migration role separation self-test: PASS");
