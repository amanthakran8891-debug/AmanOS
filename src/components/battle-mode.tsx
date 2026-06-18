"use client";

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MissionBoard, MissionKey } from "@/lib/missions";
import { completeMission } from "@/app/actions";

/** One-Tap Battle Mode — for when you feel overwhelmed. Full-screen, one enemy,
 *  ONE next task, a focus timer, and a satisfying HP hit on completion. */
export function BattleMode({ board, enemy }: { board: MissionBoard; enemy: { name: string; color: string; health: number } }) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<"focus" | "struck" | "cleared">("focus");
  const [elapsed, setElapsed] = useState(0);
  const [pending, start] = useTransition();

  const next = board.missions.find((m) => !m.done) ?? null;

  useEffect(() => {
    if (!open || phase !== "focus") return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [open, phase]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const openBattle = () => { setOpen(true); setPhase(next ? "focus" : "cleared"); setElapsed(0); };
  const strike = () => {
    if (!next) return;
    setPhase("struck");
    start(() => void completeMission(next.key as MissionKey));
  };
  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(elapsed % 60).padStart(2, "0")}`;
  const hpAfter = Math.max(0, enemy.health - (next ? Math.min(40, next.reward.lifeScore + 10) : 0));

  return (
    <>
      <button
        onClick={openBattle}
        className="group relative w-full overflow-hidden rounded-2xl border border-neon-violet/50 bg-neon-violet/10 px-5 py-4 text-center transition active:scale-[0.98]"
        style={{ boxShadow: "0 0 28px -8px rgba(167,139,250,0.6)" }}
      >
        <motion.span aria-hidden className="pointer-events-none absolute inset-0 bg-neon-violet/10" animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 2.4, repeat: Infinity }} />
        <span className="relative text-lg font-black text-neon-violet">⚔ Start Battle Mode</span>
        <span className="relative mt-0.5 block text-[11px] font-medium text-slate-300">Overwhelmed? One enemy, one task, right now.</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col bg-bg/98 backdrop-blur-md"
            style={{ background: `radial-gradient(900px 500px at 50% -10%, ${enemy.color}22, #070a12 60%)` }}
          >
            <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 py-8">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold uppercase tracking-widest" style={{ color: enemy.color }}>⚔ Battle Mode</p>
                <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              {/* enemy */}
              <div className="mt-6 text-center">
                <motion.div
                  className="mx-auto grid h-28 w-28 place-items-center rounded-full text-6xl"
                  style={{ background: `${enemy.color}1a`, border: `2px solid ${enemy.color}66` }}
                  animate={phase === "struck" ? { x: [0, -10, 10, -6, 6, 0], scale: [1, 0.94, 1] } : { y: [0, -6, 0] }}
                  transition={phase === "struck" ? { duration: 0.5 } : { duration: 3, repeat: Infinity }}
                >
                  {enemy.name.toLowerCase().includes("serpent") ? "🐍" : "🐉"}
                </motion.div>
                <p className="mt-2 text-lg font-black text-white">{enemy.name}</p>
                <div className="mx-auto mt-2 h-2.5 max-w-[240px] overflow-hidden rounded-full bg-bg">
                  <motion.div className="h-full rounded-full" style={{ background: enemy.color }} initial={{ width: `${enemy.health}%` }} animate={{ width: `${phase === "struck" ? hpAfter : enemy.health}%` }} transition={{ duration: 0.6 }} />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">Enemy HP {phase === "struck" ? hpAfter : enemy.health}%</p>
              </div>

              {phase === "focus" && next && (
                <div className="m-auto w-full text-center">
                  <p className="label">Your one task</p>
                  <p className="mt-1 text-2xl font-black text-white">{next.icon} {next.label}</p>
                  <p className="mt-1 text-sm font-semibold text-neon-violet">{next.primaryReward}</p>
                  <p className="mt-6 font-mono text-4xl font-black tabular-nums text-white">{mmss}</p>
                  <p className="text-[11px] text-slate-500">focus timer · do it now</p>
                  <button disabled={pending} onClick={strike} className="btn-neon mt-8 w-full !py-4 text-lg font-black">⚔ Strike — I did it</button>
                </div>
              )}

              {phase === "struck" && (
                <div className="m-auto w-full text-center">
                  <motion.p initial={{ scale: 0.5, opacity: 0, y: 0 }} animate={{ scale: 1.2, opacity: 1, y: -20 }} className="text-4xl font-black" style={{ color: enemy.color }}>
                    −{next ? Math.min(40, next.reward.lifeScore + 10) : 0} HP
                  </motion.p>
                  <p className="mt-3 text-xl font-black text-neon-green glow-text">Direct hit!</p>
                  <p className="mt-1 text-sm text-slate-300">{next?.label} logged. The enemy weakens.</p>
                  <div className="mt-8 grid gap-2">
                    <button onClick={() => { setPhase(board.missions.filter((m) => !m.done).length > 1 ? "focus" : "cleared"); setElapsed(0); }} className="btn-ghost !py-3">Next task</button>
                    <button onClick={() => setOpen(false)} className="btn-neon !py-3">Done for now</button>
                  </div>
                </div>
              )}

              {phase === "cleared" && (
                <div className="m-auto w-full text-center">
                  <div className="text-6xl">🏆</div>
                  <p className="mt-3 text-2xl font-black text-neon-green glow-text">All missions cleared.</p>
                  <p className="mt-1 text-sm text-slate-300">Nothing left to fight right now. That&apos;s a winning day.</p>
                  <button onClick={() => setOpen(false)} className="btn-neon mt-8 w-full !py-3">Close</button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
