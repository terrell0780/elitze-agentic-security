export type GitHubObservation = {
  repository?: Record<string, unknown>;
  installations?: Record<string, unknown>;
  workflows?: unknown[];
  branchProtections?: Array<Record<string, unknown>>;
  secretMetadata?: Array<Record<string, unknown>>;
  auditEvents?: unknown[];
};

function token(): string {
  const value = process.env.GITHUB_TOKEN?.trim();
  if (!value) throw new Error("github_token_unconfigured");
  return value;
}

async function github(path: string): Promise<unknown> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token()}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });
  const text = await response.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  if (!response.ok) throw new Error(`github_http_${response.status}`);
  return body;
}

export async function observeGitHub(repository: string): Promise<GitHubObservation> {
  const repo = repository.trim();
  const parts = repo.split("/");
  const owner = parts[0]?.trim();
  const repositoryName = parts[1]?.trim();

  if (parts.length !== 2 || !owner || !repositoryName || owner.includes(" ") || repositoryName.includes(" ")) {
    throw new Error("github_repository_invalid");
  }

  const [repositoryData, workflows, branchProtection, secretMetadata, auditLogData] = await Promise.all([
    github(`/repos/${repo}`),
    github(`/repos/${repo}/actions/workflows?per_page=100`),
    github(`/repos/${repo}/branches?protected=true&per_page=100`),
    github(`/repos/${repo}/actions/secrets?per_page=100`),
    github(`/orgs/${encodeURIComponent(owner)}/audit-log?per_page=100`).catch(() => []),
  ]);

  let installations: unknown = undefined;
  try {
    installations = await github(`/repos/${repo}/installation`);
  } catch {
    installations = undefined;
  }

  return {
    repository: repositoryData as Record<string, unknown> | undefined,
    installations: installations as Record<string, unknown> | undefined,
    workflows: Array.isArray((workflows as { workflows?: unknown[] })?.workflows)
      ? (workflows as { workflows: unknown[] }).workflows
      : [],
    branchProtections: Array.isArray(branchProtection)
      ? branchProtection.map((branch: unknown) => {
          const value = branch as { name?: string; protected?: boolean };
          return {
            name: value.name,
            protected: value.protected,
            protection_url: `/repos/${repo}/branches/${encodeURIComponent(value.name ?? "")}/protection`,
          };
        })
      : [],
    secretMetadata: Array.isArray((secretMetadata as { secrets?: unknown[] })?.secrets)
      ? (secretMetadata as { secrets: Array<{ name?: string; updated_at?: string; created_at?: string }> }).secrets.map((secret) => ({
          name: secret.name,
          updated_at: secret.updated_at,
          created_at: secret.created_at,
        }))
      : [],
    auditEvents: Array.isArray(auditLogData) ? auditLogData : [],
  };
}
