"""HTTP surface for the scan engine.

File-backed store. `database` reports NOT_CONFIGURED until a real Postgres connection is
verified — the same rule the product UI applies.
"""
from __future__ import annotations

import json
import os
from hashlib import sha256
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query, Request, UploadFile
from fastapi.responses import HTMLResponse, JSONResponse

from .engine import run_scan
from .models import TOOL_VERSION, utc_now
from .report import render_html, write_html, write_json
from .teamspeak import TeamSpeakConfig, TeamSpeakNotifier

DATA = Path(os.environ.get("ELITZE_DATA_DIR", Path(__file__).resolve().parent.parent / "data"))
SCANS = DATA / "scans"
UPLOADS = DATA / "uploads"
SCAN_ROOT = Path(os.environ.get("ELITZE_SCAN_ROOT", Path.cwd())).resolve()
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
ALLOWED_SUFFIXES = {".json", ".sarif", ".csv", ".txt", ".log", ".md", ".xml", ".yaml", ".yml",
                    ".cdx", ".spdx"}

app = FastAPI(title="Elitze scan service", version=TOOL_VERSION,
              description="Authorized scanning, patch planning and evidence intake.")


def _ensure() -> None:
    for directory in (SCANS, UPLOADS):
        directory.mkdir(parents=True, exist_ok=True)


def _resolve_target(relative: str) -> Path:
    candidate = (SCAN_ROOT / relative).resolve()
    if candidate != SCAN_ROOT and SCAN_ROOT not in candidate.parents:
        raise HTTPException(status_code=400, detail="target outside the configured scan root")
    if not candidate.is_dir():
        raise HTTPException(status_code=404, detail="target directory not found")
    return candidate


@app.get("/api/v1/health")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "service": "elitze-scan",
        "version": TOOL_VERSION,
        "checked_at": utc_now(),
        "dependencies": {
            "database": "NOT_CONFIGURED",
            "store": "file",
            "osv": "configured (api.osv.dev)",
            "kev": "configured (cisa.gov feed)",
            "epss": "configured (api.first.org)",
            "teamspeak": "configured" if TeamSpeakConfig.from_env() else "NOT_CONFIGURED",
        },
        "scan_root": str(SCAN_ROOT),
    }


@app.post("/api/v1/scans")
def create_scan(payload: dict[str, Any]) -> dict[str, Any]:
    _ensure()
    target_rel = str(payload.get("target", "."))
    enrich = bool(payload.get("enrich", True))
    target = _resolve_target(target_rel)
    result = run_scan(target=target, cache_dir=DATA / "cache", enrich=enrich)
    write_json(result, SCANS)
    write_html(result, SCANS)
    if payload.get("notify") == "teamspeak":
        summary = _summary_line(result)
        result.notes.append("teamspeak: " + str(_notify(summary)))
    return {"scan_id": result.scan_id, "target": result.target,
            "stats": result.stats, "enrichment": result.enrichment}


@app.get("/api/v1/scans")
def list_scans(limit: int = Query(20, ge=1, le=200)) -> list[dict[str, Any]]:
    _ensure()
    rows: list[dict[str, Any]] = []
    for path in sorted(SCANS.glob("scan-*.json"), key=lambda p: p.stat().st_mtime, reverse=True)[:limit]:
        data = json.loads(path.read_text(encoding="utf-8"))
        rows.append({"scan_id": data["scan_id"], "target": data["target"],
                     "finished_at": data["finished_at"], "stats": data["stats"]})
    return rows


@app.get("/api/v1/scans/{scan_id}")
def get_scan(scan_id: str) -> dict[str, Any]:
    path = SCANS / f"scan-{_safe_id(scan_id)}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="scan not found")
    return json.loads(path.read_text(encoding="utf-8"))


@app.get("/api/v1/scans/{scan_id}/findings")
def get_findings(scan_id: str, severity: str | None = None) -> list[dict[str, Any]]:
    data = get_scan(scan_id)
    findings = data.get("findings", [])
    if severity:
        findings = [f for f in findings if f["severity"] == severity.lower()]
    return findings


@app.get("/api/v1/scans/{scan_id}/patch/{finding_id}")
def get_patch(scan_id: str, finding_id: str) -> dict[str, Any]:
    for finding in get_scan(scan_id).get("findings", []):
        if finding["id"] == finding_id:
            if not finding.get("patch"):
                raise HTTPException(status_code=404, detail="no patch plan for this finding")
            return {"finding_id": finding_id, "title": finding["title"], "patch": finding["patch"]}
    raise HTTPException(status_code=404, detail="finding not found")


