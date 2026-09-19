"use client";

import { useEffect, useState } from "react";
import { BadgeCheck, CircleCheck, FileCheck2, ShieldCheck } from "lucide-react";

type Stage = "UNMEASURABLE" | "OBSERVED" | "INTEGRITY_VERIFIED" | "RETESTED" | "PROVEN";
type RecordItem = {
  decisionRef: string;
  subject: string;
  decision: string;
  stage: Stage;
  nextAction: string;
  observedAt: string | null;
};
type ProofResponse = {
  ok: boolean;
  records?: RecordItem[];
  counts?: Record<string, number>;
  error?: string;
};

const stageCopy: Record<Stage, string> = {
  UNMEASURABLE: "UNMEASURABLE",
  OBSERVED: "OBSERVED",
  INTEGRITY_VERIFIED: "INTEGRITY VERIFIED",
  RETESTED: "RETESTED",
  PROVEN: "PROVEN",
};

const stageIcon: Record<Stage, typeof BadgeCheck> = {
  UNMEASURABLE: FileCheck2,
  OBSERVED: FileCheck2,
  INTEGRITY_VERIFIED: ShieldCheck,
  RETESTED: CircleCheck,
  PROVEN: BadgeCheck,
};

export default function ProgressiveProofPanel() {
  const [data, setData] = useState<ProofResponse | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/console/progressive-proofing", { cache: "no-store" })
      .then((response) => response.json() as Promise<ProofResponse>)
      .then((payload) => { if (active) setData(payload); })
      .catch(() => { if (active) setData({ ok: false, error: "progressive_proofing_unavailable" }); });
    return () => { active = false; };
  }, []);

  const records = data?.records ?? [];
  const summary = data?.counts ?? {};
  const StageIcon = records.length > 0 ? stageIcon[records[0].stage] : FileCheck2;

  return (
    <section className="mt-8 rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-5 sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <StageIcon className="h-4 w-4 text-[var(--accent)]" />
            <h2 className="text-sm font-semibold">Progressive proofing</h2>
          </div>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-[var(--muted)]">
            Evidence advances only when the underlying proof step exists: observation → receipt integrity → retest → observed result.
          </p>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--muted)]">
          {data?.ok ? records.length + " evidence records" : "UNMEASURABLE"}
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-5">
        {(["UNMEASURABLE", "OBSERVED", "INTEGRITY_VERIFIED", "RETESTED", "PROVEN"] as Stage[]).map((stage) => (
          <div key={stage} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-3">
            <div className="font-mono text-sm font-semibold">{summary[stage] ?? 0}</div>
            <div className="mt-1 text-[9px] uppercase tracking-wider text-[var(--muted)]">{stageCopy[stage]}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-2">
        {records.slice(0, 8).map((record) => (
          <div key={record.decisionRef} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="truncate text-xs font-medium">{record.subject}</div>
                <div className="mt-1 text-[10px] text-[var(--muted)]">{record.decision} · {record.observedAt ? new Date(record.observedAt).toLocaleString() : "observation time unavailable"}</div>
              </div>
              <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-[var(--accent)]">{stageCopy[record.stage]}</span>
            </div>
            <p className="mt-2 text-[10px] leading-4 text-[var(--muted)]">{record.nextAction}</p>
          </div>
        ))}
        {records.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-4 text-xs text-[var(--muted)]">
            No tenant-scoped MCP evidence is available. Proofing remains UNMEASURABLE until a real evidence record exists.
          </div>
        )}
      </div>
    </section>
  );
}
