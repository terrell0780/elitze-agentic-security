export type GitHubObservation = {
  repository?: Record<string, unknown>;
  installations?: Record<string, unknown>;
  workflows?: unknown[];
  branchProtections?: Array<Record<string, unknown>>;
  secretMetadata?: Array<Record<string, unknown>>;
  auditEvents?: unknown[];
};

function token() {
  const value = process.env.GITHUB_TOKEN?.trim();
  if (!value) throw new Error("github_token_unconfigured");
  return value;
}

async function github(path: string) {
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
  try { body = JSON.parse(text); } catch { body = text; }
  if (!response.ok) throw new Error(`github_http_${response.status}`);
  return body as any;
}

export async function observeGitHub(repository: string): Promise<GitHubObservation> {
  const repo = repository.trim();
  if (!/^[^/\s]+\/[^/\s]+$/.test(repo)) throw new Error("github_repository_invalid");
  const [repositoryData, workflows, branchProtection, secretMetadata] = await Promise.all([
    github(`/repos/${repo}`),
    github(`/repos/${repo}/actions/workflows?per_page=100`),
    github(`/repos/${repo}/branches?protected=true&per_page=100`),
    github(`/repos/${repo}/actions/secrets?per_page=100`),
  ]);

  let installations: unknown = undefined;
  try { installations = await github(`/repos/${repo}/installation`); } catch { installations = undefined; }

  return {
    repository: repositoryData,
    installations: installations as Record<string, unknown> | undefined,
    workflows: Array.isArray((workflows as any)?.workflows) ? (workflows as any).workflows : [],
    branchProtections: Array.isArray(branchProtection) ? branchProtection.map((branch: any) => ({ name: branch.name, protected: branch.protected, protection_url: `/repos/${repo}/branches/${encodeURIComponent(branch.name)}/protection` })) : [],
    secretMetadata: Array.isArray((secretMetadata as any)?.secrets) ? (secretMetadata as any).secrets.map((secret: any) => ({ name: secret.name, updated_at: secret.updated_at, created_at: secret.created_at })) : [],
  };
}
