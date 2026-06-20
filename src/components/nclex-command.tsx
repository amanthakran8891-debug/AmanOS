// AmanOS — Phase 2, item 1: NCLEX Command Center panel (presentational, pure).
import type { NclexCommand } from "@/lib/nclex-command";

const STATUS_COLOR: Record<string, string> = {
  Strong: "#34f5c5",
  "Needs Work": "#fbbf24",
  Critical: "#fb7185",
  "No data": "#475569",
};

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/50 p-2.5 text-center">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-lg font-bold" style={{ color: color ?? "#e2e8f0" }}>{value}</p>
      {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
    </div>
  );
}

function trendBadge(t: "improving" | "stable" | "declining") {
  if (t === "improving") return <span className="text-neon-green">▲ Improving</span>;
  if (t === "declining") return <span className="text-neon-red">▼ Declining</span>;
  return <span className="text-slate-400">→ Stable</span>;
}

function Graph({ points }: { points: NclexCommand["graph"] }) {
  const W = 300, H = 80, n = points.length;
  const maxQ = Math.max(10, ...points.map((p) => p.questions));
  const x = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * W);
  const y = (v: number) => H - (Math.max(0, v) / maxQ) * H;
  const line = (key: "roll7" | "roll30") =>
    points.map((p, i) => (p[key] == null ? null : `${x(i).toFixed(1)},${y(p[key]!).toFixed(1)}`)).filter(Boolean).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 80 }} preserveAspectRatio="none">
      {points.map((p, i) => (p.questions <= 0 ? null : <rect key={p.date} x={x(i) - 2} y={y(p.questions)} width={4} height={H - y(p.questions)} fill="#334155" rx={1} />))}
      <polyline points={line("roll30")} fill="none" stroke="#22d3ee" strokeWidth={1.5} />
      <polyline points={line("roll7")} fill="none" stroke="#fbbf24" strokeWidth={1.5} />
    </svg>
  );
}

export function NclexCommand({ data: d }: { data: NclexCommand }) {
  const bandColor = d.readinessScore >= 85 ? "#34f5c5" : d.readinessScore >= 65 ? "#a3e635" : d.readinessScore >= 40 ? "#22d3ee" : "#fb7185";
  return (
    <div className="card">
      <div>
        <p className="label">🎯 NCLEX Command Center</p>
        <p className="mt-0.5 text-[11px] text-slate-500">Goal {d.goal.toLocaleString()} questions · pace, accuracy, weak areas, readiness.</p>
      </div>

      {/* Countdown + progress */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Exam" value={d.examSet ? `${d.daysLeft}d` : "Not set"} sub={d.examSet ? `${d.weeksLeft}w · ${d.examDateLabel}` : "set exam date"} color="#22d3ee" />
        <Stat label="Completed" value={d.totalQuestions.toLocaleString()} sub={`${d.pctComplete}% of goal`} />
        <Stat label="Remaining" value={d.remaining.toLocaleString()} />
        <Stat label="On track?" value={d.onTrack ? "Yes" : "No"} color={d.onTrack ? "#34f5c5" : "#fb7185"} />
      </div>

      {/* Pace */}
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Stat label="Need / day" value={String(d.requiredPerDay)} />
        <Stat label="Need / week" value={String(d.requiredPerWeek)} />
        <Stat label="Your pace / day" value={String(d.pacePerDay)} color={d.onTrack ? "#34f5c5" : "#fbbf24"} />
      </div>

      {/* Accuracy */}
      <div className="mt-2 grid grid-cols-4 gap-2">
        <Stat label="Overall acc" value={`${d.overallAccuracy}%`} />
        <Stat label="Last 7d" value={d.acc7Count > 0 ? `${d.acc7}%` : "—"} />
        <Stat label="Last 30d" value={d.acc30Count > 0 ? `${d.acc30}%` : "—"} />
        <div className="rounded-xl border border-line bg-surface-2/50 p-2.5 text-center">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Trend</p>
          <p className="mt-0.5 text-sm font-bold">{trendBadge(d.accuracyTrend)}</p>
        </div>
      </div>

      {/* Readiness */}
      <div className="mt-3 rounded-xl border border-line bg-surface-2/50 p-3 text-center">
        <p className="text-3xl font-extrabold" style={{ color: bandColor }}>{d.readinessScore}<span className="text-base text-slate-500">/100</span></p>
        <p className="mt-0.5 text-sm font-bold" style={{ color: bandColor }}>{d.readinessBand}</p>
        <p className="mt-1 text-[10px] text-slate-500">Volume {d.readinessBreakdown.volume} · Accuracy {d.readinessBreakdown.accuracy} · Consistency {d.readinessBreakdown.consistency} · Coverage {d.readinessBreakdown.coverage}</p>
      </div>

      {/* Categories */}
      <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">Category breakdown</p>
      <div className="mt-1.5 overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-wide text-slate-500">
              <th className="py-1.5 pr-2 text-left">Category</th>
              <th className="py-1.5 pr-2 text-right">Qs</th>
              <th className="py-1.5 pr-2 text-right">Acc</th>
              <th className="py-1.5 pr-2 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {d.categories.map((c) => (
              <tr key={c.key} className="border-b border-line/40 last:border-0">
                <td className="py-1.5 pr-2 text-slate-300">{c.short}</td>
                <td className="py-1.5 pr-2 text-right text-slate-400">{c.questions}</td>
                <td className="py-1.5 pr-2 text-right" style={{ color: c.color }}>{c.hasData ? `${c.accuracy}%` : "—"}</td>
                <td className="py-1.5 pr-2 text-right font-semibold" style={{ color: STATUS_COLOR[c.status] }}>{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Weak areas */}
      {d.weakAreas.length > 0 && (
        <div className="mt-3 rounded-xl border border-line bg-surface-2/40 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Weakest areas to fix</p>
          <ol className="mt-1.5 space-y-1">
            {d.weakAreas.map((w) => (
              <li key={w.rank} className="flex items-center justify-between text-[12px]">
                <span className="text-slate-300">{w.rank}. {w.label}</span>
                <span className="text-neon-red font-semibold">{w.accuracy}% <span className="text-slate-500">({w.questions} Qs)</span></span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Streaks + volume */}
      <div className="mt-3 grid grid-cols-4 gap-2">
        <Stat label="Streak" value={`${d.currentStreak}d`} color="#34f5c5" />
        <Stat label="Best streak" value={`${d.bestStreak}d`} />
        <Stat label="This week" value={String(d.questionsThisWeek)} />
        <Stat label="This month" value={String(d.questionsThisMonth)} />
      </div>

      {/* Graph */}
      <div className="mt-3 rounded-xl border border-line bg-surface-2/40 p-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Last 30 days — questions/day</p>
          <p className="text-[10px] text-slate-500"><span className="text-amber-300">━ 7d</span> · <span className="text-cyan-300">━ 30d</span></p>
        </div>
        <div className="mt-2"><Graph points={d.graph} /></div>
      </div>

      {/* Predictor */}
      <div className="mt-3 rounded-xl border border-line bg-surface-2/40 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Future predictor <span className="text-slate-600">(estimate — not a pass guarantee)</span></p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Stat label="Est. completion" value={d.expectedCompletion ?? "—"} />
          <Stat label="P(goal by exam)" value={d.probabilityHitGoal == null ? "—" : `${d.probabilityHitGoal}%`} color="#22d3ee" />
          <Stat label="Recommended / day" value={String(d.recommendedDailyTarget)} color="#a3e635" />
        </div>
      </div>
    </div>
  );
}
