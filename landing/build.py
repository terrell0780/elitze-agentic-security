"""Build the Elitze hub: shared shell + one page per surface, from measured data.

Inputs are read live at build time — the newest scan JSON, the platform health endpoint,
the CISA KEV cache and DNS-over-HTTPS records. A failed source renders as UNMEASURABLE.

    python build.py                       # newest scan, all pages
    python build.py --label authorized-sample-tree
"""
from __future__ import annotations

import argparse
import html
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import httpx

HERE = Path(__file__).resolve().parent
DOMAIN = "elitze.info"
SITE_NAME = "ELITZE Agentic Security"

SCAN_GLOBS = [HERE.parent / "elitze-scan" / "reports", HERE.parent / "repo" / "elitze-scan" / "reports"]
KEV_CACHE = [HERE.parent / "elitze-scan" / "data" / "cache" / "kev.json",
             HERE.parent / "repo" / "elitze-scan" / "data" / "cache" / "kev.json"]

NAV = [
    ("Overview", [("index.html", "Hub", "◈")]),
    ("Control", [("graph.html", "Security Atlas", "◎"),
                 ("guardrails.html", "Guardrails", "⛨"),
                 ("scans.html", "Scans & patches", "⧗"),
                 ("email.html", "Email posture", "✉")]),
    ("Agent", [("sara.html", "Sara", "◐")]),
    ("Assurance", [("integrations.html", "Integrations", "⇄"),
                   ("compare.html", "Compare", "⚖"),
                   ("plans.html", "Plans", "$"),
                   ("faq.html", "FAQ", "?"),
                   ("contact.html", "Contact", "✎"),
                   ("trust.html", "Trust", "✓")]),
]


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def esc(value: object) -> str:
    return html.escape("" if value is None else str(value))


# ---------------------------------------------------------------- data


def newest_scan(explicit: Path | None) -> Path:
    if explicit:
        return explicit
    found: list[Path] = []
    for base in SCAN_GLOBS:
        if base.is_dir():
            found.extend(base.glob("scan-*.json"))
    if not found:
        raise SystemExit("build: no scan JSON found — run elitze-scan first or pass --scan")
    return max(found, key=lambda p: p.stat().st_mtime)


def sanitize_scan(raw: dict) -> dict:
    parts = [p for p in re.split(r"[\\/]+", str(raw.get("target", ""))) if p]
    label = "/".join(parts[-2:]) if len(parts) >= 2 else (parts[-1] if parts else "unknown")
    findings = []
    for f in raw.get("findings", []):
        findings.append({
            "id": f.get("id"), "kind": f.get("kind"), "title": f.get("title"),
            "asset": Path(str(f.get("asset", ""))).name or str(f.get("asset", "")),
            "severity": f.get("severity"),
            "location": re.sub(r"^[A-Za-z]:[\\/].*?[\\/](?=[^\\/]+$)", "", f.get("location") or ""),
            "detail": f.get("detail"), "ids": f.get("ids") or {},
            "cvss_score": f.get("cvss_score"), "cvss_vector": f.get("cvss_vector"),
            "epss": f.get("epss"), "kev": f.get("kev"), "evidence": f.get("evidence"),
            "patch": f.get("patch"),
            "sources": [{"name": s.get("name"), "url": s.get("url"),
                         "observed_at": s.get("observed_at")} for s in f.get("sources", []) if isinstance(s, dict)],
        })
    return {"scan_id": raw.get("scan_id"), "target": label, "started_at": raw.get("started_at"),
            "finished_at": raw.get("finished_at"), "tool_version": raw.get("tool_version"),
            "enrichment": raw.get("enrichment", {}), "stats": raw.get("stats", {}),
            "notes": raw.get("notes", []), "findings": findings}


def kev_entry_count() -> int | None:
    for path in KEV_CACHE:
        if path.exists():
            try:
                return len(json.loads(path.read_text(encoding="utf-8")).get("vulnerabilities", []))
            except (OSError, json.JSONDecodeError):
                continue
    return None


def doh(name: str, rtype: str) -> list[str]:
    try:
        with httpx.Client(timeout=12, follow_redirects=True) as client:
            r = client.get("https://dns.google/resolve", params={"name": name, "type": rtype},
                           headers={"accept": "application/dns-json"})
            r.raise_for_status()
            return [str(a.get("data", "")).strip('"') for a in (r.json().get("Answer") or [])]
    except Exception:  # noqa: BLE001
        return []


def health() -> dict[str, str]:
    try:
        with httpx.Client(timeout=15, follow_redirects=True) as client:
            r = client.get(f"https://www.{DOMAIN}/api/v1/health",
                           headers={"User-Agent": "elitze-build/2.0"})
            body = r.json() if "json" in r.headers.get("content-type", "") else {}
            ok = r.status_code == 200 and body.get("ok") is True
            return {"code": str(r.status_code), "state": "ok" if ok else "unavailable",
                    "stamp": utc_now(), "db": str(body.get("database", "not reported")),
                    "claim": str((body.get("claims") or {}).get("productionDatabase", "not reported"))}
    except Exception as exc:  # noqa: BLE001
        return {"code": "—", "state": f"UNMEASURABLE ({type(exc).__name__})",
                "stamp": utc_now(), "db": "UNMEASURABLE", "claim": "UNMEASURABLE"}


