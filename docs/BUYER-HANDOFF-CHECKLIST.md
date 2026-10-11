# ELITZE Buyer Handoff Checklist

## Transaction and service handoff

- [ ] Transaction documents describe an outright B2B asset acquisition, transferred intellectual property, exclusions, closing date, and any agreed transition assistance.
- [ ] Confirm account ownership and transferability for IONOS domain management, Vercel, the ELITZE Runner component/service and its hosting/origin, and Resend.
- [ ] Buyer-controlled rotation/creation of production credentials is scheduled for closing; secret values are not included in repository files or this checklist.
- [ ] Disclose that the current inventory does not contain the runner URL in GitHub or Vercel settings and that production handshake / end-to-end scanner evidence remains unverified.

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
