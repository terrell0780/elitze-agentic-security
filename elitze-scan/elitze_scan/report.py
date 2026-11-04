"""Report rendering: JSON for machines, HTML for a human reviewer."""
from __future__ import annotations

import html
import json
from pathlib import Path

from .models import ScanResult

_SEV_COLOR = {"critical": "#f87171", "high": "#fb923c", "medium": "#fbbf24",
              "low": "#38bdf8", "unknown": "#94a3b8"}


def write_json(result: ScanResult, out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"scan-{result.scan_id}.json"
    path.write_text(json.dumps(result.to_dict(), indent=2), encoding="utf-8")
    return path


def _esc(value: object) -> str:
    return html.escape("" if value is None else str(value))


def _finding_block(f) -> str:
    colour = _SEV_COLOR.get(f.severity, "#94a3b8")
    ids = " · ".join(f"{k.upper()} {v}" for k, v in f.ids.items())
    metrics = []
    if f.cvss_score is not None:
        metrics.append(f"CVSS {f.cvss_score:.1f} ({f.cvss_vector})")
    if f.epss is not None:
        metrics.append(f"EPSS {f.epss:.3f}")
    if f.kev is True:
        metrics.append("CISA KEV")
    patch = f.patch
    patch_rows = ""
    if patch:
        parts = [f"<div><b>Strategy</b> {_esc(patch.strategy)}</div>"]
        if patch.target_version:
            parts.append(f"<div><b>Target</b> {_esc(patch.target_version)}</div>")
        if patch.command:
            parts.append(f"<div><b>Command</b> <code>{_esc(patch.command)}</code></div>")
        if patch.files:
            parts.append(f"<div><b>Files</b> {_esc(', '.join(patch.files))}</div>")
        if patch.blast_radius:
            parts.append(f"<div><b>Blast radius</b> {_esc(patch.blast_radius)}</div>")
        if patch.verification:
            parts.append("<div><b>Verify</b><ul>" +
                         "".join(f"<li>{_esc(v)}</li>" for v in patch.verification) + "</ul></div>")
        if patch.rollback:
            parts.append(f"<div><b>Rollback</b> {_esc(patch.rollback)}</div>")
        if patch.notes:
            parts.append("<div><b>Notes</b><ul>" +
                         "".join(f"<li>{_esc(n)}</li>" for n in patch.notes) + "</ul></div>")
        patch_rows = f"<details><summary>Patch plan</summary><div class='patch'>{''.join(parts)}</div></details>"

    sources = "".join(
        f"<li>{_esc(s.get('name'))} — <a href='{_esc(s.get('url'))}'>{_esc(s.get('url'))}</a>"
        f" <span class='muted'>{_esc(s.get('observed_at'))}</span></li>"
        for s in f.sources)

    return f"""
    <article class="finding" style="border-left-color:{colour}">
      <header>
        <span class="sev" style="color:{colour}">{_esc(f.severity.upper())}</span>
        <h3>{_esc(f.title)}</h3>
        <span class="tag">{_esc(f.kind)} · {_esc(f.evidence)}</span>
      </header>
      <p class="loc"><code>{_esc(f.location or f.asset)}</code></p>
      <p>{_esc(f.detail)}</p>
      {f'<p class="muted">{_esc(ids)}</p>' if ids else ''}
      {f'<p class="metrics">{_esc(" · ".join(metrics))}</p>' if metrics else ''}
      {patch_rows}
      <details><summary>Sources ({len(f.sources)})</summary><ul class="src">{sources}</ul></details>
    </article>"""


def render_html(result: ScanResult) -> str:
    by_sev = result.stats.get("by_severity", {})
    chips = "".join(
        f"<span class='chip' style='border-color:{_SEV_COLOR[k]};color:{_SEV_COLOR[k]}'>"
        f"{k} {by_sev.get(k, 0)}</span>"
        for k in ("critical", "high", "medium", "low", "unknown"))
    enrichment = "".join(f"<tr><td>{_esc(k)}</td><td>{_esc(v)}</td></tr>"
                         for k, v in sorted(result.enrichment.items()))
    findings = "".join(_finding_block(f) for f in result.findings) or \
        "<p class='muted'>No findings produced by the enabled checks.</p>"

    return f"""<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Scan {_esc(result.scan_id)} — {_esc(result.target)}</title>
<style>
 :root{{color-scheme:dark}}
 body{{margin:0;background:#04121c;color:#e8f6ff;font:15px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}}
 .wrap{{max-width:1040px;margin:0 auto;padding:32px 20px 64px}}
 h1{{font-size:26px;margin:0 0 4px;letter-spacing:-.3px}}
 h2{{font-size:19px;margin:34px 0 10px}}
 h3{{font-size:15.5px;margin:0}}
 .muted{{color:#8fb3c7}}
 a{{color:#a5f3fc}}
 code{{font:12.5px ui-monospace,Menlo,monospace;background:#07283a;color:#fcd34d;padding:1px 5px;border-radius:5px;word-break:break-word}}
 .top{{border:1px solid #12384f;border-radius:14px;padding:18px;background:linear-gradient(180deg,#09324533,#06243799)}}
 .meta{{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;margin-top:12px;font-size:13px}}
 .meta div{{border-bottom:1px dashed #12384f;padding-bottom:6px;display:flex;justify-content:space-between;gap:10px}}
 .meta b{{color:#8fb3c7;font-weight:500}}
 .chips{{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 4px}}
 .chip{{border:1px solid;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.04em}}
 .finding{{border:1px solid #12384f;border-left-width:3px;border-radius:12px;padding:14px 16px;margin:10px 0;background:#07283880}}
 .finding header{{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}}
 .sev{{font-size:11.5px;font-weight:700;letter-spacing:.06em}}
 .tag{{font-size:11px;color:#8fb3c7;border:1px solid #17506b;border-radius:999px;padding:2px 8px}}
 .loc{{margin:6px 0 4px}}
 .metrics{{font-size:12.5px;color:#a5f3fc}}
 details{{margin-top:8px}} summary{{cursor:pointer;color:#a5f3fc;font-size:13.5px}}
 .patch div{{margin:4px 0;font-size:13.5px}} .patch ul,.src{{margin:4px 0 0 18px;padding:0}}
 table{{width:100%;border-collapse:collapse;font-size:13px;margin-top:6px}}
 td,th{{text-align:left;padding:6px 8px;border-bottom:1px solid #12384f;color:#a9c7d6}}
 th{{color:#e8f6ff}}
 footer{{margin-top:40px;font-size:12px;color:#6f93a8}}
</style></head><body><div class="wrap">
 <div class="top">
  <h1>Elitze scan report</h1>
  <p class="muted">Target <code>{_esc(result.target)}</code> · engine v{_esc(result.tool_version)}</p>
  <div class="chips">{chips}</div>
  <div class="meta">
   <div><b>Scan ID</b><span>{_esc(result.scan_id)}</span></div>
   <div><b>Started</b><span>{_esc(result.started_at)}</span></div>
   <div><b>Finished</b><span>{_esc(result.finished_at)}</span></div>
   <div><b>Files inspected</b><span>{_esc(result.stats.get('files_scanned'))}</span></div>
   <div><b>Exact versions queried</b><span>{_esc(result.stats.get('exact_versions_queried'))}</span></div>
   <div><b>Unpinned packages</b><span>{_esc(result.stats.get('unpinned_packages'))}</span></div>
   <div><b>KEV-listed</b><span>{_esc(result.stats.get('kev_listed'))}</span></div>
   <div><b>With patch plan</b><span>{_esc(result.stats.get('with_patch_plan'))}</span></div>
  </div>
 </div>
 <h2>Enrichment state</h2>
 <table><thead><tr><th>Feed</th><th>State</th></tr></thead><tbody>{enrichment}</tbody></table>
 {f"<h2>Notes</h2><ul>{''.join(f'<li>{_esc(n)}</li>' for n in result.notes)}</ul>" if result.notes else ""}
 <h2>Findings ({len(result.findings)})</h2>
 {findings}
 <footer>
  Generated by elitze-scan {_esc(result.tool_version)} at {_esc(result.finished_at)}.
  Scores come from OSV.dev advisories, CISA KEV and FIRST EPSS at scan time; a missing feed is
  reported as UNMEASURABLE, never as clean. Reachability is not assessed by this engine.
 </footer>
</div></body></html>"""


def write_html(result: ScanResult, out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"scan-{result.scan_id}.html"
    path.write_text(render_html(result), encoding="utf-8")
    return path
