"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { elapsedSince } from "@/lib/dates";

const MILESTONES = [1, 3, 7, 14, 30, 90, 180, 365];

export function CleanStreakHero({ lastJointAt, streakDays, longestStreak }: { lastJointAt: string | null; streakDays: number; longestStreak: number }) {
  const since = lastJointAt ? new Date(lastJointAt) : null;
  const [t, setT] = useState(() => (since ? elapsedSince(since) : null));

  useEffect(() => {
    if (!since) return;
    const id = setInterval(() => setT(elapsedSince(since)), 1000);
    return () => clearInterval(id);
  }, [lastJointAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = MILESTONES.find((m) => m > streakDays) ?? MILESTONES[MILESTONES.length - 1];
  const prev = [...MILESTONES].reverse().find((m) => m <= streakDays) ?? 0;
  const pct = Math.min(100, Math.round(((streakDays - prev) / (next - prev)) * 100));
  const best = Math.max(longestStreak, streakDays);

  return (
    <motion.div
      className="card relative overflow-hidden"
      style={{ background: "linear-gradient(150deg, rgba(52,245,197,0.14), rgba(13,19,34,0.6) 60%)" }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.div aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-neon-green/20 blur-3xl" animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 6, repeat: Infinity }} />
      <div className="relative">
        <div className="flex items-end justify-between">
          <div>
            <p className="label text-neon-green">Joint-Free Streak</p>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-6xl font-black leading-none tabular-nums text-white glow-text">{streakDays}</span>
              <span className="mb-1 text-lg font-bold text-slate-300">days clean</span>
            </div>
          </div>
          <Link href="/achievements" className="chip text-neon-green hover:border-neon-green/60">Streak Wall →</Link>
        </div>

        {t && (
          <p className="mt-1 font-mono text-sm tabular-nums text-slate-400">
            {t.years > 0 && `${t.years}y `}{t.months > 0 && `${t.months}mo `}{t.days}d {String(t.hours).padStart(2, "0")}:{String(t.minutes).padStart(2, "0")}:{String(t.seconds).padStart(2, "0")} clean
          </p>
        )}

        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="text-slate-300">Next milestone: <span className="font-bold text-white">{next} days</span></span>
          <span className="text-slate-400">Best ever: <span className="font-bold text-neon-green">{best}</span></span>
        </div>
        <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-bg">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-neon-green to-neon-cyan" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9 }} style={{ boxShadow: "0 0 12px rgba(52,245,197,0.6)" }} />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {MILESTONES.map((m) => (
            <span key={m} className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${streakDays >= m ? "border-neon-green/50 bg-neon-green/15 text-neon-green" : "border-line bg-surface-2 text-slate-500"}`}>
              {streakDays >= m ? "✓ " : ""}{m}d
            </span>
          ))}
        </div>

        <p className="mt-3 text-center text-sm font-bold text-neon-green/90">Just win today.</p>
      </div>
    </motion.div>
  );
}
