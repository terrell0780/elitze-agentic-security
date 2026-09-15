# ELITZE Performance and Failure Evidence

## Purpose

This document is the acceptance contract for publishing performance, reliability, recovery, and security-failure results. ELITZE must never publish a benchmark number, reliability percentage, false-positive rate, false-negative rate, RPO, RTO, or fail-closed claim unless the result is backed by reproducible evidence.

## Claim states

- `UNMEASURED`: no valid benchmark or test evidence exists.
- `MEASURED`: a result exists with complete methodology and evidence, but independent reproduction has not yet occurred.
- `REPRODUCED`: an independent execution reproduced the stated result within the documented acceptance criteria.
- `FAILED_REPRODUCTION`: the independent execution did not reproduce the result.
- `INVALID`: evidence is incomplete, contradictory, stale, or methodologically unsound.
- `NOT_APPLICABLE`: the metric is not applicable to the tested deployment mode.

Documentation alone never creates a measured result.

## Required benchmark record

Every published result must identify:

- product version, commit or release identifier
- benchmark/test harness version
- dataset identifier and immutable dataset digest where applicable
- environment and topology
- CPU, memory, storage and relevant network configuration
- database and runtime versions
- configuration and policy version
- workload shape and request distribution
- concurrency and duration
- warm-up procedure
- sample count
- measurement clocks and units
- exclusions and failed runs
- date/time and timezone
- operator or test owner
- raw evidence location
- reproducibility command or procedure
- result status

No performance number may be derived from production customer telemetry unless its collection scope, tenant authorization and methodology are documented.

## Performance metrics

### Policy decision latency

Measure at minimum:

- p50
- p95
- p99
- maximum observed latency
- decision throughput

Measure separately for cache-hit, cache-miss, policy evaluation, evidence write, and end-to-end enforcement where technically distinguishable.

### Event-ingestion throughput

Record:

- sustained events/second
- burst events/second
- queue depth
- ingest latency
- rejection/error rate
- backpressure behavior
- evidence persistence latency

### Graph calculation time

Measure graph queries and calculations using a documented graph size and topology. Include node/edge counts, query shape, maximum traversal depth, cold/warm state, and database configuration.

### Enforcement availability

Availability claims require a defined service boundary, observation period, numerator/denominator, planned maintenance treatment, error-budget methodology, and raw availability evidence.

Do not publish an availability percentage merely because a service was reachable during a short manual test.

## Security-quality measurements

### False positives

The denominator, ground-truth source, test corpus, decision threshold, and classification procedure must be disclosed. A detection result must not be called a false positive unless the expected security classification is independently established.

### False negatives

False-negative analysis must document the attack/test corpus, expected detections, missed cases, policy configuration, execution path, and root-cause analysis. Security-sensitive results must not be hidden because they reduce headline accuracy.

### Tenant isolation

Isolation testing must exercise at least:

- direct reads/writes
- authorization checks
- graph traversal
- evidence queries and exports
- caches
- asynchronous jobs
- background processing
- credentials and delegated authority
- cross-tenant identifiers supplied by callers

Any successful unauthorized cross-tenant access is a release-blocking failure until contained and retested.

## Recovery objectives

### Recovery-point objective (RPO)

RPO must be measured from actual backup/replication behavior. Record the configured target, observed data-loss interval, workload, storage topology, test date, and recovery evidence.

### Recovery-time objective (RTO)

RTO must be measured using an actual recovery exercise. Record outage start, restore/failover actions, service restoration time, validation time, and total elapsed recovery time.

A documented target is not evidence that the target has been achieved.

## Failure behavior

### Fail-closed

Fail-closed claims require an authorized test that removes or invalidates the required policy dependency and demonstrates that protected execution is denied or held for review according to the declared enforcement contract.

Test at minimum:

- policy decision service unavailable
- policy data unavailable or stale
- identity unavailable or invalid
- MCP/tool identity missing
- required evidence unavailable
- authorization state missing or expired
- network timeout
- dependency error during enforcement

Record the exact request, expected result, observed result, evidence receipt, and release/version tested.

A UI label such as `protected`, `blocked`, or `fail-closed` is not evidence of fail-closed behavior.

## Reproduction protocol

Independent reproduction must use the published version, methodology, dataset or a permitted equivalent, and declared environment. The verifier must be able to reconstruct the test without access to private customer data.

Where exact reproduction is impossible because of hardware, cloud, provider, or tenant-specific conditions, ELITZE must publish the relevant variance and must not present the result as universally reproducible.

## Publication rules

Published reports must separate:

- measured result
- expected target
- acceptance threshold
- independent reproduction result
- unresolved limitations

Never replace missing evidence with an estimate, benchmark copied from another product, theoretical capacity, synthetic customer claim, or simulated operational metric presented as production behavior.

## Release gate

A performance or failure-behavior claim is publishable only when:

1. the evidence package is complete;
2. the methodology and version are frozen;
3. raw or independently verifiable evidence is retained;
4. the result passes the stated acceptance criteria; and
5. any independent reproduction requirement has passed or is explicitly disclosed as pending.

Otherwise the claim remains `UNMEASURED`, `MEASURED`, `INVALID`, or `PENDING REPRODUCTION` as appropriate. It must not be converted to a marketing performance claim.
