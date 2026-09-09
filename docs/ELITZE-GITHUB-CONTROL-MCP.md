# ELITZE GitHub Control MCP

The ELITZE GitHub Control MCP is a stdio Model Context Protocol server for controlled repository operations. It is designed to give an ELITZE agent a narrow, auditable GitHub tool surface rather than shell access to `git` or unrestricted GitHub automation.

## Scope

The server exposes:

- repository metadata
- GitHub code search
- repository file reads at an explicit ref
- commit inspection
- pull-request metadata, changed files, and reviews
- explicit branch creation from an exact commit SHA
- explicit UTF-8 file replacement using the current blob SHA
- pull-request creation

Pull-request merge is intentionally not exposed. Release/merge remains a separate human-controlled action.

## Security controls

- `GITHUB_TOKEN` is required at runtime and is never stored in the repository.
- `GITHUB_REPOSITORY` can establish the default repository; tools also accept an explicit `owner/name`.
- Mutations fail closed unless `ELITZE_GITHUB_MCP_WRITE=true` is explicitly enabled.
- File replacement requires the current blob SHA, reducing lost-update risk.
- Branch creation requires an exact existing commit SHA.
- No arbitrary shell commands, local filesystem writes, credential retrieval, or arbitrary Git execution are exposed.
- GitHub API failures are returned as `UNAVAILABLE`; the server does not synthesize repository state.

## Run locally

```text
npm run mcp:github
```

Required runtime configuration:

```text
GITHUB_TOKEN=<real GitHub token supplied by the runtime secret manager>
GITHUB_REPOSITORY=terrell0780/elitze-agentic-security
ELITZE_GITHUB_MCP_WRITE=false
```

Only enable write mode in an explicitly authorized environment. Do not paste tokens into source, documentation, chat, or commits.

## Agent Reach / REO / RIO relationship

This MCP is a GitHub control-plane integration, not a ranking or reach claim. It can provide agents with evidence-backed repository state that ELITZE workflows may use for REO/RIO evidence collection, release review, and security engineering. It does not invent search visibility, rankings, customer activity, or repository health metrics.

## Verification boundary

The presence of this server and its MCP dependency proves code/configuration exists. It does not by itself prove that a GitHub token is configured, that the MCP host is connected, or that a requested repository mutation succeeded. Those states must be verified from real runtime responses.
