"""Scan orchestration: local detection + live enrichment into one evidence record."""
from __future__ import annotations

import os
import re
from collections import Counter
from pathlib import Path

from . import patch as patch_mod
from . import secrets
from .enrich import Enricher
from .models import (DECLARED, OBSERVED, SEVERITY_RANK, VERIFIED,
                     Finding, ScanResult, fingerprint, severity_from_score, utc_now)
from .parsers import Package, discover

SEVERITY_LABELS = {"CRITICAL": "critical", "HIGH": "high", "MODERATE": "medium",
                   "MEDIUM": "medium", "LOW": "low"}


def _source(name: str, url: str, at: str | None = None) -> dict[str, str]:
    return {"name": name, "url": url, "observed_at": at or utc_now()}


def _dockerfile_checks(target: Path) -> list[tuple[str, str, int, str]]:
    """Return (kind, file, line, detail) for real Dockerfile hygiene defects."""
    out: list[tuple[str, str, int, str]] = []
    for path in sorted(target.rglob("Dockerfile*")):
        if any(p in {".git", "node_modules", ".venv", "venv"} for p in path.parts):
            continue
        rel = str(path.relative_to(target)).replace("\\", "/")
        try:
            lines = path.read_text(encoding="utf-8", errors="replace").splitlines()
        except OSError:
            continue
        for lineno, line in enumerate(lines, start=1):
            m = re.match(r"\s*FROM\s+(?:--platform=\S+\s+)?(\S+)", line, re.I)
            if not m:
                continue
            image = m.group(1)
            if image.lower() == "scratch" or "@sha256:" in image:
                continue
            tag = image.rsplit(":", 1)[1] if ":" in image.rsplit("/", 1)[-1] else None
            if tag is None or tag == "latest":
                out.append(("container-tag-unpinned", rel, lineno, f"base image '{image}' is not pinned to a digest"))
    return out


def _env_ignored(target: Path) -> tuple[bool, list[str]]:
    gitignore = target / ".gitignore"
    patterns: list[str] = []
    if gitignore.exists():
        try:
            patterns = [l.strip() for l in gitignore.read_text(encoding="utf-8").splitlines()]
        except OSError:
            patterns = []
    env_files = [p for p in target.glob(".env*") if p.is_file() and p.suffix not in {".example", ".sample", ".template"}]
    ignored = any(p in patterns for p in (".env", ".env*", "*.env", "/.env"))
    return ignored, [p.name for p in env_files]


def _best_fix(records: dict, vuln_ids: list[str], name: str, current: str) -> str | None:
    """Highest fixed version across this package's advisories that is above `current`."""
    candidates: list[tuple[tuple[int, int, int], str]] = []
    for vid in vuln_ids:
        rec = records.get(vid)
        if not rec:
            continue
        fixed = rec.fixed_versions.get(name)
        if not fixed:
            normalised = {re.sub(r"[-_.]+", "-", k).lower(): v
                          for k, v in rec.fixed_versions.items()}
            fixed = normalised.get(name)
        if fixed and patch_mod.is_upgrade(current, fixed):
            candidates.append((patch_mod.version_tuple(fixed), fixed))
    return max(candidates)[1] if candidates else None


