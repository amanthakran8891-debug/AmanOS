"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fmtClock as pad } from "@/lib/score";
import {
  cleanBreakdown,
  bestRunSeconds,
  streakDaysFrom,
  fmtRun,
  MILESTONES,
  MILESTONE_TITLES,
  milestoneLabel,
  currentTitle,
  nextTitle,
} from "@/lib/clean-time";

type Breakdown = NonNullable<ReturnType<typeof cleanBreakdown>>;

export function Hourglass({
  lastJointAt,
  bestCleanRunSec = 0,
  streakDays: streakDaysProp,
}: {
  lastJointAt: string | null;
  bestCleanRunSec?: number;
  streakDays?: number;
}) {
  const [t, setT] = useState<Breakdown | null>(() => cleanBreakdown(lastJointAt));
  const [bestSec, setBestSec] = useState(() => bestRunSeconds(bestCleanRunSec, lastJointAt));

  useEffect(() => {
    if (!lastJointAt) {
      setT(null);
      return;
    }
    const tick = () => {
      setT(cleanBreakdown(lastJointAt));
      setBestSec(bestRunSeconds(bestCleanRunSec, lastJointAt));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lastJointAt, bestCleanRunSec]);

  const streakDays = streakDaysProp ?? streakDaysFrom(lastJointAt);
  const title = currentTitle(streakDays);
  const upcoming = nextTitle(streakDays);
  // The current live run IS the record when it has surpassed the stored best.
  const liveIsRecord = !!t && t.totalSeconds >= bestSec;

  return (
    <div className="card relative overflow-hidden">
      {/* ambient amber glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-16 h-52 w-52 rounded-full bg-amber-400/15 blur-3xl"
        animate={{ opacity: [0.35, 0.7, 0.35] }}
        transition={{ duration: 7, repeat: Infinity }}
      />

      <div className="relative flex items-center justify-between">
        <p className="label text-amber-300/90">⏳ Hourglass of Freedom</p>
        {title && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-300"
            style={{ textShadow: "0 0 12px rgba(251,191,36,0.6)" }}
          >
            👑 {title}
          </motion.span>
        )}
      </div>

      {t ? (
        <>
          <div className="relative mt-3 flex items-center gap-5">
            <HourglassGlyph flip={t.seconds % 30 === 0} />

            <div className="min-w-0 flex-1">
              {/* y / m / d row */}
              <div className="flex flex-wrap items-end gap-x-4 gap-y-1">
                <TimeUnit n={t.years} label="yr" />
                <TimeUnit n={t.months} label="mo" />
                <TimeUnit n={t.days} label="d" />
              </div>
              {/* h : m : s — the live heartbeat */}
              <div className="mt-1.5 flex items-end gap-2 font-mono text-4xl font-black tabular-nums leading-none text-white">
                <Digit value={pad(t.hours)} />
                <span className="pb-0.5 text-2xl text-slate-600">:</span>
                <Digit value={pad(t.minutes)} />
                <span className="pb-0.5 text-2xl text-slate-600">:</span>
                <motion.span
                  key={t.seconds}
                  initial={{ opacity: 0.35, y: -3 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-amber-300"
                  style={{ textShadow: "0 0 20px rgba(251,191,36,0.75)" }}
                >
                  {pad(t.seconds)}
                </motion.span>
              </div>
              <p className="mt-1 text-[11px] font-medium text-slate-500">hours · minutes · seconds — live</p>
            </div>
          </div>

          {/* 🏆 Best Clean Run — the permanent record */}
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] px-4 py-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300/80">🏆 Best Clean Run</p>
              <p className="mt-0.5 font-mono text-xl font-extrabold tabular-nums text-amber-200" style={{ textShadow: "0 0 14px rgba(251,191,36,0.45)" }}>
                {fmtRun(bestSec)}
              </p>
            </div>
            {liveIsRecord && bestSec > 0 && (
              <motion.span
                className="rounded-full border border-amber-400/50 bg-amber-400/15 px-2.5 py-1 text-[10px] font-bold text-amber-200"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              >
                NEW RECORD — LIVE
              </motion.span>
            )}
          </div>

          {/* Motivation */}
          <div className="mt-4 text-center">
            <p className="text-sm font-bold text-amber-300/90">Every clean minute is stolen back from the dragon.</p>
            <p className="mt-0.5 text-xs text-slate-400">The clock never resets unless you choose to feed the dragon.</p>
          </div>

          {/* Visual goal system — milestone markers */}
          <MilestoneTrack streakDays={streakDays} />

          {/* Future Vision — next title */}
          {upcoming && (
            <p className="mt-3 text-center text-[11px] text-slate-400">
              Next:{" "}
              <span className="font-bold text-amber-300">{milestoneLabel(upcoming.day)} — {upcoming.title}</span>{" "}
              in <span className="font-bold tabular-nums text-white">{upcoming.daysAway}d</span>
            </p>
          )}
        </>
      ) : (
        <div className="mt-3 flex items-center gap-5">
          <HourglassGlyph flip={false} />
          <p className="text-sm text-slate-400">Set your last-joint time in Settings to start the clock.</p>
        </div>
      )}
    </div>
  );
}

