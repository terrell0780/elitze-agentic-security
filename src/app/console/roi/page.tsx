"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CircleDollarSign, ShieldCheck, TimerReset } from "lucide-react";
import { calculateRoi, type RoiInputs, type RoiObserved } from "@/lib/roi";

type ApiResponse = { ok: boolean; observed?: RoiObserved; error?: string; measurementPolicy?: string };

const initialInputs: RoiInputs = {
  annualIncidentCostAvoided: 0,
  engineeringHoursSaved: 0,
  engineeringHourlyCost: 0,
  annualAiSpendAvoided: 0,
  annualAuditCostAvoided: 0,
  annualElitzeCost: 0,
};

const money = (value: number | null) => value === null ? "UNMEASURABLE" : new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(value);
const number = (value: number) => new Intl.NumberFormat("en-CA", { maximumFractionDigits: 0 }).format(value);

export default function RoiPage() {
  const [inputs, setInputs] = useState<RoiInputs>(initialInputs);
  const [observed, setObserved] = useState<RoiObserved | null>(null);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    fetch("/api/roi", { cache: "no-store" })
      .then(async (response) => (await response.json()) as ApiResponse)
      .then((payload) => { setAvailable(payload.ok); setObserved(payload.observed ?? null); })
      .catch(() => setAvailable(false));
  }, []);

  const roi = useMemo(() => calculateRoi(inputs, observed), [inputs, observed]);
  const set = (key: keyof RoiInputs, value: string) => setInputs((current) => ({ ...current, [key]: Number(value) || 0 }));

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <header className="border-b border-[var(--border)] bg-[var(--header)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div><div className="text-sm font-semibold tracking-wide text-[var(--text)]">ELITZE</div><div className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Agentic Security · ROI</div></div>
          <a href="/console" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-[var(--text)]"><ArrowLeft className="h-3.5 w-3.5" />Console</a>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="max-w-3xl"><div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-500"><CircleDollarSign className="h-4 w-4" />Business value</div><h1 className="mt-3 text-3xl font-semibold text-[var(--text)]">RIO / ROI without fabricated value.</h1><p className="mt-3 text-sm leading-6 text-slate-400">ELITZE separates observed security results from verified outcomes and customer-approved financial assumptions. Monetary value remains UNMEASURABLE until the underlying evidence and required inputs exist.</p></div><div className="mt-6 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-4 text-sm text-[var(--muted-strong)]"><b className="text-[var(--text)]">Measurement state:</b> {roi.status === "MEASURABLE" ? "Observed security evidence exists; financial value still requires approved inputs." : roi.status === "INSUFFICIENT_EVIDENCE" ? "UNMEASURABLE — no observed security evidence is available." : "UNMEASURABLE — approved financial inputs are incomplete."}</div>

        {!available && <div className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] p-4 text-sm text-amber-200">The ELITZE ROI data plane is unavailable. Financial modeling remains available, but observed security signals cannot be loaded.</div>}

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[var(--border)] bg-white/[0.025] p-5"><div className="text-xs uppercase tracking-wider text-slate-500">Annual benefit</div><div className="mt-3 text-2xl font-semibold text-[var(--text)]">{money(roi.annualBenefit)}</div><div className="mt-2 text-xs text-slate-600">Only calculated after observed evidence and approved inputs exist.</div></div>
          <div className="rounded-2xl border border-[var(--border)] bg-white/[0.025] p-5"><div className="text-xs uppercase tracking-wider text-slate-500">Net benefit</div><div className="mt-3 text-2xl font-semibold text-[var(--text)]">{money(roi.netBenefit)}</div><div className="mt-2 text-xs text-slate-600">Annual benefit minus ELITZE cost</div></div>
          <div className="rounded-2xl border border-[var(--border)] bg-white/[0.025] p-5"><div className="text-xs uppercase tracking-wider text-slate-500">ROI</div><div className="mt-3 text-2xl font-semibold text-[var(--text)]">{roi.roiPercent === null ? "UNMEASURABLE" : `${roi.roiPercent.toFixed(1)}%`}</div><div className="mt-2 text-xs text-slate-600">Net benefit ÷ ELITZE cost</div></div>
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.95fr]">
          <section className="rounded-2xl border border-[var(--border)] bg-white/[0.02] p-6"><div className="flex items-center gap-2"><CircleDollarSign className="h-4 w-4 text-slate-300" /><h2 className="text-sm font-semibold">Approved financial assumptions</h2></div><p className="mt-2 text-xs leading-5 text-slate-500">These are customer-approved assumptions, not ELITZE-observed savings.</p><div className="mt-5 grid gap-4 sm:grid-cols-2">
            {[['annualIncidentCostAvoided','Annual incident cost avoided'],['engineeringHoursSaved','Engineering hours saved'],['engineeringHourlyCost','Engineering cost per hour'],['annualAiSpendAvoided','Annual AI/cloud spend avoided'],['annualAuditCostAvoided','Annual audit/evidence cost avoided'],['annualElitzeCost','Annual ELITZE cost']].map(([key,label]) => <label key={key} className="block"><span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span><input type="number" min="0" step="1" value={inputs[key as keyof RoiInputs]} onChange={(e) => set(key as keyof RoiInputs, e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-slate-400/40" /></label>)}
          </div></section>

          <section className="rounded-2xl border border-[var(--border)] bg-white/[0.02] p-6"><div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-slate-300" /><h2 className="text-sm font-semibold">Observed ELITZE value signals</h2></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{observed ? Object.entries(observed).map(([key,value]) => <div key={key} className="rounded-xl border border-white/7 bg-black/20 p-4"><div className="font-mono text-xl font-semibold text-[var(--text)]">{number(Number(value))}</div><div className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">{key.replace(/[A-Z]/g, (letter) => ` ${letter}`).trim()}</div></div>) : <div className="col-span-2 py-10 text-center text-xs text-slate-600">UNMEASURABLE — no observed signals loaded.</div>}</div><div className="mt-5 flex items-start gap-2 text-[10px] leading-5 text-slate-600"><TimerReset className="mt-0.5 h-3.5 w-3.5 shrink-0" />Observed metrics are read from persisted ELITZE records. They do not become dollar values without explicit business assumptions.</div></section>
        </div>

        <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white/[0.02] p-6"><h2 className="text-sm font-semibold text-[var(--text)]">RIO interpretation</h2><div className="mt-4 grid gap-4 md:grid-cols-3"><div><div className="text-[10px] uppercase tracking-wider text-slate-500">Result</div><div className="mt-2 text-sm font-semibold">Observed decisions, enforcement and evidence.</div></div><div><div className="text-[10px] uppercase tracking-wider text-slate-500">Impact</div><div className="mt-2 text-sm font-semibold">Business/security significance supported by evidence.</div></div><div><div className="text-[10px] uppercase tracking-wider text-slate-500">Outcome</div><div className="mt-2 text-sm font-semibold">Verified post-control or post-remediation state.</div></div></div><div className="mt-4 grid gap-4 md:grid-cols-3"><div><div className="text-[10px] uppercase tracking-wider text-slate-500">Prevention value</div><div className="mt-2 text-lg font-semibold">{money(roi.preventionValue)}</div></div><div><div className="text-[10px] uppercase tracking-wider text-slate-500">Engineering value</div><div className="mt-2 text-lg font-semibold">{money(roi.engineeringValue)}</div></div><div><div className="text-[10px] uppercase tracking-wider text-slate-500">Payback</div><div className="mt-2 text-lg font-semibold">{roi.paybackMonths === null ? "UNMEASURABLE" : `${roi.paybackMonths.toFixed(1)} months`}</div></div></div><p className="mt-5 text-[10px] leading-5 text-slate-600">A denied event is not automatically a prevented loss. A resolved ticket is not automatically verified remediation. ELITZE preserves missing-evidence and missing-financial-input states rather than converting them into savings or ROI claims.</p></section>
      </div>
    </main>
  );
}
