import { productionConfig } from "@/config/production";

const RESEND_API = process.env.RESEND_API_URL?.trim() || "https://api.resend.com/emails";

function requiredAny(names: string[]): string {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  throw new Error(`${names.join(" or ")} is required for transactional email.`);
}

async function sendEmail(input: { to: string; subject: string; html: string }): Promise<void> {
  const apiKey = requiredAny(["RESEND_API_KEY"]);
  const from = requiredAny(["EMAIL_FROM", "RESEND_FROM"]);

  const response = await fetch(RESEND_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [input.to], subject: input.subject, html: input.html }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Transactional email failed with HTTP ${response.status}: ${body.slice(0, 500)}`);
  }
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const origin = (process.env.APP_ORIGIN?.trim() || productionConfig.canonicalOrigin).replace(/\/$/, "");
  const url = `${origin}/auth/verify?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to: email,
    subject: "Verify your ELITZE Agentic Security account",
    html: `<p>Verify your ELITZE Agentic Security account.</p><p><a href="${url}">Verify email</a></p><p>This link expires in 24 hours.</p>`,
  });
}

export async function sendRecoveryEmail(email: string, token: string): Promise<void> {
  const origin = (process.env.APP_ORIGIN?.trim() || productionConfig.canonicalOrigin).replace(/\/$/, "");
  const url = `${origin}/reset-password?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to: email,
    subject: "Reset your ELITZE Agentic Security password",
    html: `<p>A password reset was requested for your ELITZE Agentic Security account.</p><p><a href="${url}">Reset password</a></p><p>This link expires in 1 hour.</p>`,
  });
}
