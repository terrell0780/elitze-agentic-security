import crypto from "node:crypto";

export type PolicyDecision = "ALLOW" | "DENY" | "REQUIRE_APPROVAL" | "ALLOW_WITH_CONSTRAINTS";
export type ImpactLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type DataClassification = "PUBLIC" | "INTERNAL" | "CONFIDENTIAL" | "RESTRICTED";

export interface PolicyDocument {
  id?: string; name: string; version?: string; active?: boolean;
  subject?: { agent?: string; humanOwner?: string };
  action?: { tool?: string; name?: string };
  resource?: { resource?: string; environment?: string };
  dataClassification?: DataClassification;
  timeWindow?: { start: string; end: string; timezone?: "UTC" };
  purpose?: string; impactLevel?: ImpactLevel;
  decision: PolicyDecision | "require_approval" | "deny" | "allow" | "allow_with_constraints";
  approvers?: { role?: string }; expiresAfter?: string;
}

export interface PolicyContext {
  agentIdentityId: string; agentName?: string; humanOwnerId: string; tool: string; action: string;
  resource?: string; environment?: string; dataClassification?: DataClassification; purpose?: string;
  impactLevel?: ImpactLevel; now?: Date;
}

export interface PolicyMatch {
  policyId: string; policyName: string; policyVersion: string; decision: PolicyDecision;
  approverRole?: string; approvalExpiresAt?: string; reasons: string[];
}

const decisionRank: Record<PolicyDecision, number> = { ALLOW: 0, ALLOW_WITH_CONSTRAINTS: 1, REQUIRE_APPROVAL: 2, DENY: 3 };
const DATA_ORDER: Record<DataClassification, number> = { PUBLIC: 0, INTERNAL: 1, CONFIDENTIAL: 2, RESTRICTED: 3 };

export function normalizePolicyDecision(value: PolicyDocument["decision"]): PolicyDecision {
  const normalized = String(value).toUpperCase();
  if (normalized === "ALLOW" || normalized === "DENY" || normalized === "REQUIRE_APPROVAL" || normalized === "ALLOW_WITH_CONSTRAINTS") return normalized;
  throw new Error(`unsupported_policy_decision:${value}`);
}

function globMatch(pattern: string | undefined, value: string | undefined): boolean {
  if (pattern === undefined) return true;
  if (value === undefined) return false;
  const escaped = pattern.split("*").map((part) => part.replace(/[|\\{}()[\]^$+?.]/g, "\\$&")).join(".*");
  return new RegExp(`^${escaped}$`, "i").test(value);
}

function parseDuration(value?: string): number | undefined {
  if (!value) return undefined;
  const match = String(value).trim().match(/^(\d+)\s*(s|m|h|d)$/i);
  if (!match) throw new Error(`invalid_policy_duration:${value}`);
  return Number(match[1]) * ({ s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 } as Record<string, number>)[match[2].toLowerCase()];
}

function timeWindowMatches(window: PolicyDocument["timeWindow"], now: Date): boolean {
  if (!window) return true;
  if (window.timezone && window.timezone !== "UTC") throw new Error("policy_timezones_must_be_utc");
  const parse = (value: string) => {
    const match = value.match(/^(\d{2}):(\d{2})$/);
    if (!match) throw new Error(`invalid_policy_time:${value}`);
    const hour = Number(match[1]); const minute = Number(match[2]);
    if (hour > 23 || minute > 59) throw new Error(`invalid_policy_time:${value}`);
    return hour * 60 + minute;
  };
  const start = parse(window.start); const end = parse(window.end); const current = now.getUTCHours() * 60 + now.getUTCMinutes();
  return start <= end ? current >= start && current <= end : current >= start || current <= end;
}

export function policyMatches(policy: PolicyDocument, context: PolicyContext): boolean {
  if (policy.active === false) return false;
  if (!globMatch(policy.subject?.agent, context.agentName ?? context.agentIdentityId)) return false;
  if (!globMatch(policy.subject?.humanOwner, context.humanOwnerId)) return false;
  if (!globMatch(policy.action?.tool, context.tool)) return false;
  if (!globMatch(policy.action?.name, context.action)) return false;
  if (!globMatch(policy.resource?.resource, context.resource)) return false;
  if (!globMatch(policy.resource?.environment, context.environment)) return false;
  if (policy.dataClassification && (!context.dataClassification || DATA_ORDER[context.dataClassification] < DATA_ORDER[policy.dataClassification])) return false;
  if (policy.purpose && !globMatch(policy.purpose, context.purpose)) return false;
  if (policy.impactLevel && policy.impactLevel !== context.impactLevel) return false;
  return timeWindowMatches(policy.timeWindow, context.now ?? new Date());
}

