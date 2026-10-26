# ELITZE security-tool integrations

This integration set records tool output as tenant-scoped evidence. It does not run arbitrary commands from the web application.

## Nmap: import XML scan evidence

Run Nmap on an authorized workstation or isolated security runner, targeting only assets covered by written authorization. Export XML with `nmap -sV -oX scan.xml <authorized-target>`. Submit the XML to:

`POST /api/integrations/security-tools/nmap/import`

Required header: `x-elitze-api-key: <ELITZE_INTERNAL_API_KEY>`

Example JSON body:

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "scanId": "approved-assessment-2026-01",
  "xml": "<nmaprun>...</nmaprun>"
}
```

The importer accepts XML up to 2 MiB, rejects DTD/entity declarations, caps results at 500 hosts, and records live hosts plus ports reported as `open`. It does not run Nmap, store the raw XML, or persist NSE script output. A scan's findings are observations, not proof of exploitability.

## John the Ripper: import audit summaries

Run password audits only against password hashes you are explicitly authorized to test, using a controlled worker with access restricted to the audit team. The importer accepts the output of `john --show` through:

`POST /api/integrations/security-tools/john-the-ripper/import`

Required header: `x-elitze-api-key: <ELITZE_INTERNAL_API_KEY>`

JSON body fields: `tenantId`, `scanId` (optional), `hashFormat` (optional), and `output` (the `--show` summary). The output can contain recovered plaintext passwords. Transmit it only over TLS on a trusted internal path and ensure ingress/proxy request-body logging is disabled. ELITZE's importer does not log or persist the raw output, plaintext passwords, or usernames; it stores only cracked/remaining counts, format label, and audit metadata. Output size is capped at 1 MiB.

## Metasploit Framework: read-only RPC bridge

Metasploit Framework's RPC protocol is not treated as a generic JSON REST endpoint. Run a separately managed bridge close to the Metasploit instance. Keep the underlying RPC service on a private network and expose only the bridge over HTTPS to ELITZE.

Configure these server-side variables:

- `ELITZE_METASPLOIT_BRIDGE_URL`: HTTPS origin of the bridge (the application requests `/v1/health` and `/v1/sessions`).
- `ELITZE_METASPLOIT_BRIDGE_TOKEN`: bearer token accepted by the bridge.

ELITZE calls the bridge with `Authorization: Bearer ...` and `X-ELITZE-Tenant-ID`. The bridge should authenticate the token, enforce tenant policy, and return a minimal response. Supported contract:

`GET /v1/health` → `{"ok":true,"version":"..." }`

`GET /v1/sessions` → `{"sessions":[{"id":"1","type":"shell","target":"192.0.2.10","opened_at":"..." }]}`

Ask ELITZE to observe the bridge by sending an authenticated POST to `/api/integrations/security-tools/metasploit/observe` with `{"tenantId":"...","operation":"health"}` or `{"tenantId":"...","operation":"sessions"}`.

This integration currently verifies health and observes session metadata. It does **not** launch exploit modules, run payloads, or execute commands. A successful HTTP response is reported as connected only when the bridge returns the documented contract. Never expose the native Metasploit RPC port to the public internet.

## Operational truth and access controls

- All three API routes require the ELITZE internal API key and a valid tenant UUID.
- Keep the internal key and the Metasploit bridge token in server-side secret storage; never send them to browser code.
- Imports create tenant-scoped security-graph evidence. Raw Nmap XML and raw John output are not retained by these routes.
- A source marked observed means the supplied source data was parsed and recorded. It is not a guarantee that the target is secure or vulnerable.
- Run security tools only on assets and credential material covered by explicit authorization.
