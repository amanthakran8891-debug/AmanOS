"use client";

import { motion } from "framer-motion";
import type { DashboardData } from "@/lib/data";

export function FutureSelf({ data }: { data: DashboardData }) {
  const { today, settings, score, streakDays, dragon } = data;
  const goalDays = settings.noJointGoalDays || 180;
  const streakPct = Math.min(100, Math.round((streakDays / goalDays) * 100));
  const weightToGo = today.weightKg != null && settings.weightGoal ? +(today.weightKg - settings.weightGoal).toFixed(1) : null;
  const scorePct = Math.min(100, Math.round((score.total / 90) * 100));

  return (
    <div className="card relative overflow-hidden">
      <motion.div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-neon-cyan/10 blur-3xl" animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 8, repeat: Infinity }} />
      <p className="label text-neon-cyan">Future Self</p>

      <div className="mt-3 grid grid-cols-2 gap-3">
        {/* Current */}
        <div className="rounded-2xl border border-line bg-surface-2/60 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Current Aman</p>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-200">
            <li>⚖ {today.weightKg ?? "—"} kg</li>
            <li>🔥 {streakDays} day streak</li>
            <li>⚡ Life Score {score.total}</li>
            <li>🐉 Dragon {dragon.power}%</li>
          </ul>
        </div>
        {/* Future */}
        <div className="rounded-2xl border border-neon-cyan/30 bg-neon-cyan/5 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neon-cyan">Future Aman</p>
          <ul className="mt-2 space-y-1.5 text-sm text-white">
            <li>⚖ {settings.weightGoal || "set goal"} kg</li>
            <li>🔥 {goalDays} day clean streak</li>
            <li>🎓 NCLEX Passed</li>
            <li>✈ BharatFare Successful</li>
            <li>🐉 Dragon Defeated</li>
          </ul>
        </div>
      </div>

      {/* Distance remaining */}
      <div className="mt-3 space-y-2.5">
        <Progress label={`Clean streak → ${goalDays} days`} pct={streakPct} right={`${Math.max(0, goalDays - streakDays)} to go`} color="#34f5c5" />
        <Progress label="Life Score → 90" pct={scorePct} right={`${Math.max(0, 90 - score.total)} to go`} color="#22d3ee" />
        {weightToGo != null && (
          <Progress
            label={`Weight → ${settings.weightGoal} kg`}
            pct={Math.max(0, Math.min(100, 100 - Math.abs(weightToGo) * 5))}
            right={`${Math.abs(weightToGo)} kg ${weightToGo > 0 ? "to lose" : "to gain"}`}
            color="#a78bfa"
          />
        )}
      </div>

      <p className="mt-3 text-center text-xs font-medium text-neon-cyan/90">Your future self is watching. Build him today.</p>
    </div>
  );
}

function Progress({ label, pct, right, color }: { label: string; pct: number; right: string; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-[11px]">
        <span className="text-slate-300">{label}</span>
        <span className="tabular-nums text-slate-400">{right}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-bg">
        <motion.div className="h-full rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}66` }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1 }} />
      </div>
    </div>
  );
}
