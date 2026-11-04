"""Command line entry point: `elitze-scan <target>` or `elitze-scan serve`."""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

from .engine import run_scan
from .models import TOOL_VERSION
from .report import write_html, write_json
from .teamspeak import TeamSpeakConfig, TeamSpeakNotifier

DEFAULT_OUT = Path(os.environ.get("ELITZE_REPORT_DIR", Path.cwd() / "reports"))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="elitze-scan",
        description="Authorized dependency, secret and hygiene scanning with live OSV/KEV/EPSS "
                    "enrichment and patch plans.",
    )
    parser.add_argument("--version", action="version", version=f"elitze-scan {TOOL_VERSION}")
    sub = parser.add_subparsers(dest="command")

    scan = sub.add_parser("scan", help="scan a directory (default)")
    scan.add_argument("target", nargs="?", default=".", help="directory to scan — authorized scope only")
    scan.add_argument("--no-enrich", action="store_true", help="skip OSV/KEV/EPSS lookups")
    scan.add_argument("--manual", type=Path, help="JSON file of manual findings to merge")
    scan.add_argument("--out", type=Path, default=DEFAULT_OUT, help="report output directory")
    scan.add_argument("--teamspeak", action="store_true", help="send the summary to a TeamSpeak channel")
    scan.add_argument("--json-only", action="store_true", help="write JSON without the HTML report")
    scan.add_argument("--quiet", action="store_true", help="suppress the JSON summary on stdout")

    serve = sub.add_parser("serve", help="run the HTTP API with uvicorn")
    serve.add_argument("--host", default="127.0.0.1")
    serve.add_argument("--port", type=int, default=8000)

    return parser


def cmd_scan(args: argparse.Namespace) -> int:
    target = Path(args.target)
    if not target.is_dir():
        print(f"error: {target} is not a directory", file=sys.stderr)
        return 2

    result = run_scan(target=target, cache_dir=DEFAULT_OUT.parent / "data" / "cache",
                      enrich=not args.no_enrich, manual_path=args.manual)
    json_path = write_json(result, args.out)
    html_path = None if args.json_only else write_html(result, args.out)

    if args.teamspeak:
        sev = result.stats.get("by_severity", {})
        message = (f"Elitze scan {result.scan_id}: {sev.get('critical', 0)} critical, "
                   f"{sev.get('high', 0)} high, {result.stats.get('kev_listed', 0)} KEV-listed")
        notify = TeamSpeakNotifier(TeamSpeakConfig.from_env()).send(message)
        result.notes.append(f"teamspeak: {notify}")
        if not args.quiet:
            print(f"teamspeak: {notify['status']} — {notify['detail']}")

    if not args.quiet:
        print(json.dumps({"scan_id": result.scan_id, "target": result.target, "stats": result.stats,
                          "enrichment": result.enrichment, "json": str(json_path),
                          "html": str(html_path) if html_path else None}, indent=2))

    # Non-zero when critical/high findings exist: usable as a CI gate.
    severe = result.stats["by_severity"].get("critical", 0) + result.stats["by_severity"].get("high", 0)
    return 1 if severe else 0


def cmd_serve(args: argparse.Namespace) -> int:
    try:
        import uvicorn
    except ImportError:
        print("error: uvicorn is not installed (pip install 'elitze-scan[api]')", file=sys.stderr)
        return 2
    uvicorn.run("elitze_scan.api:app", host=args.host, port=args.port)
    return 0


def main(argv: list[str] | None = None) -> int:
    argv = list(sys.argv[1:] if argv is None else argv)
    # Bare `elitze-scan <dir>` means `scan <dir>`.
    if argv and not argv[0].startswith("-") and argv[0] not in {"scan", "serve"}:
        argv.insert(0, "scan")
    if not argv:
        argv = ["scan"]

    args = build_parser().parse_args(argv)
    if args.command == "serve":
        return cmd_serve(args)
    if args.command in (None, "scan"):
        if args.command is None:
            args = build_parser().parse_args(["scan"])
        return cmd_scan(args)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
