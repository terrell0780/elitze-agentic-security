-- Tenant-scoped RLS for RAG. The runtime must set app.tenant_id transaction-locally.
-- Missing tenant context returns no rows and rejects writes; no permissive fallback exists.
ALTER TABLE public.rag_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_documents FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rag_documents_tenant_isolation ON public.rag_documents;
CREATE POLICY rag_documents_tenant_isolation ON public.rag_documents
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE public.rag_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_chunks FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rag_chunks_tenant_isolation ON public.rag_chunks;
CREATE POLICY rag_chunks_tenant_isolation ON public.rag_chunks
  FOR ALL
  USING (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM public.rag_documents AS d
      WHERE d.id = rag_chunks.document_id
        AND d.tenant_id = rag_chunks.tenant_id
    )
  )
  WITH CHECK (
    tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
    AND EXISTS (
      SELECT 1 FROM public.rag_documents AS d
      WHERE d.id = rag_chunks.document_id
        AND d.tenant_id = rag_chunks.tenant_id
    )
  );
