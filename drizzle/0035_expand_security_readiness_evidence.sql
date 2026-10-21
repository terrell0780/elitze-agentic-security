-- Replace the legacy commercial pilot evidence category with security operations proof only.
-- Remove old pilot-status records rather than retaining customer/sales artifacts in the security workspace.
DELETE FROM production_readiness_evidence WHERE category = 'customer_pilot';

ALTER TABLE production_readiness_evidence
  DROP CONSTRAINT IF EXISTS production_readiness_evidence_category_check;
ALTER TABLE production_readiness_evidence
  ADD CONSTRAINT production_readiness_evidence_category_check
  CHECK (category IN (
    'backup_restore',
    'authentication_e2e',
    'transactional_email_delivery',
    'runner_handshake',
    'tenant_isolation',
    'security_validation',
    'runtime_monitoring'
  ));
