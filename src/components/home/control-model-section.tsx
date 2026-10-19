const controlPoints = [
  {
    number: "01",
    title: "Identity",
    question: "Who or what is acting?",
    detail: "Anchor agent and workload activity to a defined identity and tenant boundary.",
  },
  {
    number: "02",
    title: "Reachability",
    question: "What can it actually reach?",
    detail: "Map the observed path from an identity to MCP servers, tools, APIs, and sensitive data.",
  },
  {
    number: "03",
    title: "Policy",
    question: "Should this action proceed?",
    detail: "Evaluate sensitive actions at the authorization boundary, before tool execution.",
  },
  {
    number: "04",
    title: "Evidence",
    question: "What can be proven?",
    detail: "Keep decisions, observations, and retest outcomes tied to their source.",
  },
] as const;

export default function ControlModelSection() {
  return (
    <section className="mx-auto max-w-[1400px] px-4 py-14 sm:px-7 sm:py-20">
            <div className="max-w-3xl">
              <div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">The control model</div>
              <h2 className="mt-3 text-3xl font-black tracking-[-.045em] sm:text-4xl">Four questions. One governed path.</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--muted-strong)]">
                Keep identity, authorization, execution, and verification connected—without treating a model response or a dashboard state as proof.
              </p>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {controlPoints.map((point) => (
                <article key={point.number} className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 transition hover:border-[var(--border-strong)]">
                  <div className="font-mono text-[10px] text-[var(--accent)]">{point.number}</div>
                  <h3 className="mt-4 text-lg font-bold">{point.title}</h3>
                  <p className="mt-2 text-sm font-semibold">{point.question}</p>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{point.detail}</p>
                </article>
              ))}
            </div>
          </section>
  );
}