@app.post("/api/v1/uploads")
async def upload(request: Request) -> dict[str, Any]:
    """Multipart or raw-body upload. Content-addressed by SHA-256, suffix allowlisted."""
    _ensure()
    body = await request.body()
    filename = request.query_params.get("name") or _filename_from_headers(request)
    if not filename:
        raise HTTPException(status_code=400, detail="filename required (query ?name= or multipart)")

    raw = body
    content_type = request.headers.get("content-type", "")
    if content_type.startswith("multipart/form-data"):
        form = await request.form()
        uploaded = next((v for v in form.values() if hasattr(v, "filename") and v.filename), None)
        if uploaded is None:
            raise HTTPException(status_code=400, detail="multipart body has no file part")
        raw = await uploaded.read()  # type: ignore[union-attr]
        filename = uploaded.filename  # type: ignore[union-attr]

    suffix = Path(filename).suffix.lower()
    if suffix not in ALLOWED_SUFFIXES:
        raise HTTPException(status_code=415,
                            detail=f"suffix '{suffix}' not accepted; allowed: {sorted(ALLOWED_SUFFIXES)}")
    if not raw:
        raise HTTPException(status_code=400, detail="empty artifact")
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="artifact exceeds 10 MiB")

    digest = sha256(raw).hexdigest()
    destination = UPLOADS / f"{digest}{suffix}"
    if not destination.exists():
        destination.write_bytes(raw)

    index_path = UPLOADS / "index.json"
    index = json.loads(index_path.read_text(encoding="utf-8")) if index_path.exists() else []
    record = {"artifact_id": digest[:16], "sha256": digest, "name": Path(filename).name,
              "bytes": len(raw), "suffix": suffix, "uploaded_at": utc_now(),
              "stored_at": destination.name}
    if not any(r["sha256"] == digest for r in index):
        index.append(record)
        index_path.write_text(json.dumps(index, indent=2), encoding="utf-8")
    return record


@app.get("/api/v1/uploads")
def list_uploads() -> list[dict[str, Any]]:
    index_path = UPLOADS / "index.json"
    return json.loads(index_path.read_text(encoding="utf-8")) if index_path.exists() else []


@app.post("/api/v1/manual-findings")
def preview_manual(payload: dict[str, Any]) -> dict[str, Any]:
    """Validate manual findings and echo what would be merged. Nothing is persisted."""
    from .manual import ManualFindingError, load_manual

    _ensure()
    staging = DATA / "manual"
    staging.mkdir(parents=True, exist_ok=True)
    path = staging / f"manual-{sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:12]}.json"
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    try:
        findings = load_manual(path)
    except ManualFindingError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return {"accepted": len(findings), "staged_at": path.name,
            "findings": [{"title": f.title, "severity": f.severity, "asset": f.asset}
                         for f in findings]}


@app.post("/api/v1/notify/teamspeak")
def notify_teamspeak(payload: dict[str, Any]) -> dict[str, Any]:
    message = str(payload.get("message", "")).strip()
    if not message:
        raise HTTPException(status_code=422, detail="message required")
    return _notify(message)


@app.get("/report/{scan_id}", response_class=HTMLResponse)
def report(scan_id: str) -> HTMLResponse:
    path = SCANS / f"scan-{_safe_id(scan_id)}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="scan not found")
    from .models import ScanResult
    from .models import Finding, PatchPlan

    data = json.loads(path.read_text(encoding="utf-8"))
    result = ScanResult(target=data["target"], scan_id=data["scan_id"],
                        started_at=data["started_at"], finished_at=data["finished_at"],
                        tool_version=data["tool_version"], notes=data.get("notes", []),
                        enrichment=data.get("enrichment", {}), stats=data.get("stats", {}))
    for raw in data.get("findings", []):
        patch = raw.pop("patch", None)
        finding = Finding(**raw)
        if patch:
            finding.patch = PatchPlan(**patch)
        result.findings.append(finding)
    return HTMLResponse(render_html(result))


@app.exception_handler(ValueError)
def value_error_handler(request: Request, exc: ValueError) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": str(exc)})


def _safe_id(scan_id: str) -> str:
    if not scan_id.replace("-", "").isalnum():
        raise HTTPException(status_code=400, detail="invalid scan id")
    return scan_id


def _filename_from_headers(request: Request) -> str | None:
    return request.headers.get("x-filename")


def _summary_line(result) -> str:
    sev = result.stats.get("by_severity", {})
    return (f"Elitze scan {result.scan_id}: "
            f"{sev.get('critical', 0)} critical, {sev.get('high', 0)} high, "
            f"{result.stats.get('kev_listed', 0)} KEV-listed, "
            f"{result.stats.get('with_patch_plan', 0)} patch plans")


def _notify(message: str) -> dict[str, Any]:
    return TeamSpeakNotifier(TeamSpeakConfig.from_env()).send(message)
