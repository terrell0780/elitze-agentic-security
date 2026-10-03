import crypto from "node:crypto";

const textEncoder = new TextEncoder();

export type WorkloadTokenClaims = {
  iss: "ELITZE-MCP-GATEWAY";
  sub: string;
  tenantId: string;
  humanOwnerId: string;
  applicationId: string;
  agentIdentityId: string;
  workloadSessionId: string;
  gatewayServerId: string;
  delegationSource: string;
  purpose: string;
  requestedCapability: string;
  approvalAuthorityId?: string;
  iat: number;
  exp: number;
  jti: string;
};

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function sign(input: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(input).digest("base64url");
}

function secret() {
  const value = process.env.ELITZE_WORKLOAD_TOKEN_SIGNING_SECRET;
  if (!value) throw new Error("workload_token_signing_secret_missing");
  if (value.length < 32) throw new Error("workload_token_signing_secret_too_short");
  return value;
}

export function issueWorkloadToken(
  input: Omit<WorkloadTokenClaims, "iss" | "iat" | "exp" | "jti">,
  ttlSeconds = Number(process.env.ELITZE_WORKLOAD_TOKEN_TTL_SECONDS ?? 300),
) {
  const now = Math.floor(Date.now() / 1000);
  const safeTtl = Math.max(30, Math.min(900, Number.isFinite(ttlSeconds) ? ttlSeconds : 300));
  const claims: WorkloadTokenClaims = {
    ...input,
    iss: "ELITZE-MCP-GATEWAY",
    iat: now,
    exp: now + safeTtl,
    jti: crypto.randomUUID(),
  };
  const header = { alg: "HS256", typ: "ELITZE-WORKLOAD", kid: "current" };
  const encodedHeader = base64url(JSON.stringify(header));
  const encodedClaims = base64url(JSON.stringify(claims));
  const payload = `${encodedHeader}.${encodedClaims}`;
  return `${payload}.${sign(payload, secret())}`;
}

export function verifyWorkloadToken(token: string): WorkloadTokenClaims {
  const [encodedHeader, encodedClaims, signature] = token.split(".");
  if (!encodedHeader || !encodedClaims || !signature) throw new Error("invalid_workload_token");

  const payload = `${encodedHeader}.${encodedClaims}`;
  const expected = sign(payload, secret());
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);

  if (left.length !== right.length || !crypto.timingSafeEqual(left, right)) {
    throw new Error("invalid_workload_token_signature");
  }

  let claims: WorkloadTokenClaims;
  try {
    claims = JSON.parse(Buffer.from(encodedClaims, "base64url").toString("utf8")) as WorkloadTokenClaims;
  } catch {
    throw new Error("invalid_workload_token_claims");
  }

  const now = Math.floor(Date.now() / 1000);
  if (claims.iss !== "ELITZE-MCP-GATEWAY") throw new Error("invalid_workload_token_issuer");
  if (!claims.jti || claims.jti.length > 100) throw new Error("invalid_workload_token_jti");
  if (!claims.sub || claims.sub !== claims.workloadSessionId) throw new Error("invalid_workload_token_subject");
  if (claims.exp <= now || claims.iat > now + 60) throw new Error("workload_token_time_invalid");
  if (
    !claims.tenantId ||
    !claims.agentIdentityId ||
    !claims.workloadSessionId ||
    !claims.gatewayServerId ||
    !claims.humanOwnerId ||
    !claims.applicationId ||
    !claims.delegationSource ||
    !claims.purpose ||
    !claims.requestedCapability
  ) {
    throw new Error("workload_token_identity_incomplete");
  }

  return claims;
}

export function hashWorkloadToken(token: string) {
  return crypto.createHash("sha256").update(textEncoder.encode(token)).digest("hex");
}
