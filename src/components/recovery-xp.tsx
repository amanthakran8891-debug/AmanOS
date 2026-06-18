"use client";

import { motion } from "framer-motion";
import type { RecoveryXp } from "@/lib/recovery-xp";

export function RecoveryXpCard({ xp }: { xp: RecoveryXp }) {
  const l = xp.level;
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="label text-neon-violet">Recovery XP</p>
          <p className="mt-1 text-3xl font-black tabular-nums text-white">
            +{xp.today.total}<span className="ml-1 text-sm font-semibold text-slate-400">today</span>
          </p>
          <p className="text-xs text-slate-400">Lifetime <span className="font-bold tabular-nums text-neon-violet">{xp.lifetime.total.toLocaleString()}</span> XP</p>
        </div>
        <div className="text-right">
          <p className="label">Level</p>
          <p className="text-2xl font-black text-neon-violet">{l.level}</p>
          <p className="text-[10px] font-semibold text-slate-400">{l.rank}</p>
        </div>
      </div>

      {/* level progress */}
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-bg">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-neon-violet to-neon-cyan" initial={{ width: 0 }} animate={{ width: `${l.progressPct}%` }} transition={{ duration: 0.8 }} style={{ boxShadow: "0 0 12px rgba(167,139,250,0.6)" }} />
      </div>
      <p className="mt-1 text-[10px] text-slate-500">
        {l.nextRankName ? `${l.xpToNext.toLocaleString()} XP → Lvl ${l.nextRankLevel} ${l.nextRankName}` : "Max rank reached"}
      </p>

      {xp.today.lines.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {xp.today.lines.map((line) => (
            <span key={line.key} className="chip text-[11px] text-slate-300">{line.label} <span className="font-bold text-neon-violet">+{line.xp}</span></span>
          ))}
        </div>
      )}
    </div>
  );
}
