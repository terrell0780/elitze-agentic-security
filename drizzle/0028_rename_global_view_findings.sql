DO $$
BEGIN
  IF to_regclass('gods_eye_findings') IS NOT NULL
     AND to_regclass('elitze_global_view_findings') IS NULL THEN
    ALTER TABLE gods_eye_findings RENAME TO elitze_global_view_findings;
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('gods_eye_findings_tenant_idx') IS NOT NULL
     AND to_regclass('elitze_global_view_findings_tenant_idx') IS NULL THEN
    ALTER INDEX gods_eye_findings_tenant_idx RENAME TO elitze_global_view_findings_tenant_idx;
  END IF;
END
$$;
