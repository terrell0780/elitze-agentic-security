import { createHash } from "node:crypto";
import { getPgPool } from "@/db";

export const GRAPH_NODE_TYPES = [
  "HUMAN_IDENTITY","AGENT_IDENTITY","SERVICE_ACCOUNT","MODEL","PROMPT_CONFIG",
  "MCP_CLIENT","MCP_SERVER","TOOL","API_CREDENTIAL","CLOUD_ROLE","DATA_STORE",
  "DEPLOYMENT_ENVIRONMENT","APPROVAL_AUTHORITY","POLICY","DECISION","RUNTIME_ACTION",
  "EVIDENCE_RECORD","VERIFICATION_RECORD",
] as const;
export type GraphNodeType = typeof GRAPH_NODE_TYPES[number];
export type EvidenceState = "OBSERVED" | "INFERRED" | "UNKNOWN" | "UNMEASURABLE";
export type AccessMode = "READ" | "WRITE" | "EXECUTE" | "ADMIN";
export type PolicyEffect = "ALLOW" | "DENY" | "REVIEW" | "CONSTRAIN";
export const GRAPH_RELATIONS = [
  "AUTHORIZES","DELEGATES","ASSUMES","USES","INVOKES","ROUTES_TO","CAN_REACH",
  "READS","WRITES","EXECUTES","DEPLOYED_IN","CONFIGURED_BY","GOVERNS","DECIDED_BY",
  "RESULTED_IN","SUPPORTED_BY","VERIFIED_BY","PROVES","DEPENDS_ON",
] as const;
export type GraphRelation = typeof GRAPH_RELATIONS[number];

type JsonRecord = Record<string, unknown>;

export type GraphNodeInput = {
  tenantId: string; nodeType: GraphNodeType; subjectKey: string; displayName: string;
  source: string; evidenceState: EvidenceState; sourceRef?: string; observedAt?: string; metadata?: JsonRecord;
};
export type GraphEdgeInput = {
  tenantId: string; from: string; to: string; relation: GraphRelation; evidenceState: EvidenceState;
  source: string; accessMode?: AccessMode; policyEffect?: PolicyEffect; sourceRef?: string; observedAt?: string; metadata?: JsonRecord;
};

const stable = (value: unknown): string => {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  return `{${Object.keys(value as JsonRecord).sort().map((key) => `${JSON.stringify(key)}:${stable((value as JsonRecord)[key])}`).join(",")}}`;
};
const hash = (value: unknown) => createHash("sha256").update(stable(value)).digest("hex");
const required = (value: string, name: string) => { const v = value.trim(); if (!v) throw new Error(`${name}_required`); if (v.length > 500) throw new Error(`${name}_too_long`); return v; };

export async function upsertGraphNode(input: GraphNodeInput) {
  const tenantId = required(input.tenantId, "tenant_id");
  const subjectKey = required(input.subjectKey, "subject_key");
  const displayName = required(input.displayName, "display_name");
  const source = required(input.source, "source");
  const metadata = input.metadata ?? {};
  const contentHash = hash({ tenantId, nodeType: input.nodeType, subjectKey, displayName, source, evidenceState: input.evidenceState, sourceRef: input.sourceRef ?? null, observedAt: input.observedAt ?? null, metadata });
  const result = await getPgPool().query(
    `INSERT INTO security_graph_nodes
      (tenant_id,node_type,subject_key,display_name,source,evidence_state,source_ref,observed_at,metadata,content_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (tenant_id,node_type,subject_key) DO UPDATE SET
       display_name=EXCLUDED.display_name,source=EXCLUDED.source,evidence_state=EXCLUDED.evidence_state,
       source_ref=EXCLUDED.source_ref,observed_at=EXCLUDED.observed_at,metadata=EXCLUDED.metadata,
       content_hash=EXCLUDED.content_hash,active=true,updated_at=now()
     RETURNING id,node_type AS "nodeType",subject_key AS "subjectKey",display_name AS "displayName",evidence_state AS "evidenceState",content_hash AS "contentHash"`,
    [tenantId,input.nodeType,subjectKey,displayName,source,input.evidenceState,input.sourceRef ?? null,input.observedAt ?? null,metadata,contentHash],
  );
  return result.rows[0];
}

export async function upsertGraphEdge(input: GraphEdgeInput) {
  const tenantId = required(input.tenantId, "tenant_id");
  const from = required(input.from, "from");
  const to = required(input.to, "to");
  const source = required(input.source, "source");
  const db = getPgPool();
  const endpoints = await db.query(
    `SELECT id,subject_key AS "subjectKey" FROM security_graph_nodes WHERE tenant_id=$1 AND subject_key=ANY($2::text[]) AND active=true`,
    [tenantId,[from,to]],
  );
  const byKey = new Map<string,string>(endpoints.rows.map((row) => [String(row.subjectKey),String(row.id)]));
  const fromId = byKey.get(from); const toId = byKey.get(to);
  if (!fromId || !toId) throw new Error("graph_edge_endpoint_missing");
  const metadata = input.metadata ?? {};
  const contentHash = hash({ tenantId,from,to,relation:input.relation,accessMode:input.accessMode ?? null,policyEffect:input.policyEffect ?? null,evidenceState:input.evidenceState,source,sourceRef:input.sourceRef ?? null,observedAt:input.observedAt ?? null,metadata });
  const result = await db.query(
    `INSERT INTO security_graph_edges
      (tenant_id,from_node_id,to_node_id,relation,access_mode,policy_effect,evidence_state,source,source_ref,observed_at,metadata,content_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT (tenant_id,from_node_id,to_node_id,relation,access_mode,policy_effect) DO UPDATE SET
       evidence_state=EXCLUDED.evidence_state,source=EXCLUDED.source,source_ref=EXCLUDED.source_ref,
       observed_at=EXCLUDED.observed_at,metadata=EXCLUDED.metadata,content_hash=EXCLUDED.content_hash,active=true
     RETURNING id,relation,evidence_state AS "evidenceState",content_hash AS "contentHash"`,
    [tenantId,fromId,toId,input.relation,input.accessMode ?? null,input.policyEffect ?? null,input.evidenceState,source,input.sourceRef ?? null,input.observedAt ?? null,metadata,contentHash],
  );
  return result.rows[0];
}

