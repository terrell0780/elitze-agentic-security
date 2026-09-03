import Link from "next/link";

export const metadata = {
  title: "ELITZE REO | Content Integrity",
  description: "ELITZE REO content provenance, evidence, uniqueness and publishing governance.",
};

const controls = [
  ["Provenance", "Required before automatic approval"],
  ["Evidence", "Verified evidence required for approval"],
  ["Uniqueness", "Composite semantic, lexical and structural signals"],
  ["Risk", "Scale, duplication, thinness, factuality, staleness, policy and reputation"],
  ["Publishing Governor", "Approve, review, queue or block"],
  ["Audit", "Decision-ready event trail with content references"],
];

export default function ReoPage() {
  return (
    <main className="min-h-screen bg-[#07070a] px-6 py-14 text-zinc-100">
      <section className="mx-auto max-w-6xl space-y-10">
        <header className="max-w-3xl space-y-4">
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">ELITZE REO</p>
          <h1 className="text-4xl font-semibold tracking-tight">Content Integrity Engine</h1>
          <p className="text-lg leading-8 text-zinc-400">Provenance, evidence, semantic uniqueness, content risk and publishing governance at the point of publication.</p>
        </header>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {controls.map(([title, description]) => (
            <article key={title} className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
              <h2 className="font-medium">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
            </article>
          ))}
        </div>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <h2 className="font-medium">Decision contract</h2>
          <div className="mt-4 grid gap-3 text-sm text-zinc-400 md:grid-cols-4">
            <span>APPROVE → publish</span>
            <span>REVIEW → human review</span>
            <span>QUEUE → staged release</span>
            <span>BLOCK → policy failure</span>
          </div>
        </section>

        <Link href="/platform" className="inline-block text-sm underline underline-offset-4">Back to ELITZE Platform</Link>
      </section>
    </main>
  );
}
