import { validateProductionSecrets } from "@/config/secrets-assert";
import { verifyProductionDatabase } from "@/lib/database-verify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Public readiness contract. Detailed database/configuration diagnostics are
 * available only through the authenticated console health endpoint.
 */
export async function GET() {
  const secretStatus = validateProductionSecrets();
  const database = await verifyProductionDatabase();
  const ok = database.success && secretStatus.ok;

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
