import fs from "node:fs";

const source = fs.readFileSync("src/db/index.ts", "utf8");
for (const marker of ["DATABASE_URL","POSTGRES_URL","POSTGRES_URL_NON_POOLING","PGHOST","PGPORT","PGUSER","PGPASSWORD","PGDATABASE","isDatabaseConfigured","databaseConfigurationSource",".neon\\.tech"]) {
  if (!source.includes(marker)) throw new Error(`database_config_contract_missing:${marker}`);
}
console.log("ELITZE database configuration self-test: PASS");