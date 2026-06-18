"use client";

import { useState } from "react";
import type { CostDashboard } from "@/lib/cost";

export function CostDashboardCard({ cost }: { cost: CostDashboard }) {
  const [scope, setScope] = useState<"lifetime" | "last30">("lifetime");
  const b = scope === "lifetime" ? cost.lifetime : cost.last30;
  const c = cost.currency;

  const rows: { icon: string; label: string; value: string; note?: string }[] = [
    { icon: "💸", label: "Money spent", value: `${c}${b.money.toLocaleString()}`, note: b.moneyEstimated ? "estimated" : "logged" },
    { icon: "⏳", label: "Hours lost", value: `${b.hoursLost.toLocaleString()}h` },
    { icon: "📚", label: "Study hours lost", value: `${b.studyHoursLost.toLocaleString()}h` },
    { icon: "🏋", label: "Gym sessions lost", value: `${b.gymSessionsLost.toLocaleString()}` },
    { icon: "📉", label: "Life Score damage", value: `−${b.lifeScoreDamage.toLocaleString()}` },
  ];

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <p className="label">Addiction Cost</p>
        <div className="inline-flex rounded-lg border border-line bg-surface-2 p-0.5 text-[11px]">
          {(["lifetime", "last30"] as const).map((s) => (
            <button key={s} onClick={() => setScope(s)} className={`rounded-md px-2.5 py-1 font-semibold transition ${scope === s ? "bg-neon-red/15 text-neon-red" : "text-slate-400"}`}>
              {s === "lifetime" ? "Lifetime" : "Last 30 Days"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {rows.map((r) => (
          <div key={r.label} className="rounded-2xl border border-line bg-surface-2/60 p-3">
            <div className="text-lg">{r.icon}</div>
            <div className="mt-1 text-lg font-extrabold tabular-nums text-white">{r.value}</div>
            <div className="text-[10px] font-semibold text-slate-400">{r.label}{r.note ? ` · ${r.note}` : ""}</div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-slate-500">{cost.framing} · based on {b.useDays} use day{b.useDays === 1 ? "" : "s"}.</p>
    </div>
  );
}
