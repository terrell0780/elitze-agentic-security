# ELITZE Portable Policy Enforcement

## Purpose

ELITZE policy must not depend on the ELITZE console being the execution environment. The policy decision point (PDP) and policy enforcement point (PEP) are separate contracts.

A customer may keep credentials, workloads, tools, MCP servers, and execution inside its own environment while ELITZE provides policy decisions, provenance, and evidence when the customer authorizes that connection.

## Canonical flow

`Customer workload -> local PEP -> ELITZE PDP (or customer-local PDP) -> allow / deny / review -> local execution -> evidence -> ELITZE verification`

The enforcement point must remain capable of failing closed for policies configured as mandatory. A remote PDP outage must never be represented as an allow decision. The result must be `UNKNOWN` / `UNMEASURABLE` when a required decision cannot be established.

## Portable interfaces

The portability contract covers:

- TypeScript SDK
- Python SDK
- Go SDK
- MCP gateway / plugin enforcement adapter
- Kubernetes validating admission controller
- CI command-line interface
- Open Policy Agent-compatible policy evaluation interface
- REST decision and evidence APIs
- event ingestion and decision events
- Terraform provider for policy/configuration lifecycle

These are interfaces and implementation targets. They are not claims that every adapter is currently production-integrated.

## PDP / PEP separation

### Policy Decision Point (PDP)

The PDP evaluates a normalized authorization request containing at minimum:

- tenant identity
- subject / agent identity
- delegated authority where applicable
- action
- resource
- MCP server and tool identity where applicable
- model/provider where applicable
- data classification
- policy version
- requested execution context

The PDP returns a structured decision:

`ALLOW | DENY | REVIEW | UNKNOWN`

plus a decision identifier, policy version, evidence state, constraints, and expiry where applicable.

### Policy Enforcement Point (PEP)

The PEP owns the actual execution boundary. It must:

1. construct the request from locally observed state;
2. obtain or evaluate the decision;
3. enforce `DENY` and configured `REVIEW` gates before side effects;
4. apply returned constraints;
5. execute only within the authorized scope;
6. emit execution evidence;
7. link execution evidence to the decision identifier;
8. support retesting and verification.

A PDP response is authorization advice; it does not itself execute the customer action.

## Local-first deployment modes

### Customer-local PDP

The customer can run a policy evaluator locally and synchronize ELITZE-governed policy artifacts. This minimizes data leaving the customer environment and avoids placing secrets in ELITZE.

### Remote ELITZE PDP

The customer can call ELITZE for policy decisions while keeping credentials and tool execution local. Requests should contain only the minimum information necessary for the decision and evidence contract. Raw credentials must not be sent to ELITZE.

### Hybrid

The customer can keep sensitive decision inputs and execution local while sending signed decision metadata, hashes, and non-secret evidence to ELITZE for verification and governance.

## Evidence contract

Every portable enforcement adapter should preserve these correlations:

`request_id -> decision_id -> policy_version -> execution_id -> evidence_id -> verification_id`

Evidence must identify whether a fact was `OBSERVED`, `INFERRED`, `UNKNOWN`, or `UNMEASURABLE`.

Portable integrations must never manufacture successful execution, reachability, telemetry, or verification records when the customer system did not provide them.

## Adapter requirements

### TypeScript SDK

Provide typed request/decision/evidence objects and an enforcement wrapper suitable for Node.js services and TypeScript agents.

### Python SDK

Provide typed request/decision/evidence models and a synchronous/asynchronous client suitable for Python agents, services, and CI systems.

### Go SDK

Provide strongly typed PDP/PEP contracts and a low-dependency client suitable for gateways, operators, and infrastructure services.

### MCP gateway / plugin

Enforce authorization at the tool execution boundary. Tool identity, MCP server identity, agent identity, requested action, and relevant classification must be evaluated before sensitive execution.

### Kubernetes admission controller

Use a validating admission webhook for policies that must reject non-compliant resources before admission. The controller must preserve Kubernetes-native AdmissionReview identity and correlate the authorization decision with the admitted object. Kubernetes admission webhooks are an established extension point for validating requests before persistence. See Kubernetes documentation. 

The adapter should default to deny/review semantics only where the configured policy requires a hard gate; fail-open behavior must never be silently introduced for a mandatory security control.

### CI CLI

Expose deterministic commands for policy check, authorization test, evidence verification, and release gate evaluation. CI must return non-zero on a configured blocking decision.

### OPA-compatible interface

Expose a normalized JSON input contract compatible with OPA-style policy evaluation. OPA separates evaluation from enforcement and supports REST evaluation plus other deployment models, making it suitable as a compatibility boundary rather than an ELITZE dependency. See OPA documentation.

The ELITZE contract must preserve ELITZE decision identifiers, evidence state, provenance, constraints, and verification semantics even when policy evaluation occurs through OPA.

### REST API

At minimum:

- `POST /api/policy/decide`
- `POST /api/policy/evidence`
- `POST /api/policy/verify`
- `GET /api/policy/decisions/{id}`
- `GET /api/policy/policies/{id}`

Responses must be versioned and machine-readable.

### Event API

Support signed or authenticated decision, execution, and verification events. Event replay must not silently create a second execution or overwrite stronger evidence.

### Terraform provider

Manage policy identifiers, policy versions, bindings, portable enforcement configuration, and evidence destinations. Secrets must remain in the customer's secret-management system rather than Terraform state whenever the provider contract permits.

## Security boundary

The portable product must preserve the ELITZE principle:

**The model is not the security boundary.**

Prompt text, model output, tool descriptions, or agent intent cannot grant authority. Authorization must be evaluated against identity, policy, resource, delegation, and observed context at the actual execution boundary.

## Production status rule

An adapter is `IMPLEMENTED` only when its code path is deployed and independently verified with a real customer/provider environment.

An adapter that exists in the repository but has not been configured and verified is `INTEGRATED` or `PLANNED` according to the Category Leader Manifest. It must not be shown as an active production control.

No fake integration status, synthetic customer activity, placeholder telemetry, invented enforcement results, or simulated execution is permitted.
