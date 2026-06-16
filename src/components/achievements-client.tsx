"use client";

import { motion } from "framer-motion";

type Record = { label: string; icon: string; current: number; longest: number; color: string };

const ACH = [
  { key: "first-clean-day", label: "First Clean Day", icon: "🌱", target: 1 },
  { key: "7-days-clean", label: "7 Days Clean", icon: "🔥", target: 7 },
  { key: "30-days-clean", label: "30 Days Clean", icon: "💎", target: 30 },
  { key: "90-days-clean", label: "90 Days Clean", icon: "🛡", target: 90 },
  { key: "100-days-clean", label: "100 Days Clean", icon: "👑", target: 100 },
  { key: "180-days-clean", label: "180 Days Clean", icon: "🌟", target: 180 },
  { key: "365-days-clean", label: "365 Days Clean", icon: "🏆", target: 365 },
  { key: "protein-master", label: "Protein Master", icon: "🥩", target: 0 },
  { key: "gym-warrior", label: "Gym Warrior", icon: "🏋️", target: 0 },
  { key: "nclex-grinder", label: "NCLEX Grinder", icon: "📚", target: 0 },
  { key: "bharatfare-builder", label: "BharatFare Builder", icon: "✈️", target: 0 },
  { key: "life-commander", label: "Life Commander", icon: "⚡", target: 0 },
];

export function AchievementsClient({ records, unlocked, streakDays }: { records: Record[]; unlocked: string[]; streakDays: number }) {
  return (
    <div className="space-y-5">
      {/* Streak Wall */}
      <section>
        <p className="label mb-2">Streak Records</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {records.map((r, i) => (
            <motion.div
              key={r.label}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className="card-tight relative overflow-hidden text-center"
              style={{ background: `linear-gradient(160deg, ${r.color}14, rgba(13,19,34,0.5))`, borderColor: `${r.color}33` }}
            >
              <div className="text-2xl">{r.icon}</div>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-300">{r.label}</p>
              <p className="mt-1 text-2xl font-black tabular-nums" style={{ color: r.color }}>{r.current}</p>
              <p className="text-[10px] text-slate-400">current · best {r.longest}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Achievements */}
      <section>
        <p className="label mb-2">Achievements</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {ACH.map((a, i) => {
            const isClean = a.target > 0;
            const unlockedNow = unlocked.includes(a.key) || (isClean && streakDays >= a.target);
            const progress = isClean ? Math.min(100, Math.round((streakDays / a.target) * 100)) : unlockedNow ? 100 : 0;
            return (
              <motion.div
                key={a.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`relative overflow-hidden rounded-2xl border p-3 text-center transition ${unlockedNow ? "border-neon-green/50 bg-neon-green/10" : "border-line bg-surface-2"}`}
              >
                {unlockedNow && (
                  <motion.div aria-hidden className="pointer-events-none absolute inset-0 bg-neon-green/10" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.6, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />
                )}
                <motion.div
                  className={`relative text-3xl ${unlockedNow ? "" : "opacity-40 grayscale"}`}
                  animate={unlockedNow ? { scale: [1, 1.15, 1], rotate: [0, 4, -4, 0] } : {}}
                  transition={{ duration: 2.4, repeat: Infinity }}
                >
                  {unlockedNow ? a.icon : "🔒"}
                </motion.div>
                <p className={`relative mt-1 text-[11px] font-bold ${unlockedNow ? "text-white" : "text-slate-400"}`}>{a.label}</p>
                {isClean && (
                  <>
                    <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-bg">
                      <motion.div className="h-full rounded-full bg-gradient-to-r from-neon-green to-neon-cyan" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.9 }} />
                    </div>
                    <p className="relative mt-1 text-[9px] tabular-nums text-slate-500">{Math.min(streakDays, a.target)}/{a.target} days</p>
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
