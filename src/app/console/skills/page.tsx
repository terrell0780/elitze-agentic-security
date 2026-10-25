"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { securitySkills } from "@/lib/security-skills";

export default function SecuritySkillsPage() {
  const domains = useMemo(() => Array.from(new Set(securitySkills.map((skill) => skill.domain))), []);
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--header)]"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5"><div><div className="text-sm font-semibold tracking-wide text-[var(--text)]">ELITZE</div><div className="text-[10px] uppercase tracking-[0.22em] text-[var(--muted)]">Security Skill Registry</div></div><Link href="/console" className="inline-flex items-center gap-2 text-xs text-[var(--muted-strong)] hover:text-[var(--text)]"><ArrowLeft className="h-3.5 w-3.5" />Console</Link></div></header>
      <div className="mx-auto max-w-6xl px-6 py-10"><div className="max-w-3xl"><div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]"><ShieldCheck className="h-4 w-4" />ELITZE governed capability registry</div><h1 className="mt-3 text-3xl font-semibold text-[var(--text)]">ELITZE security skills with authorization, verification and evidence.</h1><p className="mt-3 text-sm leading-6 text-[var(--muted-strong)]">Every capability is defined by ELITZE and governed by ELITZE policy. Framework names shown below are reference mappings only; they are not product branding, ownership claims, or execution authority.</p></div>
        <div className="mt-8 flex flex-wrap gap-2">{domains.map((domain) => <span key={domain} className="rounded-full border border-[var(--border)] bg-white/[0.025] px-3 py-1 text-[10px] uppercase tracking-wider text-[var(--muted-strong)]">{domain}</span>)}</div>
        <section className="mt-8 grid gap-4 md:grid-cols-2">{securitySkills.map((skill) => <article key={skill.id} className="rounded-2xl border border-[var(--border)] bg-white/[0.02] p-5"><div className="flex items-start justify-between gap-4"><div><div className="text-sm font-semibold text-[var(--text)]">{skill.name}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-[var(--muted)]">{skill.domain} · {skill.authorization}</div></div><span className="rounded-full border border-amber-400/15 bg-amber-400/[0.05] px-2 py-1 text-[9px] uppercase tracking-wider text-amber-200">{skill.status}</span></div><p className="mt-4 text-xs leading-5 text-[var(--muted-strong)]">{skill.description}</p><div className="mt-4 grid gap-3 text-[10px] text-[var(--muted)]"><div><span className="text-slate-600">Prerequisites:</span> {skill.prerequisites.join(" · ")}</div><div><span className="text-slate-600">Verification:</span> {skill.verification.join(" · ")}</div><div><span className="text-slate-600">Evidence:</span> {skill.evidence.join(" · ")}</div><div><span className="text-slate-600">Reference mappings:</span> {skill.frameworkMappings.join(" · ")}</div></div></article>)}</section>
      </div>
    </main>
  );
}
