"use client";

import { motion } from "framer-motion";

export function DailyCoach({ briefing }: { briefing: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card relative overflow-hidden"
      style={{ background: "linear-gradient(150deg, rgba(34,211,238,0.12), rgba(13,19,34,0.6) 60%)" }}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-neon-cyan/15 text-xl">🧭</div>
        <div className="min-w-0">
          <p className="label text-neon-cyan">AI Daily Coach</p>
          <p className="mt-1 text-[15px] leading-relaxed text-slate-100">{briefing}</p>
        </div>
      </div>
    </motion.div>
  );
}
