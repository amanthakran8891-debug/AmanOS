"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { DragonState } from "@/lib/score";
import { dragonHp } from "@/lib/damage";

/**
 * Dragon 3.0 — a living boss. UI/animation only; data logic (dragonHp, stages)
 * is unchanged. It breathes and floats, its eyes glow, it breathes fire + smoke,
 * its aura intensifies with THREAT, and it takes visible molten damage (cracks +
 * dimming) as HP falls. Fully respects prefers-reduced-motion and stays on
 * transform/opacity for mobile performance.
 */
export function Dragon({ dragon }: { dragon: DragonState }) {
  const { power, size, color, stage } = dragon;
  const hp = dragonHp(power);
  const alive = stage < 6 && hp.threat !== "DEFEATED";
  const reduce = useReducedMotion();

  const intensity = Math.max(0, Math.min(1, power / 100)); // threat strength 0..1
  const pct = hp.pct; // HP %
  const breathDur = 2.2 + (1 - intensity) * 2.5; // stronger dragon breathes faster
  const auraStrength = Math.round(0x18 + intensity * 0x40).toString(16).padStart(2, "0"); // hex alpha

  // Animations collapse to static when reduced motion is requested.
  const bodyAnim = reduce ? {} : { scale: [size, size * 1.04, size], y: alive ? [0, -5, 0] : 0, rotate: alive ? [-1.5, 1.5, -1.5] : 0 };
  const bodyTrans = reduce ? {} : {
    scale: { duration: breathDur, repeat: Infinity, ease: "easeInOut" as const },
    y: { duration: 4, repeat: Infinity, ease: "easeInOut" as const },
    rotate: { duration: 7, repeat: Infinity, ease: "easeInOut" as const },
  };

  return (
    <div className="card relative overflow-hidden">
      {/* ambient threat aura — colour + strength scale with threat */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        animate={{ background: `radial-gradient(280px 220px at 50% 36%, ${hp.threatColor}${auraStrength}, transparent 70%)` }}
        transition={{ duration: 1.2 }}
      />
      {/* high-threat ember pulse (only when strong + motion allowed) */}
      {alive && !reduce && intensity > 0.55 && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: `radial-gradient(200px 160px at 50% 40%, ${hp.threatColor}30, transparent 75%)` }}
          animate={{ opacity: [0.25, 0.6, 0.25] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <div className="relative flex items-center justify-between">
        <div>
          <p className="label">🐉 The Dragon</p>
          <AnimatePresence mode="wait">
            <motion.h3 key={hp.stage} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="text-lg font-extrabold text-white">
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
        {/* smoke particles (skipped on reduced motion) */}
        {!reduce && Array.from({ length: 5 }).map((_, i) => (
          <motion.span
            key={`smoke-${i}`}
            className="absolute rounded-full bg-slate-400/30 blur-md"
            style={{ width: 10 + i * 3, height: 10 + i * 3, left: `${44 + i * 3}%`, top: "26%" }}
            animate={{ y: [-4, -56], x: [0, (i - 2) * 10], opacity: [0, 0.35 * intensity, 0], scale: [0.6, 1.4] }}
            transition={{ duration: 3 + i * 0.4, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
          />
        ))}

        {/* fire breath — stronger dragon = more, hotter fire */}
        {alive && !reduce && Array.from({ length: 7 }).map((_, i) => (
          <motion.span
            key={`fire-${i}`}
            className="absolute rounded-full"
            style={{ width: 6 + (i % 3) * 3, height: 6 + (i % 3) * 3, background: i % 2 ? "#fbbf24" : hp.threatColor, left: `${30 - i * 1.5}%`, top: "52%", filter: "blur(1px)" }}
            animate={{ x: [-2, -40 - i * 4], y: [0, (i - 3) * 6], opacity: [0, 0.9 * intensity, 0], scale: [1, 0.3] }}
            transition={{ duration: 0.7 + i * 0.05, repeat: Infinity, delay: i * 0.08 }}
          />
        ))}

        {/* the dragon */}
        <motion.div
          animate={bodyAnim}
          transition={bodyTrans}
          style={{ scale: reduce ? size : undefined, filter: `drop-shadow(0 0 ${10 + intensity * 16}px ${hp.threatColor}aa)`, opacity: alive ? 1 : 0.4 }}
        >
          <DragonGlyph color={color} threatColor={hp.threatColor} defeated={!alive} intensity={intensity} pct={pct} reduce={!!reduce} />
        </motion.div>
      </div>

      {/* HP bar with shimmer */}
      <div>
        <div className="flex items-baseline justify-between">
          <span className="label">HP</span>
          <span className="text-base font-extrabold tabular-nums" style={{ color }}>{hp.hp.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ {hp.maxHp.toLocaleString()}</span></span>
        </div>
        <div className="relative mt-1 h-3 overflow-hidden rounded-full bg-bg" style={{ boxShadow: "inset 0 0 6px rgba(0,0,0,0.4)" }}>
          <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${color}, ${hp.threatColor})`, boxShadow: `0 0 10px ${color}88` }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut" }} />
          {/* shimmer sweep */}
          {!reduce && pct > 0 && (
            <motion.div
              aria-hidden
              className="absolute inset-y-0 w-1/3"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)", width: `${pct}%`, maxWidth: "120px" }}
              animate={{ x: ["-120%", "320%"] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-slate-400">
        {alive ? "Every completed mission damages it. Every relapse feeds it." : "The dragon is defeated. Stay sharp — it can always return."}
      </p>
    </div>
  );
}

function DragonGlyph({ color, threatColor, defeated, intensity, pct, reduce }: { color: string; threatColor: string; defeated: boolean; intensity: number; pct: number; reduce: boolean }) {
  // Molten damage: cracks fade in as HP drops.
  const crack1 = Math.max(0, Math.min(1, (72 - pct) / 72)); // appears below ~72%
  const crack2 = Math.max(0, Math.min(1, (38 - pct) / 38)); // more cracks below ~38%
  const eyeAnim = defeated || reduce ? {} : { opacity: [0.6, 1, 0.6], r: [3, 3.7, 3] };
  const wingAnim = defeated || reduce ? {} : { rotate: [0, -12, 0] };
  const tailAnim = defeated || reduce ? {} : { d: ["M50 80 C60 90 73 92 84 84", "M50 80 C60 86 75 94 86 80", "M50 80 C60 90 73 92 84 84"] };

  return (
    <svg width="170" height="170" viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="dragonBody" x1="20" y1="30" x2="86" y2="84" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={color} />
          <stop offset="1" stopColor="#0b1020" />
        </linearGradient>
        <radialGradient id="dragonBelly" cx="0.5" cy="0.4" r="0.7">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* back wing (layered, behind body) */}
      <motion.path
        d="M62 38 C82 18 99 22 96 44 C86 40 76 42 68 50 Z"
        fill={color} opacity={defeated ? 0.25 : 0.55}
        animate={wingAnim} transition={reduce ? {} : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "68px 46px" }}
      />

      {/* horns */}
      {!defeated && (
        <>
          <path d="M40 30 C38 22 42 18 47 18 C43 22 44 27 45 31 Z" fill={color} opacity={0.9} />
          <path d="M48 29 C47 21 51 17 56 18 C52 22 53 27 53 31 Z" fill={color} opacity={0.9} />
        </>
      )}

      {/* body */}
      <path
        d="M50 82 C30 82 21 67 26 54 C17 52 13 41 22 35 C31 29 41 33 43 40 C47 31 57 27 65 31 C76 25 88 31 86 44 C94 48 92 61 81 63 C83 73 73 84 60 82 C58 88 50 88 50 82 Z"
        fill={defeated ? color : "url(#dragonBody)"} opacity={defeated ? 0.5 : 0.97}
      />
      {/* belly highlight */}
      {!defeated && <path d="M50 82 C40 82 31 73 31 62 C40 70 55 70 66 64 C66 76 60 84 50 82 Z" fill="url(#dragonBelly)" />}

      {/* back spikes */}
      {!defeated && [0, 1, 2, 3].map((i) => (
        <path key={i} d={`M${52 + i * 8} ${30 - i} l3 -7 l3 7 Z`} fill={color} opacity={0.85} />
      ))}

      {/* molten damage cracks (HP-based) */}
      {crack1 > 0 && (
        <g stroke="#ff6a2c" strokeWidth={1.1} strokeLinecap="round" fill="none" opacity={crack1} style={{ filter: `drop-shadow(0 0 3px #ff6a2c)` }}>
          <path d="M40 52 l6 5 l-3 6 l7 3" />
          <path d="M58 50 l5 7 l-4 4" />
        </g>
      )}
      {crack2 > 0 && (
        <g stroke="#ffd24a" strokeWidth={1} strokeLinecap="round" fill="none" opacity={crack2} style={{ filter: `drop-shadow(0 0 3px #ff6a2c)` }}>
          <path d="M34 60 l7 4 l-2 6" />
          <path d="M64 60 l-5 6 l4 5" />
          <path d="M48 66 l4 6" />
        </g>
      )}

      {/* jaw line + teeth */}
      {!defeated && (
        <>
          <path d="M22 50 C26 54 32 55 38 54" stroke="#0b1020" strokeWidth="1.2" fill="none" opacity="0.6" />
          <path d="M24 52 l1.5 2.5 M28 53 l1.5 2.5 M32 53 l1.3 2.3" stroke="#fff" strokeWidth="0.8" opacity="0.7" />
        </>
      )}

      {/* glowing eye */}
      <motion.circle
        cx="38" cy="45" r={defeated ? 2 : 3.4}
        fill={defeated ? "#0a0a0a" : threatColor}
        animate={eyeAnim}
        transition={reduce ? {} : { duration: 1.3 + (1 - intensity), repeat: Infinity }}
        style={{ filter: defeated ? "none" : `drop-shadow(0 0 7px ${threatColor})` }}
      />
      {!defeated && <circle cx="37" cy="44" r="1.1" fill="#fff" />}

      {/* nostril (fire origin) */}
      <circle cx="27" cy="51" r="1.5" fill="#1a0a00" opacity={defeated ? 0.3 : 0.85} />

      {/* tail with spade tip */}
      <motion.path
        d="M50 80 C60 90 73 92 84 84"
        stroke={color} strokeWidth="3" strokeLinecap="round" fill="none"
        animate={tailAnim} transition={reduce ? {} : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      {!defeated && <path d="M84 84 l6 -2 l-3 5 Z" fill={color} opacity={0.85} />}
    </svg>
  );
}
