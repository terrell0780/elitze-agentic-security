# ELITZE Tamper-Evident Evidence Architecture

## Purpose

ELITZE evidence must be independently verifiable. A database audit row is not sufficient proof because an administrator or compromised process could alter or delete it after the decision.

The evidence model therefore separates the security decision from its durable proof and makes provenance, freshness, integrity, and evidence state explicit.

## Evidence chain

`Source observation -> normalized event -> canonical payload -> hash -> previous-hash link -> signed receipt -> trusted timestamp -> retention/legal-hold controls -> export bundle -> independent verification`

Every production assertion MUST carry:

- `evidenceState`: `OBSERVED | INFERRED | SIMULATED | UNKNOWN | UNMEASURABLE`
- `source`: originating system or collector
- `sourceRef`: stable source identifier where available
- `observedAt`: timestamp of the underlying observation
- `freshUntil` or freshness policy where freshness can be established
- `contentHash`: SHA-256 hash of the canonical event payload
- `previousHash`: hash of the preceding event in the tenant evidence chain
- `tenantId`: owning tenant boundary
- `schemaVersion`
- `eventId`

`SIMULATED` is not an operational security result and must never be rendered as observed protection, observed attack activity, or verified remediation.

## Append-only event model

Production evidence storage must behave as append-only from the application boundary. Corrections are represented by a new event that references the superseded event; records are not silently overwritten.

An event should contain:

```text
id
sequence
occurredAt
recordedAt
tenantId
actor
subject
action
resource
policyDecision
result
provenance
source
sourceRef
evidenceState
observedAt
freshness
payloadHash
previousHash
signatureRef
timestampRef
schemaVersion
```

Sequence and chain verification must detect missing, reordered, modified, or replayed records.

## Hash chaining

The canonical payload is serialized deterministically before hashing. The record hash incorporates the previous record hash:

`H(n) = SHA256(canonicalPayload(n) || H(n-1))`

The chain therefore provides tamper evidence, not a claim of absolute immutability by itself. Stronger immutability requires protected storage and independent trust anchors.

## Signed decision receipts

Security decisions should produce a receipt containing at minimum:

- decision identifier
- decision: `ALLOW | DENY | REVIEW | UNKNOWN`
- policy/version identifier
- subject and resource identifiers
- evidence state
- event hash
- previous hash
- signing key identifier
- signature algorithm
- signature
- timestamp reference

ELITZE must support key rotation without invalidating historical receipt verification. Historical receipts retain the key identifier and verification material required by the customer's trust policy.

## Trusted timestamps

`recordedAt` is an application timestamp and must not be treated as independent proof of time. For high-assurance evidence, ELITZE should support an external or independently verifiable timestamp reference. A timestamp failure must be recorded rather than replaced with fabricated timing data.

## Retention and legal hold

Retention is policy-driven per tenant and evidence class. Legal hold prevents eligible evidence from being purged while the hold is active. Hold state, actor, scope, creation time, release time, and policy basis must themselves be evidenced.

Retention expiry does not rewrite historical records. Deletion or anonymization events must be separately auditable.

## Customer-controlled encryption

The evidence architecture supports tenant-controlled encryption keys. ELITZE must not require customer plaintext credentials simply to prove an evidence record. Key references, encryption metadata, rotation state, and access events belong in the evidence provenance model.

Actual customer-key integration is production only after a tenant configures and verifies the selected key-management path.

## Export bundles

An export bundle should contain:

```text
manifest.json
records.ndjson
receipts/
proof/
keys-or-key-references/
schemas/
verification-instructions.md
```

The manifest identifies the tenant, export scope, first/last sequence, first/last hash, event count, schema version, and bundle digest.

Exports MUST preserve evidence states and provenance. An export must never upgrade `UNKNOWN`, `UNMEASURABLE`, or `SIMULATED` into `OBSERVED`.

## Independent verification

The verification process must require no ELITZE service connection for the cryptographic checks. An independent verifier should be able to:

1. parse the manifest and event records;
2. recompute every canonical payload hash;
3. verify every previous-hash link;
4. check sequence continuity;
5. verify decision signatures using the supplied or customer-controlled verification material;
6. validate timestamp references where available;
7. recompute the bundle digest;
8. report the first failing record and failure type.

A verifier result should distinguish:

`VERIFIED` — integrity and signatures validated for the supplied verification material.

`FAILED` — one or more integrity/signature checks failed.

`INCOMPLETE` — evidence or verification material is missing, so no integrity conclusion can be reached.

## Verification CLI contract

Target command surface:

```bash
elitzectl evidence verify ./bundle
elitzectl evidence verify ./bundle --json
elitzectl evidence inspect ./bundle --event <event-id>
```

The CLI must be deterministic and suitable for use by auditors, incident responders, or an authorized independent security reviewer.

## Security boundary

The evidence layer does not replace authorization. A signed receipt proves what ELITZE recorded and signed; it does not prove that the underlying observation was truthful if the source itself was compromised. Therefore provenance and source trust remain first-class evidence fields.

ELITZE claims only what the evidence supports.

## Implementation states

`IMPLEMENTED` = live and independently verifiable in the deployed product.

`INTEGRATED` = code/control path exists and has been configured and verified against a real tenant/environment.

`PLANNED` = repository contract exists but live production verification is missing.

`BLOCKED` = required dependency or evidence is unavailable.

The repository must not display planned or blocked evidence capabilities as live protection.
