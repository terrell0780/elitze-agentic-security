import Link from "next/link";

export const metadata = {
  title: "About | ELITZE Agentic Security",
  description: "ELITZE Agentic Security product philosophy, evidence-first control model and verified security loop.",
  alternates: { canonical: "/about" },
};
import { ArrowRight, Check, ShieldCheck } from "lucide-react";

const principles = [
  "Evidence before confidence",
  "One security graph instead of disconnected queues",
  "Policy before autonomous action",
  "Retest before closing the loop",
  "Connected data only — no fabricated posture",
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--header)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent)]"><ShieldCheck className="h-5 w-5" /></div><span className="text-sm font-bold">ELITZE</span></Link>
          <Link href="/console" className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white">Open Console</Link>
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-24">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--accent)]">About ELITZE</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-bold tracking-[-0.04em] sm:text-6xl">Security should behave like a system, not a pile of dashboards.</h1>
        <p className="mt-6 max-w-3xl text-base leading-7 text-[var(--muted-strong)]">ELITZE is built around a simple control loop: detect a meaningful security condition, explain it, authorize the response, act within policy, retest the condition, and preserve the evidence.</p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {principles.map((item, index) => <div key={item} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5"><div className="font-mono text-[10px] text-[var(--accent)]">0{index + 1}</div><div className="mt-3 flex items-start gap-3 text-sm font-semibold"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" />{item}</div></div>)}
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6"><div className="text-xs font-bold text-[var(--accent)]">Operators</div><h2 className="mt-2 text-lg font-bold">One priority queue</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">What matters, why it matters, what can be done, and whether it worked.</p></div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6"><div className="text-xs font-bold text-[var(--accent)]">Engineers</div><h2 className="mt-2 text-lg font-bold">Release-native security</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Security stays attached to changes, artifacts, dependencies and the original failing condition.</p></div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6"><div className="text-xs font-bold text-[var(--accent)]">Leaders</div><h2 className="mt-2 text-lg font-bold">Proof over theatre</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Posture is only green when the supporting control and evidence are available.</p></div>
        </div>

        <div className="mt-12 rounded-[28px] border border-[var(--accent-border)] bg-[var(--accent-soft)] p-7 sm:p-9"><div className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">Product philosophy</div><h2 className="mt-3 text-2xl font-bold sm:text-3xl">Build the secure path into the product.</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted-strong)]">That means fewer clicks, clearer decisions, safer automation, source-bound evidence and a continuous verification loop. Detailed implementation standards and benchmark notes live in the repository manifest.</p><Link href="/compare" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)]">View benchmark <ArrowRight className="h-4 w-4" /></Link></div>
      </section>
    </main>
  );
}