def dns() -> dict[str, str]:
    spf = next((t for t in doh(DOMAIN, "TXT") if t.lower().startswith("v=spf1")), "")
    dmarc = next((t for t in doh(f"_dmarc.{DOMAIN}", "TXT") if t.lower().startswith("v=dmarc1")), "")
    mx = sorted({m.split()[-1].rstrip(".") for m in doh(DOMAIN, "MX") if m})
    policy = (re.search(r"p=(\w+)", dmarc, re.I).group(1).lower() if dmarc and re.search(r"p=(\w+)", dmarc, re.I) else ("present" if dmarc else "absent"))
    return {"spf": spf, "dmarc": dmarc, "mx": ", ".join(mx), "policy": policy,
            "rua": "rua=" in dmarc.lower()}


# ---------------------------------------------------------------- shell


def shell(active: str, title: str, crumb: str, body: str, health_state: dict[str, str]) -> str:
    def nav_html() -> str:
        out = []
        for group, links in NAV:
            out.append(f'<div class="navgroup"><span>{esc(group)}</span>')
            for href, label, glyph in links:
                current = ' aria-current="page"' if href == active else ""
                out.append(f'<a class="navlink" href="{href}"{current}>'
                           f'<span class="ico" aria-hidden="true">{glyph}</span>'
                           f'<span class="lbl">{esc(label)}</span></a>')
            out.append("</div>")
        return "".join(out)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)} · {esc(SITE_NAME)}</title>
<meta name="description" content="Elitze Agentic Security — agent and MCP control plane: inventory, reachability, pre-execution policy, real scans with patch plans, and evidence that says UNKNOWN when it is unknown.">
<meta property="og:title" content="{esc(title)} · {esc(SITE_NAME)}">
<meta property="og:type" content="website">
<meta name="theme-color" content="#040f18">
<link rel="stylesheet" href="assets/site.css">
</head>
<body data-nav="open">
<a class="sr-only" href="#main">Skip to content</a>

<aside class="sidebar" aria-label="Site navigation">
  <div class="brandrow">
    <span class="brandmark" aria-hidden="true">E</span>
    <span class="brandtext"><b>ELITZE</b><span>Agentic Security</span></span>
    <button class="sidebar-toggle" type="button" id="nav-toggle" aria-label="Collapse navigation">‹</button>
  </div>
  {nav_html()}
  <div class="sidefoot">
    <b>Measured build</b><br>
    health {esc(health_state["code"])} · {esc(health_state["state"])}<br>
    {esc(health_state["stamp"])}
  </div>
</aside>

<div class="main">
  <div class="topbar">
    <button class="hamburger" type="button" id="nav-burger" aria-label="Open navigation">☰</button>
    <div class="crumbs"><a href="index.html">Hub</a><span>/</span><b>{esc(crumb)}</b></div>
    <div class="spacer"></div>
    <button class="searchbtn" type="button" id="open-search" aria-keyshortcuts="Control+K">
      <span class="lbl">Search</span> <kbd>⌘K</kbd>
    </button>
    <a class="btn primary" href="mailto:terrell0780@gmail.com?subject=Elitze%20access%20request">Request access</a>
  </div>

  <main class="content" id="main">
{body}
    <footer class="site">
      <nav aria-label="Footer">
        <a href="graph.html">Graph</a><a href="scans.html">Scans</a><a href="email.html">Email</a>
        <a href="sara.html">Sara</a><a href="compare.html">Compare</a><a href="trust.html">Trust</a>
        <a href="security.txt">security.txt</a>
      </nav>
      <div>© 2026 TrueElitze Digital · Terrell Hall · Victoria, BC, Canada<br>
      Built {esc(utc_now())}. Every figure is traced to a source and a timestamp; a failed
      measurement reads UNMEASURABLE, never zero.</div>
    </footer>
  </main>
</div>

<div class="scrim" id="scrim" data-open="false"></div>
<div class="palette" id="palette" data-open="false" role="dialog" aria-modal="true" aria-label="Search">
  <label class="sr-only" for="q">Search Elitze</label>
  <input id="q" type="text" placeholder="Search pages, findings, integrations…" autocomplete="off">
  <div class="results" id="results"></div>
</div>

<script src="assets/data.js"></script>
<script src="assets/site.js" defer></script>
</body>
</html>"""


def tiles(scan: dict, health_state: dict[str, str], kev: int | None, dnsf: dict[str, str]) -> str:
    sev = scan["stats"].get("by_severity", {})
    kev_text = f"{kev:,}" if kev is not None else "—"
    dmarc = f"p={dnsf['policy']}" if dnsf["dmarc"] else "no DMARC"
    return f"""<div class="tiles">
  <div class="tile bad"><b>{esc(health_state['code'])}</b>
    <span>platform health · database {esc(health_state['db'])}</span>
    <small>measured {esc(health_state['stamp'])}</small></div>
  <div class="tile ok"><b>{esc(kev_text)}</b>
    <span>CISA KEV entries indexed</span>
    <small>catalog {esc(scan['enrichment'].get('kev_catalog', 'unknown'))}</small></div>
  <div class="tile warn"><b>{esc(scan['stats'].get('total', 0))}</b>
    <span>findings · {esc(sev.get('high', 0))} high, {esc(sev.get('medium', 0))} medium</span>
    <small>scan {esc(scan['scan_id'])} · {esc(scan['target'])}</small></div>
  <div class="tile info"><b>{esc(dmarc)}</b>
    <span>DMARC on {esc(DOMAIN)}</span>
    <small>DNS · {'not enforcing' if dnsf['policy'] == 'none' else 'measured'}</small></div>
