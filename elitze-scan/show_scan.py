"""Summarize a scan JSON for inspection (and for the page's embedded dataset)."""
from __future__ import annotations

import json
import sys
from pathlib import Path


def main(argv: list[str]) -> int:
    path = Path(argv[1])
    data = json.loads(path.read_text(encoding="utf-8"))
    print(f"scan {data['scan_id']} · {data['stats']['total']} findings · "
          f"enrichment {data['enrichment'].get('osv')}")
    for f in data["findings"]:
        patch = f.get("patch") or {}
        print(f"{f['severity']:>8} | {f['title'][:60]:<60} | "
              f"cvss={f['cvss_score']} epss={f['epss']} kev={f['kev']} | "
              f"fix={patch.get('target_version')}")
        if patch.get("command"):
            print(f"           cmd: {patch['command'][:110]}")
        print(f"           {f['detail'][:150]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
