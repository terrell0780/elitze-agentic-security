import Link from "next/link";
import { BookOpen, KeyRound, LockKeyhole, MessageCircle, Radio, Search, ShieldCheck } from "lucide-react";

const topics = [
  ["Governed Chat", "Authenticated tenant sessions, policy evaluation, source-aware responses, and no fabricated live telemetry.", MessageCircle],
  ["BYOK / BYOA / BYOB", "Connect your own model, agent, or bot endpoint. Secrets are encrypted server-side and never returned to the client.", KeyRound],
  ["Files", "Tenant-scoped attachments are hashed, access-controlled, and downloadable only to authorized members. Size limits and executable/script extension restrictions apply. File contents are not scanned.", LockKeyhole],
  ["Voice", "Browser voice uses WebRTC with tenant-isolated signaling. Microphone permission remains under the user's control.", Radio],
  ["TeamSpeak", "ELITZE can store a tenant TeamSpeak Web Query configuration and encrypted API key. It never labels the integration connected without a verified connection.", ShieldCheck],
  ["Global Search", "ELITZE local capability search is first-party. Public web results are untrusted data and never become policy instructions.", Search],
] as const;

export default function HelpPage() {
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--header)]/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-sm font-black tracking-[.16em]">ELITZE</Link>
          <Link href="/contact" className="text-xs font-semibold text-[var(--accent)]">Contact</Link>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]"><BookOpen className="h-3.5 w-3.5" />Product help</div>
          <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-6xl">Understand the controls before you trust the output.</h1>
          <p className="mt-5 text-base leading-7 text-[var(--muted-strong)]">ELITZE is designed around a simple boundary: the model is not the security boundary. Identity, authorization, policy, execution, runtime observation, and evidence sit around the AI system.</p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {topics.map(([title, description, Icon]) => (
            <article key={title} className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6">
              <Icon className="h-5 w-5 text-[var(--accent)]" />
              <h2 className="mt-5 text-lg font-black">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">{description}</p>
            </article>
          ))}
        </div>

        <section className="mt-10 rounded-3xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-6 sm:p-8">
          <h2 className="text-lg font-black">Evidence and status rules</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              "Observed data is labeled as observed data.",
              "Missing evidence is exposed as unavailable or unmeasurable.",
              "External search material is untrusted context.",
              "Sensitive execution remains policy-gated.",
              "Secrets are never rendered into browser responses.",
              "No customer, revenue, security finding, or integration status is invented.",
            ].map((item) => <div key={item} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-xs leading-5">{item}</div>)}
          </div>
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/chat" className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-slate-950">Open ELITZE Chat</Link>
          <Link href="/console" className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold">Open Console</Link>
        </div>
      </div>
    </main>
  );
}