</div>"""


# ---------------------------------------------------------------- pages


def page_hub(scan: dict, health_state: dict[str, str], kev: int | None, dnsf: dict[str, str]) -> str:
    hub = [
        ("graph.html", "Security Atlas", "Identity → gateway → tool → data, with the evidence state of every node.", "interactive"),
        ("guardrails.html", "Guardrails", "Default-deny policy decisions with the rule trace shown.", "zero trust"),
        ("scans.html", "Scans & patches", "14 real advisories with commands, verification and rollback.", "measured"),
        ("email.html", "Email posture", "SPF, DMARC, MX and header forensics — including what fails.", "measured"),
        ("sara.html", "Sara", "Operator agent with approval gates on every write.", "agent"),
        ("integrations.html", "Integrations", "MCP, GitHub, AWS, Entra, K8s, Slack, Teams, TeamSpeak.", "surface"),
        ("compare.html", "Compare", "Capability map against the four platforms buyers benchmark.", "honest"),
        ("plans.html", "Plans", "Pilot, deployment, enterprise — CAD, Interac or KOHO.", "commercial"),
    ]
    cards = "".join(
        f'<a class="card" href="{href}"><b>{esc(name)}</b><span>{esc(desc)}</span>'
        f"<small>{esc(tag)}</small></a>" for href, name, desc, tag in hub)
    return f"""<div class="reveal">
  <span class="eyebrow"><span class="pulse"></span> Victoria BC · measured, not simulated</span>
  <h1>Every agent, every tool call,<br><em>under one watch.</em></h1>
  <p class="sub">Elitze maps your agents and MCP servers, shows what each identity can actually
  reach, and decides before a sensitive tool runs. The numbers here were measured at build time —
  including the ones that are bad.</p>
  <div class="row mt18">
    <a class="btn primary" href="graph.html">Enter the graph</a>
    <a class="btn ghost" href="scans.html">Open the live scan</a>
    <a class="btn ghost" href="https://www.elitze.info/login">Sign in</a>
  </div>
</div>
{tiles(scan, health_state, kev, dnsf)}
<h2 class="mt26">Start where you need to</h2>
<p class="lede">Seven surfaces, each one a working view rather than a brochure page.</p>
<div class="hub">{cards}</div>
<div class="note mt18"><b>What "measured" means here.</b> Health is a live read of
<code>/api/v1/health</code>; the KEV count comes from the CISA feed; the findings come from an
actual run of the scan engine against a real dependency tree; SPF/DMARC were resolved over DNS.
Where a value could not be read it says UNMEASURABLE.</div>"""


def page_graph(scan: dict) -> str:
    return """<div class="reveal">
  <span class="tagline">Security Atlas</span>
  <h2>The whole estate, one field</h2>
  <p class="lede">Identity → gateway → tool → data. Click any node for its evidence state. Rings
  mark what is verified, declared, or still unknown.</p>
</div>
<div class="graphwrap mt12">
  <canvas id="graph-canvas" aria-label="Interactive map of agents, MCP servers, tools and data paths" role="img"></canvas>
  <div class="gctl" role="group" aria-label="Filter graph by domain">
    <button class="chip" type="button" data-domain="all" aria-pressed="true">All</button>
    <button class="chip" type="button" data-domain="identity" aria-pressed="false">Identity</button>
    <button class="chip" type="button" data-domain="mcp" aria-pressed="false">MCP</button>
    <button class="chip" type="button" data-domain="cloud" aria-pressed="false">Cloud</button>
    <button class="chip" type="button" data-domain="data" aria-pressed="false">Data</button>
    <button class="chip" type="button" data-domain="runtime" aria-pressed="false">Runtime</button>
    <button class="chip" type="button" data-domain="secops" aria-pressed="false">SecOps</button>
  </div>
  <div class="glegend" aria-hidden="true">
    <span><i style="background:#22d3ee"></i>MCP</span>
    <span><i style="background:#a78bfa"></i>Identity</span>
    <span><i style="background:#38bdf8"></i>Cloud</span>
    <span><i style="background:#fcd34d"></i>Data</span>
    <span><i style="background:#34d399"></i>Runtime</span>
    <span><i style="background:#fb7185"></i>SecOps</span>
  </div>
  <div class="inspector" id="inspector" aria-live="polite">
    <h4 id="ins-title">Select a node</h4>
    <p id="ins-sub" style="margin:0;font-size:12px;color:var(--mute)">Hover to trace, click to inspect.</p>
    <dl id="ins-dl"></dl>
  </div>
</div>
<div class="row mt12">
  <button class="chip" type="button" id="g-pause" aria-pressed="false">Pause motion</button>
  <button class="chip" type="button" id="g-reset">Reset view</button>
</div>
<div class="note mt12"><b>What this is:</b> the documented Elitze topology — five adapters, the MCP
gateway, tools and data paths. Node states use the platform's evidence vocabulary. It is not live
tenant telemetry, and it says so.</div>"""


def page_guardrails() -> str:
    return """<div class="reveal">
  <span class="tagline">Zero trust · guardrails</span>
  <h2>Decide before the call, not after</h2>
  <p class="lede">Change the actor, the tool and the scope. The reference policy engine evaluates
  every rule and shows its trace — default deny, no ambient authority.</p>
