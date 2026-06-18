"use client";

import { motion } from "framer-motion";
import type { RiskForecast } from "@/lib/prediction";

export function RiskForecast({ forecast, compact = false }: { forecast: RiskForecast; compact?: boolean }) {
  const f = forecast;
  return (
    <div className="card relative overflow-hidden">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl"
        style={{ background: `${f.color}22` }}
        animate={{ opacity: [0.4, 0.75, 0.4] }}
        transition={{ duration: 5, repeat: Infinity }}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="label">Today&apos;s Risk Forecast</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-3xl leading-none">{f.emoji}</span>
            <div>
              <p className="text-2xl font-black leading-none" style={{ color: f.color }}>{f.band} Risk</p>
              <p className="text-[11px] text-slate-500">relapse risk · {f.score}/100</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="label">Confidence</p>
          <p className="text-sm font-bold capitalize text-slate-300">{f.confidence.level}</p>
          <p className="text-[10px] text-slate-500">{f.confidence.events} events</p>
        </div>
      </div>

      {/* risk meter */}
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-bg">
        <motion.div className="h-full rounded-full" style={{ background: f.color, boxShadow: `0 0 12px ${f.color}aa` }} initial={{ width: 0 }} animate={{ width: `${f.score}%` }} transition={{ duration: 0.8 }} />
      </div>

      {f.window && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-surface-2/70 px-3 py-2">
          <span className="text-lg">🕛</span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Most Dangerous Window</p>
            <p className="text-sm font-bold text-white">{f.window.label}</p>
          </div>
        </div>
      )}

      {!compact && (
        <>
          {f.reasons.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-neon-red/80">Why</p>
              <ul className="mt-1 space-y-1">
                {f.reasons.slice(0, 5).map((r, i) => (
                  <li key={i} className="flex gap-2 text-[13px] text-slate-300"><span className="text-neon-red">•</span>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {f.protective.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-neon-green/80">Lowering your risk</p>
              <ul className="mt-1 space-y-1">
                {f.protective.slice(0, 4).map((r, i) => (
                  <li key={i} className="flex gap-2 text-[13px] text-slate-300"><span className="text-neon-green">✓</span>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      <p className="mt-3 text-[11px] text-slate-500">{f.confidence.note}</p>
    </div>
  );
}
