# elitze-scan

Authorized scanning for a code tree, with **live** advisory enrichment and a patch plan attached to
every finding. Part of [Elitze Agentic Security](https://www.elitze.info).

The design rule is the product's rule: **a field that looks like a measurement carries the source that
produced it, or it is `null`.** A failed feed reads `UNMEASURABLE`. A missing score is never rendered
as zero risk.

---

## What it does

| Check | Source | Notes |
| --- | --- | --- |
| Dependency advisories | [OSV.dev](https://api.osv.dev) `querybatch` + `/v1/vulns/{id}` | Only **exact** versions from manifests and lockfiles are queried. |
| Known-exploited | [CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) feed | Catalog version and release date recorded per scan. |
| Exploit likelihood | [FIRST EPSS](https://www.first.org/epss/) | 30-day probability, per CVE. |
| CVSS | Computed from the advisory's published vector | v3.1 base score, implemented per spec — not copied from a label. |
| Secrets | Deterministic regex ruleset | Value is masked in the model; the raw secret is never written to a report. |
| Hygiene | Manifest / Dockerfile / `.gitignore` parsing | Unpinned deps, unpinned base images, unignored `.env`. |

### What it does **not** do

- No AST reachability analysis. Findings are *not* proven reachable; the field says `not_assessed`.
- No patch execution. It writes a plan; a human or an approved CI job runs it.
- No auto-downgrade. If every fixed version is older than what you run, the finding says so and no
  command is offered.
- No tenant access, no credential use, no network calls to your systems.

---

## Install

```bash
pip install -e ".[dev]"        # checkout, with API + test extras
pip install "elitze-scan[api]" # CLI + HTTP service, from a wheel
```

Python 3.11+.

## Use

```bash
elitze-scan scan ./path/to/authorized/tree
elitze-scan ./path/to/tree --json-only --quiet     # bare path means `scan`
elitze-scan scan . --no-enrich                     # offline: local checks only
elitze-scan scan . --manual manual-findings.json   # merge a human's observations
elitze-scan scan . --teamspeak                     # also post the summary
python -m elitze_scan scan .                       # same entry point
python run_scan.py .                               # checkout shim
elitze-scan serve --port 8000                      # HTTP API
```

Exit code is `0` when nothing is critical/high, `1` when it is — usable as a CI gate.

Output: `reports/scan-<id>.json` (machine) and `reports/scan-<id>.html` (human, self-contained).

## HTTP API

`elitze-scan serve`, then:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/health` | Per-dependency state; `database` reports `NOT_CONFIGURED` until verified |
| `POST` | `/api/v1/scans` | `{"target": "relative/path", "enrich": true}` — resolves under `ELITZE_SCAN_ROOT` only |
| `GET` | `/api/v1/scans` | Recent scans |
| `GET` | `/api/v1/scans/{id}` | Full result |
| `GET` | `/api/v1/scans/{id}/findings?severity=high` | Filtered findings |
| `GET` | `/api/v1/scans/{id}/patch/{finding_id}` | Just the patch plan |
| `GET` | `/report/{id}` | Rendered HTML report |
| `POST` | `/api/v1/uploads` | Evidence intake (see below) |
| `GET` | `/api/v1/uploads` | Artifact index |
| `POST` | `/api/v1/manual-findings` | Validate a manual finding set, no persistence |
| `POST` | `/api/v1/notify/teamspeak` | `{"message": "..."}` → `SENT` / `NOT_CONFIGURED` / `ERROR` |

Environment: `ELITZE_SCAN_ROOT` (path jail, default cwd), `ELITZE_DATA_DIR` (store, default `data/`),
`ELITZE_MAX_PACKAGES` (enrichment cap, default 400).

### Uploads

Content-addressed by SHA-256, suffix allowlisted (`.json .sarif .csv .txt .log .md .xml .yaml .yml
.cdx .spdx`), 10 MiB ceiling. Identical bytes are stored once.

```bash
curl -X POST "http://127.0.0.1:8000/api/v1/uploads?name=sbom.json" --data-binary @sbom.json
```

---

## Patch plans

Every dependency finding carries:

| Field | Meaning |
| --- | --- |
| `strategy` | `upgrade` · `pin` · `rotate-secret` · `config` · `manual` |
| `target_version` | The fixed version to move to, or `null` |
| `command` | What an operator would actually run |
| `blast_radius` | Same-major vs major jump, stated plainly |
| `verification` | Commands that prove the change |
| `rollback` | The inverse operation |
| `notes` | Pinning, lockfile regeneration, rotation order |

Rules baked into `patch.py`:

1. **Never a downgrade.** A fix is offered only when `version_tuple(fix) > version_tuple(current)`.
   Advisories whose fixes target older maintained lines are reported with no command.
2. **No fix, no fiction.** No fixed release above the installed version → `patch: null` plus a note.
3. **Secrets are rotated, not deleted.** The plan says rotate at the provider first, then purge history.

## Evidence states

| State | Meaning |
| --- | --- |
| `VERIFIED` | Confirmed against an authoritative source (OSV record, KEV entry, DNS answer). |
| `OBSERVED` | Seen directly in the target (a literal at `file:line`, a Dockerfile line). |
| `DECLARED` | Claimed by a manifest but not resolvable — e.g. an unpinned version. |
| `UNKNOWN` | Not determined. |
| `UNMEASURABLE` | The source was needed and unavailable. |

## TeamSpeak

The adapter speaks ServerQuery over TCP (10 011): `login` → `use sid=…` → `sendtextmessage targetmode=2`.
It returns `NOT_CONFIGURED` when credentials are absent, and never claims delivery it did not make.

```bash
export TS3_HOST=ts.example.net
export TS3_QUERY_USER=serveradmin
export TS3_QUERY_PASSWORD=...
export TS3_SERVER_ID=1
export TS3_CHANNEL_ID=1
```

## Manual findings

The manual half of the workflow. Validation is strict — a finding without a stated detail, a named
author and a remediation is rejected rather than filled with defaults.

```json
{
  "findings": [
    {
      "title": "MCP tool grants write access to billing API",
      "asset": "mcp/gateway.json",
      "severity": "high",
      "location": "mcp/gateway.json:14",
      "detail": "update_invoice is reachable by the analyst role with no approval step.",
      "remediation": "Require approval for update_invoice; scope the token to read-only.",
      "discovered_by": "terrell",
      "verification": ["replay the tool call", "confirm the approval prompt appears"],
      "evidence_url": "https://example.invalid/ticket/42"
    }
  ]
}
```

## Tests

```bash
python -m pytest -q     # 27 tests, no network required
```

Coverage includes CVSS v3.1 vectors against known scores, the no-downgrade rule, secret masking and
placeholder rejection, engine behaviour offline, path-traversal rejection, upload hashing, manual
finding validation, TeamSpeak escaping, and manifest/version consistency.

## Layout

```
elitze_scan/
  models.py     Finding, PatchPlan, ScanResult, evidence constants
  cvss.py       CVSS v3.1 base score from vector
  parsers.py    requirements / package.json / package-lock
  secrets.py    deterministic ruleset, overlap-aware, masked
  enrich.py     OSV, CISA KEV (12h cache), FIRST EPSS, per-feed state
  patch.py      patch plan construction, upgrade-only rule
  engine.py     orchestration and severity ordering
  report.py     JSON + self-contained HTML
  manual.py     manual finding intake and validation
  teamspeak.py  ServerQuery adapter
  api.py        FastAPI surface, file-backed store
  cli.py        argument parsing, exit codes
```

## Security posture

- Path jail: scan targets resolve under `ELITZE_SCAN_ROOT`; traversal is rejected.
- Secrets are masked at the model boundary and excluded from reports.
- Uploads are suffix-checked, size-capped and content-addressed.
- No outbound call carries tenant data; enrichment queries public feeds by package name and version.

Report a vulnerability to `security@elitze.info` — 48h acknowledgement, 90-day coordination.

---

© 2026 TrueElitze Digital · Terrell Hall · Victoria, BC, Canada. Proprietary.
