"""Manifest parsers. Only exact pins are treated as measurable versions."""
from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path

_REQ = re.compile(r"^\s*([A-Za-z0-9][A-Za-z0-9._\-]*)\s*(\[[^\]]*\])?\s*([=><!~]=?.*)?$")
_EXACT = re.compile(r"^==\s*([0-9][^\s,;]*)$")


@dataclass
class Package:
    ecosystem: str      # PyPI | npm
    name: str
    version: str | None  # None when the manifest does not pin exactly
    file: str
    line: int
    raw: str


def _norm(name: str) -> str:
    return re.sub(r"[-_.]+", "-", name).lower()


def parse_requirements(path: Path, rel: str) -> list[Package]:
    out: list[Package] = []
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return out
    for lineno, raw in enumerate(text.splitlines(), start=1):
        line = raw.split("#", 1)[0].strip()
        if not line or line.startswith(("-", "git+", "http:", "https:", "file:")):
            continue
        m = _REQ.match(line)
        if not m:
            continue
        name, _, spec = m.group(1), m.group(2), (m.group(3) or "").strip()
        exact = _EXACT.match(spec.replace(" ", ""))
        version = exact.group(1) if exact else None
        out.append(Package("PyPI", _norm(name), version, rel, lineno, line))
    return out


def parse_package_json(path: Path, rel: str) -> list[Package]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
    out: list[Package] = []
    for section in ("dependencies", "devDependencies", "optionalDependencies"):
        for name, spec in (data.get(section) or {}).items():
            if not isinstance(spec, str):
                continue
            cleaned = spec.lstrip("^~=")
            version = cleaned if re.fullmatch(r"\d+\.\d+\.\d+[-\w.]*", cleaned) else None
            out.append(Package("npm", name, version, rel, 0, f"{name}@{spec}"))
    return out


def parse_package_lock(path: Path, rel: str) -> list[Package]:
    """package-lock v2/v3 `packages` map carries resolved versions for the whole tree."""
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
    out: list[Package] = []
    for key, meta in (data.get("packages") or {}).items():
        if not key.startswith("node_modules/") or not isinstance(meta, dict):
            continue
        name = key.rsplit("node_modules/", 1)[-1]
        version = meta.get("version")
        if isinstance(version, str):
            out.append(Package("npm", name, version, rel, 0, f"{name}@{version}"))
    return out


def discover(target: Path) -> list[Package]:
    """Walk a target tree for manifests. Vendored trees are skipped."""
    skip = {".git", "node_modules", ".venv", "venv", "__pycache__", ".pytest_cache", "dist", "build"}
    packages: list[Package] = []
    for path in sorted(target.rglob("*")):
        if path.is_dir() or any(part in skip for part in path.parts):
            continue
        name = path.name
        rel = str(path.relative_to(target)).replace("\\", "/")
        if name == "package-lock.json":
            packages.extend(parse_package_lock(path, rel))
        elif name == "package.json":
            packages.extend(parse_package_json(path, rel))
        elif name in {"requirements.txt", "requirements-dev.txt", "constraints.txt"}:
            packages.extend(parse_requirements(path, rel))
    return packages
