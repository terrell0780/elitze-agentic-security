import { NextResponse } from "next/server";
import { verifyDatabaseConnection } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  try {
    await verifyDatabaseConnection();
    return NextResponse.json({
      ok: true,
      service: "elitze-cybersecurity",
      database: "reachable",
      latencyMs: Date.now() - started,
      claims: {
        productionDatabase: "VERIFIED_FUNCTIONAL",
        authentication: "NOT_VERIFIED",
        liveIntegrations: "NOT_VERIFIED",
      },
    });
  } catch (error) {
    console.error("ELITZE database health check failed", error);
    return NextResponse.json({
      ok: false,
      service: "elitze-cybersecurity",
      database: "unavailable",
      claims: {
        productionDatabase: "NOT_VERIFIED",
      },
    }, { status: 503 });
  }
}