def run_scan(target: Path, cache_dir: Path, enrich: bool = True, manual_path: Path | None = None,
             scan_id: str | None = None) -> ScanResult:
    target = target.resolve()
    result = ScanResult(target=str(target), scan_id=scan_id or fingerprint(str(target), utc_now()))

    packages = discover(target)
    exact: dict[tuple[str, str, str], list[Package]] = {}
    unpinned: list[Package] = []
    for pkg in packages:
        if pkg.version:
            exact.setdefault((pkg.ecosystem, pkg.name, pkg.version), []).append(pkg)
        else:
            unpinned.append(pkg)
    result.notes.append(f"{len(packages)} declared packages · {len(exact)} exact versions · {len(unpinned)} unpinned")

    secret_hits, files_inspected = secrets.scan_tree(target)
    result.stats["files_scanned"] = files_inspected
    result.stats["exact_versions_queried"] = len(exact)
    result.stats["unpinned_packages"] = len(unpinned)

    for hit in secret_hits:
        sev = str(hit["severity"])
        result.findings.append(Finding(
            kind="secret",
            title=f"{hit['label']} committed in source",
            asset=str(hit["file"]),
            severity=sev,
            location=f"{hit['file']}:{hit['line']}",
            detail=f"Literal match for rule '{hit['rule']}' at column {hit['column']}. Value masked: {hit['masked']}",
            evidence=OBSERVED,
            sources=[_source("elitze-scan ruleset", "https://www.elitze.info/trust.html")],
            patch=patch_mod.secret_patch(str(hit["rule"]), str(hit["file"]), int(hit["line"])),
        ))

    for pkg in unpinned:
        result.findings.append(Finding(
            kind="hygiene",
            title=f"Unpinned dependency: {pkg.name}",
            asset=pkg.file,
            severity="low",
            location=f"{pkg.file}:{pkg.line}" if pkg.line else pkg.file,
            detail=f"Manifest entry '{pkg.raw}' does not pin an exact version, so vulnerability "
                   f"exposure for this package is UNKNOWN rather than clean.",
            evidence=DECLARED,
            sources=[_source("manifest parse", str(target))],
            patch=patch_mod.hygiene_patch("unpinned-dependency", pkg.file),
        ))

    for kind, rel, line, detail in _dockerfile_checks(target):
        result.findings.append(Finding(
            kind="hygiene",
            title="Container base image not pinned",
            asset=rel,
            severity="low",
            location=f"{rel}:{line}",
            detail=detail,
            evidence=OBSERVED,
            sources=[_source("dockerfile parse", str(target))],
            patch=patch_mod.hygiene_patch(kind, rel, detail),
        ))

    ignored, env_files = _env_ignored(target)
    if env_files and not ignored:
        result.findings.append(Finding(
            kind="hygiene",
            title="Environment file present without a .gitignore rule",
            asset=", ".join(env_files),
            severity="high",
            location=env_files[0],
            detail="A .env file exists and .gitignore has no matching rule; the next commit can publish it.",
            evidence=OBSERVED,
            sources=[_source("filesystem observation", str(target))],
            patch=patch_mod.hygiene_patch("env-not-ignored", ".gitignore",
                                          "add '.env' and '.env.*' to .gitignore"),
        ))

    if enrich:
        enricher = Enricher(cache_dir=cache_dir)
        try:
            cap = int(os.environ.get("ELITZE_MAX_PACKAGES", "400"))
            ordered = list(exact.keys())[:cap]
            if len(exact) > cap:
                result.notes.append(f"package cap {cap} applied; {len(exact) - cap} exact versions not queried")
            queries = [{"package": {"name": name, "ecosystem": eco}, "version": ver}
                       for (eco, name, ver) in ordered]
            ids_by_index = enricher.osv_for_packages(queries)

            unique_ids: list[str] = []
            for ids in ids_by_index.values():
                for vid in ids:
                    if vid not in unique_ids and len(unique_ids) < enricher.max_vulns:
                        unique_ids.append(vid)
            records = {}
            for vid in unique_ids:
                rec = enricher.osv_vuln(vid)
                if rec:
                    records[vid] = rec

            kev = enricher.kev()
            cves = {r.cve for r in records.values() if r.cve}
            scores = enricher.epss(cves)

            for idx, key in enumerate(ordered):
                eco, name, ver = key
                for vid in ids_by_index.get(idx, []):
                    rec = records.get(vid)
                    if not rec:
                        continue
                    manifest = exact[key][0].file
                    current_sev = severity_from_score(rec.cvss_score)
                    if current_sev == "unknown" and rec.severity_label:
                        current_sev = SEVERITY_LABELS.get(rec.severity_label.upper(), "unknown")
                    cve = rec.cve
                    is_kev = bool(cve and cve in kev)
                    if is_kev and SEVERITY_RANK[current_sev] < SEVERITY_RANK["high"]:
                        current_sev = "high"
                    fixed = _best_fix(records, ids_by_index.get(idx, []), name, ver)
                    epss_pair = scores.get(cve or "")
                    detail_bits = [rec.summary or vid]
                    if is_kev:
                        detail_bits.append("listed in CISA KEV: exploitation observed in the wild")
                    if epss_pair:
                        detail_bits.append(f"EPSS {epss_pair[0]:.3f} (percentile {epss_pair[1]:.1f})")
                    if not fixed:
                        detail_bits.append("no advisory fix at or above the installed version: "
                                           "verify the affected range before acting")

                    result.findings.append(Finding(
                        kind="dependency",
                        title=f"{name} {ver}: {vid}",
                        asset=manifest,
                        severity=current_sev,
                        location=manifest,
                        detail=" — ".join(detail_bits),
                        ids={k: v for k, v in (("cve", cve), ("osv", vid)) if v},
                        cvss_score=rec.cvss_score,
                        cvss_vector=rec.cvss_vector,
                        epss=epss_pair[0] if epss_pair else None,
                        kev=is_kev,
                        evidence=VERIFIED,
                        sources=[_source("OSV.dev", rec.url, rec.modified or None),
                                 *([_source("CISA KEV", "https://www.cisa.gov/known-exploited-vulnerabilities-catalog")]
                                   if is_kev else []),
                                 *([_source("FIRST EPSS", "https://www.first.org/epss/")] if epss_pair else [])],
                        patch=patch_mod.dependency_patch(eco, name, ver, fixed, manifest,
                                                         pinned_elsewhere=len(exact[key]) - 1),
                    ))

            result.enrichment = enricher.describe()
        finally:
            enricher.close()
    else:
        result.enrichment = {"osv": "skipped", "kev": "skipped", "epss": "skipped",
                             "observed_at": utc_now()}

    if manual_path and manual_path.exists():
        from .manual import load_manual
        for finding in load_manual(manual_path):
            result.findings.append(finding)
        result.notes.append(f"manual findings merged from {manual_path.name}")

    result.findings.sort(key=lambda f: (SEVERITY_RANK.get(f.severity, 0),
                                       1 if f.kev else 0,
                                       f.epss or 0.0,
                                       f.title), reverse=True)
    result.finish()
    return result
