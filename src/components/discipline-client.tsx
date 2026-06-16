"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { DisciplineData } from "@/lib/data";

const BAND_LABEL = { strong: "Strong day", partial: "Partial day", drift: "Drift day", none: "No data" } as const;
const HIT_ICON = { full: "✓", partial: "◐", miss: "✕" } as const;
const HIT_COLOR = { full: "#34f5c5", partial: "#fbbf24", miss: "#fb7185" } as const;

export function DisciplineClient({ data }: { data: DisciplineData }) {
  const { today, yesterday, avg7, avg30, flags, momentum, report, calendar, monthLabel } = data;
  const delta = today.score - yesterday.score;
  const [selected, setSelected] = useState<DisciplineData["calendar"][number] | null>(null);

  return (
    <div className="space-y-4">
      {/* ── Today's score hero ── */}
      <div className="card relative overflow-hidden" style={{ background: `linear-gradient(160deg, ${today.color}22, rgba(13,19,34,0.6))` }}>
        <div className="flex items-end justify-between">
          <div>
            <p className="label">Today&apos;s accountability</p>
            <p className="text-6xl font-extrabold tabular-nums text-white glow-text" style={{ color: today.color }}>{today.score}</p>
            <p className="text-xs font-semibold" style={{ color: today.color }}>{BAND_LABEL[today.band]}</p>
          </div>
          <div className="text-right text-xs text-slate-400">
            <p>Yesterday <span className="font-bold text-slate-200 tabular-nums">{yesterday.hasData ? yesterday.score : "—"}</span></p>
            {yesterday.hasData && (
              <p className="tabular-nums" style={{ color: delta >= 0 ? "#34f5c5" : "#fb7185" }}>{delta >= 0 ? "▲" : "▼"} {Math.abs(delta)} vs yesterday</p>
            )}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-bg/50 px-3 py-2"><p className="text-[10px] uppercase tracking-wide text-slate-500">7-day average</p><p className="text-xl font-bold tabular-nums text-white">{avg7}</p></div>
          <div className="rounded-lg bg-bg/50 px-3 py-2"><p className="text-[10px] uppercase tracking-wide text-slate-500">30-day average</p><p className="text-xl font-bold tabular-nums text-white">{avg30}</p></div>
        </div>
      </div>

      {/* ── Today's components ── */}
      <div className="card">
        <p className="label">What built today&apos;s score</p>
        <div className="mt-2 grid grid-cols-2 gap-1.5">
          {today.parts.map((p) => (
            <div key={p.key} className="flex items-center justify-between rounded-lg border border-line bg-surface-2 px-3 py-2">
              <span className="text-xs text-slate-300">{p.label}</span>
              <span className="flex items-center gap-1.5 text-xs font-bold tabular-nums" style={{ color: HIT_COLOR[p.hit] }}>
                {p.earned}/{p.max} <span>{HIT_ICON[p.hit]}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Drift warnings ── */}
      {flags.length > 0 && (
        <div className="space-y-2">
          {flags.map((f) => (
            <motion.div key={f.key} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
              className="card flex gap-3" style={{ borderColor: f.severity === "high" ? "rgba(251,113,133,0.5)" : "rgba(251,191,36,0.4)", background: f.severity === "high" ? "rgba(251,113,133,0.06)" : "rgba(251,191,36,0.05)" }}>
              <span className="text-xl">{f.severity === "high" ? "🛑" : "⚠️"}</span>
              <div>
                <p className="text-sm font-bold" style={{ color: f.severity === "high" ? "#fb7185" : "#fbbf24" }}>Warning: {f.title}</p>
                <p className="text-xs text-slate-300">{f.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Momentum ── */}
      <div className="card">
        <p className="label">Momentum</p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {momentum.map((m) => (
            <div key={m.key} className={`rounded-2xl border px-3 py-3 text-center transition ${m.hit ? "border-neon-green/50 bg-neon-green/10" : "border-line bg-surface-2"}`}>
              <p className="text-xl">{m.icon}</p>
              <p className="mt-1 text-lg font-extrabold tabular-nums" style={{ color: m.hit ? "#34f5c5" : "#e8edf6" }}>{m.value}<span className="text-xs font-semibold text-slate-500">/{m.target}</span></p>
              <p className="text-[10px] text-slate-400">{m.title}</p>
              {m.hit && <p className="text-[10px] font-bold text-neon-green">🔥 rolling</p>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Discipline calendar ── */}
      <div className="card">
        <div className="flex items-center justify-between">
          <p className="label">Discipline calendar · {monthLabel}</p>
          <div className="flex gap-2 text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: "#34f5c5" }} />strong</span>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: "#fbbf24" }} />partial</span>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: "#fb7185" }} />drift</span>
          </div>
        </div>
        <Calendar calendar={calendar} onSelect={setSelected} selected={selected?.date} todayKey={data.date} />
        {selected && (
          <div className="mt-3 rounded-xl border border-line bg-surface-2 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-white">{new Date(selected.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}</p>
              <span className="text-sm font-bold tabular-nums" style={{ color: selected.color }}>{selected.future ? "—" : `${selected.score} · ${BAND_LABEL[selected.band]}`}</span>
            </div>
            {selected.future ? (
              <p className="mt-1 text-xs text-slate-400">In the future — unwritten. Make it a strong day.</p>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-1">
                {selected.parts.map((p) => (
                  <span key={p.key} className="flex items-center gap-1.5 text-[11px]" style={{ color: HIT_COLOR[p.hit] }}>{HIT_ICON[p.hit]} <span className="text-slate-300">{p.label}</span></span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Weekly accountability report ── */}
      <div className="card" style={{ background: "linear-gradient(160deg, rgba(251,191,36,0.08), rgba(13,19,34,0.55))" }}>
        <div className="flex items-center justify-between">
          <p className="label">Weekly accountability report</p>
          <span className="text-[10px] text-slate-500">last 7 days · refreshed every Sunday</span>
        </div>
        <p className="mt-2 text-4xl font-extrabold tabular-nums text-white">{report.totalScore}<span className="text-base text-slate-400"> avg</span></p>
        <div className="mt-3 space-y-2 text-sm">
          <Row label="Best habit" value={report.bestHabit ? `${report.bestHabit.label} · ${report.bestHabit.pct}%` : "—"} color="#34f5c5" />
          <Row label="Weakest habit" value={report.weakestHabit ? `${report.weakestHabit.label} · ${report.weakestHabit.pct}%` : "—"} color="#fb7185" />
          <Row label="Biggest win" value={report.biggestWin} color="#a3e635" />
          <Row label="Biggest failure" value={report.biggestFailure} color="#fbbf24" />
          <Row label="Next week focus" value={report.nextFocus} color="#22d3ee" />
        </div>
      </div>

      <p className="px-1 pb-2 text-center text-[11px] text-slate-500">This is the honest record. It only reflects what you log — track daily and it can&apos;t lie to you.</p>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-28 shrink-0 text-[11px] font-semibold uppercase tracking-wide" style={{ color }}>{label}</span>
      <span className="flex-1 text-slate-200">{value}</span>
    </div>
  );
}

function Calendar({ calendar, onSelect, selected, todayKey }: { calendar: DisciplineData["calendar"]; onSelect: (d: DisciplineData["calendar"][number]) => void; selected?: string; todayKey: string }) {
  if (calendar.length === 0) return null;
  // Monday-start offset for the 1st of the month.
  const firstDow = (new Date(calendar[0].date).getDay() + 6) % 7;
  const blanks = Array.from({ length: firstDow });
  return (
    <div className="mt-3">
      <div className="grid grid-cols-7 gap-1 text-center text-[9px] text-slate-500">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => <span key={i}>{d}</span>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {blanks.map((_, i) => <div key={`b${i}`} />)}
        {calendar.map((d) => {
          const day = Number(d.date.slice(8));
          const isToday = d.date === todayKey;
          const isSel = d.date === selected;
          const bg = d.future ? "transparent" : d.band === "none" ? "#131b2e" : d.color;
          const dim = d.band === "none" || d.future;
          return (
            <button key={d.date} onClick={() => onSelect(d)}
              className="relative aspect-square rounded-lg text-[11px] font-bold tabular-nums transition active:scale-95"
              style={{
                background: dim ? "rgba(19,27,46,0.6)" : `${bg}33`,
                border: isSel ? `2px solid ${d.future ? "#475569" : d.color}` : isToday ? "1.5px solid #e8edf6" : "1px solid #1e2942",
                color: dim ? "#64748b" : "#fff",
              }}>
              {day}
              {!d.future && d.band !== "none" && <i className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full" style={{ background: d.color }} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
