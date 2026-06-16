"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { elapsedSince } from "@/lib/dates";
import { fmtClock as pad } from "@/lib/score";

export function Hourglass({ lastJointAt }: { lastJointAt: string | null }) {
  const since = lastJointAt ? new Date(lastJointAt) : null;
  const [t, setT] = useState(() => (since ? elapsedSince(since) : null));

  useEffect(() => {
    if (!since) return;
    const id = setInterval(() => setT(elapsedSince(since)), 1000);
    return () => clearInterval(id);
  }, [lastJointAt]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="card relative overflow-hidden">
      <p className="label">Hourglass of Freedom</p>
      <div className="mt-2 flex items-center gap-4">
        <HourglassGlyph />
        <div className="min-w-0 flex-1">
          {t ? (
            <>
              <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                <TimeUnit n={t.years} label="yr" />
                <TimeUnit n={t.months} label="mo" />
                <TimeUnit n={t.days} label="d" />
              </div>
              <div className="mt-1 flex items-end gap-3 font-mono text-3xl font-bold tabular-nums text-white">
                <span>{pad(t.hours)}</span>
                <span className="text-slate-600">:</span>
                <span>{pad(t.minutes)}</span>
                <span className="text-slate-600">:</span>
                <motion.span key={t.seconds} initial={{ opacity: 0.4, y: -2 }} animate={{ opacity: 1, y: 0 }} className="text-neon-green glow-text">
                  {pad(t.seconds)}
                </motion.span>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">Set your last-joint time in Settings to start the clock.</p>
          )}
        </div>
      </div>
      <p className="mt-3 text-center text-xs font-medium text-neon-green/90">Every minute clean weakens the dragon.</p>
    </div>
  );
}


function TimeUnit({ n, label }: { n: number; label: string }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className="text-xl font-bold tabular-nums text-white">{n}</span>
      <span className="text-xs text-slate-400">{label}</span>
    </span>
  );
}

function HourglassGlyph() {
  return (
    <svg width="64" height="80" viewBox="0 0 64 80" className="shrink-0">
      <defs>
        <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#34f5c5" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <rect x="10" y="4" width="44" height="5" rx="2.5" fill="#1e2942" />
      <rect x="10" y="71" width="44" height="5" rx="2.5" fill="#1e2942" />
      <path d="M14 9 H50 L34 40 L50 71 H14 L30 40 Z" fill="none" stroke="#2a3a5e" strokeWidth="2" />
      {/* top sand draining */}
      <motion.path
        d="M16 11 H48 L34 38 L30 38 Z"
        fill="url(#sand)"
        opacity="0.85"
        animate={{ scaleY: [1, 0.4, 1], originY: 0 }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformBox: "fill-box", transformOrigin: "center top" }}
      />
      {/* falling stream */}
      <motion.rect x="31.5" y="38" width="1.5" height="20" fill="#34f5c5" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ duration: 1, repeat: Infinity }} />
      {/* bottom sand rising */}
      <motion.path
        d="M16 69 H48 L34 42 L30 42 Z"
        fill="url(#sand)"
        opacity="0.85"
        animate={{ scaleY: [0.4, 1, 0.4], originY: 1 }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformBox: "fill-box", transformOrigin: "center bottom" }}
      />
    </svg>
  );
}
