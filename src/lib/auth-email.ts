type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
};

export async function sendEmail({ to, subject, text, replyTo }: EmailMessage) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();
  if (!apiKey || !from) throw new Error("email_delivery_not_configured");

  const body: Record<string, unknown> = {
    from,
    to: [to],
    subject,
    text,
  };

  body.reply_to = [replyTo || process.env.ELITZE_CONTACT_EMAIL?.trim() || "tsh_cook@hotmail.com"];

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) throw new Error("email_delivery_failed");
}

export async function sendAuthEmail(to: string, subject: string, text: string) {
  return sendEmail({ to, subject, text, replyTo: process.env.ELITZE_CONTACT_EMAIL?.trim() || "tsh_cook@hotmail.com" });
}
