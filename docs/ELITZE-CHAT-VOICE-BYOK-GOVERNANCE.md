# ELITZE Chat, Voice, BYOK/BYOA/BYOB — Governance and Sale Readiness

## Product boundary

ELITZE Chat is a tenant-scoped conversation workspace. Authentication, tenant authorization, policy evaluation, external AI routing, evidence-aware RAG context, file access, voice signaling, and integration configuration are separate control points.

The model is not the security boundary.

## Chat

Chat generation requires an authenticated tenant session and an allowed `chat.generate` policy decision.

The platform does not substitute simulated live security telemetry. Upstream model output is treated as model output, not as authoritative security evidence.

Tenant-scoped RAG material is explicitly treated as untrusted context. Prompt content from retrieved material must not become policy instructions.

## BYOK / BYOA / BYOB

- BYOK: tenant-controlled model endpoint.
- BYOA: tenant-controlled agent endpoint.
- BYOB: tenant-controlled bot endpoint.

Secrets are encrypted at rest with AES-256-GCM using a server-only integration encryption key. Secrets are never returned through inventory APIs.

Only the configured compatible model invocation protocol is currently executed by the ELITZE Chat runtime. Stored agent/bot connections remain explicitly marked as unsupported until their invocation contracts are implemented and verified.

## Files

Uploads are authenticated and tenant/channel scoped, hashed with SHA-256, bounded to 10 MB per file and six files per request, and protected against common executable/script extensions.

Authenticated members of the same tenant can upload and download files in active tenant channels; anonymous public file access remains disabled. Download authorization is still policy-gated and audited, and returned content includes the SHA-256 digest.

New attachments are stored with the explicit state `NOT_SCANNED`. Uploads enforce tenant/channel authorization, policy checks, size limits, active-content extension restrictions, and SHA-256 hashing; file bytes are not sent to a scanning provider or inspected for malware. Downloads remain tenant-scoped, policy-gated, and audited. Users should upload only files from trusted sources.

## Voice

ELITZE Voice uses browser WebRTC media with tenant-scoped signaling stored in PostgreSQL. Join/leave/signal requests are policy-gated and audited.

The product must not claim universal NAT traversal or carrier-grade calling until a real TURN service is connected and tested. Browser microphone permission remains controlled by the user.

## TeamSpeak

TeamSpeak integration configuration is tenant-scoped. The Web Query URL must be HTTPS and private/loopback targets are rejected. API credentials are encrypted at rest and never returned.

The integration is not labeled connected unless a real health/connection check has completed.

## Search

First-party ELITZE capability search is local and deterministic.

Public web search is brokered by ELITZE and returned content is treated as untrusted external data. Search snippets are filtered for common prompt-injection strings but are never treated as security policy.

Google Search visibility is governed by first-party, people-first content, crawlable links, accurate structured data, canonical URLs, and compliance with Google's Search Essentials and spam policies. There is no ranking guarantee.

## Global compliance posture

This document is a product-control mapping, not a legal certification.

The control model is intended to support risk management and evidence collection aligned with widely used sources including NIST AI RMF / Generative AI Profile, OWASP application security guidance, OWASP LLM guidance, and applicable regional AI/privacy/security requirements.

ELITZE does not claim legal compliance solely because a control exists. Customer-specific legal and regulatory applicability remains a separate assessment.

## Canonical identity

Canonical origin: https://elitze.info

Secondary canonical host: https://www.elitze.info

No alternate production domain or public contact email is part of the ELITZE product surface.
