# ELITZE Agentic Security — Business Process Handoff

**Handoff date:** October 2, 2026 PDT
**Canonical product:** ELITZE Agentic Security
**Canonical domain:** `https://elitze.info`
**Canonical repository:** `terrell0780/elitze-agentic-security`
**Branch:** `main`

## Transaction definition

ELITZE is being offered as an **outright software/IP acquisition**.

The seller is **not** offering an ongoing SaaS subscription, managed hosting, billing operation, customer-support organization, renewals program, or customer-success service.

The seller-side business process ends with a controlled transaction handoff. After closing, the buyer owns the agreed operating model unless separate transition services are expressly documented.

## Seller handoff lifecycle

`Inbound → Lead Record → Qualification → NDA → Diligence → Offer → Contract → Closing → Transfer`

### 1. Inbound
Acquisition, repository-access, and general product inquiries enter through the public acquisition surface.

Current seller contact:
`tsh_cook@hotmail.com`

This is the only seller contact address represented in the acquisition workflow.

### 2. Lead Record
Every acquisition/general/repository inquiry is persisted in `acquisition_leads` before the notification email is attempted.

The notification email is not the system of record.

### 3. Qualification
The seller records whether the prospective buyer is identified and whether access to private source material is appropriate.

Qualification is a transaction-control step, not proof of available customer traction.

### 4. NDA
Private source review requires an appropriate NDA before access is granted.

No signed NDA is implied by the existence of this document.

### 5. Diligence
Diligence is controlled around:

- repository and commit history;
- technical architecture;
- database schema/migrations;
- authentication and authorization;
- CI/security gates;
- dependencies and SBOM;
- IP/domain/brand ownership;
- disclosed historical public exposure;
- known blockers and unverified operational evidence.

### 6. Offer
Commercial consideration is negotiated privately.

No public price, valuation or outcome is represented as established fact without evidence.

### 7. Contract
The definitive agreement controls exactly what transfers, including any domain, brand assets, infrastructure, contracts, data, transition assistance or other assets.

### 8. Closing
Closing requires the parties' agreed legal and financial conditions to be satisfied.

### 9. Transfer
The buyer receives the assets expressly included in the definitive agreement and establishes or assumes post-transfer hosting, credentials, support, billing, customer operations and other service responsibilities unless the parties separately agree otherwise.

## Customer / revenue status

The transfer package does **not** represent an active customer base, recurring revenue, renewals, support queue, or managed SaaS operation unless separate evidence is provided.

The buyer should verify:

- current customer contracts, if any;
- revenue records, if any;
- customer data, if any;
- infrastructure accounts, if any;
- support obligations, if any;
- licenses and third-party obligations, if any.

No customer relationship should be inferred from a product screen, CRM schema, customer-validation document or architecture reference.

## System of record

Acquisition lifecycle state is held in the acquisition pipeline:

- `acquisition_leads`
- `acquisition_lead_events`
- `crm_contacts` only when a contact is deliberately converted/linked.

Stage states:

`NEW → QUALIFIED → NDA → DILIGENCE → OFFER → CONTRACT → CLOSED_WON / CLOSED_LOST`

Stage transitions create audit events.

## Evidence rule

A claim is represented only when the underlying evidence exists. Empty tables mean no current records, not a hidden customer base.

The package must distinguish:

- IMPLEMENTED
- CONFIGURED
- INTEGRATED
- VERIFIED
- BLOCKED
- UNKNOWN
- UNMEASURABLE

Documentation, code presence and passing tests are not substitutes for live customer or revenue evidence.

## Production database alignment

The current source contains migrations through `0028_acquisition_pipeline.sql`.

Production Neon `main` must be migrated through the transfer commit before the environment is described as schema-aligned.

Do not seed synthetic acquisition or customer records merely to make the dashboard appear populated.

## Post-transfer operation

Customer onboarding, production hosting, billing, support, security operations, renewals, account management and service-level commitments are **buyer-owned post-transfer responsibilities** unless expressly included in a separate written transition agreement.

## Handoff standard

The seller's definition of business-process readiness is:

**A buyer can identify the asset, qualify access, execute diligence, negotiate the transaction, close under written terms, and receive a clean transfer package without the seller pretending to operate a SaaS business that does not exist.**
