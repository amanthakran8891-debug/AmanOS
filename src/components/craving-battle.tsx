"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const BATTLE_SECONDS = 45;

/**
 * Craving Battle Mode. Tapping is SYMBOLIC — it never grants the reward. The
 * reward fires only when the timer is fully outlasted (you actually rode the
 * craving out), at which point onSurvive() logs the real resisted-craving event.
 * Bailing early logs nothing and grants nothing.
 */
export function CravingBattle({ intensity, onSurvive, onClose }: { intensity: number; onSurvive: () => void; onClose: () => void }) {
  const [phase, setPhase] = useState<"intro" | "fight" | "won">("intro");
  const [left, setLeft] = useState(BATTLE_SECONDS);
  const [hits, setHits] = useState(0);
  const survived = useRef(false);

  useEffect(() => {
    if (phase !== "fight") return;
    const id = setInterval(() => setLeft((l) => (l <= 1 ? 0 : l - 1)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "fight" && left === 0 && !survived.current) {
      survived.current = true;
      onSurvive(); // log the REAL resisted-craving event — only on full completion
      setPhase("won");
    }
  }, [left, phase, onSurvive]);

  const hpPct = phase === "won" ? 0 : Math.round((left / BATTLE_SECONDS) * 100);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-bg/95 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-neon-red/40 bg-surface p-6 text-center shadow-glow">
        {phase === "intro" && (
          <>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon-red"><span className="inline-block animate-pulse">🐉 Dragon Attacking</span></p>
            <p className="mt-3 text-sm text-slate-300">Craving Strength</p>
            <p className="text-6xl font-black leading-none text-neon-red">{intensity}<span className="text-2xl text-slate-500">/10</span></p>
            <p className="mt-3 text-xs leading-relaxed text-slate-400">The craving rises and falls like a wave. Hold the line for {BATTLE_SECONDS} seconds and it passes. You don&apos;t have to fight it — just outlast it.</p>
            <button onClick={() => setPhase("fight")} className="btn-neon mt-4 w-full text-lg">⚔ Fight Dragon</button>
            <button onClick={onClose} className="mt-2 text-xs text-slate-500">Not now</button>
          </>
        )}

        {phase === "fight" && (
          <>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-neon-red">Hold the line</p>
            <motion.div className="my-3 text-7xl" animate={{ rotate: [-3, 3, -3], scale: [1, 1.06, 1] }} transition={{ duration: 0.6, repeat: Infinity }}>🐉</motion.div>
            <div className="h-3 overflow-hidden rounded-full bg-bg">
              <div className="h-full rounded-full bg-gradient-to-r from-neon-red to-neon-amber transition-all duration-1000" style={{ width: `${hpPct}%` }} />
            </div>
            <p className="mt-3 text-5xl font-black tabular-nums text-white">{left}s</p>
            <button onClick={() => setHits((h) => h + 1)} className="btn-neon mt-3 w-full text-lg active:scale-95">⚔ STRIKE{hits > 0 ? ` ×${hits}` : ""}</button>
            <p className="mt-2 text-[11px] text-slate-500">Tapping is symbolic — what wins is outlasting the timer. Breathe through it.</p>
            <button onClick={onClose} className="mt-2 text-xs text-slate-600">I need to stop</button>
          </>
        )}

        {phase === "won" && (
          <>
            <motion.p initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-2xl font-black text-neon-green">Craving survived. ✓</motion.p>
            <p className="mt-1 text-sm text-slate-300">You outlasted it. That was real — and it&apos;s logged.</p>
            <div className="mt-3 space-y-1 text-base font-bold">
              <p className="text-neon-red">Dragon −50 HP</p>
              <p className="text-neon-cyan">+10 XP</p>
              <p className="text-neon-amber">+5 Discipline</p>
            </div>
            <button onClick={onClose} className="btn-neon mt-4 w-full">Done</button>
          </>
        )}
      </div>
    </div>
  );
}
