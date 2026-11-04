"""Patch plan construction.

A plan is what an operator would actually run: target version, exact command, verification,
rollback, and the blast radius. It is never executed by the scanner.
"""
from __future__ import annotations

from .models import PatchPlan


def _major(version: str | None) -> int | None:
    if not version:
        return None
    head = version.split("-")[0].split("+")[0].split(".")
    try:
        return int(head[0])
    except (ValueError, IndexError):
        return None


def version_tuple(version: str | None) -> tuple[int, int, int]:
    if not version:
        return (0, 0, 0)
    core = version.split("-")[0].split("+")[0].split(".")[:3]
    parts: list[int] = []
    for chunk in core:
        digits = "".join(ch for ch in chunk if ch.isdigit())
        parts.append(int(digits) if digits else 0)
    while len(parts) < 3:
        parts.append(0)
    return (parts[0], parts[1], parts[2])


def is_upgrade(current: str | None, candidate: str | None) -> bool:
    """A fix is only offered when it moves forward. Downgrades are never recommended."""
    if not candidate:
        return False
    if current is None:
        return True
    return version_tuple(candidate) > version_tuple(current)


def dependency_patch(ecosystem: str, name: str, current: str | None, fixed: str | None,
                     manifest: str, pinned_elsewhere: int = 0) -> PatchPlan | None:
    if not fixed:
        return None  # no fixed release published: nothing honest to recommend

    cur_major, fix_major = _major(current), _major(fixed)
    if cur_major is not None and fix_major is not None and fix_major > cur_major:
        blast = f"major version jump {cur_major} → {fix_major}; breaking changes possible"
    elif current:
        blast = f"same major line ({cur_major}); low blast radius"
    else:
        blast = "version in the manifest is unpinned; pin while applying"

    if ecosystem == "PyPI":
        return PatchPlan(
            strategy="upgrade",
            target_version=fixed,
            command=f'pip install -U "{name}>={fixed}" && '
                    f'python -m pip freeze > requirements.txt',
            files=[manifest],
            blast_radius=blast,
            verification=["python -m pip install -r requirements.txt",
                          "python -m pytest -q"],
            rollback=(f'pip install "{name}=={current}"' if current else
                      "restore the previous requirements.txt from version control"),
            notes=[f"pin {name}=={fixed} in {manifest}"] +
                  ([f"{pinned_elsewhere} other manifest(s) pin this package — update together"]
                   if pinned_elsewhere else []),
        )

    return PatchPlan(
        strategy="upgrade",
        target_version=fixed,
        command=f"npm install {name}@{fixed} --save-exact",
        files=[manifest],
        blast_radius=blast,
        verification=["npm ci", "npm test"],
        rollback=(f"npm install {name}@{current} --save-exact" if current else
                  "git restore package.json package-lock.json"),
        notes=[f"regenerate the lockfile so {name}@{fixed} is the resolved version"],
    )


def secret_patch(provider_hint: str, file: str, line: int) -> PatchPlan:
    return PatchPlan(
        strategy="rotate-secret",
        command=None,
        files=[file],
        blast_radius="credential is live until rotated; treat as compromised, not misplaced",
        verification=[
            f"confirm the value at {file}:{line} is gone from the working tree",
            "confirm the value no longer appears in git history (git log -S)",
            "confirm the old credential is rejected by the provider",
        ],
        rollback="n/a — rotation is one-way; issue a new credential if the replacement fails",
        notes=[
            f"rotate at the provider first ({provider_hint}); replacing the string does not revoke it",
            "replace the literal with an environment variable and add the file to .gitignore",
            "purge history with git filter-repo before the repo is shared again",
        ],
    )


def hygiene_patch(kind: str, file: str, detail: str = "") -> PatchPlan:
    if kind == "unpinned-dependency":
        return PatchPlan(
            strategy="pin",
            command="python -m pip freeze > requirements.txt  # or use pip-compile",
            files=[file],
            blast_radius="pinning does not change installed code; it makes the state reproducible",
            verification=["python -m pip install -r requirements.txt --dry-run"],
            rollback="restore the previous manifest from version control",
            notes=["an unpinned dependency has an unknown vulnerable-version range — it is not 'clean'"],
        )
    if kind == "container-tag-unpinned":
        return PatchPlan(
            strategy="config",
            command=None,
            files=[file],
            blast_radius="base image changes on every pull; digest pinning freezes it",
            verification=["docker build .", "docker image inspect --format '{{index .RepoDigests 0}}'"],
            rollback="restore the previous FROM line",
            notes=["pin by digest: FROM image@sha256:<digest>", detail] if detail else
                  ["pin by digest: FROM image@sha256:<digest>"],
        )
    return PatchPlan(
        strategy="manual",
        files=[file],
        blast_radius="unclassified",
        verification=["re-run elitze-scan after the change"],
        rollback="restore the previous file from version control",
        notes=[detail] if detail else [],
    )
