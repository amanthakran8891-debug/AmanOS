"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export function DailyCoach({ briefing, collapsible = false }: { briefing: string; collapsible?: boolean }) {
  const [open, setOpen] = useState(!collapsible);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card relative overflow-hidden"
      style={{ background: "linear-gradient(150deg, rgba(34,211,238,0.12), rgba(13,19,34,0.6) 60%)" }}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-neon-cyan/15 text-lg">🧭</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <p className="label text-neon-cyan">AI Daily Coach</p>
            {collapsible && (
              <button onClick={() => setOpen((o) => !o)} className="text-[11px] font-semibold text-neon-cyan hover:underline">
                {open ? "Hide" : "Show"}
              </button>
            )}
          </div>
          <p className={`mt-1 text-[14px] leading-relaxed text-slate-100 ${collapsible && !open ? "line-clamp-1" : ""}`}>{briefing}</p>
        </div>
      </div>
    </motion.div>
  );
}
