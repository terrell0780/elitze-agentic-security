import { createHash } from "node:crypto";
import { getPgPool } from "@/db";
import type { PoolClient } from "pg";

const EMBEDDING_DIMENSIONS = 1536;
const MAX_DOCUMENT_CHARS = 1_000_000;
const CHUNK_SIZE = 1_200;
const CHUNK_OVERLAP = 200;

const TENANT_UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

function normalizeTenantId(value: string): string {
  const tenantId = value.trim();
  if (!TENANT_UUID_PATTERN.test(tenantId)) {
    throw new Error("invalid_tenant_id");
  }
  return tenantId.toLowerCase();
}

/**
 * Every RAG database operation runs on one pinned connection and transaction.
 * PostgreSQL RLS policies fail closed unless this transaction-local tenant
 * context is present. SET LOCAL semantics prevent tenant context leaking
 * between pooled requests.
 */
async function withTenantTransaction<T>(
  tenantId: string,
  action: (client: PoolClient, normalizedTenantId: string) => Promise<T>,
): Promise<T> {
  const normalizedTenantId = normalizeTenantId(tenantId);
  const client = await getPgPool().connect();

  try {
    await client.query("BEGIN");
    await client.query("SELECT set_config('app.tenant_id', $1, true)", [normalizedTenantId]);
    const result = await action(client, normalizedTenantId);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export type RagSource = {
  id: string;
  documentId: string;
  title: string;
  content: string;
  sourceType: string;
  sourceUri: string | null;
  similarity: number;
  metadata: Record<string, unknown>;
};

function embeddingConfig() {
  const url =
    process.env.ELITZE_EMBEDDING_URL?.trim() ||
    process.env.ELITZE_AI_GATEWAY_URL?.trim();
  if (!url) {
    throw new Error("rag_provider_not_configured");
  }

  const token =
    process.env.ELITZE_EMBEDDING_TOKEN?.trim() ||
    process.env.ELITZE_AI_GATEWAY_TOKEN?.trim() ||
    process.env.AI_GATEWAY_API_KEY?.trim();
  if (!token) {
    throw new Error("rag_provider_token_not_configured");
  }

  return {
    url: url.replace(/\/$/, ""),
    token,
    model:
      process.env.ELITZE_EMBEDDING_MODEL?.trim() ||
      "openai/text-embedding-3-small",
  };
}

function vectorLiteral(values: number[]) {
  if (
    values.length !== EMBEDDING_DIMENSIONS ||
    values.some((value) => !Number.isFinite(value))
  ) {
    throw new Error("invalid_embedding_dimensions");
  }
  return `[${values.join(",")}]`;
}

async function embed(inputs: string[]) {
  if (!inputs.length) return [] as number[][];

  const config = embeddingConfig();
  const response = await fetch(`${config.url}/embeddings`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.token}`,
    },
    body: JSON.stringify({
      model: config.model,
      input: inputs,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  const payload = (await response.json().catch(() => null)) as {
    data?: Array<{ embedding?: unknown; index?: number }>;
  } | null;

  if (!response.ok || !Array.isArray(payload?.data)) {
    throw new Error("embedding_provider_error");
  }

  const ordered = [...payload.data]
    .sort((a, b) => Number(a.index ?? 0) - Number(b.index ?? 0))
    .map((item) => item.embedding);

  if (
    ordered.length !== inputs.length ||
    ordered.some(
      (item) =>
        !Array.isArray(item) ||
        item.length !== EMBEDDING_DIMENSIONS ||
        item.some(
          (value) => typeof value !== "number" || !Number.isFinite(value),
        ),
    )
  ) {
    throw new Error("invalid_embedding_response");
  }

  return ordered as number[][];
}

export function chunkText(input: string) {
  const text = input.trim();
  if (!text || text.length > MAX_DOCUMENT_CHARS) {
    throw new Error("invalid_document_size");
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(text.length, start + CHUNK_SIZE);
    const chunk = text.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end === text.length) break;
    start = Math.max(start + 1, end - CHUNK_OVERLAP);
  }

  return chunks;
}

export function publicRagError(error: unknown): {
  code: string;
  status: 400 | 502 | 503;
} {
  const message = error instanceof Error ? error.message : "";

  if (message === "invalid_document_size" || message === "invalid_query" || message === "invalid_tenant_id") {
    return { code: message, status: 400 };
  }

  if (
    message === "rag_provider_not_configured" ||
    message === "rag_provider_token_not_configured"
  ) {
    return { code: "rag_provider_not_configured", status: 503 };
  }

  return { code: "rag_service_unavailable", status: 503 };
}

export async function indexDocument(input: {
  tenantId: string;
  contentId: string;
  title: string;
  sourceType: string;
  sourceUri?: string | null;
  content: string;
  metadata?: Record<string, unknown>;
}) {
  const chunks = chunkText(input.content);
  const embeddings = await embed(chunks);

  const contentHash = createHash("sha256").update(input.content).digest("hex");
  const metadata = JSON.stringify(input.metadata ?? {});

  return withTenantTransaction(input.tenantId, async (client, tenantId) => {
    const document = await client.query(
      `INSERT INTO rag_documents
        (tenant_id,content_id,title,source_type,source_uri,content_hash,metadata,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,now())
       ON CONFLICT (tenant_id,content_id) DO UPDATE SET
         title=EXCLUDED.title,
         source_type=EXCLUDED.source_type,
         source_uri=EXCLUDED.source_uri,
         content_hash=EXCLUDED.content_hash,
         metadata=EXCLUDED.metadata,
         updated_at=now()
       RETURNING id`,
      [
        tenantId,
        input.contentId,
        input.title.trim(),
        input.sourceType.trim(),
        input.sourceUri ?? null,
        contentHash,
        metadata,
      ],
    );

    const documentId = String(document.rows[0]?.id ?? "");
    if (!documentId) throw new Error("document_persistence_failed");

    await client.query(
      "DELETE FROM rag_chunks WHERE document_id=$1 AND tenant_id=$2",
      [documentId, tenantId],
    );

    for (let index = 0; index < chunks.length; index += 1) {
      await client.query(
        `INSERT INTO rag_chunks
          (document_id,tenant_id,chunk_index,content,content_hash,embedding,metadata)
         VALUES ($1,$2,$3,$4,$5,$6::vector,$7::jsonb)`,
        [
          documentId,
          tenantId,
          index,
          chunks[index],
          createHash("sha256").update(chunks[index]).digest("hex"),
          vectorLiteral(embeddings[index]),
          metadata,
        ],
      );
    }

    return {
      documentId,
      contentId: input.contentId,
      chunksIndexed: chunks.length,
      contentHash,
    };
  });
}

export function isRagConfigured() {
  return Boolean(
    (process.env.ELITZE_EMBEDDING_URL?.trim() ||
      process.env.ELITZE_AI_GATEWAY_URL?.trim()) &&
      (process.env.ELITZE_EMBEDDING_TOKEN?.trim() ||
        process.env.ELITZE_AI_GATEWAY_TOKEN?.trim() ||
        process.env.AI_GATEWAY_API_KEY?.trim()),
  );
}

export async function searchRag(
  tenantId: string,
  query: string,
  limit = 8,
): Promise<RagSource[]> {
  const clean = query.trim();
  if (!clean || clean.length > 20_000) {
    throw new Error("invalid_query");
  }

  const [embedding] = await embed([clean]);
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 20);


  return withTenantTransaction(tenantId, async (client, normalizedTenantId) => {
    const result = await client.query(
      `SELECT
         c.id,
         c.document_id AS "documentId",
         d.title,
         c.content,
         d.source_type AS "sourceType",
         d.source_uri AS "sourceUri",
         1-(c.embedding <=> $1::vector) AS similarity,
         c.metadata
       FROM rag_chunks c
       JOIN rag_documents d ON d.id=c.document_id
       WHERE c.tenant_id=$2 AND d.tenant_id=$2
       ORDER BY c.embedding <=> $1::vector ASC
       LIMIT $3`,
      [vectorLiteral(embedding), normalizedTenantId, safeLimit],
    );

    return result.rows as RagSource[];
  });
}

export function formatRetrievedContext(sources: RagSource[]) {
  return sources
    .map(
      (source, index) =>
        `[Source ${index + 1}] ${source.title}
${source.content}
Source type: ${source.sourceType}${source.sourceUri ? `\nSource URI: ${source.sourceUri}` : ""}`,
    )
    .join("\n\n");
}
