"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { logDragonAttack } from "@/app/actions";

const SURVIVAL_SECONDS = 15 * 60;

const MISSIONS = [
  { key: "water", label: "Drink a full glass of water", icon: "💧" },
  { key: "walk", label: "Walk for 10 minutes", icon: "🚶" },
  { key: "leave", label: "Leave the trigger environment", icon: "🚪" },
  { key: "gita", label: "Read one Gita verse", icon: "🕉" },
  { key: "mission", label: "Complete one small mission", icon: "✅" },
];

const BREATH_PHASES = [
  { label: "Breathe in", ms: 4000, scale: 1.5 },
  { label: "Hold", ms: 4000, scale: 1.5 },
  { label: "Breathe out", ms: 4000, scale: 1 },
  { label: "Hold", ms: 4000, scale: 1 },
];

type Phase = "idle" | "active" | "resolve" | "done";

export function DragonAttackMode() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [timeLeft, setTimeLeft] = useState(SURVIVAL_SECONDS);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [breathIdx, setBreathIdx] = useState(0);
  const [survived, setSurvived] = useState<boolean | null>(null);
  const [pending, start] = useTransition();
  const startedAt = useRef<number>(0);

  // survival countdown
  useEffect(() => {
    if (phase !== "active") return;
    const id = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) { clearInterval(id); setPhase("resolve"); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // breathing cycle
  useEffect(() => {
    if (phase !== "active") return;
    const t = setTimeout(() => setBreathIdx((i) => (i + 1) % BREATH_PHASES.length), BREATH_PHASES[breathIdx].ms);
    return () => clearTimeout(t);
  }, [phase, breathIdx]);

  // lock scroll while active
  useEffect(() => {
    if (phase === "idle" || phase === "done") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [phase]);

  const open = () => { setTimeLeft(SURVIVAL_SECONDS); setChecked({}); setBreathIdx(0); setSurvived(null); startedAt.current = Date.now(); setPhase("active"); };
  const missionsCompleted = Object.values(checked).filter(Boolean).length;
  const elapsed = Math.min(SURVIVAL_SECONDS, Math.round((Date.now() - startedAt.current) / 1000));

  const resolve = (didSurvive: boolean) => {
    setSurvived(didSurvive);
    start(() => void logDragonAttack({ survived: didSurvive, missionsCompleted, durationSec: elapsed, intensity: 8 }).then(() => setPhase("done")));
    setPhase("done");
  };

  const mmss = `${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:${String(timeLeft % 60).padStart(2, "0")}`;
  const breath = BREATH_PHASES[breathIdx];

  return (
    <>
      <button
        onClick={open}
        className="group relative w-full overflow-hidden rounded-2xl border border-neon-red/50 bg-neon-red/10 px-5 py-4 text-center transition active:scale-[0.98]"
        style={{ boxShadow: "0 0 28px -8px rgba(251,113,133,0.6)" }}
      >
        <motion.span aria-hidden className="pointer-events-none absolute inset-0 bg-neon-red/10" animate={{ opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 2.2, repeat: Infinity }} />
        <span className="relative text-lg font-black text-neon-red">🐉 Dragon Attack Mode</span>
        <span className="relative mt-0.5 block text-[11px] font-medium text-slate-300">Craving hitting hard? Tap for emergency intervention.</span>
      </button>

      <AnimatePresence>
        {(phase === "active" || phase === "resolve" || phase === "done") && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-bg/98 backdrop-blur-md"
            style={{ background: "radial-gradient(900px 500px at 50% -10%, rgba(251,113,133,0.18), #070a12 60%)" }}
          >
            <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 py-8">
              {phase === "active" && (
                <>
                  <div className="text-center">
                    <p className="text-sm font-bold uppercase tracking-widest text-neon-red">🐉 Dragon Attack — Survive It</p>
                    <p className="mt-1 font-mono text-6xl font-black tabular-nums text-white" style={{ textShadow: "0 0 24px rgba(255,255,255,0.25)" }}>{mmss}</p>
                    <p className="mt-1 text-xs text-slate-400">The craving peaks and passes. Outlast it — you only have to win the next 15 minutes.</p>
                  </div>

                  {/* breathing guide */}
                  <div className="my-8 flex flex-col items-center">
                    <motion.div
                      className="grid h-44 w-44 place-items-center rounded-full border-2 border-neon-cyan/50"
                      animate={{ scale: breath.scale, boxShadow: ["0 0 30px rgba(34,211,238,0.3)", "0 0 50px rgba(34,211,238,0.5)"] }}
                      transition={{ duration: breath.ms / 1000, ease: "easeInOut" }}
                    >
                      <span className="text-lg font-bold text-neon-cyan">{breath.label}</span>
                    </motion.div>
                    <p className="mt-3 text-[11px] text-slate-500">Box breathing · in 4 · hold 4 · out 4 · hold 4</p>
                  </div>

                  {/* mission list */}
                  <div className="space-y-2">
                    <p className="label">Survival missions ({missionsCompleted}/{MISSIONS.length})</p>
                    {MISSIONS.map((m) => {
                      const on = !!checked[m.key];
                      return (
                        <button
                          key={m.key}
                          onClick={() => setChecked((c) => ({ ...c, [m.key]: !c[m.key] }))}
                          className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${on ? "border-neon-green/50 bg-neon-green/10" : "border-line bg-surface-2"}`}
                        >
                          <span className="text-xl">{m.icon}</span>
                          <span className={`flex-1 text-sm font-semibold ${on ? "text-neon-green line-through" : "text-white"}`}>{m.label}</span>
                          <span className={`grid h-6 w-6 place-items-center rounded-full border-2 text-xs ${on ? "border-neon-green bg-neon-green text-bg" : "border-line text-transparent"}`}>✓</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-auto pt-8">
                    <button onClick={() => setPhase("resolve")} className="btn-neon w-full !py-3 text-base">I made it through</button>
                  </div>
                </>
              )}

              {phase === "resolve" && (
                <div className="m-auto w-full text-center">
                  <p className="text-2xl font-black text-white">Did you defeat the dragon?</p>
                  <p className="mt-2 text-sm text-slate-400">Be honest — both answers move your recovery forward.</p>
                  <div className="mt-8 grid gap-3">
                    <button disabled={pending} onClick={() => resolve(true)} className="btn-neon !py-4 text-lg font-black">✅ YES — I survived it</button>
                    <button disabled={pending} onClick={() => resolve(false)} className="btn-danger !py-4 text-base">No — I used</button>
                  </div>
                </div>
              )}

              {phase === "done" && (
                <div className="m-auto w-full text-center">
                  {survived ? (
                    <>
                      <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-6xl">🏆</motion.div>
                      <p className="mt-3 text-2xl font-black text-neon-green glow-text">Dragon defeated.</p>
                      <p className="mt-2 text-sm text-slate-300">+{10 + missionsCompleted * 25} Recovery XP · craving resisted and logged. That&apos;s a permanent win.</p>
                    </>
                  ) : (
                    <>
                      <div className="text-6xl">🌅</div>
                      <p className="mt-3 text-2xl font-black text-white">Logged. This is data, not failure.</p>
                      <p className="mt-2 text-sm text-slate-300">The craving outcome is recorded so your forecast learns. Your clean clock only resets if you log an actual relapse. Come back stronger.</p>
                    </>
                  )}
                  <button onClick={() => setPhase("idle")} className="btn-ghost mt-8 w-full !py-3">Close</button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
