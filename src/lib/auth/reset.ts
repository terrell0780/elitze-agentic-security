import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/database";
import { authTokens, sessions, users } from "@/db/production-schema";
import { hashOpaqueToken, hashPassword, createOpaqueToken } from "@/lib/auth/crypto";

export async function resetPassword(token: string, password: string): Promise<void> {
  const [row] = await db.select({ tokenId: authTokens.id, userId: authTokens.userId })
    .from(authTokens)
    .where(and(
      eq(authTokens.tokenHash, hashOpaqueToken(token)),
      eq(authTokens.kind, "password_recovery"),
      isNull(authTokens.consumedAt),
      gt(authTokens.expiresAt, new Date()),
    ))
    .limit(1);

  if (!row) throw new Error("Invalid or expired recovery token.");

  const passwordHash = await hashPassword(password);

  await db.transaction(async (tx) => {
    await tx.update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, row.userId));

    await tx.update(authTokens)
      .set({ consumedAt: new Date() })
      .where(eq(authTokens.id, row.tokenId));

    await tx.update(sessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(sessions.userId, row.userId), isNull(sessions.revokedAt)));
  });
}

export async function issueEmailVerification(userId: string): Promise<string> {
  const token = createOpaqueToken();
  const [user] = await db.select({ organizationId: users.organizationId }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("User not found.");

  await db.insert(authTokens).values({
    userId,
    tenantId: user.organizationId,
    tokenHash: hashOpaqueToken(token),
    purpose: "email_verification",
    kind: "email_verification",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  return token;
}
