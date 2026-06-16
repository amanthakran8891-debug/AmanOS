"use client";

import { motion } from "framer-motion";
import type { Verse } from "@/lib/gita";

export function GitaCard({ verse }: { verse: Verse }) {
  return (
    <motion.div
      className="relative overflow-hidden rounded-3xl border border-line p-6 shadow-card"
      style={{ background: "linear-gradient(160deg, rgba(167,139,250,0.10), rgba(13,19,34,0.6) 60%)" }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-neon-violet/15 blur-3xl"
        animate={{ opacity: [0.4, 0.75, 0.4] }}
        transition={{ duration: 7, repeat: Infinity }}
      />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neon-violet">Bhagavad Gita · Today</p>
          <span className="rounded-full border border-neon-violet/40 px-2.5 py-0.5 text-[11px] font-semibold text-neon-violet">{verse.ref.replace("Bhagavad Gita ", "")}</span>
        </div>

        {/* Sanskrit */}
        <p className="mt-3 font-semibold italic leading-relaxed text-neon-violet/90">“{verse.verse}”</p>

        {/* Translation */}
        <p className="mt-3 text-lg font-bold leading-snug text-white">{verse.translation}</p>

        {/* Practical meaning */}
        <div className="mt-4 rounded-2xl border border-line bg-surface-2/60 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Practical meaning</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-200">{verse.meaning}</p>
        </div>

        {/* Personal application */}
        <div className="mt-3 rounded-2xl border border-neon-green/30 bg-neon-green/5 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-neon-green">Today&rsquo;s meaning for you</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-100">{verse.application}</p>
        </div>

        <p className="mt-3 text-right text-xs font-semibold text-slate-500">— {verse.ref}</p>
      </div>
    </motion.div>
  );
}
