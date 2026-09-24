import { NextRequest } from "next/server";
import { getDatabaseConfigStatus } from "@/db";
import { assertSameOrigin, consumeRateLimit, getRateLimitKey, issueEmailToken, registerUser } from "@/lib/auth";
import { sendAuthEmail } from "@/lib/auth-email";

export const dynamic = "force-dynamic";

type RegistrationError = Error & { code?: string; missing?: string[] };

function emailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM?.trim());
}

function duplicateRegistration(error: unknown) {
  if (!(error instanceof Error)) return false;
  const code = (error as RegistrationError).code;
  return code === "23505" || error.message.includes("duplicate") || error.message.includes("unique");
}

function databaseUnavailable(error: unknown) {
  if (!(error instanceof Error)) return false;
  const code = (error as RegistrationError).code;
  return code === "database_unconfigured" ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND" ||
    code === "ETIMEDOUT" ||
    code === "57P01" ||
    code === "08001" ||
    code === "08006" ||
    code === "3D000" ||
    code === "42P01" ||
    code === "42703";
}

function logRegistrationFailure(stage: string, error: unknown) {
  const config = getDatabaseConfigStatus();
  const details = error instanceof Error ? {
    name: error.name,
    code: (error as RegistrationError).code,
    message: error.message,
    missing: (error as RegistrationError).missing,
  } : { value: String(error) };

  console.error("ELITZE registration failed", {
    stage,
    databaseConfigured: config.configured,
    databaseConfigSource: config.configured ? config.source : undefined,
    missingDatabaseEnv: config.configured ? undefined : config.missing,
    emailConfigured: emailConfigured(),
    error: details,
  });
}

export async function POST(request: NextRequest) {
  try {
    if (!(await assertSameOrigin(request))) return Response.json({ error: "csrf_rejected" }, { status: 403 });
    const body = await request.json() as { email?: unknown; password?: unknown; displayName?: unknown };
    if (typeof body.email !== "string" || typeof body.password !== "string") {
      return Response.json({ error: "email_and_password_required" }, { status: 400 });
    }

    const databaseConfig = getDatabaseConfigStatus();
    if (!databaseConfig.configured) {
      const error = new Error("database_unconfigured") as RegistrationError;
      error.code = "database_unconfigured";
      error.missing = databaseConfig.missing;
      logRegistrationFailure("database_config", error);
      return Response.json({ error: "database_unavailable" }, { status: 503 });
    }

    const email = body.email.trim().toLowerCase();
    if (!(await consumeRateLimit(await getRateLimitKey("register", email), 5, 60 * 60))) {
      return Response.json({ error: "too_many_attempts" }, { status: 429, headers: { "Retry-After": "3600" } });
    }

    if (!emailConfigured()) {
      logRegistrationFailure("email_config", new Error("email_delivery_not_configured"));
      return Response.json({ error: "email_delivery_not_configured" }, { status: 503 });
    }

    const user = await registerUser(email, body.password, typeof body.displayName === "string" ? body.displayName : undefined);
    const token = await issueEmailToken(user, "email_verification", 60);
    const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.elitze.info").replace(/\/$/, "");
    await sendAuthEmail(user.email, "Verify your ELITZE Agentic Security email", `Verify your email: ${base}/auth/verify?token=${encodeURIComponent(token)}\n\nThis link expires in 60 minutes.`);
    return Response.json({ ok: true, verificationRequired: true, alreadyRegistered: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "registration_failed";
    if (message === "email_delivery_not_configured") return Response.json({ error: "email_delivery_not_configured" }, { status: 503 });
    if (message === "invalid_email" || message === "password_policy" || message === "email_and_password_required") {
      return Response.json({ error: message }, { status: 400 });
    }
    if (duplicateRegistration(error)) {
      return Response.json({ ok: true, verificationRequired: true, alreadyRegistered: true });
    }
    if (databaseUnavailable(error)) {
      logRegistrationFailure("database", error);
      return Response.json({ error: "database_unavailable" }, { status: 503 });
    }
    logRegistrationFailure("registration", error);
    return Response.json({ error: "registration_unavailable" }, { status: 503 });
  }
}
