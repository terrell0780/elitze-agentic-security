import crypto from "node:crypto";
import type { PoolClient } from "pg";

export function hashToolDescription(tool: unknown): string {
  const stable = JSON.stringify(tool, (_, value) => {
    if (value && typeof value === "object" && !Array.isArray(value)) return Object.fromEntries(Object.entries(value).sort());
    return value;
  });
  return crypto.createHash("sha256").update(stable).digest("hex");
}

export async function persistObservedTool(
  client: PoolClient,
  input: {
    tenantId: string;
    serverId: string;
    serverName: string;
    tool: { name?: unknown; description?: unknown; inputSchema?: unknown };
    sourceRef: string;
    observedAt: Date;
  },
) {
  const toolName = typeof input.tool.name === "string" ? input.tool.name.trim() : "";
  if (!toolName) return null;
  const description = typeof input.tool.description === "string" ? input.tool.description : "";
  const inputSchema = input.tool.inputSchema && typeof input.tool.inputSchema === "object" ? input.tool.inputSchema : {};
  const descriptionHash = hashToolDescription({ description, inputSchema });

  const existing = await client.query(
    `SELECT id, description_hash, last_observed_at
       FROM mcp_tool_inventory
      WHERE tenant_id=$1 AND gateway_server_id=$2 AND tool_name=$3
      LIMIT 1`,
    [input.tenantId, input.serverId, toolName],
  );
  const previousHash = existing.rows[0]?.description_hash ?? null;
  const changed = Boolean(previousHash && previousHash !== descriptionHash);

  const row = await client.query(
    `INSERT INTO mcp_tool_inventory
       (tenant_id,gateway_server_id,tool_name,description_hash,description,input_schema,source_ref,evidence_state,first_observed_at,last_observed_at,previous_description_hash,changed_at,active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'OBSERVED',$8,$8,$9,$10,true)
     ON CONFLICT (tenant_id,gateway_server_id,tool_name) DO UPDATE SET
       description_hash=EXCLUDED.description_hash,
       description=EXCLUDED.description,
       input_schema=EXCLUDED.input_schema,
       source_ref=EXCLUDED.source_ref,
       evidence_state='OBSERVED',
       last_observed_at=EXCLUDED.last_observed_at,
       previous_description_hash=CASE WHEN mcp_tool_inventory.description_hash <> EXCLUDED.description_hash THEN mcp_tool_inventory.description_hash ELSE mcp_tool_inventory.previous_description_hash END,
       changed_at=CASE WHEN mcp_tool_inventory.description_hash <> EXCLUDED.description_hash THEN EXCLUDED.last_observed_at ELSE mcp_tool_inventory.changed_at END,
       active=true
     RETURNING id,tool_name AS "toolName",description_hash AS "descriptionHash",previous_description_hash AS "previousDescriptionHash",changed_at AS "changedAt"`,
    [input.tenantId, input.serverId, toolName, descriptionHash, description, inputSchema, input.sourceRef, input.observedAt.toISOString(), previousHash, changed ? input.observedAt.toISOString() : null],
  );

  const graphServerKey = `mcp-server:${input.serverId}`;
  const graphToolKey = `mcp-tool:${input.serverId}:${toolName}`;
  const graphAgentResult = await client.query(
    `SELECT agent_identity_id FROM mcp_gateway_servers WHERE id=$1 AND tenant_id=$2 LIMIT 1`,
    [input.serverId, input.tenantId],
  );
  const agentId = graphAgentResult.rows[0]?.agent_identity_id ? String(graphAgentResult.rows[0].agent_identity_id) : null;

  await upsertGraphNode(client, input.tenantId, "MCP_SERVER", graphServerKey, input.serverName, "mcp-gateway", "OBSERVED", input.sourceRef, input.observedAt);
  await upsertGraphNode(client, input.tenantId, "TOOL", graphToolKey, toolName, "mcp-gateway", "OBSERVED", input.sourceRef, input.observedAt, { descriptionHash, descriptionChanged: changed });
  if (agentId) {
    const agent = await client.query(`SELECT name FROM agent_identities WHERE id=$1 AND tenant_id=$2 LIMIT 1`, [agentId, input.tenantId]);
    const agentName = agent.rows[0]?.name ? String(agent.rows[0].name) : agentId;
    const graphAgentKey = `agent:${agentId}`;
    await upsertGraphNode(client, input.tenantId, "AGENT_IDENTITY", graphAgentKey, agentName, "agent_identities", "OBSERVED", agentId, input.observedAt);
    await upsertGraphEdge(client, input.tenantId, graphAgentKey, graphServerKey, "ROUTES_TO", "OBSERVED", "EXECUTE", input.sourceRef, input.observedAt, { credentialBoundary: "gateway" });
  }
  await upsertGraphEdge(client, input.tenantId, graphServerKey, graphToolKey, "INVOKES", "OBSERVED", "EXECUTE", input.sourceRef, input.observedAt, { descriptionHash });

  return { inventory: row.rows[0], changed };
}

