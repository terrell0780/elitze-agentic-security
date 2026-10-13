# ELITZE Agentic Security — FAQ

## What does ELITZE protect?

ELITZE focuses on agent identity and MCP runtime security: discover agents and MCP servers, map access, evaluate policy before sensitive tool execution, observe authorized activity, retest changes, and preserve verifiable evidence.

## Does a graph node mean that an asset is exploitable?

No. Graph relationships represent recorded tenant data and retain source/evidence labels. Asset-specific reachability or exploitability is UNMEASURABLE when relevant inventory, network path, authorization or runtime evidence is missing.

## What does the Autonomous Analyst do?

The analyst runs an evidence-bounded workflow over tenant-scoped OBSERVED security-fabric events. Deterministic detection rules identify explicitly supported patterns. An optional LangGraph/NVIDIA NIM review may prioritize known finding IDs and highlight evidence gaps. Model output cannot create a finding, change source severity, or authorize execution.

## What is LangGraph used for?

LangGraph defines the analysis steps and state transitions. The recursive review is bounded to at most two model passes. Missing data is not replaced by generated events or assumed healthy posture.

## How is NVIDIA NIM connected?

A tenant administrator may configure an HTTPS NIM-compatible /v1 endpoint, model ID and API key. The key is encrypted at rest. A successful /v1/models probe is required to establish that the endpoint and selected model are available. A stored configuration alone is NOT_VERIFIED.

## Does ELITZE integrate with the Recursive product?

The current implementation provides bounded recursive reasoning inside LangGraph. It does not claim a direct third-party Recursive API integration. That connection remains NOT_CONFIGURED unless a supported API contract and authorized credentials are supplied.

## Does the threat detector generate sample attacks or findings?

No. Rules consume only authenticated tenant records explicitly marked OBSERVED. Non-observed rows are counted separately and ignored for matching. Empty evidence yields UNMEASURABLE, not a clean or safe verdict.

## What does the 3D globe show?

Only source-observed events whose payload includes valid latitude/longitude coordinates. The sphere and latitude/longitude grid are visual context, not a map of detected threats. No coordinate is guessed or generated.

## How does adversary emulation work?

The public ATT&CK catalogue is retrieved from the official MITRE Enterprise STIX dataset. An execution request requires a target, permitted scope/profile, authorization reference and unexpired Rules of Engagement. ELITZE's current runner executes its supported scanner profile; a selected ATT&CK technique is planning metadata unless a compatible technique-specific executor confirms an actual run.

## Is AttackIQ connected?

No direct AttackIQ platform connector is claimed. Public adversary-emulation principles inform the plan, but ELITZE will not invent undocumented API behavior, credentials or execution results.

## Can evidence be exported to Obsidian?

Authenticated users can export the latest observed tenant security-fabric records to Markdown with YAML metadata and ATT&CK wikilinks where a source supplied a valid technique ID. A bounded obsidian://new link is available for convenience; use the full .md download for the complete export.

## Which search/SEO data is live?

The protected MCP endpoint supports Google Search Console Search Analytics and GA4 Data API requests when an authorized access token and property are configured. No traffic, ranking, impression, click or conversion metric is created when those data sources are unavailable.

## What do NOT_CONFIGURED, UNKNOWN and UNMEASURABLE mean?

- **NOT_CONFIGURED:** there is no saved/selected integration configuration.
- **UNKNOWN:** records exist, but available facts do not establish the requested conclusion.
- **UNMEASURABLE:** required source data or an operational measurement path is missing.
- **INSUFFICIENT_REACH:** the observed and authorized graph does not establish enough of the path to make the claim.

## Does a passing build prove production pentesting is live?

No. A build proves that the source compiled. A real runner requires a stable HTTPS host, protected HMAC/token configuration, a successful signed production handshake, an in-scope target with authorization and a verified runner callback containing source-backed findings or a confirmed clean scan result.
