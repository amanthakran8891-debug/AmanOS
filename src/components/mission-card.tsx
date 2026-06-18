"use client";

import { motion } from "framer-motion";
import type { DashboardData } from "@/lib/data";

export function MissionCard({ data }: { data: DashboardData }) {
  const { today, settings } = data;
  const items = [
    { label: "Stay Clean", done: today.jointClean },
    { label: `Hit ${settings.proteinTarget}g Protein`, done: today.proteinG >= settings.proteinTarget },
    { label: "Complete NCLEX Study", done: today.nclexHours >= settings.nclexHoursTarget },
    { label: "Complete BharatFare Task", done: today.bharatfareDone },
    { label: "Train Scheduled Body Part", done: today.gymDone },
  ];
  const done = items.filter((i) => i.done).length;
  const all = done === items.length;

  return (
    <motion.div
      className="card relative overflow-hidden"
      style={{ background: all ? "linear-gradient(160deg, rgba(52,245,197,0.18), rgba(13,19,34,0.6))" : "linear-gradient(160deg, rgba(167,139,250,0.08), rgba(13,19,34,0.55))" }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between">
        <p className="label text-neon-violet">Full Daily Checklist</p>
        <span className={`text-sm font-bold tabular-nums ${all ? "text-neon-green" : "text-slate-300"}`}>{done} / {items.length}</span>
      </div>

      <div className="mt-3 space-y-1.5">
        {items.map((it, i) => (
          <motion.div
            key={it.label}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${it.done ? "border-neon-green/40 bg-neon-green/10" : "border-line bg-surface-2"}`}
          >
            <span className={`flex h-5 w-5 items-center justify-center rounded-md border text-[11px] ${it.done ? "border-neon-green bg-neon-green text-bg" : "border-line text-transparent"}`}>✓</span>
            <span className={`text-sm font-medium ${it.done ? "text-slate-400 line-through" : "text-white"}`}>{it.label}</span>
          </motion.div>
        ))}
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-bg">
        <motion.div className="h-full rounded-full bg-gradient-to-r from-neon-violet to-neon-green" initial={{ width: 0 }} animate={{ width: `${(done / items.length) * 100}%` }} transition={{ duration: 0.7 }} />
      </div>

      {all && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-3 text-center">
          <p className="text-lg font-extrabold text-neon-green glow-text">MISSION ACCOMPLISHED</p>
          <p className="text-sm font-semibold text-slate-200">The Dragon Weakens. 🐉</p>
        </motion.div>
      )}
    </motion.div>
  );
}
