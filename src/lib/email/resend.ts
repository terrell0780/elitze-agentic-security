const RESEND_API = "https://api.resend.com/emails";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for transactional email.`);
  return value;
}

async function sendEmail(input: { to: string; subject: string; html: string }): Promise<void> {
  const apiKey = required("RESEND_API_KEY");
  const from = required("EMAIL_FROM");

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
  const origin = required("APP_ORIGIN").replace(/\/$/, "");
  const url = `${origin}/verify-email?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to: email,
    subject: "Verify your ELITZE Cybersecurity account",
    html: `<p>Verify your ELITZE Cybersecurity account.</p><p><a href="${url}">Verify email</a></p><p>This link expires in 24 hours.</p>`,
  });
}

export async function sendRecoveryEmail(email: string, token: string): Promise<void> {
  const origin = required("APP_ORIGIN").replace(/\/$/, "");
  const url = `${origin}/reset-password?token=${encodeURIComponent(token)}`;
  await sendEmail({
    to: email,
    subject: "Reset your ELITZE Cybersecurity password",
    html: `<p>A password reset was requested for your ELITZE Cybersecurity account.</p><p><a href="${url}">Reset password</a></p><p>This link expires in 1 hour.</p>`,
  });
}
