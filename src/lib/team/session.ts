import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "elitze_team_session";
const MAX_AGE = 60 * 60 * 12;

type TeamSession = { actorId: string; tenantId: string; issuedAt: number };

function secret() {
  const value = process.env.ELITZE_TEAM_SESSION_SECRET?.trim();
  if (!value) throw new Error("ELITZE_TEAM_SESSION_SECRET is required");
  return value;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function encodeTeamSession(actorId: string, tenantId: string) {
  const payload = Buffer.from(JSON.stringify({ actorId, tenantId, issuedAt: Date.now() })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeTeamSession(value: string | undefined): TeamSession | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as TeamSession;
    if (!parsed.actorId || typeof parsed.actorId !== "string" || !parsed.tenantId || typeof parsed.tenantId !== "string" || typeof parsed.issuedAt !== "number") return null;
    if (Date.now() - parsed.issuedAt > MAX_AGE * 1000) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getTeamSession() {
  const store = await cookies();
  return decodeTeamSession(store.get(COOKIE_NAME)?.value);
}

export const teamSessionCookie = COOKIE_NAME;
export const teamSessionMaxAge = MAX_AGE;
