"""Live enrichment from OSV.dev, CISA KEV and FIRST EPSS.

Every call records its own state. If a feed is unreachable the field stays None and the
state reads UNMEASURABLE — a missing score is never rendered as a safe score.
"""
from __future__ import annotations

import json
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Iterable

import httpx

from .cvss import base_score
from .models import UNMEASURABLE, VERIFIED, utc_now

OSV_BATCH = "https://api.osv.dev/v1/querybatch"
OSV_VULN = "https://api.osv.dev/v1/vulns/{id}"
KEV_FEED = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
EPSS_API = "https://api.first.org/data/v1/epss"
KEV_TTL_SECONDS = 12 * 3600


@dataclass
class VulnRecord:
    vuln_id: str
    aliases: list[str]
    summary: str
    severity_label: str | None
    cvss_score: float | None
    cvss_vector: str | None
    fixed_versions: dict[str, str]  # package name -> first fixed version
    url: str
    modified: str | None

    @property
    def cve(self) -> str | None:
        for alias in self.aliases:
            if alias.upper().startswith("CVE-"):
                return alias.upper()
        return self.vuln_id if self.vuln_id.upper().startswith("CVE-") else None


class Enricher:
    def __init__(self, cache_dir: Path, timeout: float = 30.0, max_vulns: int = 250) -> None:
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.timeout = timeout
        self.max_vulns = max_vulns
        self.state: dict[str, str] = {}
        self.observed_at = utc_now()
        self.kev_catalog: str | None = None
        self.kev_released: str | None = None
        self._client = httpx.Client(timeout=timeout, follow_redirects=True,
                                    headers={"User-Agent": "elitze-scan/1.4 (+https://www.elitze.info)"})

    def close(self) -> None:
        self._client.close()

    # ---------- OSV ----------

    def osv_for_packages(self, queries: list[dict[str, str]]) -> dict[int, list[str]]:
        """Map query index -> ordered vuln ids. Empty dict means the feed failed."""
        if not queries:
            self.state["osv"] = VERIFIED
            return {}
        try:
            r = self._client.post(OSV_BATCH, json={"queries": queries})
            r.raise_for_status()
            results = r.json().get("results", [])
            self.state["osv"] = VERIFIED
            return {i: [v["id"] for v in (res.get("vulns") or [])]
                    for i, res in enumerate(results)}
        except Exception:  # noqa: BLE001
            self.state["osv"] = UNMEASURABLE
            return {}

    def osv_vuln(self, vuln_id: str) -> VulnRecord | None:
        try:
            r = self._client.get(OSV_VULN.format(id=vuln_id))
            if r.status_code == 404:
                return None
            r.raise_for_status()
            data: dict[str, Any] = r.json()
        except Exception:  # noqa: BLE001
            return None
        return _record_from_osv(data)

    # ---------- KEV ----------

    def kev(self) -> set[str]:
        cached = self.cache_dir / "kev.json"
        if cached.exists() and (time.time() - cached.stat().st_mtime) < KEV_TTL_SECONDS:
            try:
                payload = json.loads(cached.read_text(encoding="utf-8"))
                self.state["kev"] = f"{VERIFIED} (cache)"
                self.kev_catalog = payload.get("catalogVersion")
                self.kev_released = payload.get("dateReleased")
                return {v["cveID"] for v in payload.get("vulnerabilities", [])}
            except (OSError, json.JSONDecodeError, KeyError):
                pass
        try:
            r = self._client.get(KEV_FEED)
            r.raise_for_status()
            raw = r.content
            payload = json.loads(raw)
            cached.write_bytes(raw)
            self.state["kev"] = VERIFIED
            self.kev_catalog = payload.get("catalogVersion")
            self.kev_released = payload.get("dateReleased")
            return {v["cveID"] for v in payload.get("vulnerabilities", [])}
        except Exception:  # noqa: BLE001
            self.state["kev"] = UNMEASURABLE
            return set()

    # ---------- EPSS ----------

    def epss(self, cves: Iterable[str]) -> dict[str, tuple[float, float]]:
        unique = sorted({c for c in cves if c})
        if not unique:
            self.state["epss"] = VERIFIED
            return {}
        out: dict[str, tuple[float, float]] = {}
        for chunk_start in range(0, len(unique), 100):
            chunk = unique[chunk_start:chunk_start + 100]
            try:
                r = self._client.get(EPSS_API, params={"cve": ",".join(chunk)})
                r.raise_for_status()
                for row in r.json().get("data", []):
                    out[row["cve"]] = (float(row["epss"]), float(row.get("percentile", 0)))
                self.state["epss"] = VERIFIED
            except Exception:  # noqa: BLE001
                self.state["epss"] = UNMEASURABLE
                return out
        return out

    def describe(self) -> dict[str, str]:
        out = dict(self.state)
        if self.kev_catalog:
            out["kev_catalog"] = str(self.kev_catalog)
        if self.kev_released:
            out["kev_released"] = str(self.kev_released)
        out["observed_at"] = self.observed_at
        return out


def _record_from_osv(data: dict[str, Any]) -> VulnRecord:
    vector = None
    score = None
    for sev in data.get("severity") or []:
        s = sev.get("score") or ""
        if s.upper().startswith("CVSS:3"):
            vector = s
            score = base_score(s)
            break
    label = (data.get("database_specific") or {}).get("severity")

    fixed: dict[str, str] = {}
    for affected in data.get("affected") or []:
        name = (affected.get("package") or {}).get("name", "")
        for rng in affected.get("ranges") or []:
            for event in rng.get("events") or []:
                if event.get("fixed"):
                    fixed.setdefault(name, event["fixed"])
    return VulnRecord(
        vuln_id=data.get("id", ""),
        aliases=[a for a in (data.get("aliases") or []) if isinstance(a, str)],
        summary=(data.get("summary") or data.get("details") or "").strip().split("\n")[0][:400],
        severity_label=label,
        cvss_score=score,
        cvss_vector=vector,
        fixed_versions=fixed,
        url=OSV_VULN.format(id=data.get("id", "")),
        modified=data.get("modified"),
    )
