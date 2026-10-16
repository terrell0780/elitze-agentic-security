import { validateProductionSecrets } from "@/config/secrets-assert";
import { verifyProductionDatabase } from "@/lib/database-verify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function redactReadinessMessage(message: string): string {
  return message
    .replace(/postgres(?:ql)?:\/\/[^\s"'\`]+/gi, "[redacted connection string]")
    .replace(/\b(password|secret|token|api[_-]?key)\b\s*[:=]\s*[^,\s;]+/gi, "$1=[redacted]");
}

/**
 * Public readiness contract. Detailed database/configuration diagnostics are
 * available only through the authenticated console health endpoint.
 */
export async function GET() {
  const secretStatus = validateProductionSecrets();
  const database = await verifyProductionDatabase();
  const ok = database.success && secretStatus.ok;

  if (!ok) {
    // Internal server logs only. Never log secret values or database URLs.
    console.error("ELITZE production readiness check failed", {
      database: {
        success: database.success,
        configurationSource: database.configurationSource,
        message: redactReadinessMessage(database.message),
        expectedMigrations: database.expectedMigrations ?? null,
        appliedMigrations: database.appliedMigrations ?? null,
        missingMigrationCount: database.missingMigrations?.length ?? 0,
      },
      configuration: {
        databaseConfigured: secretStatus.databaseConfigured,
        missing: secretStatus.missing,
        malformed: secretStatus.malformed,
      },
    });
  }

  return Response.json(
    {
      ok,
      service: "elitze-agentic-security",
      status: ok ? "ready" : "unavailable",
    },
    {
      status: ok ? 200 : 503,
      headers: { "cache-control": "no-store" },
    },
  );
}