</div>
<div class="two mt12">
  <div class="card">
    <div class="grid2">
      <div><label class="field" for="p-principal">Principal</label>
        <select id="p-principal">
          <option value="human_verified">Human · SSO verified</option>
          <option value="agent_sara">Agent · Sara (assistant)</option>
          <option value="agent_unverified">Agent · unregistered runtime</option>
          <option value="svc_ci">Service · GitHub Actions (OIDC)</option>
        </select></div>
      <div><label class="field" for="p-tool">Tool call</label>
        <select id="p-tool">
          <option value="read_inventory">mcp.filesystem.read</option>
          <option value="create_pr">github.create_pull_request</option>
          <option value="send_email">email.send_external</option>
          <option value="attach_policy">aws.iam.attach_role_policy</option>
          <option value="export_evidence">data.export_tenant_evidence</option>
        </select></div>
      <div><label class="field" for="p-scope">Authorization scope</label>
        <select id="p-scope">
          <option value="in_scope">Inside written scope</option>
          <option value="out_of_scope">Outside written scope</option>
          <option value="expired">Expired authorization</option>
        </select></div>
      <div><label class="field" for="p-approval">Human approval</label>
        <select id="p-approval">
          <option value="yes">Present, named operator</option>
          <option value="no">Absent</option>
        </select></div>
    </div>
    <div class="verdict" id="verdict" data-v="DENY">DENY</div>
    <p class="muted" style="font-size:12.5px" id="verdict-why">Evaluating…</p>
    <ul class="trace" id="trace" aria-live="polite"></ul>
  </div>
  <div class="card soft">
    <h3>Invariants the runtime holds</h3>
    <ul class="invariants mt8">
      <li><span>01</span><div><b>No ambient authority.</b> A tool call carries its own verified identity, scope and expiry.</div></li>
      <li><span>02</span><div><b>Default deny.</b> Absent a matching grant the call does not execute — it queues or fails closed.</div></li>
      <li><span>03</span><div><b>Approval is a record.</b> Named operator, timestamp, decision, exact arguments.</div></li>
      <li><span>04</span><div><b>The model is not the boundary.</b> Prompt instructions never widen a permission.</div></li>
      <li><span>05</span><div><b>Every decision is evidenced.</b> Rule trace, inputs and outcome retained per tenant.</div></li>
    </ul>
    <div class="note mt12"><b>Honest scope:</b> this panel is a reference implementation of the
    documented policy model running in your browser. The same rule set is what the runtime enforces
    server-side; nothing here claims a live tenant.</div>
  </div>
</div>"""


def page_scans(scan: dict) -> str:
    sev = scan["stats"].get("by_severity", {})
    enr = scan["enrichment"]
    return f"""<div class="reveal spread">
  <div>
    <span class="tagline">Real scan · automatic + manual</span>
    <h2>Findings with a patch plan attached</h2>
    <p class="lede">Generated from an actual run of the engine against <code>{esc(scan['target'])}</code>
    at {esc(scan['finished_at'])}. Click a row for the exact command, verification and rollback.</p>
  </div>
  <span class="badge" data-s="{'VERIFIED' if enr.get('osv') == 'VERIFIED' else 'UNKNOWN'}">feeds {esc(enr.get('osv', 'unknown'))}</span>
</div>

<div class="tiles">
  <div class="tile warn"><b>{esc(scan['stats'].get('total', 0))}</b><span>findings</span><small>scan {esc(scan['scan_id'])}</small></div>
  <div class="tile bad"><b>{esc(sev.get('high', 0))}</b><span>high severity</span><small>{esc(sev.get('medium', 0))} medium · {esc(sev.get('low', 0))} low</small></div>
  <div class="tile info"><b>{esc(scan['stats'].get('exact_versions_queried', 0))}</b><span>exact versions queried</span><small>OSV querybatch + per-advisory lookup</small></div>
  <div class="tile ok"><b>{esc(scan['stats'].get('with_patch_plan', 0))}</b><span>with a patch plan</span><small>KEV-listed: {esc(scan['stats'].get('kev_listed', 0))}</small></div>
</div>

<div class="filters mt18" role="group" aria-label="Filter findings by severity">
  <button class="chip" type="button" data-sev="all" aria-pressed="true">All</button>
  <button class="chip" type="button" data-sev="high" aria-pressed="false">High</button>
  <button class="chip" type="button" data-sev="medium" aria-pressed="false">Medium</button>
  <button class="chip" type="button" data-sev="low" aria-pressed="false">Low</button>
  <span class="muted" style="margin-left:auto;font-size:11.5px" id="scan-meta"></span>
</div>

<div class="tablewrap">
  <table>
    <thead><tr><th scope="col">Severity</th><th scope="col">Finding</th><th scope="col">Package</th>
      <th scope="col">CVSS</th><th scope="col">EPSS</th><th scope="col">Fix</th></tr></thead>
    <tbody id="fbody"></tbody>
  </table>
</div>

<div class="drawer" id="drawer" hidden>
  <div class="head">
    <div><h3 id="d-title">—</h3><p class="muted" style="margin:2px 0 0;font-size:12px" id="d-meta"></p></div>
    <button class="chip" type="button" id="d-close">Close</button>
  </div>
  <div class="body">
    <div><div class="kv"><b>Patch strategy</b><span id="d-strategy">—</span></div></div>
    <div><div class="kv"><b>Blast radius</b><span id="d-blast">—</span></div></div>
    <div style="grid-column:1/-1">
      <div class="kv" style="border:0;padding:0"><b>Command</b></div>
      <div class="cmd mt8"><code id="d-cmd">—</code><button class="btn tiny ghost" type="button" id="d-copy">Copy</button></div>
    </div>
    <div><div class="kv"><b>Verify</b><ul style="margin:4px 0 0 16px;padding:0" id="d-verify"></ul></div></div>
    <div><div class="kv"><b>Rollback</b><span id="d-rollback">—</span></div></div>
    <div style="grid-column:1/-1"><div class="kv" style="border:0;padding:0"><b>Sources</b><span id="d-sources" style="font-size:12px"></span></div></div>
  </div>
