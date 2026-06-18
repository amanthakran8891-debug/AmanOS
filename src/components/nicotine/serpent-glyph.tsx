"use client";

import { motion } from "framer-motion";
import type { ThreatBand } from "@/lib/serpent";

/** Animated Smoke Serpent — pure SVG + Framer Motion. Reacts to threat:
 *  eye colour, movement speed, smoke density, tail shake + warning pulse. */
export function SerpentGlyph({
  threat,
  eye,
  color,
  heavySmoke,
  warningPulse,
}: {
  threat: ThreatBand;
  eye: string;
  color: string;
  heavySmoke: boolean;
  warningPulse: boolean;
}) {
  // Movement quickens with threat.
  const breath = threat === "EXTREME" ? 1.8 : threat === "HIGH" ? 2.6 : threat === "MODERATE" ? 3.6 : 4.8;
  const swayDeg = threat === "EXTREME" ? 7 : threat === "HIGH" ? 4.5 : threat === "MODERATE" ? 3 : 2;
  const tailDur = threat === "EXTREME" ? 0.5 : threat === "HIGH" ? 1.4 : 2.4;
  const smokeCount = heavySmoke ? 6 : threat === "MODERATE" ? 4 : 2;
  const smoke = Array.from({ length: smokeCount });

  return (
    <div className="relative w-full" style={{ aspectRatio: "16 / 11" }}>
      {warningPulse && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-3xl"
          style={{ boxShadow: `inset 0 0 60px ${color}55, 0 0 40px ${color}33` }}
          animate={{ opacity: [0.25, 0.7, 0.25] }}
          transition={{ duration: 1.1, repeat: Infinity }}
        />
      )}

      <svg viewBox="0 0 320 220" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="serpentBody" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3a4763" />
            <stop offset="0.5" stopColor="#2a3550" />
            <stop offset="1" stopColor="#1a2238" />
          </linearGradient>
          <radialGradient id="serpentBelly" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#4a5a7e" />
            <stop offset="1" stopColor="#2a3550" />
          </radialGradient>
          <filter id="serpentGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* rising smoke */}
        {smoke.map((_, i) => {
          const x = 120 + (i * 37) % 150;
          const delay = (i * 0.5) % 2.5;
          return (
            <motion.circle
              key={i}
              cx={x}
              r={6 + (i % 3) * 2}
              fill={heavySmoke ? color : "#64748b"}
              opacity={0.18}
              animate={{ cy: [150, 40], opacity: [0, heavySmoke ? 0.5 : 0.28, 0], scale: [0.6, 1.4, 1.9] }}
              transition={{ duration: 3.2, repeat: Infinity, delay, ease: "easeOut" }}
              style={{ transformOrigin: "center" }}
            />
          );
        })}

        {/* whole serpent — idle breathing */}
        <motion.g
          animate={{ scale: [1, 1.025, 1] }}
          transition={{ duration: breath, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "160px 150px" }}
        >
          {/* coiled body (S-curve) */}
          <path
            d="M40 195 C 40 150, 120 150, 120 120 C 120 92, 60 92, 60 70 C 60 48, 130 44, 175 56"
            fill="none"
            stroke="url(#serpentBody)"
            strokeWidth="34"
            strokeLinecap="round"
          />
          <path
            d="M40 195 C 40 150, 120 150, 120 120 C 120 92, 60 92, 60 70 C 60 48, 130 44, 175 56"
            fill="none"
            stroke="url(#serpentBelly)"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.5"
          />

          {/* tail — shakes harder with threat */}
          <motion.g
            animate={{ rotate: [-swayDeg, swayDeg, -swayDeg] }}
            transition={{ duration: tailDur, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "44px 195px" }}
          >
            <path d="M44 196 C 24 200, 16 210, 8 208" fill="none" stroke="url(#serpentBody)" strokeWidth="10" strokeLinecap="round" />
          </motion.g>

          {/* head — sways */}
          <motion.g
            animate={{ rotate: [-swayDeg, swayDeg, -swayDeg], x: [0, swayDeg, 0] }}
            transition={{ duration: breath * 0.9, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "180px 58px" }}
          >
            {/* head shape */}
            <path d="M170 40 C 205 36, 232 48, 236 62 C 238 74, 222 82, 198 80 C 176 78, 162 66, 164 54 C 165 46, 166 42, 170 40 Z" fill="url(#serpentBody)" />
            {/* nostrils */}
            <ellipse cx="230" cy="60" rx="2" ry="1.4" fill="#0b0f1a" />

            {/* forked tongue — flicks */}
            <motion.g
              animate={{ scaleX: [0, 1, 0], opacity: [0, 1, 0] }}
              transition={{ duration: 0.7, repeat: Infinity, repeatDelay: threat === "EXTREME" ? 0.8 : 2.2, ease: "easeInOut" }}
              style={{ transformOrigin: "236px 64px" }}
            >
              <path d="M236 64 L 256 62 M252 60 L 258 57 M252 64 L 258 67" stroke={threat === "LOW" ? "#fb7185" : color} strokeWidth="2" fill="none" strokeLinecap="round" />
            </motion.g>

            {/* eye — glows by threat */}
            <circle cx="196" cy="58" r="7.5" fill="#0b0f1a" />
            <motion.circle
              cx="196" cy="58" r="4.6" fill={eye} filter="url(#serpentGlow)"
              animate={{ opacity: [0.65, 1, 0.65] }}
              transition={{ duration: threat === "EXTREME" ? 0.7 : 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <circle cx="194.5" cy="56.5" r="1.4" fill="#fff" opacity="0.85" />
          </motion.g>
        </motion.g>
      </svg>
    </div>
  );
}
