import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPgPool } from "@/db";
import { SECURITY_CONNECTORS, isSecurityConnectorId, probeSecurityConnector } from "@/lib/elitze-secure/security-source-fabric";
import type { SecurityConnectorStatus } from "@/lib/elitze-secure/security-source-fabric-types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isConfigured(definition: SecurityConnectorStatus) {
  return definition.credentialEnv.every((name) => Boolean(process.env[name]?.trim()))
    && (!definition.endpointEnv || Boolean(process.env[definition.endpointEnv]?.trim()));
}

async function loadStatuses(tenantId: string): Promise<SecurityConnectorStatus[]> {
  const result = await getPgPool().query(
    "SELECT connector_id,health_state,integration_state,last_observed_at,last_error " +
    "FROM security_fabric_sources WHERE tenant_id=$1",
    [tenantId],
  );
  const byId = new Map(result.rows.map((row) => [String(row.connector_id),row]));
  return SECURITY_CONNECTORS.map((definition) => {
    const source = byId.get(definition.id);
    return {
      ...definition,
      configured: isConfigured(definition),
      integrationState: source?.integration_state ?? "IMPLEMENTED",
      health: source?.health_state ?? "NOT_CONFIGURED",
      lastObservedAt: source?.last_observed_at ?? null,
      lastError: source?.last_error ?? null,
    };
  });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok:false,error:"unauthorized" },{ status:401 });
  try {
    const db = getPgPool();
    const [connectors,threats,criticalAssets,vulnerabilities,graph,events,campaigns] = await Promise.all([
      loadStatuses(user.tenantId),
      db.query(
        "SELECT COUNT(*)::int AS count FROM security_fabric_events " +
        "WHERE tenant_id=$1 AND evidence_state='OBSERVED' AND observed_at > now() - interval '24 hours' " +
        "AND severity IN ('HIGH','CRITICAL')",
        [user.tenantId],
      ),
      db.query(
        "SELECT COUNT(*)::int AS count FROM security_assets " +
        "WHERE tenant_id=$1 AND lower(criticality)='critical' AND status='active'",
        [user.tenantId],
      ),
      db.query(
        "SELECT COUNT(*) FILTER (WHERE kev=true AND status='open')::int AS kev, " +
        "AVG(epss) FILTER (WHERE epss IS NOT NULL)::float AS epss, " +
        "AVG(exposure_score) FILTER (WHERE exposure_score IS NOT NULL)::float AS exposure " +
        "FROM vulnerabilities WHERE tenant_id=$1",
        [user.tenantId],
      ),
      db.query(
        "SELECT COUNT(*)::int AS nodes FROM security_graph_nodes WHERE tenant_id=$1 AND active=true",
        [user.tenantId],
      ),
      db.query(
        "SELECT id,connector_id,event_type,subject_key,evidence_state,severity,observed_at,source_ref,payload " +
        "FROM security_fabric_events WHERE tenant_id=$1 ORDER BY observed_at DESC LIMIT 40",
        [user.tenantId],
      ),
      db.query(
        "SELECT COUNT(DISTINCT COALESCE(payload->>'campaignId',payload->>'campaign'))::int AS count " +
        "FROM security_fabric_events WHERE tenant_id=$1 " +
        "AND COALESCE(payload->>'campaignId',payload->>'campaign') IS NOT NULL",
        [user.tenantId],
      ),
    ]);
    return NextResponse.json({
      ok:true,
      connectors,
      metrics:{
        activeThreats: threats.rows[0]?.count ?? 0,
        criticalAssets: criticalAssets.rows[0]?.count ?? 0,
        kev: vulnerabilities.rows[0]?.kev ?? 0,
        epss: vulnerabilities.rows[0]?.epss ?? null,
        vpr: null,
        exposure: vulnerabilities.rows[0]?.exposure ?? null,
      },
      graph:{ nodes:graph.rows[0]?.nodes ?? 0 },
      activeCampaigns: campaigns.rows[0]?.count ?? 0,
      events: events.rows,
    });
  } catch (error) {
    console.error("ELITZE security fabric dashboard failed",error);
    return NextResponse.json({ ok:false,error:"security_fabric_unavailable" },{ status:503 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok:false,error:"unauthorized" },{ status:401 });
  const body = await request.json().catch(() => null) as { action?:string; connectorId?:string } | null;
  if (body?.action !== "probe" || !body.connectorId || !isSecurityConnectorId(body.connectorId)) {
    return NextResponse.json({ ok:false,error:"probe_connector_required" },{ status:400 });
  }
  try {
    const result = await probeSecurityConnector(body.connectorId);
    await getPgPool().query(
      "INSERT INTO security_fabric_sources " +
      "(tenant_id,connector_id,integration_state,health_state,last_observed_at,last_error,metadata) " +
      "VALUES ($1,$2,$3,$4,CASE WHEN $4='CONNECTED' THEN now() ELSE NULL END,NULL,$5) " +
      "ON CONFLICT (tenant_id,connector_id) DO UPDATE SET " +
      "integration_state=EXCLUDED.integration_state,health_state=EXCLUDED.health_state," +
      "last_observed_at=EXCLUDED.last_observed_at,last_error=NULL,updated_at=now()",
      [user.tenantId,body.connectorId,result.integrationState,result.health,JSON.stringify({ detail:result.detail,evidenceState:result.evidenceState })],
    );
    return NextResponse.json({ ok:true,result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "connector_probe_failed";
    await getPgPool().query(
      "INSERT INTO security_fabric_sources " +
      "(tenant_id,connector_id,integration_state,health_state,last_error_at,last_error) " +
      "VALUES ($1,$2,'IMPLEMENTED','ERROR',now(),$3) " +
      "ON CONFLICT (tenant_id,connector_id) DO UPDATE SET " +
      "health_state='ERROR',last_error_at=now(),last_error=$3,updated_at=now()",
      [user.tenantId,body.connectorId,message],
    );
    return NextResponse.json({ ok:false,error:message,evidenceState:"UNAVAILABLE" },{ status:503 });
  }
}
