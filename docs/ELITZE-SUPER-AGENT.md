# ELITZE Super Agent

## Purpose
ELITZE Super Agent is the intelligence layer for the ELITZE Agentic Security control plane.

Deep reasoning → live research → code execution → MCP tools → Agent Reach → Security Graph / God's Eye View → policy-aware analysis → evidence

The model provider is an implementation detail. ELITZE remains the product identity and security control plane.

## Capabilities
- High-effort reasoning for security analysis, engineering and research.
- Live web research with source URLs.
- X Search for current public discussion and signals.
- Code execution through the model provider sandbox.
- Remote MCP servers with HTTPS-only configuration and optional allowed_tools.
- Tenant-scoped Agent Reach from agent_reachability.
- Tenant-scoped Security Graph / God's Eye View from security_graph_nodes and security_graph_edges.
- Existing ELITZE security skill registry.
- Real-time voice through short-lived browser credentials.
- Native image generation through grok-imagine-image-2.0.
- Interaction evidence written to evidence_records when the database is available.

## Security boundary
The model is never the authorization boundary.
The Super Agent can analyze, research, recommend and invoke explicitly configured read-only tools. Consequential infrastructure or customer actions must remain behind ELITZE identity, policy, authorization, approval, execution and verification controls.
Agent Reach and God's Eye View are read-only evidence views. They do not create reachability, graph edges, findings or posture.

## Environment
Required: XAI_API_KEY
Optional:
- ELITZE_SUPER_AGENT_MODEL — defaults to grok-4.7.
- XAI_BASE_URL — defaults to https://api.x.ai/v1.
- ELITZE_SUPER_AGENT_MCP_SERVERS — JSON array containing server_url, server_label, optional server_description, optional allowed_tools, and optional authorization_env.

## Browser voice
The server creates a short-lived realtime client secret using the server-side XAI_API_KEY. The browser connects using the xai-client-secret.<token> WebSocket protocol and never receives the permanent API key.

## UI
Authenticated users can open /console/super-agent.
The workspace provides mode selection, text chat, live source links, secure voice, image generation, and access to tenant-scoped Agent Reach and Security Graph context through tool use.

## Evidence states
When source records are missing, unavailable or insufficient, the agent must say so. Typical states are UNKNOWN, UNMEASURABLE, INSUFFICIENT_REACH, and UNAVAILABLE.

## Provider independence
ELITZE Super Agent is wrapped behind runSuperAgent(). The rest of ELITZE talks to the ELITZE agent interface rather than a provider-specific UI. This keeps the intelligence engine replaceable without changing the product identity or the security boundary.