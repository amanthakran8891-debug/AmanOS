"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { RecoveryXp, XpLine } from "@/lib/recovery-xp";
import { RECOVERY_XP, unlocksFor } from "@/lib/recovery-xp";

/** Clean hours accrued so far today, derived live from the anchor. */
function liveCleanHoursToday(lastJointAt: string | null, now = Date.now()): number {
  if (!lastJointAt) return 0;
  const anchor = new Date(lastJointAt).getTime();
  if (!Number.isFinite(anchor)) return 0;
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const from = Math.max(start.getTime(), anchor);
  return Math.max(0, Math.min(24, Math.floor((now - from) / 3600000)));
}

export function RecoveryXpCard({ xp, lastJointAt, detailed = false }: { xp: RecoveryXp; lastJointAt: string | null; detailed?: boolean }) {
  const l = xp.level;
  const unlocks = unlocksFor(l.level);
  const [cleanHrs, setCleanHrs] = useState(() => liveCleanHoursToday(lastJointAt));

  useEffect(() => {
    const tick = () => setCleanHrs(liveCleanHoursToday(lastJointAt));
    tick();
    const id = setInterval(tick, 30000); // clean hours change hourly; refresh often enough to feel live
    return () => clearInterval(id);
  }, [lastJointAt]);

  // Replace the server-computed clean-hour line with the live value.
  const serverCleanHourXp = xp.today.lines.find((x) => x.key === "cleanHour")?.xp ?? 0;
  const liveCleanHourXp = cleanHrs * RECOVERY_XP.cleanHour;
  const todayTotal = xp.today.total - serverCleanHourXp + liveCleanHourXp;

  const lines: XpLine[] = [
    ...(cleanHrs > 0 ? [{ key: "cleanHour", label: `Clean hours ×${cleanHrs}`, xp: liveCleanHourXp }] : []),
    ...xp.today.lines.filter((x) => x.key !== "cleanHour"),
  ];

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="label text-neon-violet">Recovery XP</p>
          <p className="mt-1 text-3xl font-black tabular-nums text-white">
            +{todayTotal}<span className="ml-1 text-sm font-semibold text-slate-400">today</span>
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

      {lines.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {lines.map((line) => (
            <span key={line.key} className="chip text-[11px] text-slate-300">{line.label} <span className="font-bold text-neon-violet">+{line.xp}</span></span>
          ))}
          <span className="chip text-[11px] font-bold text-white">Total +{todayTotal}</span>
        </div>
      )}

      {detailed && (
        <div className="mt-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Unlocks</p>
          <div className="mt-2 space-y-1.5">
            {unlocks.map((u) => (
              <div key={u.level} className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${u.unlocked ? "border-neon-violet/40 bg-neon-violet/10" : "border-line bg-surface-2/40"}`}>
                <span className="text-lg">{u.unlocked ? u.icon : "🔒"}</span>
                <span className={`flex-1 text-sm font-semibold ${u.unlocked ? "text-white" : "text-slate-500"}`}>{u.label}</span>
                <span className={`text-[11px] font-bold ${u.unlocked ? "text-neon-violet" : "text-slate-500"}`}>Lvl {u.level}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
