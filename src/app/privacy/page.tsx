export const metadata = {
  title: "Privacy Notice | ELITZE",
  description: "ELITZE 2026 Privacy Notice.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#07070a] px-6 py-16 text-zinc-100">
      <article className="mx-auto max-w-4xl space-y-8">
        <header>
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">ELITZE Legal</p>
          <h1 className="mt-3 text-4xl font-semibold">Privacy Notice</h1>
          <p className="mt-2 text-zinc-400">Version 2026.09 · Effective September 3, 2026</p>
        </header>
        <section className="space-y-5 text-zinc-300">
          <p>ELITZE may process account information, authentication metadata, service configuration, security telemetry, integration metadata, support communications, usage information, Customer Content, and audit/evidence records needed to provide and secure the Services.</p>
          <p>Processing purposes include service delivery, security, authentication, policy enforcement, incident investigation, audit, support, abuse prevention, service operations, and legal compliance.</p>
          <p>Where AI models or automated systems are used, inputs and outputs may be processed to provide the requested function. Model-provider routing depends on configuration and applicable contractual and provider terms.</p>
          <p>Retention, deletion, international processing, subprocessors, and individual rights are governed by applicable law and the applicable enterprise agreement or data-processing terms.</p>
          <p>Customers are responsible for lawful collection, required notices, permissions, access controls, data-routing rules, and retention configuration for information submitted to the Services.</p>
        </section>
        <p className="text-sm text-zinc-500">For the complete legal draft, see <code>docs/legal/ELITZE-PRIVACY-NOTICE-2026.md</code> in the repository.</p>
      </article>
    </main>
  );
}
