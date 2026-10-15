---
name: elitze-pr-repair
description: Triage and repair ELITZE GitHub pull requests by preserving valid fixes, resolving current-main conflicts, running relevant checks, and documenting evidence.
---

# ELITZE Pull Request Repair

Use this skill when asked to fix, reconcile, or complete pull requests in the ELITZE repository.

## Procedure

1. Confirm the repository, base branch, PR head, latest base SHA, changed files, and current workflow status.
2. Read the full diff and relevant callers/tests before editing. Separate unrelated changes so useful security fixes are not lost while removing or replacing one feature.
3. Rebase the work conceptually against current main or create a fresh branch from the latest base when the existing branch is stale. Never silently overwrite another author's unrelated work.
4. Make the smallest complete set of changes that meets the requested behavior. Keep APIs, database semantics, documentation, tests, UI text, examples, and configuration consistent.
5. Search for stale references after the main edit. Remove dead source files, scripts, configuration keys, docs, and UI claims when they are no longer used; preserve unrelated controls and compatibility required by existing data.
6. Run targeted tests first, followed by typecheck, lint, build, dependency checks, and relevant security tests when available. Do not state a check passed unless its result is observed.
7. Review the final diff for unrelated changes, missing migrations, exposed secrets, unsafe test targets, or fake evidence.
8. Open or update a PR with a clear summary and verification record. Do not merge while required checks fail, conflicts remain, or material findings are unresolved.
9. Never bypass a failing gate simply to make the PR green. Explain the actual failure and make the narrow repair.
10. Do not deploy to production unless the user explicitly authorizes deployment.

## Done means

The PR points at the intended current base, the requested changes and related cleanup are included, relevant checks are verified, and the PR description states what evidence those checks do and do not establish.
