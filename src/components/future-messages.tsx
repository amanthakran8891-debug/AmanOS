"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { FutureMessage } from "@/lib/future-messages";
import { milestoneLabel } from "@/lib/clean-time";

export function FutureMessages({ messages, next }: { messages: FutureMessage[]; next: { day: number; title: string; daysAway: number } | null }) {
  const firstUnlocked = messages.find((m) => m.isLatest)?.day ?? messages.find((m) => m.unlocked)?.day ?? null;
  const [openDay, setOpenDay] = useState<number | null>(firstUnlocked);
  const open = messages.find((m) => m.day === openDay) ?? null;

  return (
    <div className="card">
      <p className="label text-amber-300/90">✉️ Messages from Future Aman</p>
      <p className="mt-0.5 text-[11px] text-slate-500">Earned, not given. Each unlocks at a clean milestone.</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {messages.map((m) => (
          <button
            key={m.day}
            disabled={!m.unlocked}
            onClick={() => setOpenDay(m.day)}
            className={`rounded-full border px-3 py-1 text-[11px] font-bold transition ${
              openDay === m.day && m.unlocked
                ? "border-amber-400/60 bg-amber-400/15 text-amber-200"
                : m.unlocked
                  ? "border-line bg-surface-2 text-slate-300 hover:border-amber-400/40"
                  : "border-line bg-surface-2/40 text-slate-600"
            }`}
          >
            {m.unlocked ? "🔓" : "🔒"} {milestoneLabel(m.day)} · {m.title}
          </button>
        ))}
      </div>

      {open && open.unlocked && (
        <motion.div
          key={open.day}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] p-4"
        >
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-300/80">{milestoneLabel(open.day)} — {open.title}</p>
          <p className="mt-1.5 text-[15px] leading-relaxed text-slate-100">“{open.message}”</p>
          <p className="mt-2 text-right text-xs italic text-amber-300/70">— Future Aman</p>
        </motion.div>
      )}

      {next && (
        <p className="mt-3 text-center text-[11px] text-slate-400">
          Next letter: <span className="font-bold text-amber-300">{milestoneLabel(next.day)} — {next.title}</span> in <span className="font-bold tabular-nums text-white">{next.daysAway}d</span>
        </p>
      )}
    </div>
  );
}
