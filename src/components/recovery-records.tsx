"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { bestRunSeconds, fmtRun } from "@/lib/clean-time";

export interface RecoveryRecordsData {
  bestCleanRunSec: number;
  highestLifeScore: number;
  bestDisciplineScore: number;
  highestDamageDay: number;
  totalCleanDays: number;
}

/** Permanent career statistics for the recovery journey. These persist across
 *  relapses — a setback resets the clock, never the records. */
export function RecoveryRecords({ records, lastJointAt }: { records: RecoveryRecordsData; lastJointAt: string | null }) {
  // Keep the Longest Clean Run ticking live when the current run is the record.
  const [bestSec, setBestSec] = useState(() => bestRunSeconds(records.bestCleanRunSec, lastJointAt));
  useEffect(() => {
    const tick = () => setBestSec(bestRunSeconds(records.bestCleanRunSec, lastJointAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [records.bestCleanRunSec, lastJointAt]);

  const cards: { icon: string; label: string; value: string; color: string }[] = [
    { icon: "🏆", label: "Longest Clean Run", value: fmtRun(bestSec), color: "#fbbf24" },
    { icon: "⭐", label: "Highest Life Score", value: String(records.highestLifeScore), color: "#34f5c5" },
    { icon: "⚔", label: "Highest Dragon Damage Day", value: records.highestDamageDay.toLocaleString(), color: "#a78bfa" },
    { icon: "🔥", label: "Best Discipline Score", value: String(records.bestDisciplineScore), color: "#fb7185" },
    { icon: "📅", label: "Total Clean Days Lifetime", value: String(records.totalCleanDays), color: "#22d3ee" },
  ];

  return (
    <div className="card">
      <p className="label text-amber-300/90">🎖 Recovery Records</p>
      <p className="mt-0.5 text-[11px] text-slate-500">Career stats — permanent. A relapse resets the clock, never these.</p>
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-line bg-surface-2/70 p-3 text-center"
            style={{ boxShadow: `inset 0 0 22px -16px ${c.color}` }}
          >
            <div className="text-xl" style={{ filter: `drop-shadow(0 0 8px ${c.color}66)` }}>{c.icon}</div>
            <div className="mt-1 font-mono text-lg font-extrabold tabular-nums" style={{ color: c.color, textShadow: `0 0 12px ${c.color}55` }}>
              {c.value}
            </div>
            <div className="mt-0.5 text-[10px] font-semibold leading-tight text-slate-400">{c.label}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
