import io
from hashlib import sha256
from pathlib import Path

from fastapi.testclient import TestClient

from elitze_scan.api import app

client = TestClient(app)
ROOT = Path(__import__("os").environ["ELITZE_SCAN_ROOT"])


def test_health_reports_each_dependency_honestly():
    body = client.get("/api/v1/health").json()
    assert body["ok"] is True
    assert body["dependencies"]["database"] == "NOT_CONFIGURED"
    assert body["dependencies"]["store"] == "file"
    assert "osv" in body["dependencies"]


def test_upload_is_content_addressed():
    payload = b'{"sbom": "example"}'
    response = client.post("/api/v1/uploads?name=sbom.json", content=payload)
    assert response.status_code == 200
    record = response.json()
    assert record["sha256"] == sha256(payload).hexdigest()
    assert record["bytes"] == len(payload)
    listed = client.get("/api/v1/uploads").json()
    assert any(row["sha256"] == record["sha256"] for row in listed)


def test_upload_rejects_disallowed_suffix():
    assert client.post("/api/v1/uploads?name=payload.exe", content=b"MZ").status_code == 415


def test_upload_rejects_empty_body():
    assert client.post("/api/v1/uploads?name=empty.json", content=b"").status_code == 400


def test_scan_roundtrip_and_report():
    response = client.post("/api/v1/scans", json={"target": "sample", "enrich": False})
    assert response.status_code == 200
    scan_id = response.json()["scan_id"]

    findings = client.get(f"/api/v1/scans/{scan_id}/findings").json()
    assert findings, "sample target must produce findings"

    report = client.get(f"/report/{scan_id}")
    assert report.status_code == 200
    assert "Elitze scan report" in report.text
    assert "UNMEASURABLE" not in report.text or "skipped" in report.text

    patch_target = next((f for f in findings if f.get("patch")), None)
    assert patch_target is not None
    patch = client.get(f"/api/v1/scans/{scan_id}/patch/{patch_target['id']}").json()
    assert patch["patch"]["strategy"]


def test_scan_rejects_path_traversal():
    response = client.post("/api/v1/scans", json={"target": "../../etc", "enrich": False})
    assert response.status_code == 400


def test_manual_findings_validation_over_http():
    good = {"findings": [{
        "title": "MCP server bound to 0.0.0.0", "asset": "mcp/server.yaml", "severity": "medium",
        "detail": "gateway listens on all interfaces", "remediation": "bind to 127.0.0.1",
        "discovered_by": "terrell"}]}
    assert client.post("/api/v1/manual-findings", json=good).json()["accepted"] == 1

    bad = {"findings": [{"title": "x"}]}
    assert client.post("/api/v1/manual-findings", json=bad).status_code == 422


def test_teamspeak_without_configuration_reports_not_configured():
    response = client.post("/api/v1/notify/teamspeak", json={"message": "scan complete"})
    assert response.status_code == 200
    assert response.json()["status"] == "NOT_CONFIGURED"
    assert response.json()["delivered"] is False
