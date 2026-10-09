import { NextRequest } from "next/server";
import { getPgPool } from "@/db";
import { sendEmail } from "@/lib/auth-email";
import { productionConfig } from "@/config/production";
import { consumeRateLimit, getRateLimitKey } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RequestType = "acquisition" | "repository" | "general";

const DESTINATION = () => process.env.ELITZE_CONTACT_EMAIL?.trim() || "tsh_cook@hotmail.com";
const MAX_NAME = 120;
const MAX_ORGANIZATION = 160;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 4000;

function normalize(value: unknown, max: number) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max)
    : "";
}

function validEmail(value: string) {
  return value.length <= MAX_EMAIL && /^\S+@\S+\.\S+$/.test(value);
}

function subjectFor(requestType: RequestType) {
  switch (requestType) {
    case "acquisition":
      return "ELITZE Agentic Security — Acquisition Inquiry";
    case "repository":
      return "ELITZE Agentic Security — Repository Access Request";
    default:
      return "ELITZE Agentic Security — Contact Request";
  }
}

function labelFor(requestType: RequestType) {
  switch (requestType) {
    case "acquisition":
      return "Acquisition inquiry";
    case "repository":
      return "Repository access request";
    default:
      return "General contact";
  }
}

export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (!origin) return Response.json({ error: "csrf_rejected" }, { status: 403 });

    let requestOrigin: URL;
    try {
      requestOrigin = new URL(origin);
    } catch {
      return Response.json({ error: "csrf_rejected" }, { status: 403 });
    }

    if (!productionConfig.allowedOrigins.includes(requestOrigin.origin)) {
      return Response.json({ error: "csrf_rejected" }, { status: 403 });
    }

    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body) return Response.json({ error: "invalid_request" }, { status: 400 });

    if (normalize(body.website, 200)) return Response.json({ ok: true });

    const requestTypeRaw = normalize(body.requestType, 20) as RequestType;
    const requestType: RequestType = ["acquisition", "repository", "general"].includes(requestTypeRaw)
      ? requestTypeRaw
      : "general";
    const name = normalize(body.name, MAX_NAME);
    const organization = normalize(body.organization, MAX_ORGANIZATION);
    const email = normalize(body.email, MAX_EMAIL).toLowerCase();
    const message = normalize(body.message, MAX_MESSAGE);

    if (!name || !email || !message || !validEmail(email)) {
      return Response.json({ error: "name_email_message_required" }, { status: 400 });
    }

    const key = await getRateLimitKey("acquisition-contact", email);
    if (!(await consumeRateLimit(key, 5, 60 * 60))) {
      return Response.json({ error: "too_many_requests" }, {
        status: 429,
        headers: { "Retry-After": "3600" },
      });
    }

    const lead = await getPgPool().query(
      "INSERT INTO acquisition_leads (request_type,name,organization,email,message,source) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,created_at AS \"createdAt\"",
      [
        requestType,
        name,
        organization || "Not provided",
        email,
        message,
        productionConfig.canonicalOrigin,
      ],
    );

    const leadId = lead.rows[0]?.id ?? "unavailable";
    const submittedAt = lead.rows[0]?.createdAt ?? new Date().toISOString();
    const emailText = [
      "ELITZE contact type: " + labelFor(requestType),
      "Lead ID: " + leadId,
      "Submitted: " + submittedAt,
      "",
      "Name: " + name,
      "Organization: " + (organization || "Not provided"),
      "Email: " + email,
      "",
      "Message:",
      message,
      "",
      "Source: " + productionConfig.canonicalOrigin,
    ].join("\n");

    try {
      if (!process.env.ELITZE_EMAIL_PROVIDER?.trim() || !process.env.ELITZE_EMAIL_FROM?.trim()) {
        return Response.json(
          { error: "email_delivery_not_configured", leadRecorded: true, leadId },
          { status: 503 },
        );
      }
      await sendEmail({ to: DESTINATION(), subject: subjectFor(requestType), text: emailText });
    } catch (error) {
      console.error("ELITZE contact email delivery failed after lead persistence", error);
      return Response.json(
        { error: "email_delivery_failed", leadRecorded: true, leadId },
        { status: 503 },
      );
    }

    return Response.json({ ok: true, leadRecorded: true, leadId });
  } catch (error) {
    console.error("ELITZE contact intake failed", error);
    return Response.json({ error: "contact_intake_unavailable" }, { status: 503 });
  }
}
