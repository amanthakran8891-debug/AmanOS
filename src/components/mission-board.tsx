"use client";

import { useTransition } from "react";
import { motion } from "framer-motion";
import type { MissionBoard } from "@/lib/missions";
import { completeMission } from "@/app/actions";

export function MissionBoardCard({ board }: { board: MissionBoard }) {
  const [pending, start] = useTransition();
  const complete = (key: "gym" | "nclex" | "protein" | "spiritual") => start(() => void completeMission(key));

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <p className="label text-neon-green">🎯 Today&apos;s Mission Board</p>
        <span className="chip text-[11px] font-bold">{board.completed} / {board.total}</span>
      </div>
      <p className="mt-0.5 text-[11px] text-slate-500">Highest-impact actions, picked for today. One tap to complete.</p>

      <div className="mt-3 space-y-2">
        {board.missions.map((m) => (
          <motion.div
            key={m.key}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${m.done ? "border-neon-green/40 bg-neon-green/10" : "border-line bg-surface-2/60"}`}
          >
            <span className="text-xl">{m.icon}</span>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-bold ${m.done ? "text-neon-green" : "text-white"}`}>{m.label}</p>
              <p className="text-[11px] text-slate-400">
                {m.sub} · <span className="font-semibold text-neon-violet">{m.primaryReward}</span>
              </p>
            </div>
            {m.done ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-neon-green/20 px-2.5 py-1 text-xs font-bold text-neon-green">✓ Done</span>
            ) : (
              <button className="btn-neon !px-3 !py-1.5 text-xs" disabled={pending} onClick={() => complete(m.key)}>Mark Done</button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
