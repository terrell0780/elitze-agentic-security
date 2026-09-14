# ELITZE Enterprise Rollout Checklist

Use this before enabling production customer response paths.

## Identity

- Customer IdP configured and verified.
- Subject-to-tenant mapping verified.
- Roles mapped to ELITZE permissions.
- MFA and session controls are enforced by the identity provider.

## Security controls

- Tenant isolation tests pass.
- Approval policy is configured for high-impact actions.
- Break-glass procedures are documented and audited.
- Connector permissions use least privilege.

## Integrations

- Connector endpoint is HTTPS.
- Credentials are stored in the deployment secret manager.
- Connector health is `CONNECTED` only after real authentication succeeds.
- Ingestion is idempotent and failures are observable.

## Evidence and recovery

- Evidence retention is configured.
- Audit export is tested.
- Database backups are enabled.
- Restore test is completed.
- RPO/RTO are documented for the deployment.

## Security verification

- Authorized test attack paths have been retested after remediation.
- The result of every response action is verified against a real source.
- No UI or API surface represents unavailable integrations as live.
