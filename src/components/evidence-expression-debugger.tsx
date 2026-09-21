"use client";

import { useEffect, useState } from "react";
import { Bug, CheckCircle2, Code2, FileSearch, ShieldAlert } from "lucide-react";

type RecordItem = {
  decisionRef: string;
  requestId: string;
  subject: string;
  decision: string;
  evidenceState: string;
  stage: string;
  nextAction: string;
  observedAt: string | null;
};

type DebugResponse = {
  ok: boolean;
  records?: RecordItem[];
  record?: RecordItem;
  result?: boolean;
  error?: string;
  expression?: string;
};

const examples = [
  'decision == "ALLOW"',
  'stage == "PROVEN" && evidenceState == "OBSERVED"',
  'subject contains "github"',
  'stage == "RETESTED" || decision == "DENY"',
];

export default function EvidenceExpressionDebugger() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [recordId, setRecordId] = useState("");
  const [expression, setExpression] = useState(examples[0]);
  const [result, setResult] = useState<DebugResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/console/evidence-debugger", { cache: "no-store" })
      .then((response) => response.json() as Promise<DebugResponse>)
      .then((payload) => {
        if (!active) return;
        const nextRecords = payload.records ?? [];
        setRecords(nextRecords);
        setRecordId(nextRecords[0]?.decisionRef ?? "");
      })
      .catch(() => { if (active) setRecords([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function evaluate() {
    setBusy(true);
    try {
      const response = await fetch("/api/console/evidence-debugger", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decisionRef: recordId, expression }),
      });
      setResult((await response.json()) as DebugResponse);
    } catch {
      setResult({ ok: false, error: "evidence_expression_unavailable" });
    } finally {
      setBusy(false);
    }
  }

  const selected = records.find((record) => record.decisionRef === recordId);

  return (
    <section className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-5 sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2"><Bug className="h-4 w-4 text-[var(--accent)]" /><h2 className="text-sm font-semibold">Evidence Expression Debugger</h2></div>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-[var(--muted)]">Evaluate a bounded expression against a real tenant-scoped evidence record. This surface does not execute JavaScript or arbitrary code.</p>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">{loading ? "LOADING" : String(records.length) + " RECORDS"}</div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[.9fr_1.1fr]">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-4">
          <div className="flex items-center gap-2"><FileSearch className="h-4 w-4 text-[var(--accent)]" /><span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Evidence record</span></div>
          <select value={recordId} onChange={(event) => setRecordId(event.target.value)} disabled={!records.length} className="mt-3 w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2.5 text-xs outline-none focus:border-[var(--accent-border)]">
            {!records.length && <option value="">No records available</option>}
            {records.map((record) => <option key={record.decisionRef} value={record.decisionRef}>{record.decisionRef} · {record.subject} · {record.stage}</option>)}
          </select>
          {selected && <div className="mt-4 space-y-2 text-[10px] text-[var(--muted)]">
            <div className="flex justify-between gap-3"><span>Decision</span><span className="font-mono text-[var(--text)]">{selected.decision}</span></div>
            <div className="flex justify-between gap-3"><span>Evidence</span><span className="font-mono text-[var(--text)]">{selected.evidenceState}</span></div>
            <div className="flex justify-between gap-3"><span>Proof stage</span><span className="font-mono text-[var(--text)]">{selected.stage}</span></div>
          </div>}
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-4">
          <div className="flex items-center gap-2"><Code2 className="h-4 w-4 text-[var(--accent)]" /><span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Expression</span></div>
          <textarea value={expression} onChange={(event) => setExpression(event.target.value)} maxLength={500} rows={3} spellCheck={false} className="mt-3 w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-3 font-mono text-xs outline-none focus:border-[var(--accent-border)]" />
          <div className="mt-3 flex flex-wrap gap-2">{examples.map((example) => <button key={example} type="button" onClick={() => setExpression(example)} className="rounded-full border border-[var(--border)] bg-[var(--panel)] px-2.5 py-1 text-[9px] text-[var(--muted)] hover:text-[var(--text)]">{example}</button>)}</div>
          <button type="button" onClick={() => void evaluate()} disabled={busy || !recordId || !expression.trim()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Evaluating" : "Evaluate expression"}</button>
        </div>
      </div>

      {result && <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-4">
        <div className="flex items-center gap-2 text-sm font-bold">{result.result ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <ShieldAlert className="h-4 w-4 text-amber-300" />}<span>{result.ok ? (result.result ? "TRUE" : "FALSE") : "EXPRESSION ERROR"}</span></div>
        <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{result.ok ? "Evaluated against " + (result.record?.decisionRef ?? recordId) + "." : (result.error ?? "evidence_expression_unavailable")}</p>
        {result.expression && <div className="mt-2 break-words rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3 font-mono text-[10px] text-[var(--muted-strong)]">{result.expression}</div>}
      </div>}
    </section>
  );
}
