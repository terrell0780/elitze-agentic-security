import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SecurityWorkspacePreview from "@/components/security-workspace-preview";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-[var(--border)]">
      <div className="pointer-events-none absolute inset-0 hero-grid opacity-70" />
      <div className="pointer-events-none absolute left-[62%] top-[-220px] h-[650px] w-[650px] rounded-full bg-[var(--accent-glow)] blur-3xl" />
      <div className="relative mx-auto grid max-w-[1400px] gap-12 px-4 py-16 sm:px-7 sm:py-24 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:py-28">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent-border)] bg-[var(--accent-soft)] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.2em] text-[var(--accent)]">
            Enterprise cybersecurity control plane
          </div>
          <h1 className="display-type mt-7 max-w-4xl text-[2.8rem] leading-[.98] sm:text-6xl lg:text-[5.1rem]">
            See the threat.
            <br />
            <span className="text-[var(--accent)]">Control the path.</span>
            <br />
            Prove the fix.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[var(--muted-strong)]">
            Discover identities and reachable resources, enforce policy before sensitive execution, observe runtime behavior, and preserve evidence for remediation and retesting.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/workspace" className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-slate-950 transition hover:brightness-110">
              Open workspace <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/security" className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-5 py-3 text-sm font-semibold transition hover:border-[var(--border-strong)]">
              Explore the security model <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-5 text-xs leading-5 text-[var(--muted)]">
            The model is not the security boundary. Missing or unverified telemetry is not presented as a confirmed security result.
          </p>
        </div>
        <SecurityWorkspacePreview />
      </div>
    </section>
  );
}
