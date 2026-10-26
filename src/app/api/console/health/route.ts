import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { validateProductionSecrets } from "@/config/secrets-assert";
import { verifyProductionDatabase } from "@/lib/database-verify";
import { isPlatformOwner } from "@/lib/platform-owner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }

  const secretStatus = validateProductionSecrets();
  const database = await verifyProductionDatabase();
  const databaseConfigured = database.configurationSource !== "NONE";
  const schema = database.success ? "ok" : databaseConfigured ? "migration_or_connection_error" : "unknown";
  const configurationReady = secretStatus.ok;
  const ok = database.success && configurationReady;

  const response: Record<string, unknown> = {
    ok,
    service: "elitze-agentic-security",
    brand: "ELITZE",
    checks: {
      database: database.success ? "ok" : databaseConfigured ? "unhealthy" : "unconfigured",
      schema,
      productionConfiguration: configurationReady ? "ok" : "blocked",
    },
  };

  if (isPlatformOwner(user)) {
    response.database = {
      configurationSource: database.configurationSource,
      version: database.version,
      expectedMigrations: database.expectedMigrations,
      appliedMigrations: database.appliedMigrations,
      missingMigrations: database.missingMigrations ?? [],
      message: database.message,
    };
    response.configuration = {
      databaseConfigured: secretStatus.databaseConfigured,
      missingCount: secretStatus.missing.length,
      malformedCount: secretStatus.malformed.length,
    };
  }

  return NextResponse.json(response, {
    status: ok ? 200 : 503,
    headers: { "cache-control": "private, no-store" },
  });
}
