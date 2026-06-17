"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { CeoData } from "@/lib/data";
import { trendMeta, GRADE_COLOR, type Grade } from "@/lib/ceo";

export function CeoDashboard({ ceo, lifeScore }: { ceo: CeoData; lifeScore?: number }) {
  const { grade, gradeColor, ceoScore, winning, status, warning, priority, momentum, weekly, history } = ceo;
  const [showMeeting, setShowMeeting] = useState(false);
  const primaryThreat = `Cannabis Relapse · ${status.dragonThreat} threat`;

  return (
    <div className="card relative overflow-hidden" style={{ background: `linear-gradient(165deg, ${gradeColor}1a, rgba(13,19,34,0.7))`, borderColor: `${gradeColor}44` }}>
      {/* CEO Status Report */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">CEO Status Report</p>
          <p className="mt-0.5 text-lg font-bold text-white">{winning}</p>
        </div>
        <div className="flex flex-col items-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl text-4xl font-black" style={{ background: `${gradeColor}22`, color: gradeColor, border: `2px solid ${gradeColor}` }}>{grade}</div>
          <p className="mt-1 text-[10px] tabular-nums text-slate-400">{lifeScore != null ? `Life Score ${lifeScore}` : `CEO ${ceoScore}`}</p>
        </div>
      </div>
      <div className="mt-3 space-y-1 rounded-xl border border-line bg-bg/40 p-3 text-xs">
        <p><span className="font-bold text-neon-red">⚠ Primary Threat:</span> <span className="text-slate-200">{primaryThreat}</span></p>
        <p><span className="font-bold text-neon-green">↑ Primary Opportunity:</span> <span className="text-slate-200">NCLEX + BharatFare</span></p>
        <p><span className="font-bold text-neon-cyan">🎯 Today&apos;s Win Condition:</span> <span className="font-semibold text-white">{priority.title}</span></p>
      </div>

      {/* Status grid */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Stat label="Discipline" value={String(status.discipline)} color={status.discipline >= 75 ? "#34f5c5" : status.discipline >= 45 ? "#fbbf24" : "#fb7185"} />
        <Stat label="Dragon Threat" value={status.dragonThreat} color={status.dragonThreatColor} />
        <Stat label="Recovery" value={status.recoveryPhase} color="#22d3ee" small />
        <Stat label="NCLEX" value={status.nclexReadiness} color={status.nclexReadinessColor} small />
        <Stat label="BharatFare" value={trendMeta(status.bharatfareMomentum).label} color={trendMeta(status.bharatfareMomentum).color} small />
      </div>

      {/* Critical warning — single highest priority */}
      {warning && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2"
          style={{ background: warning.severity === "high" ? "rgba(251,113,133,0.12)" : "rgba(251,191,36,0.10)", border: `1px solid ${warning.severity === "high" ? "rgba(251,113,133,0.5)" : "rgba(251,191,36,0.4)"}` }}>
          <span>{warning.severity === "high" ? "🛑" : "⚠️"}</span>
          <div>
            <p className="text-sm font-bold" style={{ color: warning.severity === "high" ? "#fb7185" : "#fbbf24" }}>{warning.title}</p>
            <p className="text-[11px] text-slate-300">{warning.detail}</p>
          </div>
        </motion.div>
      )}

      {/* Today's priority — one mission */}
      <div className="mt-3 rounded-xl border border-neon-cyan/40 bg-neon-cyan/8 px-3 py-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neon-cyan">Today&apos;s Priority</p>
        <p className="mt-1 text-base font-extrabold text-white">{priority.title}</p>
        <p className="text-xs text-slate-300">{priority.detail}</p>
      </div>

      {/* Momentum indicators */}
      <div className="mt-3">
        <p className="label">Momentum</p>
        <div className="mt-1.5 grid grid-cols-5 gap-1.5">
          {momentum.map((m) => {
            const t = trendMeta(m.trend);
            return (
              <div key={m.key} className="rounded-lg border border-line bg-surface-2 px-1 py-1.5 text-center">
                <p className="text-[9px] uppercase tracking-wide text-slate-500">{m.label}</p>
                <p className="text-sm font-bold" style={{ color: t.color }}>{t.icon}</p>
                <p className="text-[8px]" style={{ color: t.color }}>{t.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CEO Weekly Meeting */}
      <button onClick={() => setShowMeeting((s) => !s)} className="mt-3 flex w-full items-center justify-between rounded-xl border border-line bg-surface-2 px-3 py-2 text-left">
        <span className="text-xs font-bold text-white">📋 CEO Weekly Meeting <span className="ml-1 font-normal text-slate-400">· grade {weekly.grade} · {weekly.totalScore}</span></span>
        <span className="text-slate-400">{showMeeting ? "▲" : "▼"}</span>
      </button>
      {showMeeting && (
        <div className="mt-2 space-y-2 rounded-xl border border-line bg-bg/40 p-3">
          <MeetingBlock title="Wins" items={weekly.wins} color="#34f5c5" />
          <MeetingBlock title="Losses" items={weekly.losses} color="#fb7185" />
          <MeetingBlock title="Missed opportunities" items={weekly.missed} color="#fbbf24" />
          <div className="text-xs"><span className="font-bold text-neon-red">Biggest risk: </span><span className="text-slate-200">{weekly.biggestRisk}</span></div>
          <div className="text-xs"><span className="font-bold text-neon-cyan">Next week focus: </span><span className="text-slate-200">{weekly.nextFocus}</span></div>
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">6-week record</p>
            <div className="flex gap-1">
              {history.map((h, i) => (
                <div key={i} className="flex-1 rounded-md py-1 text-center" style={{ background: h.hasData ? `${GRADE_COLOR[h.grade as Grade]}22` : "rgba(30,41,66,0.5)" }} title={`${h.label}: ${h.hasData ? h.score : "no data"}`}>
                  <p className="text-xs font-black" style={{ color: h.hasData ? GRADE_COLOR[h.grade as Grade] : "#475569" }}>{h.hasData ? h.grade : "–"}</p>
                </div>
              ))}
            </div>
            <div className="mt-0.5 flex gap-1 text-[8px] text-slate-600">
              {history.map((h, i) => <span key={i} className="flex-1 text-center">{i === 0 ? "now" : `-${i}w`}</span>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color, small }: { label: string; value: string; color: string; small?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2/70 px-2 py-1.5">
      <p className="text-[9px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`font-bold ${small ? "text-[11px] leading-tight" : "text-base"}`} style={{ color }}>{value}</p>
    </div>
  );
}

function MeetingBlock({ title, items, color }: { title: string; items: string[]; color: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color }}>{title}</p>
      <ul className="mt-0.5 space-y-0.5">
        {items.map((it, i) => <li key={i} className="text-xs text-slate-200">• {it}</li>)}
      </ul>
    </div>
  );
}
