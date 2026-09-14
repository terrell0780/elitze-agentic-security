# ELITZE Buyer Handoff Checklist

## Source

- [ ] Exact transfer commit identified
- [ ] Repository visibility confirmed private
- [ ] No `.env`, credentials, API keys or database URLs committed
- [ ] Secret scan completed
- [ ] Git history reviewed for exposed secrets
- [ ] No unrelated project code in the repository

## Product

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run sale:readiness`
- [ ] Database migration set reviewed
- [ ] Required production environment variables documented
- [ ] External services and infrastructure dependencies documented

## Security

- [ ] Authentication boundary reviewed
- [ ] Internal API key boundary reviewed
- [ ] Containment remains fail-closed without an executor
- [ ] Evidence and audit controls reviewed
- [ ] Execute-capable skills require authorization
- [ ] No synthetic security telemetry or fabricated ROI

## Commercial / IP

- [ ] Existing sales package reviewed
- [ ] Third-party licenses and attribution notices reviewed
- [ ] Public-history disclosure completed where applicable
- [ ] Buyer receives only rights actually owned and transferable
- [ ] Exact handoff artifact/commit archived
