-- Agent workforce and patch-gauntlet records. Tenant-scoped dynamic agent
-- identities hired by the lead orchestrator, plus gauntlet verification runs
-- for agent-proposed patches. Identities are DECLARED catalog entries and
-- gauntlet status is derived only from recorded gate exit codes; runtime
-- execution state remains UNKNOWN until separate execution evidence exists.
CREATE TABLE IF NOT EXISTS public.agent_workforce (
  id bigserial PRIMARY KEY,
  tenant_id uuid NOT NULL,
  agent_id varchar(64) NOT NULL UNIQUE,
  name varchar(80) NOT NULL,
  avatar_url varchar(400) NOT NULL,
  specialty varchar(120) NOT NULL,
  system_prompt text NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'active',
  hired_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agent_workforce_tenant_idx ON public.agent_workforce (tenant_id);

CREATE TABLE IF NOT EXISTS public.agent_patch_gauntlets (
  id bigserial PRIMARY KEY,
  tenant_id uuid NOT NULL,
  agent_id varchar(64) NOT NULL,
  patch_ref varchar(300) NOT NULL,
  gates jsonb NOT NULL,
  status varchar(20) NOT NULL,
  failing_gate varchar(120),
  log_excerpt text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agent_patch_gauntlets_tenant_idx ON public.agent_patch_gauntlets (tenant_id);
CREATE INDEX IF NOT EXISTS agent_patch_gauntlets_agent_idx ON public.agent_patch_gauntlets (agent_id);

-- Tenant isolation identical to the RAG pattern (0033_rag_tenant_rls.sql): the
-- runtime must set app.tenant_id transaction-locally; missing tenant context
-- returns no rows and rejects writes. No permissive fallback exists.
ALTER TABLE public.agent_workforce ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_workforce FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS agent_workforce_tenant_isolation ON public.agent_workforce;
CREATE POLICY agent_workforce_tenant_isolation ON public.agent_workforce
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE public.agent_patch_gauntlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_patch_gauntlets FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS agent_patch_gauntlets_tenant_isolation ON public.agent_patch_gauntlets;
CREATE POLICY agent_patch_gauntlets_tenant_isolation ON public.agent_patch_gauntlets
  FOR ALL
  USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);