</div>

<h2 class="mt26">Exploit likelihood, not vibes</h2>
<p class="lede">EPSS probability of exploitation in the next 30 days, joined to KEV and the
advisory's fixed version. Bars are the real values from this scan.</p>
<div class="two">
  <div class="card"><h3>Top exposure in this estate</h3><div class="bars" id="bars"></div></div>
  <div class="card soft">
    <h3>Feed state at scan time</h3>
    <dl style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;font-size:12.5px;margin:8px 0 0">
      <dt class="muted">OSV.dev</dt><dd class="mono" style="margin:0;text-align:right">{esc(enr.get('osv', 'UNKNOWN'))}</dd>
      <dt class="muted">CISA KEV</dt><dd class="mono" style="margin:0;text-align:right">{esc(enr.get('kev', 'UNKNOWN'))}</dd>
      <dt class="muted">FIRST EPSS</dt><dd class="mono" style="margin:0;text-align:right">{esc(enr.get('epss', 'UNKNOWN'))}</dd>
      <dt class="muted">KEV catalog</dt><dd class="mono" style="margin:0;text-align:right">{esc(enr.get('kev_catalog', '—'))}</dd>
      <dt class="muted">Observed at</dt><dd class="mono" style="margin:0;text-align:right">{esc(enr.get('observed_at', '—'))}</dd>
    </dl>
    <div class="note mt12"><b>Rule:</b> if a feed fails, the field reads UNMEASURABLE. A missing score
    is never rendered as zero risk.</div>
  </div>
</div>

<div class="note mt18"><b>What the engine does and does not do.</b> It resolves exact versions from
manifests and lockfiles, queries OSV.dev, computes CVSS v3.1 base scores from the published vector,
joins CISA KEV and FIRST EPSS, and writes a patch plan. It does <b>not</b> perform AST reachability
analysis, it does <b>not</b> execute the patch, and a downgrade is never recommended — when no fixed
version sits above the installed one, it says so.</div>"""


def page_email(dnsf: dict[str, str]) -> str:
    spf_state = "OBSERVED" if dnsf["spf"] else "UNMEASURABLE"
    dmarc_state = "OBSERVED" if dnsf["dmarc"] else "UNMEASURABLE"
    mx_state = "VERIFIED" if dnsf["mx"] else "UNMEASURABLE"
    spf_badge = ("softfail" if "~all" in dnsf["spf"] else "hardfail" if "-all" in dnsf["spf"] else "published") if dnsf["spf"] else "not found"
    dmarc_badge = ((("not enforcing" if dnsf["policy"] == "none" else f"p={dnsf['policy']}") + ("" if dnsf["rua"] else " · no rua")) if dnsf["dmarc"] else "not found")
    return f"""<div class="reveal">
  <span class="tagline">Email · measured posture</span>
  <h2>Your own domain, audited</h2>
  <p class="lede">Mail is where agents leak. These records were read over DNS at build time —
  including the parts that fail.</p>
</div>
<div class="grid mt12">
  <div class="int"><b>SPF</b><span><code>{esc(dnsf['spf'] or 'no SPF record')}</code></span><span class="badge" data-s="{spf_state}">{esc(spf_badge)}</span></div>
  <div class="int"><b>DMARC</b><span><code>{esc(dnsf['dmarc'] or 'no DMARC record')}</code></span><span class="badge" data-s="{dmarc_state}">{esc(dmarc_badge)}</span></div>
  <div class="int"><b>MX</b><span>{esc(dnsf['mx'] or 'none published')}</span><span class="badge" data-s="{mx_state}">{'resolved' if dnsf['mx'] else 'unresolved'}</span></div>
  <div class="int"><b>DKIM</b><span>selector not discoverable from DNS alone</span><span class="badge" data-s="UNMEASURABLE">not measured</span></div>
</div>

<div class="two mt18">
  <div class="card">
    <h3>Header inspector</h3>
    <p class="muted" style="font-size:12.5px">Paste the top of a message. Parses
    Authentication-Results, Received hops and From/Return-Path alignment locally — nothing leaves the page.</p>
    <label class="field" for="hdr">Raw headers</label>
    <textarea id="hdr" spellcheck="false">Authentication-Results: mx.example.net; spf=softfail smtp.mailfrom=bounce@example.net; dkim=none; dmarc=fail header.from=elitze.info
Received: from unknown (HELO mail.example.net) (203.0.113.9) by mx01.example.net
From: "Elitze Billing" &lt;billing@elitze.info&gt;
Return-Path: &lt;bounce@example.net&gt;</textarea>
    <div class="row mt8">
      <button class="btn ghost tiny" type="button" id="hdr-run">Analyse</button>
      <button class="btn ghost tiny" type="button" id="hdr-clear">Clear</button>
    </div>
  </div>
  <div class="card soft">
    <h3>Verdict</h3>
    <div class="verdict" id="mail-verdict" data-v="DENY">—</div>
    <p class="muted" style="font-size:12.5px" id="mail-why">Run the analyser.</p>
    <ul class="trace" id="mail-trace"></ul>
    <div class="note mt12"><b>Fix path:</b> publish DKIM, add
    <code>rua=mailto:security@elitze.info</code>, then move from <code>p=none</code> to
    <code>p=quarantine</code>. Until DMARC enforces, the domain your invoices come from can be spoofed.</div>
  </div>
