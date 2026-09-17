export const metadata = {
  title: "Privacy & Cookies | ELITZE",
  description: "ELITZE 2026 Privacy Notice, cookies, analytics and data handling information.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#07070a] px-6 py-16 text-zinc-100">
      <article className="mx-auto max-w-4xl space-y-10">
        <header>
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">ELITZE Legal</p>
          <h1 className="mt-3 text-4xl font-semibold">Privacy & Cookies</h1>
          <p className="mt-2 text-zinc-400">Version 2026.09 · Effective September 17, 2026</p>
        </header>

        <section className="space-y-5 text-zinc-300">
          <h2 className="text-2xl font-semibold text-white">Privacy notice</h2>
          <p>ELITZE may process account information, authentication metadata, service configuration, security telemetry, integration metadata, support communications, usage information, Customer Content, and audit/evidence records needed to provide and secure the Services.</p>
          <p>Processing purposes include service delivery, security, authentication, policy enforcement, incident investigation, audit, support, abuse prevention, service operations, and legal compliance.</p>
          <p>Where AI models or automated systems are used, inputs and outputs may be processed to provide the requested function. Model-provider routing depends on configuration and applicable contractual and provider terms.</p>
          <p>Retention, deletion, international processing, subprocessors, and individual rights are governed by applicable law and the applicable enterprise agreement or data-processing terms.</p>
          <p>Customers are responsible for lawful collection, required notices, permissions, access controls, data-routing rules, and retention configuration for information submitted to the Services.</p>
        </section>

        <section className="space-y-5 text-zinc-300">
          <h2 className="text-2xl font-semibold text-white">Cookies and digital markers</h2>
          <p>ELITZE uses a first-party consent cookie named <code className="rounded bg-white/10 px-1.5 py-0.5 text-zinc-100">__Host-ELITZE_CONSENT</code>. It records whether the visitor selected necessary-only or optional analytics consent and is retained for 180 days unless cleared sooner. This preference cookie is not used for advertising profiling.</p>
          <p>Necessary cookies may also be used by authenticated or security-sensitive parts of the application to maintain sessions, protect requests, enforce access controls, and support required site functions.</p>
          <p>Optional analytics is disabled until the visitor selects &quot;Allow analytics&quot;. When enabled and configured, ELITZE may load Google Analytics 4 and/or Google Ads measurement using the deployment values documented in the environment example. Analytics preferences can be changed at any time with Cookie settings.</p>
          <p>ELITZE does not claim that a third-party analytics provider will collect no information. Provider-specific processing is governed by the provider&apos;s current terms and privacy documentation as well as applicable law.</p>
        </section>

        <section className="space-y-5 text-zinc-300">
          <h2 className="text-2xl font-semibold text-white">Your choices</h2>
          <p>You may reject optional analytics cookies, accept them, or later change the selection using the Cookie settings control. Browser controls can also be used to clear or block cookies, although some required application functions may stop working.</p>
          <p>Where applicable law provides additional privacy rights, requests may be made through the contact mechanism provided by ELITZE or the governing enterprise agreement.</p>
        </section>

        <p className="text-sm text-zinc-500">The published legal terms and applicable signed enterprise agreement control. This page does not constitute legal advice.</p>
      </article>
    </main>
  );
}