export async function recordGraphEvidence(input: { tenantId: string; nodeId?: string; edgeId?: string; evidenceKind: "OBSERVATION"|"DECISION"|"EXECUTION"|"RETEST"|"VERIFICATION"; source: string; sourceRef?: string; observedAt?: string; payload?: JsonRecord }) {
  if (!input.nodeId && !input.edgeId) throw new Error("graph_evidence_target_required");
  const payload = input.payload ?? {};
  const contentHash = hash({ evidenceKind:input.evidenceKind,source:input.source,sourceRef:input.sourceRef ?? null,observedAt:input.observedAt ?? null,payload });
  const result = await getPgPool().query(
    `INSERT INTO security_graph_evidence
      (tenant_id,node_id,edge_id,evidence_kind,source,source_ref,observed_at,payload,content_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT DO NOTHING RETURNING id,content_hash AS "contentHash"`,
    [input.tenantId,input.nodeId ?? null,input.edgeId ?? null,input.evidenceKind,input.source,input.sourceRef ?? null,input.observedAt ?? null,payload,contentHash],
  );
  return result.rows[0] ?? { duplicate:true,contentHash };
}

export async function findGraphPaths(input: { tenantId:string; fromSubjectKey:string; toSubjectKey:string; maxDepth?:number }) {
  const maxDepth = Math.min(Math.max(input.maxDepth ?? 8,1),16);
  const result = await getPgPool().query(
    `WITH RECURSIVE paths AS (
       SELECT e.to_node_id AS node_id,ARRAY[e.from_node_id,e.to_node_id]::uuid[] AS node_path,ARRAY[e.id]::uuid[] AS edge_path,1 AS depth
       FROM security_graph_edges e
       JOIN security_graph_nodes f ON f.id=e.from_node_id
       WHERE e.tenant_id=$1 AND e.active=true AND f.subject_key=$2
       UNION ALL
       SELECT e.to_node_id,p.node_path||e.to_node_id,p.edge_path||e.id,p.depth+1
       FROM paths p JOIN security_graph_edges e ON e.from_node_id=p.node_id
       WHERE e.tenant_id=$1 AND e.active=true AND p.depth<$4 AND NOT e.to_node_id=ANY(p.node_path)
     )
     SELECT p.depth,p.node_path,p.edge_path
     FROM paths p JOIN security_graph_nodes target ON target.id=p.node_id
     WHERE target.tenant_id=$1 AND target.subject_key=$3
     ORDER BY p.depth ASC LIMIT 20`,
    [input.tenantId,input.fromSubjectKey,input.toSubjectKey,maxDepth],
  );
  const db = getPgPool();
  return Promise.all(result.rows.map(async (row) => {
    const nodeIds = row.node_path as string[]; const edgeIds = row.edge_path as string[];
    const [nodes,edges] = await Promise.all([
      db.query(`SELECT id,node_type AS "nodeType",subject_key AS "subjectKey",display_name AS "displayName",evidence_state AS "evidenceState",source,source_ref AS "sourceRef",observed_at AS "observedAt" FROM security_graph_nodes WHERE tenant_id=$1 AND id=ANY($2::uuid[]) ORDER BY array_position($2::uuid[],id)`,[input.tenantId,nodeIds]),
      db.query(`SELECT id,relation,access_mode AS "accessMode",policy_effect AS "policyEffect",evidence_state AS "evidenceState",source,source_ref AS "sourceRef",observed_at AS "observedAt" FROM security_graph_edges WHERE tenant_id=$1 AND id=ANY($2::uuid[]) ORDER BY array_position($2::uuid[],id)`,[input.tenantId,edgeIds]),
    ]);
    const states = [...nodes.rows.map((r)=>r.evidenceState),...edges.rows.map((r)=>r.evidenceState)];
    const evidenceState: EvidenceState = states.includes("UNMEASURABLE") ? "UNMEASURABLE" : states.includes("UNKNOWN") ? "UNKNOWN" : states.includes("INFERRED") ? "INFERRED" : "OBSERVED";
    return { depth:Number(row.depth),nodes:nodes.rows,edges:edges.rows,evidenceState };
  }));
}

export async function graphStats(tenantId:string) {
  const db=getPgPool();
  const [nodes,edges,evidence]=await Promise.all([
    db.query(`SELECT node_type AS "nodeType",COUNT(*)::int AS count FROM security_graph_nodes WHERE tenant_id=$1 AND active=true GROUP BY node_type ORDER BY node_type`,[tenantId]),
    db.query(`SELECT relation,COUNT(*)::int AS count FROM security_graph_edges WHERE tenant_id=$1 AND active=true GROUP BY relation ORDER BY relation`,[tenantId]),
    db.query(`SELECT evidence_state AS "evidenceState",COUNT(*)::int AS count FROM security_graph_nodes WHERE tenant_id=$1 AND active=true GROUP BY evidence_state ORDER BY evidence_state`,[tenantId]),
  ]);
  return {nodes:nodes.rows,edges:edges.rows,evidence:evidence.rows};
}
