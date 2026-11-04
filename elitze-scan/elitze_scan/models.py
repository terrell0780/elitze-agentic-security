"""Core data model for the Elitze scan engine.

Design rule: a field that looks like a measurement carries the name of the source that
produced it, or it is None. Nothing is defaulted to a "good" value.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from hashlib import sha256
from typing import Any

TOOL_VERSION = "1.4.0"

# Evidence vocabulary — same five states the platform uses in the UI.
VERIFIED = "VERIFIED"
OBSERVED = "OBSERVED"
DECLARED = "DECLARED"
UNKNOWN = "UNKNOWN"
UNMEASURABLE = "UNMEASURABLE"

SEVERITY_RANK = {"critical": 4, "high": 3, "medium": 2, "low": 1, "unknown": 0}


def utc_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def fingerprint(*parts: str) -> str:
    return sha256("|".join(parts).encode("utf-8")).hexdigest()[:16]


def severity_from_score(score: float | None) -> str:
    if score is None:
        return "unknown"
    if score >= 9.0:
        return "critical"
    if score >= 7.0:
        return "high"
    if score >= 4.0:
        return "medium"
    if score > 0:
        return "low"
    return "unknown"


@dataclass
class PatchPlan:
    """A remediation proposal. `command` is what would actually be executed by a human."""

    strategy: str  # upgrade | pin | patch-code | rotate-secret | config | manual
    target_version: str | None = None
    command: str | None = None
    files: list[str] = field(default_factory=list)
    blast_radius: str = ""
    verification: list[str] = field(default_factory=list)
    rollback: str = ""
    notes: list[str] = field(default_factory=list)


@dataclass
class Finding:
    kind: str  # dependency | secret | hygiene | manual
    title: str
    asset: str
    severity: str = "unknown"
    location: str | None = None
    detail: str = ""
    ids: dict[str, str] = field(default_factory=dict)
    cvss_score: float | None = None
    cvss_vector: str | None = None
    epss: float | None = None
    kev: bool | None = None
    reachability: str = "not_assessed"  # not_assessed | reachable | not_reachable
    evidence: str = OBSERVED
    sources: list[dict[str, Any]] = field(default_factory=list)
    patch: PatchPlan | None = None
    id: str = ""

    def __post_init__(self) -> None:
        if not self.id:
            self.id = fingerprint(self.kind, self.asset, self.location or "", self.title,
                                  self.ids.get("cve", ""))

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class ScanResult:
    target: str
    scan_id: str = ""
    started_at: str = field(default_factory=utc_now)
    finished_at: str | None = None
    tool_version: str = TOOL_VERSION
    findings: list[Finding] = field(default_factory=list)
    notes: list[str] = field(default_factory=list)
    enrichment: dict[str, str] = field(default_factory=dict)
    stats: dict[str, Any] = field(default_factory=dict)

    def finish(self) -> None:
        self.finished_at = utc_now()
        counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "unknown": 0}
        for f in self.findings:
            counts[f.severity] = counts.get(f.severity, 0) + 1
        self.stats = {
            "total": len(self.findings),
            "by_severity": counts,
            "kev_listed": sum(1 for f in self.findings if f.kev is True),
            "with_patch_plan": sum(1 for f in self.findings if f.patch is not None),
            "files_scanned": self.stats.get("files_scanned", 0),
            "exact_versions_queried": self.stats.get("exact_versions_queried", 0),
            "unpinned_packages": self.stats.get("unpinned_packages", 0),
        }

    def to_dict(self) -> dict[str, Any]:
        return {
            "scan_id": self.scan_id,
            "target": self.target,
            "started_at": self.started_at,
            "finished_at": self.finished_at,
            "tool_version": self.tool_version,
            "enrichment": self.enrichment,
            "stats": self.stats,
            "notes": self.notes,
            "findings": [f.to_dict() for f in self.findings],
        }
