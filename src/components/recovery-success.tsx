// AmanOS — Phase 1, item 5: Recovery Success Rate panel (presentational, pure).
import type { RecoverySuccess } from "@/lib/recovery-success";

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/50 p-2.5 text-center">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-lg font-bold" style={{ color: color ?? "#e2e8f0" }}>{value}</p>
      {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
    </div>
  );
}

export function RecoverySuccessPanel({ data }: { data: RecoverySuccess }) {
  const rateColor = data.successRate >= 80 ? "#34f5c5" : data.successRate >= 50 ? "#fbbf24" : "#fb7185";
  return (
    <div className="card">
      <div>
        <p className="label">📈 Recovery Success Rate</p>
        <p className="mt-0.5 text-[11px] text-slate-500">A relapse never erases progress. Clean = no cannabis &amp; no nicotine use that day.</p>
      </div>

      {/* Headline */}
      <div className="mt-3 rounded-xl border border-line bg-surface-2/50 p-3 text-center">
        <p className="text-3xl font-extrabold" style={{ color: rateColor }}>{data.successRate}%</p>
        <p className="mt-0.5 text-[12px] text-slate-300">{data.cleanDays} clean of {data.daysSinceFirstAttempt} total days</p>
        <p className="text-[10px] text-slate-500">since first quit attempt{data.anchorDate ? ` · ${data.anchorDate}` : ""}</p>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="Total days" value={String(data.daysSinceFirstAttempt)} />
        <Stat label="Clean days" value={String(data.cleanDays)} color="#34f5c5" />
        <Stat label="Use days" value={String(data.useDays)} color="#fb7185" />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <Stat label="Last 7 days" value={`${data.last7Rate}%`} />
        <Stat label="Last 30 days" value={`${data.last30Rate}%`} />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <Stat label="Best clean period" value={`${data.bestCleanPeriodDays}d`} color="#34f5c5" />
        <Stat label="Worst relapse period" value={`${data.worstRelapsePeriodDays}d`} color="#fb7185" />
      </div>
    </div>
  );
}
