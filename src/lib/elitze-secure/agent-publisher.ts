/**
 * GitHub publisher handoff for verified agent patches.
 *
 * The publisher never executes git operations and never submits pull requests
 * from the web application. It fail-closes unless the gauntlet recorded a
 * PASSED result for the patch, then produces the exact execution plan (branch
 * provisioning, staging, commit, push, PR payload) for the authorized runner
 * tier. The runner's own reportback — not this handoff — is the evidence that
 * a pull request was actually published.
 */

export type PublisherBlocked = { ready: false; reason: string };
export type PublisherHandoff = {
  ready: true;
  branchName: string;
  commitMessage: string;
  gitSteps: Array<{ step: string; command: string[] }>;
  prPayload: {
    target: string;
    title: string;
    body: string;
    draft: true;
  };
  runnerChecks: string[];
  executionTier: "authorized_runner";
  autoSubmitted: false;
};
export type PublisherDecision = PublisherBlocked | PublisherHandoff;

export type PublisherInput = {
  gauntletStatus: "PASSED" | "FAILED" | "UNKNOWN";
  githubTokenConfigured: boolean;
  bountyId: string;
  workspaceRef: string;
  seed: string;
};

/** bounty-fix/<safe-bounty-id>-<4-hex-seed>, cross-platform safe. */
export function publisherBranchName(bountyId: string, seed: string): string {
  const safe = String(bountyId ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "patch";
  const hexSeed = (String(seed ?? "").replace(/[^0-9a-f]/gi, "") + "0000").slice(0, 4);
  return `bounty-fix/${safe}-${hexSeed}`;
}

export function evaluatePublisherGuard(input: PublisherInput): PublisherDecision {
  if (input.gauntletStatus !== "PASSED") {
    return { ready: false, reason: "publisher_bypassed_failed_sandbox_gates" };
  }
  if (!input.githubTokenConfigured) {
    return { ready: false, reason: "missing_github_authentication_token" };
  }
  const bountyId = String(input.bountyId ?? "").trim();
  if (!bountyId) {
    return { ready: false, reason: "missing_bounty_id" };
  }
  if (!String(input.workspaceRef ?? "").trim()) {
    return { ready: false, reason: "workspace_missing" };
  }

  const branchName = publisherBranchName(bountyId, input.seed);
  const commitMessage = `fix: autonomous codebase remediation for bounty ${bountyId}`;

  return {
    ready: true,
    branchName,
    commitMessage,
    gitSteps: [
      { step: "branch_provisioning", command: ["git", "checkout", "-b", branchName] },
      { step: "stage_changes", command: ["git", "add", "."] },
      { step: "commit", command: ["git", "commit", "-m", commitMessage] },
      { step: "push", command: ["git", "push", "origin", branchName] },
    ],
    prPayload: {
      target: "terrell0780/elitze-agentic-security",
      title: commitMessage,
      body: [
        `Autonomous remediation for bounty ${bountyId}.`,
        "",
        "Gauntlet verification: PASSED (all recorded gates exited 0).",
        "Evidence basis: recorded gate exit codes, agent workforce identity locked at hire time.",
        "",
        "Draft pull request. Merge is a human decision.",
      ].join("\n"),
      draft: true,
    },
    runnerChecks: [
      "GITHUB_TOKEN present in the runner environment before any git operation",
      "workspace matches the gauntlet-recorded patch reference",
      "gauntlet record re-read from the ledger immediately before push",
    ],
    executionTier: "authorized_runner",
    autoSubmitted: false,
  };
}
