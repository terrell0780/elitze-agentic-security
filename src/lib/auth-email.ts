type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
};

const env = (name: string) => process.env[name]?.trim() ?? "";
const DEFAULT_REPLY_TO = "tsh_cook@hotmail.com";

export async function sendEmail({ to, subject, text, replyTo }: EmailMessage) {
  const provider = env("ELITZE_EMAIL_PROVIDER").toLowerCase() || "resend";
  const from = env("ELITZE_EMAIL_FROM");
  if (!from) throw new Error("email_delivery_not_configured");

  if (provider === "resend") {
    const apiKey = env("RESEND_API_KEY");
    if (!apiKey) throw new Error("email_delivery_not_configured");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
        reply_to: [replyTo || env("ELITZE_CONTACT_EMAIL") || DEFAULT_REPLY_TO].filter(Boolean),
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`email_delivery_failed:${response.status}:${body.slice(0, 500)}`);
    }
    return;
  }

  if (provider === "test") {
    const endpoint = env("ELITZE_EMAIL_TEST_ENDPOINT");
    if (!endpoint) throw new Error("email_delivery_not_configured");
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
        reply_to: [replyTo || env("ELITZE_CONTACT_EMAIL") || DEFAULT_REPLY_TO].filter(Boolean),
      }),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("email_delivery_failed");
    return;
  }

  throw new Error("unsupported_email_provider");
}

export async function sendAuthEmail(to: string, subject: string, text: string) {
  return sendEmail({ to, subject, text, replyTo: env("ELITZE_CONTACT_EMAIL") || DEFAULT_REPLY_TO });
}

/**
 * True when the configured provider has everything it needs to deliver mail.
 * Used as a pre-flight check so registration and password reset fail with an
 * honest 503 before any user state is created or any account lookup happens.
 */
export function emailDeliveryConfigured(): boolean {
  const provider = env("ELITZE_EMAIL_PROVIDER").toLowerCase() || "resend";
  if (!env("ELITZE_EMAIL_FROM")) return false;
  if (provider === "resend") return Boolean(env("RESEND_API_KEY"));
  if (provider === "test") return Boolean(env("ELITZE_EMAIL_TEST_ENDPOINT"));
  return false;
}