function Digit({ value }: { value: string }) {
  return <span style={{ textShadow: "0 0 16px rgba(255,255,255,0.18)" }}>{value}</span>;
}

function TimeUnit({ n, label }: { n: number; label: string }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className="text-2xl font-black tabular-nums text-white">{n}</span>
      <span className="text-xs font-semibold text-slate-400">{label}</span>
    </span>
  );
}

// ── Milestone track ───────────────────────────────────────────────────────────
function MilestoneTrack({ streakDays }: { streakDays: number }) {
  const next = MILESTONES.find((m) => m > streakDays) ?? MILESTONES[MILESTONES.length - 1];
  const titleFor = (day: number) => MILESTONE_TITLES.find((m) => m.day === day)?.title ?? null;

  return (
    <div className="mt-4 flex items-center justify-between gap-1 overflow-x-auto pb-1">
      {MILESTONES.map((m, i) => {
        const done = streakDays >= m;
        const isCurrent = m === next && !done;
        const tt = titleFor(m);
        return (
          <div key={m} className="flex shrink-0 items-center">
            {i > 0 && (
              <span className={`h-0.5 w-3 sm:w-5 ${streakDays >= MILESTONES[i - 1] ? "bg-amber-400/60" : "bg-line"}`} />
            )}
            <div className="flex flex-col items-center gap-0.5">
              <motion.span
                className="text-base leading-none"
                style={
                  done
                    ? { color: "#fbbf24", textShadow: "0 0 12px rgba(251,191,36,0.85)" }
                    : isCurrent
                      ? { color: "#fcd34d" }
                      : { color: "#475569" }
                }
                animate={isCurrent ? { scale: [1, 1.35, 1], opacity: [0.7, 1, 0.7] } : {}}
                transition={isCurrent ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : {}}
              >
                {done ? "●" : "○"}
              </motion.span>
              <span className={`text-[8px] font-semibold ${done ? "text-amber-300" : isCurrent ? "text-amber-200" : "text-slate-600"}`}>
                {milestoneLabel(m).replace("Day ", "D")}
              </span>
              {tt && (
                <span className={`text-[7px] leading-tight ${done ? "text-amber-400/70" : "text-slate-700"}`}>{tt}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── The animated hourglass glyph ──────────────────────────────────────────────
function HourglassGlyph({ flip }: { flip: boolean }) {
  return (
    <motion.svg
      width="80"
      height="104"
      viewBox="0 0 80 104"
      className="shrink-0"
      animate={{ rotate: flip ? [0, 180, 360] : 0 }}
      transition={{ duration: 1.6, ease: "easeInOut" }}
    >
      <defs>
        <linearGradient id="hg-sand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fcd34d" />
          <stop offset="0.5" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="hg-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2a3a5e" />
          <stop offset="1" stopColor="#1a2440" />
        </linearGradient>
        <filter id="hg-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* clip paths so the sand can never spill outside the glass chambers */}
        <clipPath id="hg-top">
          <path d="M18 13 H62 L43 50 H37 Z" />
        </clipPath>
        <clipPath id="hg-bottom">
          <path d="M37 54 H43 L62 91 H18 Z" />
        </clipPath>
      </defs>

      {/* caps */}
      <rect x="12" y="5" width="56" height="6" rx="3" fill="#243352" />
      <rect x="12" y="93" width="56" height="6" rx="3" fill="#243352" />

      {/* glass outline */}
      <path
        d="M18 11 H62 L43 52 L62 93 H18 L37 52 Z"
        fill="url(#hg-glass)"
        fillOpacity="0.25"
        stroke="#33456b"
        strokeWidth="2"
      />

      {/* top chamber — sand drains away (shrinks downward) */}
      <g clipPath="url(#hg-top)">
        <motion.rect
          x="14"
          width="52"
          fill="url(#hg-sand)"
          initial={false}
          animate={{ y: [13, 50], height: [40, 3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
      </g>

      {/* falling stream of sand */}
      <motion.rect
        x="39"
        y="49"
        width="2"
        height="6"
        rx="1"
        fill="#fcd34d"
        filter="url(#hg-glow)"
        animate={{ opacity: [0.15, 1, 0.15], scaleY: [0.6, 1.1, 0.6] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "center" }}
      />
      {/* individual grains */}
      {[0, 0.3, 0.6].map((d, i) => (
        <motion.circle
          key={i}
          cx="40"
          r="1"
          fill="#fde68a"
          animate={{ cy: [50, 88], opacity: [0, 1, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeIn", delay: d }}
        />
      ))}

      {/* bottom chamber — sand piles up (grows from the floor) */}
      <g clipPath="url(#hg-bottom)">
        <motion.rect
          x="14"
          width="52"
          fill="url(#hg-sand)"
          initial={false}
          animate={{ y: [88, 55], height: [3, 36] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
        {/* soft mound highlight */}
        <motion.ellipse
          cx="40"
          rx="13"
          ry="3"
          fill="#fde68a"
          fillOpacity="0.5"
          animate={{ cy: [89, 57] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        />
      </g>

      {/* glass rims for a premium edge */}
      <path d="M18 11 H62 L43 52 L62 93 H18 L37 52 Z" fill="none" stroke="#4a5f8c" strokeOpacity="0.5" strokeWidth="1" />
    </motion.svg>
  );
}
