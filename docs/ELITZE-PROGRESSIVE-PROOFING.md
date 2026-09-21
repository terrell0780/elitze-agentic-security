# ELITZE Progressive Proofing

Progressive proofing is a fail-closed evidence ladder for real tenant-scoped MCP decisions.

## Proof ladder

UNMEASURABLE → OBSERVED → INTEGRITY_VERIFIED → RETESTED → PROVEN

OBSERVED requires a persisted observed evidence record with a source reference, observation time, and evidence hash.

INTEGRITY_VERIFIED requires a valid signed evidence receipt or an explicitly persisted VERIFIED receipt status.

RETESTED requires an actual authorized runtime retest recorded as PASSED.

PROVEN additionally requires an observed upstream result hash.

A dashboard state never advances the ladder. Missing, stale, unavailable, or unverifiable evidence stops progression and remains visible.

## Security boundary

Progressive proofing does not decide whether the original source was trustworthy. A valid ELITZE receipt proves what ELITZE recorded and signed. Source trust, authorization, provenance, and tenant scope remain independent requirements.

No synthetic observations, fabricated retests, simulated upstream results, or inferred proof states are generated.

## Console endpoint

Authenticated tenants can inspect recent proof stages at /api/console/progressive-proofing.

The console reports the next missing proof step rather than converting incomplete evidence into success.
