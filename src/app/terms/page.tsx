import Link from "next/link";

export const metadata = {
  title: "Terms of Service | ELITZE",
  description: "ELITZE 2026 Terms of Service and AI-specific service terms.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#07070a] px-6 py-16 text-zinc-100">
      <article className="mx-auto max-w-4xl space-y-10">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">ELITZE Legal</p>
          <h1 className="text-4xl font-semibold">Terms of Service</h1>
          <p className="text-zinc-400">Version 2026.09 · Effective September 3, 2026</p>
        </header>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6">
          <h2 className="text-lg font-medium">AI-specific terms</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-zinc-300">
            <li>AI outputs may be probabilistic and require independent validation for consequential decisions.</li>
            <li>Agentic actions require authorized scope, credentials, targets, and applicable approval controls.</li>
            <li>Customers remain responsible for required AI disclosures and labeling of generated or materially altered content.</li>
            <li>Third-party model and integration processing is governed by the applicable provider and enterprise agreements.</li>
            <li>ELITZE REO uses provenance, evidence, uniqueness, risk, and publishing-governance controls.</li>
          </ul>
        </section>

        <nav className="flex flex-wrap gap-4 text-sm">
          <Link className="underline underline-offset-4" href="/">Back to ELITZE</Link>
          <a className="underline underline-offset-4" href="/legal/ELITZE-PRIVACY-NOTICE-2026.md">Privacy Notice</a>
        </nav>

        <p className="text-sm text-zinc-500">The published legal terms and applicable signed enterprise agreement control. This page does not constitute legal advice.</p>
      </article>
    </main>
  );
}
