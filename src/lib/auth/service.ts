import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/database";
import { authTokens, organizations, sessions, users } from "@/db/production-schema";
import {
  createOpaqueToken,
  hashOpaqueToken,
  hashPassword,
  normalizeEmail,
  verifyPassword,
} from "@/lib/auth/crypto";

const SESSION_DAYS = 7;
const VERIFICATION_HOURS = 24;
const RECOVERY_HOURS = 1;

function expiresFromNow(ms: number): Date {
  return new Date(Date.now() + ms);
}

export type AuthUser = {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  emailVerifiedAt: Date | null;
};

export async function registerUser(input: {
  organizationName: string;
  organizationSlug: string;
  email: string;
  password: string;
}): Promise<{ user: AuthUser; verificationToken: string }> {
  const email = normalizeEmail(input.email);
  const passwordHash = await hashPassword(input.password);

  return db.transaction(async (tx) => {
    const [organization] = await tx.insert(organizations).values({
      name: input.organizationName.trim(),
      slug: input.organizationSlug.trim().toLowerCase(),
    }).returning();

    if (!organization) throw new Error("Organization creation failed.");

    const [user] = await tx.insert(users).values({
      organizationId: organization.id,
      email,
      passwordHash,
    }).returning();

    if (!user) throw new Error("User creation failed.");

    const verificationToken = createOpaqueToken();
    await tx.insert(authTokens).values({
      userId: user.id,
      tokenHash: hashOpaqueToken(verificationToken),
      kind: "email_verification",
      expiresAt: expiresFromNow(VERIFICATION_HOURS * 60 * 60 * 1000),
    });

    return {
      user: {
        id: user.id,
        organizationId: user.organizationId,
        email: user.email,
        role: user.role,
        emailVerifiedAt: user.emailVerifiedAt,
      },
      verificationToken,
    };
  });
}

export async function verifyEmail(token: string): Promise<AuthUser> {
  const tokenHash = hashOpaqueToken(token);
  return db.transaction(async (tx) => {
    const [row] = await tx.select({
      tokenId: authTokens.id,
      userId: users.id,
      organizationId: users.organizationId,
      email: users.email,
      role: users.role,
      emailVerifiedAt: users.emailVerifiedAt,
      expiresAt: authTokens.expiresAt,
    })
      .from(authTokens)
      .innerJoin(users, eq(users.id, authTokens.userId))
      .where(and(
        eq(authTokens.tokenHash, tokenHash),
        eq(authTokens.kind, "email_verification"),
        isNull(authTokens.consumedAt),
        gt(authTokens.expiresAt, new Date()),
      ))
      .limit(1);

    if (!row) throw new Error("Invalid or expired verification token.");

    await tx.update(authTokens)
      .set({ consumedAt: new Date() })
      .where(eq(authTokens.id, row.tokenId));

    const [user] = await tx.update(users)
      .set({ emailVerifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, row.userId))
      .returning();

    if (!user) throw new Error("User verification failed.");

    return {
      id: user.id,
      organizationId: user.organizationId,
      email: user.email,
      role: user.role,
      emailVerifiedAt: user.emailVerifiedAt,
    };
  });
}

export async function loginUser(emailInput: string, password: string): Promise<{ user: AuthUser; sessionToken: string }> {
  const email = normalizeEmail(emailInput);
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user || user.disabled || !await verifyPassword(password, user.passwordHash)) {
    throw new Error("Invalid email or password.");
  }

  if (!user.emailVerifiedAt) {
    throw new Error("Email verification is required before login.");
  }

  const sessionToken = createOpaqueToken(48);
  await db.insert(sessions).values({
    userId: user.id,
    tokenHash: hashOpaqueToken(sessionToken),
    expiresAt: expiresFromNow(SESSION_DAYS * 24 * 60 * 60 * 1000),
  });

  return {
    user: {
      id: user.id,
      organizationId: user.organizationId,
      email: user.email,
      role: user.role,
      emailVerifiedAt: user.emailVerifiedAt,
    },
    sessionToken,
  };
}

export async function getUserBySessionToken(token: string): Promise<AuthUser | null> {
  const [row] = await db.select({
    id: users.id,
    organizationId: users.organizationId,
    email: users.email,
    role: users.role,
    emailVerifiedAt: users.emailVerifiedAt,
    sessionId: sessions.id,
  })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(
      eq(sessions.tokenHash, hashOpaqueToken(token)),
      isNull(sessions.revokedAt),
      gt(sessions.expiresAt, new Date()),
      eq(users.disabled, false),
      // Only verified accounts receive authenticated application sessions.
      // The verification requirement is enforced again here for defense in depth.
      isNotNull(users.emailVerifiedAt),
    ))
    .limit(1);

  if (!row) return null;

  await db.update(sessions)
    .set({ lastSeenAt: new Date() })
    .where(eq(sessions.id, row.sessionId));

  return {
    id: row.id,
    organizationId: row.organizationId,
    email: row.email,
    role: row.role,
    emailVerifiedAt: row.emailVerifiedAt,
  };
}

export async function revokeSession(token: string): Promise<void> {
  await db.update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(
      eq(sessions.tokenHash, hashOpaqueToken(token)),
      isNull(sessions.revokedAt),
    ));
}

export async function requestPasswordRecovery(emailInput: string): Promise<string | null> {
  const email = normalizeEmail(emailInput);
  const [user] = await db.select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), eq(users.disabled, false)))
    .limit(1);

  if (!user) return null;

  const token = createOpaqueToken();
  await db.insert(authTokens).values({
    userId: user.id,
    tokenHash: hashOpaqueToken(token),
    kind: "password_recovery",
    expiresAt: expiresFromNow(RECOVERY_HOURS * 60 * 60 * 1000),
  });

  return token;
}
