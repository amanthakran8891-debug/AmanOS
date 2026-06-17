"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { elapsedSince } from "@/lib/dates";
import { MILESTONES, MILESTONE_REWARDS, fmtDur } from "@/lib/damage";

export function CleanStreakHero({ lastJointAt, streakDays, longestStreak }: { lastJointAt: string | null; streakDays: number; longestStreak: number }) {
  const since = lastJointAt ? new Date(lastJointAt) : null;
  const [t, setT] = useState(() => (since ? elapsedSince(since) : null));

  useEffect(() => {
    if (!since) return;
    const id = setInterval(() => setT(elapsedSince(since)), 1000);
    return () => clearInterval(id);
  }, [lastJointAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const elapsedSec = t ? t.totalSeconds : 0;
  const next = MILESTONES.find((m) => m > streakDays) ?? MILESTONES[MILESTONES.length - 1];
  const prev = [...MILESTONES].reverse().find((m) => m <= streakDays) ?? 0;
  const pct = Math.min(100, Math.round(((streakDays - prev) / (next - prev)) * 100));
  const remainingToNext = Math.max(0, next * 86400 - elapsedSec);
  const bestSec = Math.max(longestStreak * 86400, elapsedSec);
  const upcomingRewards = MILESTONE_REWARDS.filter((r) => r.day > streakDays).slice(0, 3);
  const label = (d: number) => (d === 365 ? "Year 1" : `Day ${d}`);

  return (
    <motion.div className="card relative overflow-hidden" style={{ background: "linear-gradient(150deg, rgba(52,245,197,0.14), rgba(13,19,34,0.6) 60%)" }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <motion.div aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-neon-green/20 blur-3xl" animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ duration: 6, repeat: Infinity }} />
      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <p className="label text-neon-green">🕒 Clean Time</p>
            <div className="mt-0.5 flex items-end gap-2">
              <span className="text-5xl font-black leading-none tabular-nums text-white glow-text">{fmtDur(elapsedSec)}</span>
            </div>
            {t && <p className="mt-0.5 font-mono text-xs tabular-nums text-slate-500">{t.days}d {String(t.hours).padStart(2, "0")}:{String(t.minutes).padStart(2, "0")}:{String(t.seconds).padStart(2, "0")}</p>}
          </div>
          <Link href="/achievements" className="chip text-neon-green hover:border-neon-green/60">Streak Wall →</Link>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="text-slate-300">⏳ <span className="font-bold text-white">{label(next)}</span> unlocks in <span className="font-bold text-neon-cyan tabular-nums">{fmtDur(remainingToNext)}</span></span>
          <span className="text-slate-400">🏆 Longest Clean Run <span className="font-bold text-neon-green tabular-nums">{fmtDur(bestSec)}</span></span>
        </div>

        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-bg">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-neon-green to-neon-cyan" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.9 }} style={{ boxShadow: "0 0 12px rgba(52,245,197,0.6)" }} />
        </div>

        {/* Milestone progression path */}
        <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-1">
          {MILESTONES.map((m, i) => {
            const done = streakDays >= m;
            const isNext = m === next;
            return (
              <div key={m} className="flex shrink-0 items-center">
                {i > 0 && <span className={`h-0.5 w-3 ${streakDays >= MILESTONES[i - 1] ? "bg-neon-green/60" : "bg-line"}`} />}
                <div className="flex flex-col items-center">
                  <span className={`text-sm leading-none ${done ? "text-neon-green" : isNext ? "text-neon-cyan" : "text-slate-600"}`}>{done ? "●" : "○"}</span>
                  <span className={`mt-0.5 text-[9px] ${done ? "text-neon-green" : isNext ? "text-neon-cyan" : "text-slate-600"}`}>{label(m).replace("Day ", "D")}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Next rewards */}
        {upcomingRewards.length > 0 && (
          <div className="mt-3 rounded-xl border border-line bg-surface-2/60 p-2.5">
            <p className="text-[11px] font-bold text-neon-amber">🎁 Next Rewards</p>
            <div className="mt-1 space-y-0.5">
              {upcomingRewards.map((r) => (
                <div key={r.day} className="flex justify-between text-[11px]">
                  <span className="text-slate-400">{label(r.day)}</span>
                  <span className="font-semibold text-slate-200">{r.reward}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-3 text-center text-sm font-bold text-neon-green/90">Just win today.</p>
      </div>
    </motion.div>
  );
}
