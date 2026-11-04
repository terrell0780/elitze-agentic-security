"""CVSS v3.1 base-score calculation from a vector string.

Implemented from the specification so a score on the report is arithmetic, not an
advisory's marketing label. Vectors that are not v3.x return None.
"""
from __future__ import annotations

import math

_AV = {"N": 0.85, "A": 0.62, "L": 0.55, "P": 0.20}
_AC = {"L": 0.77, "H": 0.44}
_PR_U = {"N": 0.85, "L": 0.62, "H": 0.27}
_PR_C = {"N": 0.85, "L": 0.68, "H": 0.50}
_UI = {"N": 0.85, "R": 0.62}
_CI = {"H": 0.56, "L": 0.22, "N": 0.0}


def _roundup(value: float) -> float:
    """CVSS v3.1 Appendix A roundup: smallest number, one decimal, >= input."""
    integer = int(round(value * 100000))
    if integer % 10000 == 0:
        return integer / 100000.0
    return (math.floor(integer / 10000) + 1) / 10.0


def base_score(vector: str) -> float | None:
    if not vector or not vector.upper().startswith("CVSS:3"):
        return None
    parts: dict[str, str] = {}
    for chunk in vector.split("/")[1:]:
        if ":" in chunk:
            key, _, val = chunk.partition(":")
            parts[key.upper()] = val.upper()
    try:
        scope_changed = parts["S"] == "C"
        av = _AV[parts["AV"]]
        ac = _AC[parts["AC"]]
        pr = (_PR_C if scope_changed else _PR_U)[parts["PR"]]
        ui = _UI[parts["UI"]]
        conf, integ, avail = (_CI[parts["C"]], _CI[parts["I"]], _CI[parts["A"]])
    except KeyError:
        return None

    iss = 1 - ((1 - conf) * (1 - integ) * (1 - avail))
    if scope_changed:
        impact = 7.52 * (iss - 0.029) - 3.25 * (iss - 0.02) ** 15
    else:
        impact = 6.42 * iss
    exploitability = 8.22 * av * ac * pr * ui

    if impact <= 0:
        return 0.0
    raw = 1.08 * (impact + exploitability) if scope_changed else (impact + exploitability)
    return _roundup(min(raw, 10.0))
