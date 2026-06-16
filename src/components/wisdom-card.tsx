"use client";

import { motion } from "framer-motion";
import type { Wisdom } from "@/lib/wisdom";

export function WisdomCard({ wisdom, dateLabel }: { wisdom: Wisdom; dateLabel: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-3xl border border-line p-6 shadow-card"
      style={{
        background:
          "linear-gradient(135deg, rgba(52,245,197,0.10), rgba(167,139,250,0.10) 55%, rgba(34,211,238,0.08))",
      }}
    >
      {/* animated aurora glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-neon-violet/20 blur-3xl"
        animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-neon-green/15 blur-3xl"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 9, repeat: Infinity }}
      />

      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulseGlow rounded-full bg-neon-green" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">{dateLabel} · Daily Wisdom</p>
        </div>
        <p className="mt-3 text-balance text-2xl font-extrabold leading-snug tracking-tight text-white sm:text-[28px]">
          <span className="bg-gradient-to-r from-neon-green via-white to-neon-violet bg-clip-text text-transparent">
            “{wisdom.quote}”
          </span>
        </p>
        {wisdom.author && <p className="mt-2 text-sm font-medium text-slate-400">— {wisdom.author}</p>}
      </div>
    </motion.div>
  );
}
