import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getPgPool } from "@/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const privateHeaders = { "cache-control": "private, no-store" };

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401, headers: privateHeaders });
  try {
    const db = getPgPool();
    const [nodes, edges] = await Promise.all([
      db.query(`SELECT id,node_type AS "nodeType",subject_key AS "subjectKey",display_name AS "displayName",evidence_state AS "evidenceState",source,source_ref AS "sourceRef",observed_at AS "observedAt",metadata FROM security_graph_nodes WHERE tenant_id=$1 AND active=true ORDER BY observed_at DESC NULLS LAST LIMIT 250`, [user.tenantId]),
      db.query(`SELECT e.id, e.relation,e.access_mode AS "accessMode",e.policy_effect AS "policyEffect",e.evidence_state AS "evidenceState",e.source,e.source_ref AS "sourceRef",e.observed_at AS "observedAt",f.subject_key AS "from",t.subject_key AS "to" FROM security_graph_edges e JOIN security_graph_nodes f ON f.id=e.from_node_id JOIN security_graph_nodes t ON t.id=e.to_node_id WHERE e.tenant_id=$1 AND e.active=true ORDER BY e.observed_at DESC NULLS LAST LIMIT 500`, [user.tenantId]),
    ]);
    return NextResponse.json({ ok: true, nodes: nodes.rows, edges: edges.rows, source: "ELITZE security graph" }, { headers: privateHeaders });
  } catch (error) {
    console.error("ELITZE console security graph load failed", error);
    return NextResponse.json({ ok: false, error: "security_graph_unavailable", evidenceState: "UNAVAILABLE" }, { status: 503, headers: privateHeaders });
  }
}
