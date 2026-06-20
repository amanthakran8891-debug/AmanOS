// AmanOS — Phase 1, item 4: Money Saved panel (presentational, pure).
import type { MoneySaved, SavedPeriod } from "@/lib/money-saved";

const ROWS: [string, keyof MoneySaved][] = [
  ["Today", "today"],
  ["Last 7 days", "last7"],
  ["Last 30 days", "last30"],
  ["This year", "year"],
  ["Lifetime", "lifetime"],
];

function Goal({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <div className="flex justify-between text-[11px]">
        <span className="text-slate-400">{label}</span>
        <span className="font-semibold text-neon-green">{pct}%</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div style={{ width: `${pct}%` }} className="h-full bg-neon-green" />
      </div>
    </div>
  );
}

export function MoneySavedPanel({ data }: { data: MoneySaved }) {
  const isRow = (k: keyof MoneySaved): k is "today" | "last7" | "last30" | "year" | "lifetime" =>
    ["today", "last7", "last30", "year", "lifetime"].includes(k as string);

  return (
    <div className="card">
      <div>
        <p className="label">💰 Money Saved</p>
        <p className="mt-0.5 text-[11px] text-slate-500">
          What staying clean kept in your pocket. Baseline: {data.baseline.jointsPerDay} joints/day · {data.baseline.cigsPerDay} cigs/day
          {data.hasReliableBaseline ? "" : " (set a baseline for accuracy)"}.
        </p>
      </div>

      {/* Lifetime headline */}
      <div className="mt-3 rounded-xl border border-line bg-surface-2/50 p-3 text-center">
        <p className="text-[10px] uppercase tracking-wide text-slate-500">Lifetime saved</p>
        <p className="mt-0.5 text-2xl font-extrabold text-neon-green">£{data.lifetime.saved.toFixed(2)}</p>
        <p className="mt-0.5 text-[11px] text-slate-500">{data.lifetime.jointsAvoided.toLocaleString()} joints · {data.lifetime.cigsAvoided.toLocaleString()} cigarettes avoided</p>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-wide text-slate-500">
              <th className="py-1.5 pr-2 text-left">Period</th>
              <th className="py-1.5 pr-2 text-right">Joints avoided</th>
              <th className="py-1.5 pr-2 text-right">Cigs avoided</th>
              <th className="py-1.5 pr-2 text-right">Saved</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([label, key]) => {
              if (!isRow(key)) return null;
              const p = data[key] as SavedPeriod;
              return (
                <tr key={key} className="border-b border-line/40 last:border-0">
                  <td className="py-1.5 pr-2 text-slate-400">{label}</td>
                  <td className="py-1.5 pr-2 text-right text-emerald-300">{p.jointsAvoided.toLocaleString()}</td>
                  <td className="py-1.5 pr-2 text-right text-amber-300">{p.cigsAvoided.toLocaleString()}</td>
                  <td className="py-1.5 pr-2 text-right font-bold text-neon-green">£{p.saved.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Milestones */}
      <div className="mt-3 space-y-2 rounded-xl border border-line bg-surface-2/40 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Savings milestones</p>
        <Goal label="£100" pct={data.goals.p100} />
        <Goal label="£500" pct={data.goals.p500} />
        <Goal label="£1,000" pct={data.goals.p1000} />
      </div>
    </div>
  );
}
