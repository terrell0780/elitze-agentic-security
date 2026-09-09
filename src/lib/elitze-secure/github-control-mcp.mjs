import { McpServer } from "@modelcontextprotocol/server";
import { StdioServerTransport } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

const token = process.env.GITHUB_TOKEN?.trim();
const defaultRepository = process.env.GITHUB_REPOSITORY?.trim();
const allowWrite = process.env.ELITZE_GITHUB_MCP_WRITE === "true";

const server = new McpServer({
  name: "elitze-github-control",
  version: "1.0.0",
});

const repositorySchema = z.string().regex(/^[^/\s]+\/[^/\s]+$/, "Repository must be owner/name.");
const shaSchema = z.string().regex(/^[0-9a-f]{7,64}$/i, "Invalid commit/blob SHA.");

function unavailable(message) {
  return { isError: true, content: [{ type: "text", text: `UNAVAILABLE: ${message}` }] };
}

function writeBlocked() {
  return unavailable("GitHub write operations are disabled. Set ELITZE_GITHUB_MCP_WRITE=true only in an explicitly authorized runtime.");
}

async function github(path, init = {}) {
  if (!token) throw new Error("GITHUB_TOKEN is not configured for this runtime.");
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  if (!response.ok) throw new Error(`GitHub HTTP ${response.status}: ${typeof body === "string" ? body : JSON.stringify(body)}`);
  return body;
}

function result(body) {
  return { content: [{ type: "text", text: JSON.stringify(body, null, 2) }] };
}

function repository(input) {
  return input.repository ?? defaultRepository ?? "";
}

server.registerTool("github_repository", {
  title: "ELITZE GitHub Repository",
  description: "Read repository metadata from GitHub using the configured authorization.",
  inputSchema: z.object({ repository: repositorySchema.optional() }),
}, async (input) => {
  try {
    const repo = repository(input);
    if (!repo) return unavailable("GITHUB_REPOSITORY is not configured and no repository was supplied.");
    return result(await github(`/repos/${repo}`));
  } catch (error) { return unavailable(error.message); }
});

server.registerTool("github_search_code", {
  title: "ELITZE GitHub Code Search",
  description: "Search code in the authorized GitHub scope. Returns GitHub results only; no synthetic findings.",
  inputSchema: z.object({ query: z.string().min(1).max(500), repository: repositorySchema.optional(), topn: z.number().int().min(1).max(100).default(20) }),
}, async (input) => {
  try {
    const repo = repository(input);
    const q = encodeURIComponent(`${input.query}${repo ? ` repo:${repo}` : ""}`);
    const body = await github(`/search/code?q=${q}&per_page=${input.topn}`);
    return result(body);
  } catch (error) { return unavailable(error.message); }
});

server.registerTool("github_file", {
  title: "ELITZE GitHub File",
  description: "Read a repository file at a branch, tag, or commit without executing repository content.",
  inputSchema: z.object({ repository: repositorySchema.optional(), path: z.string().min(1).max(500), ref: z.string().min(1).max(200).optional() }),
}, async (input) => {
  try {
    const repo = repository(input);
    if (!repo) return unavailable("Repository is required.");
    const ref = input.ref ? `?ref=${encodeURIComponent(input.ref)}` : "";
    return result(await github(`/repos/${repo}/contents/${input.path.split("/").map(encodeURIComponent).join("/")}${ref}`));
  } catch (error) { return unavailable(error.message); }
});

server.registerTool("github_commit", {
  title: "ELITZE GitHub Commit",
  description: "Inspect a commit and its metadata/diff through GitHub.",
  inputSchema: z.object({ repository: repositorySchema.optional(), sha: shaSchema }),
}, async (input) => {
  try {
    const repo = repository(input);
    if (!repo) return unavailable("Repository is required.");
    return result(await github(`/repos/${repo}/commits/${input.sha}`));
  } catch (error) { return unavailable(error.message); }
});

server.registerTool("github_pull_request", {
  title: "ELITZE GitHub Pull Request",
  description: "Read pull request metadata, changed files, and review state.",
  inputSchema: z.object({ repository: repositorySchema.optional(), number: z.number().int().positive() }),
}, async (input) => {
  try {
    const repo = repository(input);
    if (!repo) return unavailable("Repository is required.");
    const pr = await github(`/repos/${repo}/pulls/${input.number}`);
    const files = await github(`/repos/${repo}/pulls/${input.number}/files?per_page=100`);
    const reviews = await github(`/repos/${repo}/pulls/${input.number}/reviews?per_page=100`);
    return result({ pullRequest: pr, files, reviews });
  } catch (error) { return unavailable(error.message); }
});

server.registerTool("github_create_branch", {
  title: "ELITZE GitHub Create Branch",
  description: "Create a branch from an exact existing commit SHA. Requires explicit MCP write authorization.",
  inputSchema: z.object({ repository: repositorySchema.optional(), branch: z.string().regex(/^[A-Za-z0-9._/-]{1,200}$/), sha: shaSchema }),
}, async (input) => {
  if (!allowWrite) return writeBlocked();
  try {
    const repo = repository(input);
    if (!repo) return unavailable("Repository is required.");
    return result(await github(`/repos/${repo}/git/refs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ref: `refs/heads/${input.branch}`, sha: input.sha }) }));
  } catch (error) { return unavailable(error.message); }
});

server.registerTool("github_update_file", {
  title: "ELITZE GitHub Update File",
  description: "Replace one UTF-8 text file on an explicit branch. Requires write authorization and the current blob SHA to prevent lost updates.",
  inputSchema: z.object({ repository: repositorySchema.optional(), path: z.string().min(1).max(500), branch: z.string().min(1).max(200), content: z.string(), sha: shaSchema, message: z.string().min(1).max(200) }),
}, async (input) => {
  if (!allowWrite) return writeBlocked();
  try {
    const repo = repository(input);
    if (!repo) return unavailable("Repository is required.");
    const encodedPath = input.path.split("/").map(encodeURIComponent).join("/");
    return result(await github(`/repos/${repo}/contents/${encodedPath}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: input.message, content: Buffer.from(input.content, "utf8").toString("base64"), sha: input.sha, branch: input.branch }) }));
  } catch (error) { return unavailable(error.message); }
});

server.registerTool("github_create_pull_request", {
  title: "ELITZE GitHub Create Pull Request",
  description: "Open a pull request between explicit branches. Requires write authorization; this tool never merges.",
  inputSchema: z.object({ repository: repositorySchema.optional(), title: z.string().min(1).max(256), body: z.string().max(10000).default(""), head: z.string().min(1).max(200), base: z.string().min(1).max(200), draft: z.boolean().default(true) }),
}, async (input) => {
  if (!allowWrite) return writeBlocked();
  try {
    const repo = repository(input);
    if (!repo) return unavailable("Repository is required.");
    return result(await github(`/repos/${repo}/pulls`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: input.title, body: input.body, head: input.head, base: input.base, draft: input.draft }) }));
  } catch (error) { return unavailable(error.message); }
});

server.registerTool("github_merge_pull_request", {
  title: "ELITZE GitHub Merge Pull Request",
  description: "Intentionally disabled in the ELITZE GitHub MCP. Merge remains a separate human-controlled release action.",
  inputSchema: z.object({ repository: repositorySchema.optional(), number: z.number().int().positive() }),
}, async () => unavailable("Merge is deliberately not exposed by the ELITZE GitHub MCP. Use explicit repository review and release controls."));

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("ELITZE GitHub Control MCP server running on stdio");
