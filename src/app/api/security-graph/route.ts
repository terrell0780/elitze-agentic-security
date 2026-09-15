import { NextRequest, NextResponse } from "next/server";
import { authorizeInternalRequest } from "@/lib/security/policy";
import { GRAPH_NODE_TYPES, GRAPH_RELATIONS, graphStats, recordGraphEvidence, upsertGraphEdge, upsertGraphNode, findGraphPaths, type GraphNodeType, type GraphRelation, type EvidenceState } from "@/lib/elitze-secure/security-graph-v2";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(request: NextRequest) {
  return authorizeInternalRequest(request.headers.get("x-elitze-api-key"), process.env.ELITZE_INTERNAL_API_KEY);
}

function isNodeType(value: unknown): value is GraphNodeType { return typeof value === "string" && GRAPH_NODE_TYPES.includes(value as GraphNodeType); }
function isRelation(value: unknown): value is GraphRelation { return typeof value === "string" && GRAPH_RELATIONS.includes(value as GraphRelation); }
function isEvidenceState(value: unknown): value is EvidenceState { return value === "OBSERVED" || value === "INFERRED" || value === "UNKNOWN" || value === "UNMEASURABLE"; }

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ ok:false,error:"unauthorized" },{status:401});
  const tenantId = request.nextUrl.searchParams.get("tenantId")?.trim();
  if (!tenantId) return NextResponse.json({ ok:false,error:"tenant_id_required" },{status:400});
  const from = request.nextUrl.searchParams.get("from")?.trim();
  const to = request.nextUrl.searchParams.get("to")?.trim();
  if (from && to) {
    const paths = await findGraphPaths({ tenantId, fromSubjectKey: from, toSubjectKey: to, maxDepth: Number(request.nextUrl.searchParams.get("maxDepth") ?? 8) });
    return NextResponse.json({ ok:true, tenantId, paths });
  }
  return NextResponse.json({ ok:true, tenantId, stats: await graphStats(tenantId) });
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ ok:false,error:"unauthorized" },{status:401});
  const body = await request.json().catch(() => null) as {
    nodes?: Array<Record<string,unknown>>;
    edges?: Array<Record<string,unknown>>;
    evidence?: Array<Record<string,unknown>>;
  } | null;
  if (!body) return NextResponse.json({ ok:false,error:"invalid_json" },{status:400});
  const nodes = body.nodes ?? [];
  const edges = body.edges ?? [];
  const evidence = body.evidence ?? [];
  if (nodes.length + edges.length + evidence.length > 250) return NextResponse.json({ ok:false,error:"batch_too_large" },{status:413});
  const results = { nodes:[], edges:[], evidence:[] } as { nodes:unknown[]; edges:unknown[]; evidence:unknown[] };
  try {
    for (const node of nodes) {
      if (!isNodeType(node.nodeType) || !isEvidenceState(node.evidenceState)) throw new Error("invalid_graph_node");
      results.nodes.push(await upsertGraphNode(node as never));
    }
    for (const edge of edges) {
      if (!isRelation(edge.relation) || !isEvidenceState(edge.evidenceState)) throw new Error("invalid_graph_edge");
      results.edges.push(await upsertGraphEdge(edge as never));
    }
    for (const item of evidence) {
      if (typeof item.evidenceKind !== "string" || typeof item.source !== "string") throw new Error("invalid_graph_evidence");
      results.evidence.push(await recordGraphEvidence(item as never));
    }
  } catch (error) {
    return NextResponse.json({ ok:false,error:error instanceof Error ? error.message : "graph_write_failed" },{status:400});
  }
  return NextResponse.json({ ok:true, results });
}
