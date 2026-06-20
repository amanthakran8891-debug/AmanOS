// AmanOS — Phase 1, item 8: Discipline Score History panel (presentational, pure).
import type { DisciplineHistory, PeriodTrend, DisciplineGraphPoint } from "@/lib/discipline-history";

function dirBadge(d: PeriodTrend["direction"], delta: number) {
  if (d === "improving") return <span className="text-neon-green">▲ +{delta}</span>;
  if (d === "declining") return <span className="text-neon-red">▼ {delta}</span>;
  return <span className="text-slate-400">→ Stable</span>;
}

function Graph({ points }: { points: DisciplineGraphPoint[] }) {
  const W = 300, H = 90, n = points.length;
  const x = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * W);
  const y = (v: number) => H - (Math.max(0, Math.min(100, v)) / 100) * H;
  const line = (key: "roll7" | "roll28") =>
    points
      .map((p, i) => (p[key] == null ? null : `${x(i).toFixed(1)},${y(p[key]!).toFixed(1)}`))
      .filter(Boolean)
      .join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 90 }} preserveAspectRatio="none">
      {points.map((p, i) =>
        p.score == null ? null : (
          <rect key={p.date} x={x(i) - 2} y={y(p.score)} width={4} height={H - y(p.score)} fill="#334155" rx={1} />
        ),
      )}
      <polyline points={line("roll28")} fill="none" stroke="#22d3ee" strokeWidth={1.5} />
      <polyline points={line("roll7")} fill="none" stroke="#fbbf24" strokeWidth={1.5} />
    </svg>
  );
}

function Rec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/50 p-2.5 text-center">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-base font-bold text-slate-100">{value}</p>
    </div>
  );
}

export function DisciplineHistoryPanel({ data }: { data: DisciplineHistory }) {
  const rows: [string, PeriodTrend][] = [
    ["7 days", data.trends.d7],
    ["14 days", data.trends.d14],
    ["21 days", data.trends.d21],
    ["28 days", data.trends.d28],
  ];
  const r = data.records;

  return (
    <div className="card">
      <div>
        <p className="label">📊 Discipline Score History</p>
        <p className="mt-0.5 text-[11px] text-slate-500">Trends matter more than single days. Strong ≥ 75 · Drift &lt; 45.</p>
      </div>

      {/* Trend report */}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-wide text-slate-500">
              <th className="py-1.5 pr-2 text-left">Period</th>
              <th className="py-1.5 pr-2 text-right">Avg</th>
              <th className="py-1.5 pr-2 text-right">Best</th>
              <th className="py-1.5 pr-2 text-right">Worst</th>
              <th className="py-1.5 pr-2 text-right">Strong</th>
              <th className="py-1.5 pr-2 text-right">Drift</th>
              <th className="py-1.5 pr-2 text-right">vs prev</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, t]) => (
              <tr key={label} className="border-b border-line/40 last:border-0">
                <td className="py-1.5 pr-2 text-slate-400">{label}</td>
                <td className="py-1.5 pr-2 text-right font-bold text-slate-100">{t.avg}</td>
                <td className="py-1.5 pr-2 text-right text-neon-green">{t.best}</td>
                <td className="py-1.5 pr-2 text-right text-neon-red">{t.worst}</td>
                <td className="py-1.5 pr-2 text-right text-emerald-300">{t.strongDays}</td>
                <td className="py-1.5 pr-2 text-right text-amber-300">{t.driftDays}</td>
                <td className="py-1.5 pr-2 text-right">{dirBadge(t.direction, t.improvement)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Consistency */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-line bg-surface-2/50 p-2.5 text-center">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">28-day average</p>
          <p className="mt-0.5 text-lg font-bold text-slate-100">{data.consistencyAvg}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface-2/50 p-2.5 text-center">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Consistency score</p>
          <p className="mt-0.5 text-lg font-bold text-neon-green">{data.consistencyScore}</p>
        </div>
      </div>

      {/* Graph */}
      <div className="mt-3 rounded-xl border border-line bg-surface-2/40 p-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Last 30 days</p>
          <p className="text-[10px] text-slate-500"><span className="text-amber-300">━ 7-day</span> · <span className="text-cyan-300">━ 28-day</span></p>
        </div>
        <div className="mt-2"><Graph points={data.graph} /></div>
      </div>

      {/* Personal records */}
      <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">Personal records</p>
      <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Rec label="Highest score" value={String(r.highestScore)} />
        <Rec label="Best 7-day avg" value={String(r.highest7Avg)} />
        <Rec label="Best 14-day avg" value={String(r.highest14Avg)} />
        <Rec label="Best 28-day avg" value={String(r.highest28Avg)} />
        <Rec label="Longest strong streak" value={`${r.longestStrongStreak}d`} />
        <Rec label="Longest clean streak" value={`${r.longestCleanStreak}d`} />
        <Rec label="Best month" value={r.bestMonth ? `${r.bestMonth.month} (${r.bestMonth.avg})` : "—"} />
      </div>
    </div>
  );
}
