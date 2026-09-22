# ELITZE TypeSafe AI / Jev Decision Plane

ELITZE integrates the official TypeSafe JavaScript SDK as a server-side decision layer for bounded security decisions.

## Boundary

~~~text
ELITZE evidence + state
        ↓
TypeSafe / Jev typed decision
        ↓
ELITZE policy engine
        ↓
canonical remediation state machine
        ↓
enforcement / remediation
        ↓
observed outcome + evidence
~~~

Jev is advisory intelligence. It never becomes the security boundary, never directly executes a remediation action, and never declares a finding fixed.

## Integration

ELITZE uses the official @typesafe-ai/sdk package and TypeSafeClient.systemOne().

Environment:

~~~text
TYPESAFE_API_KEY
TYPESAFE_DEFAULT_MODEL=jev-latest
~~~

The Jev client is server-side only. The API key is never exposed to browser code.

## Decision Workloads

The adapter provides bounded decisions for:

- remediation approval routing
- vulnerability triage
- emerging-threat response
- red-team campaign selection
- runtime anomaly classification
- evidence-strength classification

Jev output remains a recommendation. ELITZE policy thresholds and hard gates determine whether a transition is allowed.

## Fail-Closed Behavior

No API key, timeout, provider error, malformed decision, or low-confidence condition grants permission.

Fallback:

~~~text
Jev unavailable
    ↓
ELITZE deterministic policy
    ↓
ALLOW only if policy independently permits
OR
HOLD / HUMAN REVIEW
~~~

## Data Boundary

The adapter redacts keys that commonly contain secrets or credentials before external inference. ELITZE should pass normalized security state rather than raw secrets, credentials, private keys, cookies, or unnecessary customer records.

## Canonical Remediation States

Only these values may be persisted as remediation current_state:

~~~text
DETECTED
IDENTIFIED
CORRELATED
TRIAGED
EXPOSURE_VALIDATION
EXPLOITABILITY_VALIDATION
BLAST_ANALYZED
REMEDIATION_PLANNED
SAFETY_CHECKED
APPROVAL_REQUIRED
PREPARED
PREVALIDATED
CANARY_DEPLOY
EXPLOIT_REGRESSION
FUNCTIONAL_VERIFY
SECURITY_VERIFY
VERIFIED_FIX
CONTAINED
ROLLBACK
ROLLED_BACK
BLOCKED
HOLD
MONITORING
REOPENED
~~~

Decision words such as PASS, FAIL, RETRY, REASSESS, ESCALATE and CONTAIN are events/actions, not persisted states.

Only VERIFIED_FIX means the remediation has passed required security and functional verification.

## Failure Transitions

Examples:

~~~text
SAFETY_CHECKED + SAFETY_FAILED
    → BLOCKED

SAFETY_CHECKED + SAFETY_UNCERTAIN
    → HOLD

CANARY_DEPLOY + CANARY_OPERATIONAL_FAILED
    → ROLLBACK

EXPLOIT_REGRESSION + EXPLOIT_STILL_SUCCEEDS
    → CONTAINED

FUNCTIONAL_VERIFY + FUNCTIONAL_VERIFICATION_FAILED
    → ROLLBACK

SECURITY_VERIFY + SECURITY_VERIFICATION_PASSED
    → VERIFIED_FIX

VERIFIED_FIX + RUNTIME_ATTACK_OBSERVED
    → REOPENED
~~~

There are no implicit failure jumps and no undefined states.

## Evidence

Each transition can be written to the ELITZE audit ledger with:

- remediation ID
- finding ID
- asset ID
- previous state
- next state
- event
- transition allowed/denied
- reason
- context

The database migration creates current-state and append-only transition tables with canonical-state constraints.

## Safety Principle

Jev can recommend.
ELITZE policy can authorize.
The canonical state machine can transition.
Evidence proves what actually happened.
