"""Manual findings intake.

The manual half of the workflow: a human records what they observed. Validation is strict —
a manual finding without a stated observation, a named author and a remediation is rejected
rather than silently filled in with defaults.
"""
from __future__ import annotations

import json
from pathlib import Path

from .models import OBSERVED, SEVERITY_RANK, Finding, PatchPlan, utc_now

REQUIRED = ("title", "asset", "severity", "detail", "remediation", "discovered_by")


class ManualFindingError(ValueError):
    pass


def load_manual(path: Path) -> list[Finding]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ManualFindingError(f"{path.name}: unreadable ({exc})") from exc

    entries = payload.get("findings") if isinstance(payload, dict) else payload
    if not isinstance(entries, list):
        raise ManualFindingError(f"{path.name}: expected a list under 'findings'")

    findings: list[Finding] = []
    for index, entry in enumerate(entries):
        if not isinstance(entry, dict):
            raise ManualFindingError(f"{path.name}[{index}]: entry is not an object")
        missing = [k for k in REQUIRED if not str(entry.get(k, "")).strip()]
        if missing:
            raise ManualFindingError(f"{path.name}[{index}]: missing {', '.join(missing)}")
        severity = str(entry["severity"]).lower()
        if severity not in SEVERITY_RANK:
            raise ManualFindingError(f"{path.name}[{index}]: severity '{severity}' not in "
                                     f"{sorted(SEVERITY_RANK)}")
        verification = entry.get("verification") or []
        if isinstance(verification, str):
            verification = [verification]
        findings.append(Finding(
            kind="manual",
            title=str(entry["title"]).strip(),
            asset=str(entry["asset"]).strip(),
            severity=severity,
            location=entry.get("location"),
            detail=f"[manual:{entry['discovered_by']}] {entry['detail']}".strip(),
            ids={"cve": entry["cve"].upper()} if entry.get("cve") else {},
            evidence=OBSERVED,
            sources=[{"name": f"manual:{entry['discovered_by']}",
                      "url": entry.get("evidence_url", ""),
                      "observed_at": entry.get("discovered_at") or utc_now()}],
            patch=PatchPlan(
                strategy="manual",
                command=entry.get("command"),
                files=[str(entry["asset"])],
                blast_radius=entry.get("blast_radius", "stated by the operator"),
                verification=list(verification) or ["re-run elitze-scan and confirm the finding is gone"],
                rollback=entry.get("rollback", "restore the previous state from version control"),
                notes=[str(entry["remediation"])],
            ),
        ))
    return findings
