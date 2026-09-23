CREATE TABLE IF NOT EXISTS google_ads_compliance_checks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), tenant_id uuid NOT NULL REFERENCES auth_tenants(id) ON DELETE CASCADE,
 policy_version text NOT NULL DEFAULT '2026', status text NOT NULL CHECK(status IN ('PASS','REVIEW','FAIL','NOT_ASSESSED','INSUFFICIENT_EVIDENCE')),
 controls jsonb NOT NULL,input_hash text NOT NULL,evidence_hash text NOT NULL,source text NOT NULL DEFAULT 'elitze-google-ads-governance',
 checked_at timestamptz NOT NULL DEFAULT now(),created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS google_ads_compliance_tenant_checked_idx ON google_ads_compliance_checks(tenant_id,checked_at DESC);
CREATE TABLE IF NOT EXISTS google_ads_policy_versions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),policy_key text NOT NULL,version text NOT NULL,source_url text NOT NULL,
 effective_at timestamptz,active boolean NOT NULL DEFAULT true,metadata jsonb NOT NULL DEFAULT '{}'::jsonb,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(policy_key,version)
);
INSERT INTO google_ads_policy_versions(policy_key,version,source_url,metadata) VALUES
('misrepresentation','2026','https://support.google.com/adspolicy/answer/6020955?hl=en','{"control":"truthful_identity_and_offer"}'),
('misleading_representation','2026','https://support.google.com/adspolicy/answer/15936666?hl=en','{"control":"identity_and_destination"}'),
('unreliable_claims','2026','https://support.google.com/adspolicy/answer/15936857?hl=en','{"control":"claims"}'),
('data_collection_and_use','2026','https://support.google.com/adspolicy/answer/6020956?hl=en','{"control":"privacy"}'),
('restricted_targeting','2026','https://support.google.com/adspolicy/answer/143465?hl=en','{"control":"personalized_and_sensitive_targeting"}'),
('customer_match','2026','https://support.google.com/adspolicy/answer/6299717?hl=en','{"control":"audience"}')
ON CONFLICT(policy_key,version) DO UPDATE SET source_url=EXCLUDED.source_url,metadata=EXCLUDED.metadata,active=true;
