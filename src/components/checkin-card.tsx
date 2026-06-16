"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import type { DashboardData } from "@/lib/data";
import { markCleanToday, addWater, toggleFlag, addFood, setField, setNote } from "@/app/actions";

export function CheckinCard({ data }: { data: DashboardData }) {
  const { today, settings } = data;
  const hour = new Date().getHours();
  const [mode, setMode] = useState<"morning" | "night">(hour >= 16 ? "night" : "morning");
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<void>) => start(() => void fn());
  const [gratitude, setGratitude] = useState(today.notes);

  const morning = [
    { label: "Awake & ready", icon: "☀️", done: true, tap: () => {} },
    { label: "Hydrate (500ml)", icon: "💧", done: today.waterMl >= 500, tap: () => run(() => addWater(500)) },
    { label: "Stay clean today", icon: "🚭", done: today.jointClean, tap: () => run(() => markCleanToday()) },
    { label: "Read Gita", icon: "🕉️", done: today.spiritualDone, tap: () => run(() => toggleFlag("spiritualDone")) },
  ];
  const night = [
    { label: "Stayed clean", icon: "🚭", done: today.jointClean, tap: () => run(() => markCleanToday()) },
    { label: "Trained", icon: "🏋", done: today.gymDone, tap: () => run(() => toggleFlag("gymDone")) },
    { label: "Hit protein", icon: "🥩", done: today.proteinG >= settings.proteinTarget, tap: () => run(() => addFood("Quick protein top-up", Math.max(0, settings.proteinTarget - today.proteinG), 0)) },
    { label: "NCLEX done", icon: "📚", done: today.nclexHours >= settings.nclexHoursTarget, tap: () => run(() => setField("nclexHours", settings.nclexHoursTarget)) },
    { label: "Sleep target", icon: "😴", done: today.sleepHours >= settings.sleepTarget, tap: () => run(() => setField("sleepHours", settings.sleepTarget)) },
  ];
  const items = mode === "morning" ? morning : night;

  return (
    <div className="card" style={{ background: mode === "morning" ? "linear-gradient(160deg, rgba(251,191,36,0.10), rgba(13,19,34,0.55))" : "linear-gradient(160deg, rgba(167,139,250,0.10), rgba(13,19,34,0.55))" }}>
      <div className="flex items-center justify-between">
        <p className="label">{mode === "morning" ? "☀️ Morning Check-in" : "🌙 Night Check-in"}</p>
        <div className="inline-flex rounded-xl border border-line bg-surface-2 p-1">
          {(["morning", "night"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition ${mode === m ? "bg-neon-violet/20 text-neon-violet" : "text-slate-400"}`}>{m}</button>
          ))}
        </div>
      </div>
      <p className="mt-1 text-xs text-slate-400">Under 20 seconds — tap each as you do it.</p>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((it) => (
          <motion.button
            key={it.label}
            whileTap={{ scale: 0.95 }}
            disabled={pending}
            onClick={it.tap}
            className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-center transition ${it.done ? "border-neon-green/50 bg-neon-green/15" : "border-line bg-surface-2"}`}
          >
            <span className="text-xl">{it.icon}</span>
            <span className={`text-[11px] font-semibold ${it.done ? "text-neon-green" : "text-white"}`}>{it.done ? "✓ " : ""}{it.label}</span>
          </motion.button>
        ))}
      </div>

      {mode === "night" && (
        <div className="mt-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Gratitude</p>
          <div className="mt-1 flex gap-2">
            <input className="input" placeholder="One thing you're grateful for…" value={gratitude} onChange={(e) => setGratitude(e.target.value)} />
            <button className="btn-neon" disabled={pending} onClick={() => run(() => setNote(gratitude))}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
}
