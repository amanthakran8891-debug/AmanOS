// AmanOS — Phase 1, item 3: Dragon Tax (smoking cost per period).
// Pure presentational — works in server pages and inside client components.
import type { DragonTax } from "@/lib/smoking-split";

const ROWS: [string, keyof DragonTax][] = [
  ["Today", "today"],
  ["Last 7 days", "last7"],
  ["Last 30 days", "last30"],
  ["This year", "year"],
  ["Lifetime", "lifetime"],
];

export function DragonTaxPanel({ tax }: { tax: DragonTax }) {
  return (
    <div className="card">
      <div>
        <p className="label">🐉 Dragon Tax</p>
        <p className="mt-0.5 text-[11px] text-slate-500">The price the dragon charges. Joints £5 · Cigarettes £0.50.</p>
      </div>

      {/* Today headline */}
      <div className="mt-3 rounded-xl border border-line bg-surface-2/50 p-3 text-center">
        <p className="text-[10px] uppercase tracking-wide text-slate-500">Today</p>
        <p className="mt-0.5 text-2xl font-extrabold text-neon-red">£{tax.today.total.toFixed(2)}</p>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-wide text-slate-500">
              <th className="py-1.5 pr-2 text-left">Period</th>
              <th className="py-1.5 pr-2 text-right">Joint</th>
              <th className="py-1.5 pr-2 text-right">Cigarette</th>
              <th className="py-1.5 pr-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([label, key]) => {
              const p = tax[key];
              return (
                <tr key={key} className="border-b border-line/40 last:border-0">
                  <td className="py-1.5 pr-2 text-slate-400">{label}</td>
                  <td className="py-1.5 pr-2 text-right text-emerald-300">£{p.joint.toFixed(2)}</td>
                  <td className="py-1.5 pr-2 text-right text-amber-300">£{p.cig.toFixed(2)}</td>
                  <td className="py-1.5 pr-2 text-right font-bold text-slate-100">£{p.total.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