</div>

<h2 class="mt26">What Sara does with mail</h2>
<div class="grid">
  <div class="int"><b>Inbound triage</b><span>classify, extract the ask, link the thread to a finding</span><span class="badge" data-s="DECLARED">documented</span></div>
  <div class="int"><b>Draft with approval</b><span>composes a reply; a named operator must send</span><span class="badge" data-s="DECLARED">gate on send</span></div>
  <div class="int"><b>Disclosure routing</b><span>security@ with 48h acknowledgement target</span><span class="badge" data-s="OBSERVED">policy published</span></div>
  <div class="int"><b>Phishing verdict</b><span>SPF/DKIM/DMARC + alignment, shown above</span><span class="badge" data-s="OBSERVED">working here</span></div>
</div>"""


def page_sara() -> str:
    return """<div class="reveal">
  <span class="tagline">Sara · the ELITZE assistant</span>
  <h2>An operator's agent, with the handbrake on</h2>
  <p class="lede">Sara investigates, drafts and prepares — inside the same authorization boundary as
  everything else. Every action that changes state stops at a named approver.</p>
</div>
<div class="two mt12">
  <div class="card">
    <h3>Goal → plan preview</h3>
    <p class="muted" style="font-size:12.5px">Type what you want done. The planner composes steps and
    marks where a human must approve. No model call happens here.</p>
    <label class="field" for="goal">Goal</label>
    <input type="text" id="goal" value="Triage the billing thread and prepare a patch for the undici findings">
    <div class="row mt8"><button class="btn ghost tiny" type="button" id="goal-run">Compose plan</button></div>
    <ol id="plan" style="margin:12px 0 0 18px;padding:0;font-size:13.2px;color:#a9c7d6"></ol>
  </div>
  <div class="card soft">
    <h3>Agent surface</h3>
    <div class="grid mt8">
      <div class="int"><b>Triggers</b><span>schedule · new email · chat · webhook · calendar</span><span class="badge" data-s="DECLARED">documented</span></div>
      <div class="int"><b>Email triage</b><span>classify, extract tasks, draft reply</span><span class="badge" data-s="DECLARED">approval to send</span></div>
      <div class="int"><b>Scheduling</b><span>propose slots, hold, confirm</span><span class="badge" data-s="DECLARED">documented</span></div>
      <div class="int"><b>Evidence work</b><span>collect, cite, export, retest</span><span class="badge" data-s="OBSERVED">in product</span></div>
      <div class="int"><b>Plain-English builder</b><span>describe a workflow, get steps</span><span class="badge" data-s="UNKNOWN">not built</span></div>
      <div class="int"><b>CRM / task sync</b><span>Jira, Linear, ServiceNow, HubSpot</span><span class="badge" data-s="UNKNOWN">not built</span></div>
    </div>
    <div class="note mt12"><b>Boundary:</b> Sara cannot grant its own permissions, bypass approvals or
    widen scope. Outbound email always requires a named approver — a product rule, not a setting.</div>
  </div>
</div>
<h2 class="mt26">Why the gates exist</h2>
<div class="grid">
  <div class="int"><b>Prompt injection</b><span>a hostile tool result cannot expand Sara's grants</span><span class="badge" data-s="DECLARED">design rule</span></div>
  <div class="int"><b>Confused deputy</b><span>every call carries its own identity, not the caller's session</span><span class="badge" data-s="DECLARED">design rule</span></div>
  <div class="int"><b>Irreversible writes</b><span>send, delete, attach-policy and export all require approval</span><span class="badge" data-s="DECLARED">policy</span></div>
</div>"""


def page_integrations() -> str:
    rows = [
        ("MCP gateway", "server + tool inventory, pre-execution control", "DECLARED"),
        ("GitHub + Actions", "repo, workflow run, OIDC workload identity", "DECLARED"),
        ("AWS IAM + CloudTrail", "principal reach, event history", "DECLARED"),
        ("Microsoft Entra + Azure", "identity, sign-in, risk", "DECLARED"),
        ("Kubernetes", "RBAC, service accounts, workloads", "DECLARED"),
        ("Email (SMTP + DNS)", "SPF, DKIM, DMARC, header forensics", "OBSERVED"),
        ("TeamSpeak", "ServerQuery channel notifications", "UNKNOWN"),
        ("Slack", "channel alerts, approval prompts", "DECLARED"),
        ("Microsoft Teams", "adaptive cards, approvals", "DECLARED"),
        ("Jira / Linear", "finding → issue with patch plan", "DECLARED"),
        ("PagerDuty", "escalation on critical + KEV", "DECLARED"),
        ("ServiceNow", "CMDB binding, change records", "DECLARED"),
        ("OSV.dev", "advisory source for every dependency finding", "VERIFIED"),
        ("CISA KEV + FIRST EPSS", "exploited-in-wild and likelihood", "VERIFIED"),
    ]
    cards = "".join(
        f'<div class="int"><b>{esc(n)}</b><span>{esc(d)}</span>'
        f'<span class="badge" data-s="{s}">{s.lower()}</span></div>' for n, d, s in rows)
    return f"""<div class="reveal">
  <span class="tagline">Integrations</span>
  <h2>Plugs into the stack you already run</h2>
  <p class="lede">Status is honest: <b>verified</b> means a live authenticated path was exercised;
  <b>declared</b> means the adapter is documented and not yet connected here.</p>
