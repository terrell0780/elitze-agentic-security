import { NextRequest, NextResponse } from "next/server";
import { authorizeInternalRequest } from "@/lib/security/policy";
import { getPgPool } from "@/db";
import { observeGitHub } from "@/lib/elitze-secure/github-integration";
import { upsertGraphEdge, upsertGraphNode } from "@/lib/elitze-secure/security-graph-v2";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!authorizeInternalRequest(request.headers.get("x-elitze-api-key"), process.env.ELITZE_INTERNAL_API_KEY)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as { tenantId?: string; repository?: string } | null;
  if (!body?.tenantId || !body.repository) return NextResponse.json({ ok: false, error: "tenantId_repository_required" }, { status: 400 });

  try {
    const observedAt = new Date().toISOString();
    const observation = await observeGitHub(body.repository);
    const repo = observation.repository as any;
    const repoKey = `github-repository:${repo.full_name}`;
    await upsertGraphNode({ tenantId: body.tenantId, nodeType: "DATA_STORE", subjectKey: repoKey, displayName: String(repo.full_name), source: "github-api", evidenceState: "OBSERVED", sourceRef: `github:repo:${repo.full_name}`, observedAt, metadata: { visibility: repo.visibility, defaultBranch: repo.default_branch, archived: repo.archived } });

    for (const workflow of observation.workflows ?? []) {
      const item = workflow as any;
      const key = `github-workflow:${repo.full_name}:${item.id}`;
      await upsertGraphNode({ tenantId: body.tenantId, nodeType: "TOOL", subjectKey: key, displayName: String(item.name ?? item.path ?? item.id), source: "github-api", evidenceState: "OBSERVED", sourceRef: `github:workflow:${repo.full_name}:${item.id}`, observedAt, metadata: { path: item.path, state: item.state } });
      await upsertGraphEdge({ tenantId: body.tenantId, from: repoKey, to: key, relation: "INVOKES", evidenceState: "OBSERVED", source: "github-api", accessMode: "EXECUTE", sourceRef: `github:workflow:${repo.full_name}:${item.id}`, observedAt });
    }

    for (const branch of observation.branchProtections ?? []) {
      const item = branch as any;
      const key = `github-branch:${repo.full_name}:${item.name}`;
      await upsertGraphNode({ tenantId: body.tenantId, nodeType: "DEPLOYMENT_ENVIRONMENT", subjectKey: key, displayName: `${repo.full_name}:${item.name}`, source: "github-api", evidenceState: "OBSERVED", sourceRef: `github:branch:${repo.full_name}:${item.name}`, observedAt, metadata: { protected: item.protected } });
      await upsertGraphEdge({ tenantId: body.tenantId, from: repoKey, to: key, relation: "ROUTES_TO", evidenceState: "OBSERVED", source: "github-api", accessMode: "WRITE", sourceRef: `github:branch:${repo.full_name}:${item.name}`, observedAt });
    }

    for (const secret of observation.secretMetadata ?? []) {
      const item = secret as any;
      const key = `github-secret:${repo.full_name}:${item.name}`;
      await upsertGraphNode({ tenantId: body.tenantId, nodeType: "API_CREDENTIAL", subjectKey: key, displayName: `GitHub Actions secret: ${item.name}`, source: "github-api", evidenceState: "OBSERVED", sourceRef: `github:secret-metadata:${repo.full_name}:${item.name}`, observedAt, metadata: { value: "NOT_RETRIEVED", createdAt: item.created_at ?? null, updatedAt: item.updated_at ?? null } });
      await upsertGraphEdge({ tenantId: body.tenantId, from: repoKey, to: key, relation: "USES", evidenceState: "OBSERVED", source: "github-api", accessMode: "EXECUTE", sourceRef: `github:secret-metadata:${repo.full_name}:${item.name}`, observedAt });
    }

    return NextResponse.json({ ok: true, source: "github-api", observedAt, repository: observation.repository, installations: observation.installations ?? "UNAVAILABLE", workflows: observation.workflows?.length ?? 0, protectedBranches: observation.branchProtections?.length ?? 0, secretMetadata: observation.secretMetadata?.length ?? 0, auditEvents: observation.auditEvents ?? "UNAVAILABLE" });
  } catch (error) {
    console.error("ELITZE GitHub observation failed", error);
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "github_observation_failed", evidenceState: "UNAVAILABLE" }, { status: 503 });
  }
}
