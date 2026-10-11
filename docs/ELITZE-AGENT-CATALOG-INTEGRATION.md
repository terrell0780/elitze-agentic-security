# ELITZE Agent Catalog Integration - Implementation Notes

## Canonical product

ELITZE Agentic Security remains the only canonical application. The agent passport catalog, truth-state UI, vulnerability triage, and AST structural comparison are implemented in the existing Next.js application. No separate product or production deployment was created.

## Source archive and roster provenance

The role catalog was derived from the supplied local Python source archive and checked against its static dashboard and agent prompt catalog. A separate TypeScript agent/workflow package was reviewed as a distinct source bundle and is not treated as the canonical roster.

The Python source archive's LICENSE text is internally contradictory: it labels itself MIT while also stating that permission is not granted and restricting use of the source product name and branding. No source files or source branding were copied into the ELITZE application. The VPR formula was independently implemented from the documented formula. Resolve the source archive's license and IP provenance before any source-code redistribution or buyer transfer.

## Implemented

- Added all 24 source-derived role IDs to the ELITZE Agent Passport catalog, grouped into Offensive, Defensive and Operations.
- Passport records mark catalog truth as DECLARED and runtime truth as UNKNOWN. Execution windows and active authorization remain UNKNOWN; documented skills are not represented as live grants.
- Added a shared truth-state legend and the Claim -> Source -> Observation -> Evidence Reference chain to the ELITZE control surface. Schematic graph nodes and relationships are marked DECLARED.
- Added evidence references and explicit truth states to external vulnerability-intelligence results.
- Ported the documented context-aware VPR formula to TypeScript. It returns a score only when CVSS and all four explicit context inputs are supplied; it does not silently assume asset criticality, exposure, data classification or exploit availability.
- Added authenticated POST /api/vulnerabilities/reachability for bounded, in-process source/sink/sanitizer pattern triage. Submitted code is not executed, persisted or sent to an external provider. Pattern co-occurrence is INFERRED, never treated as proof of exploitability.
- Added authenticated POST /api/vulnerabilities/ast-diff for TypeScript/TSX/JavaScript/JSX syntax-tree node and hashed leaf-token comparison. Source text is not returned in diff details; syntax errors produce UNMEASURABLE.
- Added tenant-scoped progressive-proof API fields for truth state, evidence reference and evidence hash.
- Added CSV evidence export with formula-injection escaping, truth state, source reference and hash. The UI explicitly does not claim SOC 2 certification.
- Added self-tests for the 24-role roster, VPR formula, source/sink triage and AST structural comparison.

## Known limitations and remaining gates

- Reachability triage is a pattern heuristic, not control-flow or data-flow proof. A sink/source match cannot confirm exploitability; sanitizer matches are candidates only.
- AST comparison is structural and token-hash based, not semantic-equivalence proof, patch verification or regression testing. Run the actual test suite against any proposed patch.
- The supplied Python code describes patch-generation concepts and claims AST-diff functionality, but the inspected source archive did not contain a complete semantic AST-diff verifier or evidence supporting the advertised performance metrics.
- No agent passport is connected to a live agent runtime, scheduler, policy engine or verified execution. Do not claim the 24 agents are operational.
- The Python backend, its SQLite database and its executable have not been imported into or deployed alongside ELITZE. The single canonical application remains Next.js.
- Controlled integrations must be explicitly configured and authorized. This change does not establish that any external feed or scanner connection has been authenticated, exercised end to end, or verified in production.
- Live production auth/recovery, runner challenge-response, real integration execution, dependency audit, and acquisition readiness are separate verification gates. This change does not certify them.
- Do not deploy these changes until typecheck, lint, relevant self-tests and a production build pass, followed by explicit deployment authorization.

## Provenance rules

A catalog entry is not an operational agent. A public intelligence record is not proof of tenant exposure. Missing context remains UNKNOWN or UNMEASURABLE. Compliance mapping is not certification.
