# ELITZE · Agentic Security — Implementation Completeness Contract

This repository is governed by one rule: a control is not considered implemented merely because it appears in a UI, README, roadmap, or architecture document.

## Production status rules

- **Implemented** means executable code exists, is reachable through the intended runtime path, persists or emits evidence where required, and is covered by verification.
- **Integrated** means the external dependency is configured and the integration path is executable; credentials and tenant configuration are supplied at deployment time.
- **Planned** means the requirement exists in architecture but no production implementation exists yet. Planned capability must never be represented as active protection.
- **Blocked** means implementation cannot be completed without an external dependency, credential, infrastructure capability, or customer-controlled system.

## Mandatory control planes

1. AI asset and agent discovery
2. Human and non-human identity
3. Purpose binding and least privilege
4. AI Policy Enforcement Point before generation and tool execution
5. Tool/MCP authorization
6. Data and secret authorization
7. Runtime telemetry and behavioral detection
8. Containment and kill-switch execution
9. Offensive validation and regression testing
10. Attack-path and blast-radius analysis
11. Vulnerability and exposure correlation
12. Evidence, audit, and immutable decision history
13. SOC/SIEM/SOAR integration
14. CI/CD security gates
15. Tenant isolation and enterprise IAM
16. Resilience, backup, recovery, and operational observability

## Safety boundary

Models are untrusted decision inputs. Authorization, policy, credentials, network controls, sandboxing, and containment must remain independently enforceable.

## Release gates

A production release must pass typecheck, lint, automated tests, security self-tests, migration verification, build verification, and configuration validation. A missing secret or external integration must fail closed where that dependency is security-critical.