async function upsertGraphNode(client: PoolClient, tenantId: string, nodeType: string, subjectKey: string, displayName: string, source: string, evidenceState: string, sourceRef: string, observedAt: Date, metadata: Record<string, unknown> = {}) {
  const content = JSON.stringify({ tenantId, nodeType, subjectKey, displayName, source, evidenceState, sourceRef, observedAt: observedAt.toISOString(), metadata });
  const contentHash = crypto.createHash("sha256").update(content).digest("hex");
  await client.query(
    `INSERT INTO security_graph_nodes (tenant_id,node_type,subject_key,display_name,source,evidence_state,source_ref,observed_at,metadata,content_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (tenant_id,node_type,subject_key) DO UPDATE SET
       display_name=EXCLUDED.display_name,source=EXCLUDED.source,evidence_state=EXCLUDED.evidence_state,source_ref=EXCLUDED.source_ref,observed_at=EXCLUDED.observed_at,metadata=EXCLUDED.metadata,content_hash=EXCLUDED.content_hash,active=true,updated_at=now()`,
    [tenantId,nodeType,subjectKey,displayName,source,evidenceState,sourceRef,observedAt.toISOString(),metadata,contentHash],
  );
}

async function upsertGraphEdge(client: PoolClient, tenantId: string, from: string, to: string, relation: string, evidenceState: string, accessMode: string, sourceRef: string, observedAt: Date, metadata: Record<string, unknown> = {}) {
  const endpoints = await client.query(`SELECT id,subject_key FROM security_graph_nodes WHERE tenant_id=$1 AND subject_key=ANY($2::text[]) AND active=true`, [tenantId,[from,to]]);
  const ids = new Map(endpoints.rows.map((row) => [String(row.subject_key), String(row.id)]));
  const fromId = ids.get(from); const toId = ids.get(to);
  if (!fromId || !toId) return;
  const content = JSON.stringify({ tenantId,from,to,relation,evidenceState,accessMode,sourceRef,observedAt:observedAt.toISOString(),metadata});
  const contentHash = crypto.createHash("sha256").update(content).digest("hex");
  await client.query(
    `INSERT INTO security_graph_edges (tenant_id,from_node_id,to_node_id,relation,access_mode,evidence_state,source,source_ref,observed_at,metadata,content_hash)
     VALUES ($1,$2,$3,$4,$5,$6,'mcp-gateway',$7,$8,$9,$10)
     ON CONFLICT (tenant_id,from_node_id,to_node_id,relation,access_mode,policy_effect) DO UPDATE SET evidence_state=EXCLUDED.evidence_state,source_ref=EXCLUDED.source_ref,observed_at=EXCLUDED.observed_at,metadata=EXCLUDED.metadata,content_hash=EXCLUDED.content_hash,active=true`,
    [tenantId,fromId,toId,relation,accessMode,evidenceState,sourceRef,observedAt.toISOString(),metadata,contentHash],
  );
}
