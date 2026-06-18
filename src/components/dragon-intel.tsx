"use client";

import type { DragonIntel } from "@/lib/dragon-intel";

const SEV_COLOR = { high: "#fb7185", medium: "#fbbf24", low: "#64748b" } as const;

export function DragonIntelPanel({ intel }: { intel: DragonIntel }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <p className="label text-neon-violet">🐉 Dragon Intelligence</p>
        <span className="chip text-[11px]">{intel.exploitedCount}/{intel.totalWeaknesses} weaknesses hit</span>
      </div>
      <p className="mt-1 text-xs text-slate-400">{intel.summary}</p>

      {/* Weaknesses */}
      <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-neon-green/80">Weaknesses — exploit these</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {intel.weaknesses.map((w) => (
          <div key={w.key} className={`rounded-xl border px-3 py-2.5 ${w.exploitedToday ? "border-neon-green/50 bg-neon-green/10" : "border-line bg-surface-2/60"}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">{w.icon} {w.label}</span>
              <span className={`text-[11px] font-bold ${w.exploitedToday ? "text-neon-green" : "text-slate-400"}`}>{w.multiplier}</span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-400">{w.effect}</p>
            {w.exploitedToday && w.damageToday > 0 && (
              <p className="mt-1 text-[11px] font-bold text-neon-green">−{w.damageToday.toLocaleString()} HP today</p>
            )}
          </div>
        ))}
      </div>

      {(intel.cravingResistancePct > 0 || intel.cravingDampenPct > 0) && (
        <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
          {intel.cravingResistancePct > 0 && <span className="chip text-neon-cyan">🧠 +{intel.cravingResistancePct}% mental resistance</span>}
          {intel.cravingDampenPct > 0 && <span className="chip text-neon-green">🕉 −{intel.cravingDampenPct}% craving strength</span>}
        </div>
      )}

      {/* Strongest attacks */}
      <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-neon-red/80">Strongest attacks — defend these</p>
      <div className="mt-2 space-y-1.5">
        {intel.attacks.map((a) => (
          <div key={a.key} className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/60 px-3 py-2">
            <span className="text-lg">{a.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{a.label}</p>
              <p className="text-[11px] text-slate-400">{a.detail}</p>
            </div>
            <span className="h-2 w-2 rounded-full" style={{ background: SEV_COLOR[a.severity], boxShadow: `0 0 8px ${SEV_COLOR[a.severity]}` }} />
          </div>
        ))}
      </div>
    </div>
  );
}
