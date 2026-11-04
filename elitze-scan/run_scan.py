"""Compatibility shim: `python run_scan.py <target>` still works from a checkout.

The bundled interpreter runs isolated, so the package directory is added explicitly.
Prefer `python -m elitze_scan scan <target>` or the installed `elitze-scan` command.
"""
from __future__ import annotations

import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
if str(BASE) not in sys.path:
    sys.path.insert(0, str(BASE))

from elitze_scan.cli import main  # noqa: E402

if __name__ == "__main__":
    raise SystemExit(main())
