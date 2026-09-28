CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS rag_documents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
 content_id varchar(240) NOT NULL, title varchar(500) NOT NULL, source_type varchar(80) NOT NULL, source_uri text,
 content_hash varchar(64) NOT NULL, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (tenant_id, content_id)
);
CREATE TABLE IF NOT EXISTS rag_chunks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 document_id uuid NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
 tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
 chunk_index integer NOT NULL, content text NOT NULL, content_hash varchar(64) NOT NULL,
 embedding vector(1536) NOT NULL, metadata jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (document_id, chunk_index)
);
CREATE INDEX IF NOT EXISTS rag_documents_tenant_idx ON rag_documents(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS rag_chunks_tenant_idx ON rag_chunks(tenant_id, document_id, chunk_index);
CREATE INDEX IF NOT EXISTS rag_chunks_embedding_hnsw_idx ON rag_chunks USING hnsw (embedding vector_cosine_ops);
