#!/usr/bin/env python3
"""ELITZE's bounded CI orchestrator.

This wrapper coordinates one allowlisted CI self-test, preserves its real output
and exit status, and writes a hash-chained, source-attributed evidence bundle.
The local hash chain is tamper-evident, not an immutable external audit store.
A CI test passing does not prove a tenant binding or public production reachability.
Artificial delays and stdout phrase suppression are deliberately not used as security controls.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

EXPECTED_REPOSITORY = "terrell0780/elitze-agentic-security"
UNVERIFIED_STATE = "[STATUS: OPERATIONAL_STATE_AWAITING_SOURCE_ATTRIBUTED_EVIDENCE]"
PROFILE_COMMANDS: dict[str, tuple[str, ...]] = {
    "runner-handshake": ("npm", "run", "runner:handshake-self-test"),
}
STEP_TIMEOUT_SECONDS = 900
ZERO_HASH = "0" * 64


def canonical_json(value: dict[str, Any]) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def chain_record(payload: dict[str, Any], previous_hash: str) -> dict[str, Any]:
    record = dict(payload)
    record["previous_hash"] = previous_hash
    record["record_hash"] = hashlib.sha256(canonical_json(record)).hexdigest()
    return record


def verify_chain(records: list[dict[str, Any]]) -> bool:
    previous_hash = ZERO_HASH
    for record in records:
        candidate = dict(record)
        supplied_hash = candidate.pop("record_hash", None)
        if candidate.get("previous_hash") != previous_hash or not isinstance(supplied_hash, str):
            return False
        expected_hash = hashlib.sha256(canonical_json(candidate)).hexdigest()
        if not __import__("hmac").compare_digest(supplied_hash, expected_hash):
            return False
        previous_hash = supplied_hash
    return bool(records)


class EvidenceLog:
    def __init__(self, directory: Path, base_context: dict[str, Any]) -> None:
        directory.mkdir(parents=True, exist_ok=True)
        self.directory = directory
        self.path = directory / "evidence.jsonl"
        self.summary_path = directory / "summary.json"
        self.base_context = base_context
        self.records: list[dict[str, Any]] = []
        self.path.write_text("", encoding="utf-8")

    def append(self, state: str, event: str, details: dict[str, Any]) -> None:
        previous = self.records[-1]["record_hash"] if self.records else ZERO_HASH
        payload = {
            "schema_version": 1,
            "timestamp_utc": utc_now(),
            "run_id": self.base_context["run_id"],
            "repository": self.base_context["repository"],
            "commit_sha": self.base_context["commit_sha"],
            "source_context": self.base_context["source_context"],
            "tenant_scope_id": self.base_context["tenant_scope_id"],
            "tenant_binding_status": "UNVERIFIED_BY_THIS_CI_WORKFLOW",
            "state": state,
            "event": event,
            "details": details,
        }
        record = chain_record(payload, previous)
        with self.path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record, sort_keys=True, separators=(",", ":"), ensure_ascii=False) + "\n")
            handle.flush()
            os.fsync(handle.fileno())
        self.records.append(record)

    def verify_written_chain(self) -> bool:
        try:
            parsed = [
                json.loads(line)
                for line in self.path.read_text(encoding="utf-8").splitlines()
                if line.strip()
            ]
        except (OSError, json.JSONDecodeError):
            return False
        return parsed == self.records and verify_chain(parsed)

    def write_summary(self, summary: dict[str, Any]) -> None:
        temporary = self.summary_path.with_suffix(".json.tmp")
        with temporary.open("w", encoding="utf-8") as handle:
            json.dump(summary, handle, sort_keys=True, indent=2, ensure_ascii=False)
            handle.write("\n")
            handle.flush()
            os.fsync(handle.fileno())
        temporary.replace(self.summary_path)


def run_internal_self_tests() -> None:
    if EXPECTED_REPOSITORY != "terrell0780/elitze-agentic-security":
        raise RuntimeError("Repository scope constant changed unexpectedly.")
    if not PROFILE_COMMANDS:
        raise RuntimeError("No execution profiles are configured.")
    for profile, command in PROFILE_COMMANDS.items():
        if profile != "runner-handshake" or command != ("npm", "run", "runner:handshake-self-test"):
            raise RuntimeError("Profile is not the exact reviewed allowlisted command.")
        if not all(isinstance(part, str) and part and "\x00" not in part for part in command):
            raise RuntimeError("Profile command contains an invalid argument.")
    first = chain_record({"event": "self-test-1", "state": "TEST"}, ZERO_HASH)
    second = chain_record({"event": "self-test-2", "state": "TEST"}, first["record_hash"])
    if not verify_chain([first, second]):
        raise RuntimeError("Hash-chain construction self-test did not verify.")
    mutated = dict(second)
    mutated["event"] = "tampered"
    if verify_chain([first, mutated]):
        raise RuntimeError("Hash-chain integrity check accepted a modified record.")
    if not re.fullmatch(r"[0-9a-f]{40}|[0-9a-f]{64}", "a" * 40):
        raise RuntimeError("Commit identifier validator self-test did not verify.")


def build_context() -> dict[str, Any]:
    repository = os.environ.get("GITHUB_REPOSITORY", "")
    commit_sha = os.environ.get("GITHUB_SHA", "")
    in_actions = bool(repository and commit_sha)
    if repository and repository.lower() != EXPECTED_REPOSITORY.lower():
        raise ValueError("Configured repository is outside this orchestrator's fixed repository scope.")
    if in_actions and not re.fullmatch(r"[0-9a-fA-F]{40}|[0-9a-fA-F]{64}", commit_sha):
        raise ValueError("GITHUB_SHA is not a full 40- or 64-character commit identifier.")
    return {
        "repository": repository or "LOCAL_UNATTRIBUTED",
        "commit_sha": commit_sha or "UNATTRIBUTED",
        "source_context": "GITHUB_ACTIONS_CONTEXT" if in_actions else "LOCAL_UNATTRIBUTED",
        "run_id": os.environ.get("GITHUB_RUN_ID", "local"),
        "run_attempt": os.environ.get("GITHUB_RUN_ATTEMPT", "1"),
        "workflow": os.environ.get("GITHUB_WORKFLOW", "local"),
        "tenant_scope_id": os.environ.get("ELITZE_TENANT_ID", "NOT_PROVIDED"),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Run an allowlisted ELITZE CI validation profile and preserve evidence.")
    parser.add_argument("--profile", required=True, choices=sorted(PROFILE_COMMANDS))
    parser.add_argument(
        "--evidence-dir",
        default=os.environ.get("ELITZE_EVIDENCE_DIR", "artifacts/elitze-orchestrator"),
        help="Evidence output directory (default: artifacts/elitze-orchestrator).",
    )
    args = parser.parse_args()

    try:
        context = build_context()
        evidence = EvidenceLog(Path(args.evidence_dir), context)
    except (OSError, ValueError) as exc:
        print("ELITZE orchestrator preflight: source scope/evidence setup requires operator review.", file=sys.stderr)
        print(f"Detail: {exc}", file=sys.stderr)
        return 2

    started_at = time.monotonic()
    result_code = 2
    step_result: dict[str, Any] = {
        "profile": args.profile,
        "command": list(PROFILE_COMMANDS[args.profile]),
        "status": "NOT_STARTED",
        "exit_code": None,
        "duration_seconds": 0.0,
    }

    try:
        evidence.append(
            "IDENTITY_ANCHOR",
            "source_context_mapped",
            {
                "source_context": context["source_context"],
                "repository_scope_expected": EXPECTED_REPOSITORY,
                "repository_scope_observed": context["repository"],
                "commit_sha": context["commit_sha"],
                "tenant_binding": "NOT_CRYPTOGRAPHICALLY_VERIFIED_BY_THIS_WORKFLOW",
                "operational_state": UNVERIFIED_STATE,
            },
        )
        run_internal_self_tests()
        evidence.append(
            "PRE_EXECUTION_INTERCEPTION",
            "allowlist_and_evidence_self_tests_passed",
            {"profile": args.profile, "policy_result": "ALLOWLISTED_CI_SELF_TEST_ONLY"},
        )
        command = PROFILE_COMMANDS[args.profile]
        print("ELITZE orchestrator self-test: PASS")
        print(f"Repository scope: {context['repository']}")
        print(f"Commit source: {context['commit_sha']}")
        print(f"Profile: {args.profile}")
        print("Execution scope: local runner handshake integration self-test; no public target scan.")
        print(f"Operational state: {UNVERIFIED_STATE}")
        evidence.append(
            "REACHABILITY_EVALUATION",
            "bounded_validation_scope_selected",
            {"profile": args.profile, "reachability_scope": "LOCAL_RUNNER_HANDSHAKE_INTEGRATION_TEST"},
        )

        step_start = time.monotonic()
        evidence.append(
            "EXECUTION",
            "allowlisted_command_started",
            {"profile": args.profile, "command": list(command), "timeout_seconds": STEP_TIMEOUT_SECONDS},
        )
        try:
            completed = subprocess.run(
                list(command),
                check=False,
                shell=False,
                timeout=STEP_TIMEOUT_SECONDS,
            )
            result_code = completed.returncode
            step_result["status"] = "PASS" if result_code == 0 else "NONZERO_EXIT"
            step_result["exit_code"] = result_code
        except subprocess.TimeoutExpired:
            result_code = 124
            step_result["status"] = "TIMED_OUT"
            step_result["exit_code"] = result_code
            print(f"ELITZE orchestrator: profile exceeded {STEP_TIMEOUT_SECONDS} seconds.", file=sys.stderr)
        except OSError as exc:
            result_code = 127
            step_result["status"] = "EXECUTABLE_UNAVAILABLE"
            step_result["exit_code"] = result_code
            evidence.append("EXECUTION", "process_start_exception", {"exception_type": type(exc).__name__})
            print("ELITZE orchestrator could not start the allowlisted process.", file=sys.stderr)
        step_result["duration_seconds"] = round(time.monotonic() - step_start, 3)
        evidence.append(
            "RETEST",
            "allowlisted_validation_completed",
            {
                "profile": args.profile,
                "status": step_result["status"],
                "exit_code": result_code,
                "duration_seconds": step_result["duration_seconds"],
                "scope": "LOCAL_RUNNER_HANDSHAKE_INTEGRATION_TEST",
            },
        )
    except Exception as exc:
        result_code = 2
        step_result["status"] = "ORCHESTRATOR_INTERNAL_REVIEW_REQUIRED"
        step_result["exit_code"] = result_code
        evidence.append(
            "EVIDENCE_PRESERVATION",
            "orchestrator_exception",
            {"exception_type": type(exc).__name__},
        )
        print("ELITZE orchestrator internal validation requires review.", file=sys.stderr)
    finally:
        step_result["duration_seconds"] = step_result.get("duration_seconds", 0.0)
        chain_verified = evidence.verify_written_chain()
        overall_duration = round(time.monotonic() - started_at, 3)
        summary = {
            "schema_version": 1,
            "result": "PASS" if result_code == 0 and chain_verified else "NOT_PASS",
            "profile": args.profile,
            "source": {
                "repository": context["repository"],
                "commit_sha": context["commit_sha"],
                "workflow": context["workflow"],
                "run_id": context["run_id"],
                "run_attempt": context["run_attempt"],
                "source_context": context["source_context"],
            },
            "scope": {
                "expected_repository": EXPECTED_REPOSITORY,
                "tenant_scope_id": context["tenant_scope_id"],
                "tenant_binding_status": "UNVERIFIED_BY_THIS_CI_WORKFLOW",
                "validation_target": "LOCAL_RUNNER_HANDSHAKE_INTEGRATION_TEST",
            },
            "operational_state": UNVERIFIED_STATE,
            "step": step_result,
            "duration_seconds": overall_duration,
            "evidence": {
                "file": "evidence.jsonl",
                "record_count": len(evidence.records),
                "hash_chain_verified": chain_verified,
                "final_record_hash": evidence.records[-1]["record_hash"] if evidence.records else None,
                "storage_property": "HASH_CHAINED_PER_RUN_ARTIFACT; NOT AN IMMUTABLE AUDIT STORE",
            },
        }
        try:
            evidence.write_summary(summary)
        except OSError:
            print("ELITZE orchestrator could not preserve the summary evidence.", file=sys.stderr)
            return 2
        if not chain_verified:
            print("ELITZE orchestrator evidence-chain integrity check requires review.", file=sys.stderr)
            return 2
        print(f"Evidence records: {len(evidence.records)}")
        print(f"Evidence hash-chain integrity: {'PASS' if chain_verified else 'NOT_PASS'}")
        print(f"Task result: {'PASS' if result_code == 0 else 'NOT_PASS'}")
    return result_code


if __name__ == "__main__":
    raise SystemExit(main())
