"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { RecoveryXp, XpLine } from "@/lib/recovery-xp";
import { RECOVERY_XP } from "@/lib/recovery-xp";

/** Clean hours accrued so far today, derived live from the anchor. */
function liveCleanHoursToday(lastJointAt: string | null, now = Date.now()): number {
  if (!lastJointAt) return 0;
  const anchor = new Date(lastJointAt).getTime();
  if (!Number.isFinite(anchor)) return 0;
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const from = Math.max(start.getTime(), anchor);
  return Math.max(0, Math.min(24, Math.floor((now - from) / 3600000)));
}

export function RecoveryXpCard({ xp, lastJointAt }: { xp: RecoveryXp; lastJointAt: string | null }) {
  const l = xp.level;
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
        </div>
      )}
    </div>
  );
}
