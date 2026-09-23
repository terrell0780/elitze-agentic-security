"use client";

import { FormEvent, useState } from "react";
import { trackElitzeEvent } from "@/lib/analytics-events";

type RequestType = "acquisition" | "repository" | "general";

type Props = {
  requestType: RequestType;
  title?: string;
  description?: string;
};

const labels: Record<RequestType, string> = {
  acquisition: "Acquisition inquiry",
  repository: "Repository access request",
  general: "General contact",
};

export default function AcquisitionContactForm({
  requestType,
  title = labels[requestType],
  description = "This form routes directly to tsh_cook@hotmail.com.",
}: Props) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setError("");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/acquisition/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestType,
        name: form.get("name"),
        organization: form.get("organization"),
        email: form.get("email"),
        message: form.get("message"),
        website: form.get("website"),
      }),
    });

    const payload = await response.json().catch(() => ({})) as { error?: string };
    if (!response.ok) {
      setStatus("error");
      setError(
        payload.error === "email_delivery_not_configured"
          ? "Contact delivery is not configured on this deployment."
          : "The message could not be sent. Please use the direct email below.",
      );
      return;
    }

    event.currentTarget.reset();
    trackElitzeEvent(requestType === "acquisition" ? "acquisition_inquiry" : requestType === "repository" ? "repository_access_request" : "sales_cta");
    setStatus("sent");
  }

  return (
    <section className="rounded-3xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-7 sm:p-9">
      <div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">{labels[requestType]}</div>
      <h2 className="mt-3 text-2xl font-black tracking-[-.03em]">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted-strong)]">{description}</p>

      <form onSubmit={submit} className="mt-7 grid gap-4" noValidate>
        <div className="absolute -left-[10000px] h-px w-px overflow-hidden">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold">
            Name
            <input
              name="name"
              required
              maxLength={120}
              autoComplete="name"
              className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 font-normal outline-none focus:border-[var(--accent)]"
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Organization
            <input
              name="organization"
              maxLength={160}
              autoComplete="organization"
              className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 font-normal outline-none focus:border-[var(--accent)]"
            />
          </label>
        </div>

        <label className="grid gap-2 text-sm font-semibold">
          Email
          <input
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 font-normal outline-none focus:border-[var(--accent)]"
          />
        </label>

        <label className="grid gap-2 text-sm font-semibold">
          Message
          <textarea
            name="message"
            required
            minLength={10}
            maxLength={4000}
            rows={7}
            className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 font-normal outline-none focus:border-[var(--accent)]"
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={status === "sending"}
            className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : "Send securely"}
          </button>
          <a
            href="mailto:tsh_cook@hotmail.com"
            className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold"
          >
            Email tsh_cook@hotmail.com
          </a>
        </div>

        <div aria-live="polite" className="text-xs leading-5 text-[var(--muted)]">
          {status === "sent" && "Sent. The request has been routed to tsh_cook@hotmail.com."}
          {status === "error" && error}
        </div>
      </form>
    </section>
  );
}