export function evaluatePolicies(policies: PolicyDocument[], context: PolicyContext): PolicyMatch | null {
  const matches = policies.filter((policy) => policyMatches(policy, context)).map((policy) => {
    const decision = normalizePolicyDecision(policy.decision); const ttl = parseDuration(policy.expiresAfter);
    const approvalExpiresAt = decision === "REQUIRE_APPROVAL" && ttl ? new Date((context.now ?? new Date()).getTime() + ttl).toISOString() : undefined;
    return {
      policyId: policy.id ?? crypto.createHash("sha256").update(JSON.stringify(policy)).digest("hex").slice(0, 24),
      policyName: policy.name, policyVersion: policy.version ?? "1", decision,
      approverRole: policy.approvers?.role, approvalExpiresAt, reasons: [`matched_policy:${policy.name}`],
    };
  });
  if (!matches.length) return null;
  return matches.sort((a, b) => decisionRank[b.decision] - decisionRank[a.decision] || a.policyId.localeCompare(b.policyId))[0];
}

export function validatePolicy(policy: PolicyDocument): PolicyDocument {
  if (!policy.name?.trim()) throw new Error("policy_name_required");
  if (!policy.decision) throw new Error("policy_decision_required");
  normalizePolicyDecision(policy.decision);
  if (policy.dataClassification && !(policy.dataClassification in DATA_ORDER)) throw new Error("invalid_data_classification");
  if (policy.impactLevel && !["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(policy.impactLevel)) throw new Error("invalid_impact_level");
  if (policy.approvers && !policy.approvers.role?.trim()) throw new Error("approval_role_required");
  parseDuration(policy.expiresAfter); timeWindowMatches(policy.timeWindow, new Date());
  return policy;
}

function normalizeAliases(root: Record<string, any>): Record<string, any> {
  const output = { ...root };
  const aliases: Record<string, string> = {
    human_owner: "humanOwner", data_classification: "dataClassification", time_window: "timeWindow",
    impact_level: "impactLevel", expires_after: "expiresAfter",
  };
  for (const [source, target] of Object.entries(aliases)) if (output[source] !== undefined && output[target] === undefined) { output[target] = output[source]; delete output[source]; }
  for (const section of ["subject", "action", "resource", "approvers", "timeWindow"]) {
    if (!output[section] || typeof output[section] !== "object") continue;
    const child = { ...output[section] };
    if (section === "subject" && child.human_owner !== undefined && child.humanOwner === undefined) { child.humanOwner = child.human_owner; delete child.human_owner; }
    output[section] = child;
  }
  return output;
}

export function parsePolicyDocument(text: string): PolicyDocument {
  const trimmed = text.trim(); if (!trimmed) throw new Error("policy_document_empty");
  if (trimmed.startsWith("{")) return validatePolicy(normalizeAliases(JSON.parse(trimmed)) as PolicyDocument);
  const root: Record<string, any> = {};
  const stack: Array<{ indent: number; object: Record<string, any> }> = [{ indent: -1, object: root }];
  for (const line of trimmed.split(/\r?\n/).filter((value) => value.trim() && !value.trim().startsWith("#"))) {
    const indent = line.match(/^\s*/)?.[0].length ?? 0;
    const match = line.match(/^\s*([A-Za-z][A-Za-z0-9_-]*):(?:\s*(.*))?$/);
    if (!match) throw new Error(`unsupported_policy_yaml_line:${line.trim()}`);
    while (stack.length && indent <= stack[stack.length - 1].indent) stack.pop();
    const parent = stack[stack.length - 1]?.object; if (!parent) throw new Error("invalid_policy_yaml_indentation");
    const key = match[1]; const raw = match[2] ?? "";
    if (!raw) { const child: Record<string, any> = {}; parent[key] = child; stack.push({ indent, object: child }); }
    else parent[key] = parseScalar(raw);
  }
  return validatePolicy(normalizeAliases(root) as PolicyDocument);
}

function parseScalar(raw: string): string | boolean | number {
  const value = raw.trim().replace(/^['"]|['"]$/g, "");
  if (value === "true") return true; if (value === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  return value;
}
