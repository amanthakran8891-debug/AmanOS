"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { DragonState } from "@/lib/score";
import { dragonHp } from "@/lib/damage";

/**
 * Dragon 2.0 — the addiction, made to feel alive. It breathes, its eyes glow,
 * it breathes fire and smoke, and it visibly shrinks/weakens as your Life Score
 * and clean streak grow. Six stages with smooth transitions.
 */
export function Dragon({ dragon }: { dragon: DragonState }) {
  const { power, size, stage, color } = dragon;
  const hp = dragonHp(power);
  const alive = stage < 6;
  const intensity = power / 100; // 0..1 — drives fire/smoke strength
  const breathDur = 2.2 + (1 - intensity) * 2.5; // weaker dragon breathes slower

  return (
    <div className="card relative overflow-hidden">
      {/* ambient aura — colour shifts smoothly with stage */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        animate={{ background: `radial-gradient(260px 200px at 50% 38%, ${color}22, transparent 70%)` }}
        transition={{ duration: 1.2 }}
      />

      <div className="relative flex items-center justify-between">
        <div>
          <p className="label">🐉 The Dragon</p>
          <AnimatePresence mode="wait">
            <motion.h3
              key={hp.stage}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="text-lg font-extrabold text-white"
            >
              <span style={{ color }} className="glow-text">{hp.stage}</span>
            </motion.h3>
          </AnimatePresence>
        </div>
        <div className="text-right">
          <p className="label">Threat</p>
          <p className="text-lg font-extrabold tracking-wide" style={{ color: hp.threatColor }}>{hp.threat}</p>
        </div>
      </div>

      <div className="relative mx-auto my-3 flex h-48 items-center justify-center">
        {/* smoke particles */}
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.span
            key={`smoke-${i}`}
            className="absolute rounded-full bg-slate-400/30 blur-md"
            style={{ width: 10 + i * 3, height: 10 + i * 3, left: `${44 + i * 3}%`, top: "26%" }}
            animate={{ y: [-4, -56], x: [0, (i - 2) * 10], opacity: [0, 0.35 * intensity, 0], scale: [0.6, 1.4] }}
            transition={{ duration: 3 + i * 0.4, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
          />
        ))}

        {/* fire breath — stronger when the dragon is stronger */}
        {alive &&
          Array.from({ length: 7 }).map((_, i) => (
            <motion.span
              key={`fire-${i}`}
              className="absolute rounded-full"
              style={{
                width: 6 + Math.random() * 6,
                height: 6 + Math.random() * 6,
                background: i % 2 ? "#fbbf24" : color,
                left: `${30 - i * 1.5}%`,
                top: "52%",
                filter: "blur(1px)",
              }}
              animate={{
                x: [-2, -40 - i * 4],
                y: [0, (i - 3) * 6],
                opacity: [0, 0.9 * intensity, 0],
                scale: [1, 0.3],
              }}
              transition={{ duration: 0.7 + i * 0.05, repeat: Infinity, delay: i * 0.08 }}
            />
          ))}

        {/* the dragon — breathes + shrinks with size, smooth scale transition */}
        <motion.div
          animate={{
            scale: [size, size * 1.04, size],
            y: alive ? [0, -5, 0] : 0,
            rotate: alive ? [-1.5, 1.5, -1.5] : 0,
          }}
          transition={{
            scale: { duration: breathDur, repeat: Infinity, ease: "easeInOut" },
            y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 7, repeat: Infinity, ease: "easeInOut" },
          }}
          style={{ filter: `drop-shadow(0 0 18px ${color}aa)`, opacity: alive ? 1 : 0.45 }}
        >
          <DragonGlyph color={color} defeated={!alive} eyeGlow={color} intensity={intensity} />
        </motion.div>
      </div>

      <div>
        <div className="flex items-baseline justify-between">
          <span className="label">HP</span>
          <span className="text-base font-extrabold tabular-nums" style={{ color }}>{hp.hp.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ {hp.maxHp.toLocaleString()}</span></span>
        </div>
        <div className="mt-1 h-3 overflow-hidden rounded-full bg-bg" style={{ boxShadow: "inset 0 0 6px rgba(0,0,0,0.4)" }}>
          <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${color}, ${hp.threatColor})`, boxShadow: `0 0 10px ${color}88` }} animate={{ width: `${hp.pct}%` }} transition={{ duration: 1, ease: "easeOut" }} />
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-slate-400">
        {alive ? "Every completed mission damages it. Every relapse feeds it." : "The dragon is defeated. Stay sharp — it can always return."}
      </p>
    </div>
  );
}

function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2 p-2">
      <p className="label">{label}</p>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg">
        <motion.div className="h-full rounded-full" style={{ background: color }} animate={{ width: `${value}%` }} transition={{ duration: 1, ease: "easeOut" }} />
      </div>
    </div>
  );
}

function DragonGlyph({ color, defeated, eyeGlow, intensity }: { color: string; defeated: boolean; eyeGlow: string; intensity: number }) {
  return (
    <svg width="160" height="160" viewBox="0 0 100 100" fill="none">
      {/* wing (animated flap) */}
      <motion.path
        d="M64 40 C80 24 94 28 92 46 C82 44 72 46 66 52 Z"
        fill={color}
        opacity={defeated ? 0.3 : 0.7}
        animate={defeated ? {} : { rotate: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "66px 46px" }}
      />
      {/* body */}
      <path
        d="M50 80 C30 80 22 66 26 54 C18 52 14 42 22 36 C30 30 40 34 42 40 C46 32 56 28 64 32 C74 26 86 32 84 44 C92 48 90 60 80 62 C82 72 72 82 60 80 C58 86 50 86 50 80 Z"
        fill={color}
        opacity={defeated ? 0.5 : 0.94}
      />
      {/* spikes */}
      {!defeated &&
        [0, 1, 2].map((i) => (
          <path key={i} d={`M${56 + i * 8} ${30 - i} l3 -6 l3 6 Z`} fill={color} opacity={0.8} />
        ))}
      {/* glowing eye */}
      <motion.circle
        cx="38" cy="46" r={defeated ? 2 : 3.4}
        fill={defeated ? "#0a0a0a" : eyeGlow}
        animate={defeated ? {} : { opacity: [0.6, 1, 0.6], r: [3, 3.6, 3] }}
        transition={{ duration: 1.4 + (1 - intensity), repeat: Infinity }}
        style={{ filter: defeated ? "none" : `drop-shadow(0 0 6px ${eyeGlow})` }}
      />
      {!defeated && <circle cx="37" cy="45" r="1.1" fill="#fff" />}
      {/* nostril (fire origin) */}
      <circle cx="28" cy="52" r="1.4" fill="#1a0a00" opacity={defeated ? 0.3 : 0.8} />
      {/* tail */}
      <motion.path
        d="M50 78 C58 88 70 90 80 84"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        animate={defeated ? {} : { d: ["M50 78 C58 88 70 90 80 84", "M50 78 C58 84 72 92 82 80", "M50 78 C58 88 70 90 80 84"] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
    </svg>
  );
}
