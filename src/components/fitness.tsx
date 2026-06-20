// AmanOS — Phase 2, item 4: Fitness Progress Command Center panel (presentational, pure).
import type { FitnessCommand, MeasureTrend, GraphPoint } from "@/lib/fitness";

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/50 p-2.5 text-center">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-base font-bold" style={{ color: color ?? "#e2e8f0" }}>{value}</p>
      {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
    </div>
  );
}

// downChange green when a metric we want to fall (weight/waist/bodyFat) decreases
function chg(n: number | null, unit = "", lowerIsBetter = true) {
  if (n == null) return <span className="text-slate-500">—</span>;
  const good = lowerIsBetter ? n < 0 : n > 0;
  const cls = n === 0 ? "text-slate-400" : good ? "text-neon-green" : "text-neon-red";
  return <span className={cls}>{n > 0 ? "+" : ""}{n}{unit}</span>;
}

function Measure({ label, m, unit }: { label: string; m: MeasureTrend; unit: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/50 p-2.5 text-center">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-base font-bold text-slate-100">{m.current != null ? `${m.current}${unit}` : "—"}</p>
      <p className="text-[10px]">{chg(m.delta, unit)}</p>
    </div>
  );
}

function Bars({ points, color = "#22d3ee" }: { points: GraphPoint[]; color?: string }) {
  const W = 300, H = 60, n = points.length;
  const max = Math.max(1, ...points.map((p) => p.value));
  const bw = n > 0 ? W / n : W;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 60 }} preserveAspectRatio="none">
      {points.map((p, i) => {
        const h = (p.value / max) * H;
        return <rect key={i} x={i * bw + 1} y={H - h} width={Math.max(1, bw - 2)} height={h} fill={color} rx={1} />;
      })}
    </svg>
  );
}

