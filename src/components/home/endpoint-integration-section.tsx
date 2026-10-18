import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

export default function EndpointIntegrationSection() {
  return (
    <section className="border-y border-[var(--border)] bg-[var(--section)]">
            <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-14 sm:px-7 sm:py-18 lg:grid-cols-[1fr_1fr] lg:items-center">
              <div>
                <div className="text-[9px] font-bold uppercase tracking-[.24em] text-[var(--accent)]">Endpoint threat intelligence</div>
                <h2 className="mt-3 text-3xl font-black tracking-[-.045em] sm:text-4xl">Bring endpoint evidence into the agent security control plane.</h2>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-[var(--muted-strong)]">
                  Connect SentinelOne Singularity to ingest actual endpoint and threat records alongside agent identities, MCP reachability, and policy evidence. ELITZE distinguishes provider observations from verified response outcomes.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {["Threat and endpoint inventory", "Source-attributed evidence", "Read-only connection validation"].map((item) => (
                    <span key={item} className="rounded-full border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-xs font-semibold text-[var(--muted-strong)]">
                      {item}
                    </span>
                  ))}
                </div>
                <Link href="/integrations" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-slate-950 transition hover:brightness-110">
                  Explore integrations <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.2em] text-[var(--muted)]">SentinelOne Singularity</p>
                    <h3 className="mt-3 text-xl font-bold">Endpoint security integration</h3>
                  </div>
                  <ShieldCheck className="h-6 w-6 shrink-0 text-[var(--accent)]" />
                </div>
                <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                  Connector code is deployed with the ELITZE application. A customer console URL and authorized API token are required before a live connection can be confirmed.
                </p>
                <div className="mt-5 rounded-xl border border-[var(--border)] px-4 py-3">
                  <p className="text-xs font-semibold">Live provider connection</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">Not verified until credentials are configured and authenticated API checks pass.</p>
                </div>
              </div>
            </div>
          </section>
  );
}
