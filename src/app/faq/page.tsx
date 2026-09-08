import Link from "next/link";
import { ArrowRight, ChevronDown, ShieldCheck } from "lucide-react";

const faq = [
  ["Is ELITZE replacing our existing security tools?", "No. The product is designed as a control and verification layer across connected code, cloud, identity, agent, data, runtime and security systems. Expand coverage as integrations become available."],
  ["Does ELITZE invent live security data?", "No. Connected, verified records drive posture. Empty or unavailable integrations remain explicit instead of being filled with synthetic assets, alerts or telemetry."],
  ["What makes Infinite Pentest different?", "It is intended to make offensive validation part of the release loop: identify a relevant condition, validate exploitability, remediate, then retest the original condition and preserve evidence."],
  ["What is Gods Eye AI?", "Gods Eye is the visual security command surface for traversing connected security domains and relationships. The visual layer is interactive; production posture still comes from verified data sources."],
  ["What is Obsidian?", "Obsidian is the evidence and security-memory concept: preserve the relationship between the signal, context, decision, action and verification so operators do not have to reconstruct the story from disconnected tickets."],
  ["Can autonomous actions be destructive?", "Actions are intended to remain inside explicit policy, identity and capability boundaries. Where required infrastructure or authorization is unavailable, the safe behavior is to fail closed rather than pretend an action occurred."],
  ["How does ELITZE handle AI risk?", "Models are decision inputs, not the security boundary. Authorization, policy enforcement, evidence and containment are deterministic control points."],
  ["Where is the detailed technical material?", "The primary product experience stays visual. Detailed standards, implementation states, benchmark notes and architecture decisions belong in the About, Security and repository documentation rather than the main landing flow."],
];

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--header)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6"><Link href="/" className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"><ShieldCheck className="h-5 w-5" /></div><span className="text-sm font-bold">ELITZE</span></Link><Link href="/console" className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white">Open Console</Link></div>
      </header>
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24"><div className="text-center"><p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--accent)]">FAQ</p><h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-6xl">The answers, without the wall of text.</h1><p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-[var(--muted-strong)]">Core product questions belong here so the main experience can stay focused on outcomes and visual control surfaces.</p></div><div className="mt-10 space-y-3">{faq.map(([question, answer]) => <details key={question} className="group rounded-2xl border border-[var(--border)] bg-[var(--panel)] open:border-[var(--accent-border)]"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 text-sm font-semibold"><span>{question}</span><ChevronDown className="h-4 w-4 shrink-0 text-[var(--muted)] transition group-open:rotate-180" /></summary><div className="px-5 pb-5 text-sm leading-6 text-[var(--muted)]">{answer}</div></details>)}</div><div className="mt-10 text-center"><Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">Back to ELITZE <ArrowRight className="h-4 w-4" /></Link></div></section>
    </main>
  );
}
