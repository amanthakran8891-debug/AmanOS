"use client";

import { useEffect, useState } from "react";
import { fmtDur } from "@/lib/damage";

function secsToMidnight(): number {
  const now = new Date();
  const mid = new Date(now);
  mid.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((mid.getTime() - now.getTime()) / 1000));
}

/** Shown only when a relapse was logged today. Replaces the 90-day framing with
 *  the only thing that matters now: don't slip again before midnight. */
export function RecoveryMission() {
  const [remaining, setRemaining] = useState(secsToMidnight);
  useEffect(() => {
    const id = setInterval(() => setRemaining(secsToMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="card" style={{ border: "1px solid rgba(251,113,133,0.5)", background: "linear-gradient(160deg, rgba(251,113,133,0.12), rgba(13,19,34,0.6))" }}>
      <p className="label text-neon-red">⚔ Recovery Mission</p>
      <p className="mt-1 text-lg font-extrabold text-white">Reach midnight without another relapse.</p>
      <p className="mt-0.5 text-xs text-slate-400">A slip happened today — that&apos;s a setback, not the end. Forget the 90-day dream for now. Your only job is the next few hours.</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-lg bg-bg/50 px-3 py-1.5 text-sm font-bold tabular-nums text-neon-red">⏳ {fmtDur(remaining)} until you win today</span>
        <span className="text-xs font-semibold text-neon-green">Reward: +10 Discipline · +50 XP · Dragon −5%</span>
      </div>
    </div>
  );
}
