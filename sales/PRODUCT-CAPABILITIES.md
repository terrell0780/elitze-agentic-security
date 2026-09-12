# ELITZE Agentic Security — Product Capabilities

This document separates what the current repository explicitly describes from anything that would require deployment or external verification.

## Documented product capabilities

| Area | Repository-documented capability | Sales status wording |
|---|---|---|
| AI security | AI Security Gateway, agent boundaries, MCP and tool governance | Documented capability; deployment verification required |
| API security | API security and OpenAPI governance | Documented capability; deployment verification required |
| Application/code security | Code and software-supply-chain controls | Documented capability; deployment verification required |
| Cloud/identity/data | Posture, authorization, sensitive-data pathways and runtime context | Documented capability; deployment verification required |
| Exposure/vulnerability | Attack paths, CVE intelligence, remediation priority and verification | Documented capability; deployment verification required |
| SecOps | Investigation, governed response, containment, audit and evidence | Documented capability; deployment verification required |
| Global Security View | Interactive visual command surface | Documented capability; deployed behavior should be demonstrated before sale |
| REO | Continuous validation of reachable/exploitable conditions with evidence-backed retesting | Core documented capability; operational verification required |
| Security decision API | `POST /api/security/decision` | Repository-documented endpoint; runtime/configuration verification required |
| Kill-switch API | `POST /api/security/kill-switch` | Repository-documented endpoint; executor availability must be verified |
| Health API | `GET /api/health` | Repository-documented endpoint |
| Public search broker | `GET /api/search?q=...` | Repository-documented endpoint |
| Security state | `GET /api/market` | Repository-documented endpoint |
| Data hub | `GET /api/data-hub` | Repository-documented endpoint |
| Use cases | `GET /api/use-cases` | Repository-documented endpoint |
| CRM | `GET /api/crm` | Repository-documented authenticated endpoint |

## Security boundary

Internal security-decision and containment APIs require the ELITZE internal API key. Containment additionally requires an infrastructure executor. Without an executor, the documented behavior is to record the request and fail closed rather than claim infrastructure isolation.

## Production requirements documented by the project

1. Secret-managed environment variables.
2. `DATABASE_URL` configured.
3. `ELITZE_INTERNAL_API_KEY` configured.
4. Database migrations applied with `npm run db:migrate`.
5. Validation with `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
6. Deployment using the same runtime environment and database requirements.

## What is not claimed here

This file does not claim current customer count, recurring revenue, traffic, uptime, production telemetry, successful remediation history, regulatory certification, penetration-test certification, or live connector coverage unless separately evidenced.