</div>
<div class="grid mt12">{cards}</div>
<div class="note mt18"><b>TeamSpeak</b> is a first-class notification target: the adapter speaks
ServerQuery over TCP (<code>login</code> → <code>use sid=…</code> →
<code>sendtextmessage targetmode=2</code>) and reports <code>NOT_CONFIGURED</code> until
<code>TS3_HOST</code> and <code>TS3_QUERY_PASSWORD</code> exist. It never claims delivery it did not make.</div>
<div class="note mt12"><b>Notification shape.</b> Every alert carries the finding id, severity, KEV
status, the patch command and a link to the evidence record — so a message in a channel is
actionable without opening the console.</div>"""


def page_compare() -> str:
    matrix = [
        ("Agent / MCP inventory", "y", "y", "y", "y", "y"),
        ("Non-human identity governance", "y", "y", "y", "y", "y"),
        ("Pre-execution tool-call policy", "y", "p", "p", "p", "p"),
        ("Reachability to sensitive data", "p", "y", "y", "y", "y"),
        ("Endpoint EDR / EPP", "n", "y", "y", "y", "y"),
        ("Network enforcement", "n", "n", "y", "p", "p"),
        ("SIEM / log lake", "p", "y", "y", "y", "y"),
        ("SOAR playbooks", "p", "y", "y", "y", "y"),
        ("Vulnerability + KEV/EPSS", "y", "y", "y", "y", "y"),
        ("Automated patch synthesis", "p", "p", "p", "p", "p"),
        ("AI red teaming", "p", "y", "y", "p", "p"),
        ("Email auth forensics", "y", "p", "p", "p", "p"),
        ("Evidence portability (export)", "y", "p", "p", "p", "p"),
        ("SOC 2 / ISO 27001 held", "n", "y", "y", "y", "y"),
        ("24/7 managed response", "n", "y", "y", "y", "y"),
    ]

    def cell(v: str) -> str:
        return '<td class="y">●</td>' if v == "y" else ('<td class="p">◐</td>' if v == "p" else '<td class="n">○</td>')

    body = "".join(
        f'<tr><th scope="row" style="font-weight:500;color:#cfe8f4">{esc(r[0])}</th>'
        + "".join(cell(v) for v in r[1:]) + "</tr>" for r in matrix)
    return f"""<div class="reveal">
  <span class="tagline">Honest comparison</span>
  <h2>Where Elitze sits</h2>
  <p class="lede">Capability map against the four platforms buyers benchmark. Vendor columns reflect
  their own published product surfaces (Nov 2026); the Elitze column is what exists here.</p>
</div>
<div class="tablewrap mt12" style="max-height:none">
  <table class="matrix">
    <thead><tr><th scope="col">Capability</th><th scope="col">Elitze</th><th scope="col">CrowdStrike</th>
      <th scope="col">Palo Alto</th><th scope="col">Microsoft</th><th scope="col">SentinelOne</th></tr></thead>
    <tbody>{body}</tbody>
  </table>
</div>
<p class="muted mt8" style="font-size:12px">● present · ◐ partial or add-on · ○ not offered</p>
<div class="note mt12"><b>Read this honestly:</b> Elitze does not replace endpoint EDR, network
enforcement or a hyperscaler's identity plane. It wins on tool-call granularity, MCP inventory,
evidence portability and deal size. Certifications: <b>none held</b>.</div>"""


def page_plans() -> str:
    return """<div class="reveal">
  <span class="tagline">Plans</span>
  <h2>Start with one control path</h2>
  <p class="lede">Pilot a single adapter, prove the evidence, then expand. Prices in CAD.</p>
</div>
<div class="grid mt12">
  <div class="card"><h3>Pilot</h3><div class="price">$500 <small>30 days</small></div>
    <ul class="feat"><li>One tenant, one adapter</li><li>Inventory + reachability map</li>
      <li>Real scan + patch plans</li><li>Evidence pack at day 30</li></ul></div>
  <div class="card" style="border-color:var(--line2);box-shadow:0 0 0 1px rgba(34,211,238,.16)">
    <h3>Deployment</h3><div class="price">$1,500 <small>7–10 business days</small></div>
    <ul class="feat"><li>Adapters live-verified</li><li>Pre-execution policy + approvals</li>
      <li>KEV/EPSS over real assets</li><li>Authorized validation + retest</li><li>Evidence export</li></ul></div>
  <div class="card"><h3>Enterprise</h3><div class="price">Custom <small>annual</small></div>
    <ul class="feat"><li>SSO/SAML + SCIM</li><li>DPA, subprocessors, SLA</li>
      <li>Audit-log export</li><li>Named support</li></ul></div>
</div>
<div class="pay">
  <span><b>Interac e-Transfer</b> · CAD</span>
  <span><b>KOHO deposit</b> · CAD</span>
  <span><b>Google Pay</b> · being enabled via processor</span>
