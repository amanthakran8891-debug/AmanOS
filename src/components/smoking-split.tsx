// AmanOS — Phase 1, item 2: Joint vs Cigarette split panel (presentational).
// Server component (no client JS) — receives a pre-computed split.
import type { SmokingSplit, SubstanceSplit } from "@/lib/smoking-split";

function Column({ title, emoji, accent, data, unit }: { title: string; emoji: string; accent: string; data: SubstanceSplit; unit: string }) {
  const rows: [string, number][] = [
    ["Today", data.today],
    ["Last 7 days", data.last7],
    ["Last 30 days", data.last30],
    ["This year", data.year],
    ["Lifetime", data.lifetime],
  ];
  return (
    <div className="rounded-xl border border-line bg-surface-2/50 p-3">
      <p className="text-sm font-bold" style={{ color: accent }}>{emoji} {title}</p>
      <table className="mt-2 w-full text-[12px]">
        <tbody>
          {rows.map(([label, n]) => (
            <tr key={label} className="border-b border-line/40 last:border-0">
              <td className="py-1 text-slate-400">{label}</td>
              <td className="py-1 text-right font-semibold text-slate-100">{n.toLocaleString()}<span className="ml-1 text-[10px] font-normal text-slate-500">{unit}</span></td>
            </tr>
          ))}
          <tr>
            <td className="pt-1.5 text-slate-400">Lifetime cost</td>
            <td className="pt-1.5 text-right font-bold" style={{ color: accent }}>£{data.cost.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function SmokingSplitPanel({ split }: { split: SmokingSplit }) {
  return (
    <div className="card">
      <div>
        <p className="label">🚬 Joint vs Cigarette Split</p>
        <p className="mt-0.5 text-[11px] text-slate-500">Joints £5 each · Cigarettes £0.50 each. Counted from your logged history.</p>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Column title="Joints" emoji="🌿" accent="#34d399" data={split.joints} unit="joints" />
        <Column title="Cigarettes" emoji="🚬" accent="#fbbf24" data={split.cigarettes} unit="cigs" />
      </div>

      {/* Totals */}
      <div className="mt-3 rounded-xl border border-line bg-surface-2/40 p-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Total smoking cost</span>
          <span className="text-lg font-extrabold text-neon-red">£{split.totalCost.toFixed(2)}</span>
        </div>
        {/* Cost-share bar */}
        <div className="mt-2 flex h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div style={{ width: `${split.jointPct}%`, background: "#34d399" }} />
          <div style={{ width: `${split.cigPct}%`, background: "#fbbf24" }} />
        </div>
        <div className="mt-1.5 flex justify-between text-[11px]">
          <span className="text-emerald-300">Joints {split.jointPct}%</span>
          <span className="text-amber-300">Cigarettes {split.cigPct}%</span>
        </div>
        <p className="mt-1 text-[10px] text-slate-500">% shown is share of total smoking cost.</p>
      </div>
    </div>
  );
}
