import json
from pathlib import Path

from elitze_scan.engine import run_scan


def _scan(tmp_path: Path, enrich: bool = False):
    return run_scan(target=tmp_path, cache_dir=tmp_path / "_cache", enrich=enrich)


def test_offline_scan_finds_all_four_defect_classes(tmp_path: Path):
    (tmp_path / "requirements.txt").write_text("requests==2.31.0\nflask\n", encoding="utf-8")
    (tmp_path / "Dockerfile").write_text("FROM python:latest\n", encoding="utf-8")
    (tmp_path / ".env").write_text("A=1\n", encoding="utf-8")
    key = "AKIA" + "R" * 16
    (tmp_path / "conf.py").write_text(f'KEY = "{key}"\n', encoding="utf-8")

    result = _scan(tmp_path)
    kinds = {f.kind for f in result.findings}
    assert {"secret", "hygiene"} <= kinds

    titles = " ".join(f.title for f in result.findings)
    assert "AWS access key" in titles
    assert "Container base image" in titles
    assert "Environment file" in titles
    assert "Unpinned dependency: flask" in titles

    # Enrichment was skipped, so it must say so — not "clean".
    assert result.enrichment["osv"] == "skipped"
    assert result.stats["total"] == len(result.findings)
    assert result.stats["with_patch_plan"] == len(result.findings)
    assert result.finished_at is not None


def test_clean_target_yields_no_findings(tmp_path: Path):
    (tmp_path / "requirements.txt").write_text("requests==2.31.0\n", encoding="utf-8")
    (tmp_path / ".gitignore").write_text(".env\n", encoding="utf-8")
    result = _scan(tmp_path)
    assert result.findings == []
    assert result.stats["total"] == 0


def test_severity_ordering_puts_critical_first(tmp_path: Path):
    (tmp_path / "requirements.txt").write_text("flask\n", encoding="utf-8")
    (tmp_path / ".env").write_text("A=1\n", encoding="utf-8")           # high
    (tmp_path / "Dockerfile").write_text("FROM python:latest\n", encoding="utf-8")  # low
    key = "AKIA" + "S" * 16
    (tmp_path / "conf.py").write_text(f'KEY = "{key}"\n', encoding="utf-8")  # high
    result = _scan(tmp_path)
    assert result.findings[0].severity in {"high", "critical"}


def test_manual_findings_are_validated_and_merged(tmp_path: Path):
    (tmp_path / "requirements.txt").write_text("requests==2.31.0\n", encoding="utf-8")
    manual = tmp_path / "manual.json"
    manual.write_text(json.dumps({"findings": [{
        "title": "MCP tool grants write access to billing API",
        "asset": "mcp/gateway.json",
        "severity": "high",
        "detail": "Tool 'update_invoice' is reachable by the analyst role without approval.",
        "remediation": "Require approval step for update_invoice; scope token to read-only.",
        "discovered_by": "terrell",
        "verification": ["replay the tool call", "confirm approval prompt appears"],
    }]}), encoding="utf-8")

    result = run_scan(target=tmp_path, cache_dir=tmp_path / "_cache", enrich=False, manual_path=manual)
    manual_findings = [f for f in result.findings if f.kind == "manual"]
    assert len(manual_findings) == 1
    finding = manual_findings[0]
    assert finding.evidence == "OBSERVED"
    assert finding.patch is not None
    assert finding.patch.strategy == "manual"
    assert "manual:terrell" in finding.detail


def test_manual_finding_missing_fields_is_rejected(tmp_path: Path):
    from elitze_scan.manual import ManualFindingError, load_manual

    path = tmp_path / "bad.json"
    path.write_text(json.dumps({"findings": [{"title": "x", "asset": "y", "severity": "high"}]}),
                    encoding="utf-8")
    try:
        load_manual(path)
    except ManualFindingError as exc:
        assert "missing" in str(exc)
    else:
        raise AssertionError("invalid manual finding was accepted")