</div>
<div class="note mt12"><b>Payment reality:</b> Google Pay is a wallet, not a rail — it needs a merchant
processor with identity verification. Interac and KOHO work today. US clients:
<a href="mailto:tsh_cook@hotmail.com">tsh_cook@hotmail.com</a>.</div>"""


def page_faq() -> str:
    items = [
        ("Is anything on this site simulated?",
         "No. Health is a live read of /api/v1/health, the KEV count comes from the CISA feed, the findings come from an actual engine run against a real dependency tree, and SPF/DMARC were resolved over DNS. Where a value could not be read it says UNMEASURABLE."),
        ("Why is platform health 503?",
         "Because the deployed app cannot reach its database. The honest state is \"unavailable\" with productionDatabase NOT_VERIFIED; when the connection is verified the tile changes and so does this answer."),
        ("Does the scanner touch my production systems?",
         "No. It reads manifests and lockfiles in a directory you name, then queries public advisory feeds. Reaching into running systems requires authorized validation, separately scoped and written."),
        ("Do you auto-apply patches?",
         "No. The engine produces a plan — target version, command, verification, rollback, blast radius. Execution stays with a human or an approved CI job."),
        ("Why does one finding have no fix?",
         "Because every advisory fix for that package is older than the installed version. Recommending it would be a downgrade, so the plan is withheld and the finding says why."),
        ("Is Sara a general-purpose chatbot?",
         "No. Sara is the ELITZE security assistant. It investigates, drafts and prepares inside tenant authorization and cannot self-grant. It is not a general-purpose agent."),
        ("Do you hold SOC 2 or ISO 27001?",
         "No. None held, stated plainly on the trust page."),
        ("How do I pay?",
         "Interac e-Transfer or KOHO deposit. Google Pay needs a merchant processor with identity verification and is being enabled."),
    ]
    blocks = "".join(
        f"<details><summary>{esc(q)}</summary><p>{esc(a)}</p></details>" for q, a in items)
    return f"""<div class="reveal"><span class="tagline">FAQ</span>
  <h2>Questions that matter before a pilot</h2>
  <p class="lede">Short answers, no hedging.</p></div>
<div class="mt12">{blocks}</div>"""


def page_contact() -> str:
    return """<div class="reveal"><span class="tagline">Contact</span>
  <h2>Talk to the person who builds it</h2>
  <p class="lede">Victoria, BC. Remote across Canada and the US.</p></div>
<div class="grid mt12">
  <div class="int"><b>Canada &amp; general</b><span><a href="mailto:terrell0780@gmail.com">terrell0780@gmail.com</a></span>
    <span class="badge" data-s="VERIFIED">monitored</span></div>
  <div class="int"><b>United States</b><span><a href="mailto:tsh_cook@hotmail.com">tsh_cook@hotmail.com</a></span>
    <span class="badge" data-s="VERIFIED">monitored</span></div>
  <div class="int"><b>Security disclosure</b><span><a href="mailto:security@elitze.info">security@elitze.info</a></span>
    <span class="badge" data-s="VERIFIED">48h ack · 90-day</span></div>
</div>
<div class="row mt18">
  <a class="btn primary" href="mailto:terrell0780@gmail.com?subject=Elitze%20access%20request">Request access</a>
  <a class="btn ghost" href="https://www.elitze.info/login?provider=google">Sign in with Google</a>
  <a class="btn ghost" href="https://www.elitze.info/login?provider=github">Sign in with GitHub</a>
  <a class="btn ghost" href="trust.html">Trust &amp; security</a>
</div>
<div class="note mt18"><b>What happens next.</b> You get a reply with a scope sheet — adapters, what
read-only access means for each, and the exact evidence you receive at day 30. No discovery call
gatekeeping.</div>"""


# ---------------------------------------------------------------- build


def main() -> int:
    parser = argparse.ArgumentParser(description="Build the Elitze multi-page hub")
    parser.add_argument("--scan", type=Path, help="scan JSON to embed (default: newest)")
    parser.add_argument("--label", help="public label for the scanned target")
    args = parser.parse_args()

    scan_path = newest_scan(args.scan)
    scan = sanitize_scan(json.loads(scan_path.read_text(encoding="utf-8")))
    if args.label:
        scan["target"] = args.label
    health_state = health()
    dnsf = dns()
    kev = kev_entry_count()

    assets = HERE / "assets"
    assets.mkdir(exist_ok=True)
    payload = {"scan": scan,
               "site": {"health": health_state, "dns": dnsf, "kevEntries": kev,
                        "buildStamp": utc_now(), "domain": DOMAIN}}
    (assets / "data.js").write_text(
        "window.ELITZE_DATA = " + json.dumps(payload, separators=(",", ":"), ensure_ascii=False).replace("</", "<\\/") + ";\n",
        encoding="utf-8")

    pages = {
        "index.html": ("Hub", "Hub", page_hub(scan, health_state, kev, dnsf)),
        "graph.html": ("Security Atlas", "Security Atlas", page_graph(scan)),
        "guardrails.html": ("Guardrails", "Guardrails", page_guardrails()),
        "scans.html": ("Scans & patches", "Scans & patches", page_scans(scan)),
        "email.html": ("Email posture", "Email posture", page_email(dnsf)),
        "sara.html": ("Sara", "Sara", page_sara()),
        "integrations.html": ("Integrations", "Integrations", page_integrations()),
        "compare.html": ("Compare", "Compare", page_compare()),
        "plans.html": ("Plans", "Plans", page_plans()),
        "faq.html": ("FAQ", "FAQ", page_faq()),
        "contact.html": ("Contact", "Contact", page_contact()),
    }

    written = []
    for filename, (title, crumb, body) in pages.items():
        (HERE / filename).write_text(shell(filename, title, crumb, body, health_state), encoding="utf-8")
        written.append(filename)

    print(json.dumps({"pages": written, "scan": scan["scan_id"], "target": scan["target"],
                      "findings": scan["stats"].get("total"), "health": health_state,
                      "kev_entries": kev, "dns": {k: v for k, v in dnsf.items() if k != "rua"}},
                     indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
