"use client";

import { useTransition } from "react";
import { motion } from "framer-motion";
import type { DashboardData } from "@/lib/data";
import { markCleanToday, addFood, toggleFlag, setField } from "@/app/actions";

export function QuickActions({ data }: { data: DashboardData }) {
  const { today, settings } = data;
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<void>) => start(() => void fn());

  const buttons = [
    {
      label: "No Joint",
      icon: "🚭",
      done: today.jointClean,
      onTap: () => run(() => markCleanToday()),
      hint: "Mark today clean",
    },
    {
      label: "Protein Target",
      icon: "🥩",
      done: today.proteinG >= settings.proteinTarget,
      onTap: () => run(() => addFood("Quick protein top-up", Math.max(0, settings.proteinTarget - today.proteinG), 0)),
      hint: `${today.proteinG}/${settings.proteinTarget}g`,
    },
    {
      label: "Gym Complete",
      icon: "🏋",
      done: today.gymDone,
      onTap: () => run(() => toggleFlag("gymDone")),
      hint: today.gymDone ? "Done" : "Tap when trained",
    },
    {
      label: "NCLEX Complete",
      icon: "📚",
      done: today.nclexHours >= settings.nclexHoursTarget,
      onTap: () => run(() => setField("nclexHours", settings.nclexHoursTarget)),
      hint: `${today.nclexHours}/${settings.nclexHoursTarget}h`,
    },
    {
      label: "Sleep Target",
      icon: "😴",
      done: today.sleepHours >= settings.sleepTarget,
      onTap: () => run(() => setField("sleepHours", settings.sleepTarget)),
      hint: `${today.sleepHours}/${settings.sleepTarget}h`,
    },
  ];

  return (
    <div className="card">
      <p className="label">Quick Actions <span className="text-slate-500">· update your day in seconds</span></p>
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        {buttons.map((b) => (
          <motion.button
            key={b.label}
            whileTap={{ scale: 0.95 }}
            disabled={pending}
            onClick={b.onTap}
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-4 text-center transition ${
              b.done ? "border-neon-green/50 bg-neon-green/15 shadow-glow" : "border-line bg-surface-2 hover:border-neon-cyan/40"
            }`}
          >
            <span className="text-2xl">{b.icon}</span>
            <span className={`text-xs font-bold ${b.done ? "text-neon-green" : "text-white"}`}>{b.done ? "✓ " : ""}{b.label}</span>
            <span className="text-[10px] text-slate-400">{b.hint}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
