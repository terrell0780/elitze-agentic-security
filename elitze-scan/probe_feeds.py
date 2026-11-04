"""Connectivity probe: which public vulnerability feeds are reachable from this host?"""
from __future__ import annotations

import json

import httpx

TARGETS = [
    ("OSV querybatch", "POST", "https://api.osv.dev/v1/querybatch",
     {"queries": [{"package": {"name": "jinja2", "ecosystem": "PyPI"}, "version": "2.11.2"}]}),
    ("CISA KEV feed", "GET",
     "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json", None),
    ("FIRST EPSS", "GET", "https://api.first.org/data/v1/epss?cve=CVE-2021-44228", None),
]


def main() -> int:
    for name, method, url, body in TARGETS:
        try:
            with httpx.Client(timeout=25, follow_redirects=True) as c:
                r = c.request(method, url, json=body) if body else c.get(url)
            head = r.text[:120].replace("\n", " ")
            print(f"{name:<16} {r.status_code}  bytes={len(r.content):<8} {head}")
        except Exception as exc:  # noqa: BLE001
            print(f"{name:<16} UNREACHABLE  {type(exc).__name__}: {exc}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
