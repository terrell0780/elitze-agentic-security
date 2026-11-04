"""Deterministic credential detection.

Pattern-based on purpose: every hit is a literal match at a file:line, so it can be
reproduced. No entropy heuristics — those trade precision for theatre. Secret values are
masked in the model and never written to a report in full.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

SKIP_DIRS = {".git", "node_modules", ".venv", "venv", "__pycache__", ".pytest_cache",
             "dist", "build", ".next", ".mypy_cache", "data"}
SKIP_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".pdf", ".zip", ".gz", ".tar",
            ".woff", ".woff2", ".ttf", ".eot", ".mp4", ".mp3", ".exe", ".dll", ".so",
            ".pyc", ".lock", ".map"}
MAX_BYTES = 1_000_000


@dataclass(frozen=True)
class Rule:
    key: str
    label: str
    severity: str
    pattern: re.Pattern[str]
    group: int = 0  # group holding the secret when the pattern is an assignment


RULES: tuple[Rule, ...] = (
    Rule("aws-akid", "AWS access key ID", "high", re.compile(r"\b(AKIA[0-9A-Z]{16})\b")),
    Rule("aws-secret", "AWS secret access key", "critical",
         re.compile(r"(?i)aws_?secret_?access_?key\s*[=:]\s*['\"]?([A-Za-z0-9/+=]{40})"), 1),
    Rule("github-token", "GitHub token", "critical", re.compile(r"\b(gh[pousr]_[A-Za-z0-9]{36,})\b")),
    Rule("slack-webhook", "Slack incoming webhook", "high",
         re.compile(r"(https://hooks\.slack\.com/services/T[A-Za-z0-9]+/B[A-Za-z0-9]+/[A-Za-z0-9]+)")),
    Rule("google-api-key", "Google API key", "high", re.compile(r"\b(AIza[0-9A-Za-z\-_]{35})\b")),
    Rule("stripe-live", "Stripe live secret key", "critical",
         re.compile(r"\b(sk_live_[0-9A-Za-z]{20,})\b")),
    Rule("private-key", "Private key block", "critical",
         re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----")),
    Rule("db-url-password", "Database URL containing a password", "high",
         re.compile(r"\b(postgres(?:ql)?://[^\s:@/]+:([^\s@/]{6,})@[^\s\"'`]+)"), 1),
    Rule("generic-assignment", "Credential-shaped assignment", "medium",
         re.compile(r"(?i)\b(?:api[_-]?key|apikey|secret|token|password|passwd)\b\s*[=:]\s*['\"]([^'\"\s]{12,})['\"]"), 1),
)

# Values that are obviously placeholders are not findings.
_PLACEHOLDER = re.compile(
    r"(?i)^(x{4,}|\*{4,}|<[^>]+>|\$\{[^}]+\}|changeme|placeholder|example|test|dummy|redacted|your[_-]?\w+)"
)


def mask(value: str) -> str:
    if len(value) <= 8:
        return "*" * len(value)
    return f"{value[:4]}{'*' * min(24, len(value) - 8)}{value[-4:]}"


def _looks_binary(sample: bytes) -> bool:
    return b"\x00" in sample


_RANK = {"critical": 3, "high": 2, "medium": 1, "low": 0}


def scan_text(text: str, rel: str) -> list[dict[str, object]]:
    """Match each line, then drop matches that overlap a higher-severity match.

    Without this, one GitHub token reports twice (specific rule + generic assignment).
    """
    hits: list[dict[str, object]] = []
    for lineno, line in enumerate(text.splitlines(), start=1):
        if len(line) > 4000:
            continue
        candidates: list[tuple[int, int, int, Rule, str]] = []
        for rule in RULES:
            for m in rule.pattern.finditer(line):
                secret = m.group(rule.group)
                if rule.key != "private-key" and _PLACEHOLDER.match(secret):
                    continue
                candidates.append((m.start(rule.group), m.end(rule.group),
                                   _RANK.get(rule.severity, 0), rule, secret))
        # Highest severity wins; ties go to the earlier span.
        candidates.sort(key=lambda c: (-c[2], c[0]))
        claimed: list[tuple[int, int]] = []
        for start, end, _, rule, secret in candidates:
            if any(start < span_end and end > span_start for span_start, span_end in claimed):
                continue
            claimed.append((start, end))
            if rule.key == "private-key":
                masked = "-----BEGIN PRIVATE KEY----- (block header)"
            else:
                masked = mask(secret)
            hits.append({
                "rule": rule.key,
                "label": rule.label,
                "severity": rule.severity,
                "file": rel,
                "line": lineno,
                "masked": masked,
                "column": start + 1,
            })
    return hits


def scan_tree(target: Path) -> tuple[list[dict[str, object]], int]:
    """Return (hits, files_inspected)."""
    hits: list[dict[str, object]] = []
    inspected = 0
    for path in sorted(target.rglob("*")):
        if path.is_dir():
            continue
        if any(part in SKIP_DIRS for part in path.relative_to(target).parts):
            continue
        if path.suffix.lower() in SKIP_EXT:
            continue
        try:
            if path.stat().st_size > MAX_BYTES:
                continue
            raw = path.read_bytes()
        except OSError:
            continue
        if _looks_binary(raw[:2048]):
            continue
        inspected += 1
        rel = str(path.relative_to(target)).replace("\\", "/")
        hits.extend(scan_text(raw.decode("utf-8", errors="replace"), rel))
    return hits, inspected