function Line({ points, color = "#34f5c5" }: { points: GraphPoint[]; color?: string }) {
  const W = 300, H = 60, n = points.length;
  const vals = points.map((p) => p.value);
  const lo = vals.length ? Math.min(...vals) : 0, hi = vals.length ? Math.max(...vals) : 1;
  const range = hi - lo || 1;
  const x = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * W);
  const y = (v: number) => H - ((v - lo) / range) * H;
  const poly = points.map((p, i) => `${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 60 }} preserveAspectRatio="none">
      <polyline points={poly} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  );
}

export function FitnessPanel({ data: d }: { data: FitnessCommand }) {
  const bandColor = d.fitnessScore >= 85 ? "#34f5c5" : d.fitnessScore >= 65 ? "#a3e635" : d.fitnessScore >= 40 ? "#22d3ee" : "#fb7185";
  return (
    <div className="card">
      <div>
        <p className="label">💪 Fitness Command Center</p>
        <p className="mt-0.5 text-[11px] text-slate-500">Weight, strength, body metrics &amp; consistency — from your logs.</p>
      </div>

      {/* Fitness score */}
      <div className="mt-3 rounded-xl border border-line bg-surface-2/50 p-3 text-center">
        <p className="text-3xl font-extrabold" style={{ color: bandColor }}>{d.fitnessScore}<span className="text-base text-slate-500">/100</span></p>
        <p className="mt-0.5 text-sm font-bold" style={{ color: bandColor }}>{d.band}</p>
        <p className="mt-1 text-[10px] text-slate-500">Weight {d.scoreBreakdown.weight} · Consistency {d.scoreBreakdown.consistency} · Strength {d.scoreBreakdown.strength} · Nutrition {d.scoreBreakdown.nutrition}</p>
      </div>

      {/* Next action */}
      <div className="mt-3 rounded-xl border border-neon-amber/30 bg-neon-amber/5 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Next action</p>
        <p className="mt-0.5 text-sm font-semibold text-slate-100">{d.nextAction}</p>
      </div>

      {/* Weight */}
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        <Stat label="Weight" value={d.currentWeight != null ? `${d.currentWeight}kg` : "—"} />
        <Stat label="Goal" value={d.goalWeight != null ? `${d.goalWeight}kg` : "—"} />
        <div className="rounded-xl border border-line bg-surface-2/50 p-2.5 text-center"><p className="text-[10px] uppercase tracking-wide text-slate-500">7d</p><p className="mt-0.5 text-base font-bold">{chg(d.change7, "kg")}</p></div>
        <div className="rounded-xl border border-line bg-surface-2/50 p-2.5 text-center"><p className="text-[10px] uppercase tracking-wide text-slate-500">30d</p><p className="mt-0.5 text-base font-bold">{chg(d.change30, "kg")}</p></div>
        <Stat label="BMI" value={d.bmi != null ? String(d.bmi) : "—"} />
        <Stat label="To goal" value={d.progressToGoal != null ? `${d.progressToGoal}%` : "—"} color="#34f5c5" />
      </div>

      {/* Weight trend graph */}
      {d.weightTrend.length > 1 && (
        <div className="mt-3 rounded-xl border border-line bg-surface-2/40 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Weight trend</p>
          <div className="mt-2"><Line points={d.weightTrend} /></div>
        </div>
      )}

      {/* Strength */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="Volume 7d" value={d.weeklyVolume.toLocaleString()} sub="sets×reps×kg" />
        <Stat label="Volume 30d" value={d.monthlyVolume.toLocaleString()} />
        <Stat label="Consistency" value={`${d.consistencyPct}%`} sub={`${d.sessions7}/${d.gymTarget} this wk`} color="#34f5c5" />
      </div>

      {d.bestLifts.length > 0 && (
        <div className="mt-2 overflow-x-auto">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Best lifts</p>
          <table className="mt-1 w-full text-[12px]">
            <tbody>
              {d.bestLifts.map((l) => (
                <tr key={l.exercise} className="border-b border-line/40 last:border-0">
                  <td className="py-1 pr-2 text-slate-300">{l.exercise}</td>
                  <td className="py-1 pr-2 text-slate-500">{l.bodyPart}</td>
                  <td className="py-1 pr-2 text-right font-semibold text-slate-100">{l.maxWeight}kg</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {d.recentPRs.length > 0 && (
        <div className="mt-2 rounded-xl border border-line bg-surface-2/40 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Recent PRs (30d)</p>
          <ul className="mt-1 space-y-0.5 text-[12px]">
            {d.recentPRs.map((p) => (<li key={p.exercise} className="flex justify-between"><span className="text-slate-300">🏆 {p.exercise}</span><span className="text-neon-green font-semibold">{p.weight}kg <span className="text-slate-500">{p.date.slice(5)}</span></span></li>))}
          </ul>
        </div>
      )}

      {/* Body metrics */}
      <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">Body metrics</p>
      <div className="mt-1.5 grid grid-cols-3 gap-2 sm:grid-cols-5">
        <Measure label="Chest" m={d.chest} unit="cm" />
        <Measure label="Waist" m={d.waist} unit="cm" />
        <Measure label="Arms" m={d.arms} unit="cm" />
        <Measure label="Thighs" m={d.thighs} unit="cm" />
        <Measure label="Body fat" m={d.bodyFat} unit="%" />
      </div>

      {/* Frequency + volume graphs */}
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-surface-2/40 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Training frequency (12 wk)</p>
          <div className="mt-2"><Bars points={d.trainingFrequency} color="#22d3ee" /></div>
        </div>
        <div className="rounded-xl border border-line bg-surface-2/40 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Weekly volume (12 wk)</p>
          <div className="mt-2"><Bars points={d.weeklyVolumeTrend} color="#a3e635" /></div>
        </div>
      </div>

      {/* Records */}
      <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">Personal records</p>
      <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Stat label="Heaviest" value={d.records.heaviest != null ? `${d.records.heaviest}kg` : "—"} />
        <Stat label="Lowest" value={d.records.lowest != null ? `${d.records.lowest}kg` : "—"} />
        <Stat label="Best wk volume" value={d.records.bestWeeklyVolume.toLocaleString()} />
        <Stat label="Gym streak" value={`${d.records.longestGymStreak}d`} color="#34f5c5" />
        <Stat label="Loss streak" value={`${d.records.biggestLossStreak}`} color="#34f5c5" />
      </div>
    </div>
  );
}
