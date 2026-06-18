"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import type { NclexData } from "@/lib/data";
import { NCLEX_TOPICS, TOPIC_BY_KEY, ACCURACY_TARGET, accuracyColor } from "@/lib/nclex";
import { logNclexSession, deleteNclexSession, setNclexExam } from "@/app/actions";
import { StatTile } from "@/components/bits";

export function NclexClient({ data }: { data: NclexData }) {
  const { exam, totals, streak, readiness, stats, weak, trend, recent } = data;
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<void>) => start(() => void fn());

  // Quick-log form state
  const [topic, setTopic] = useState(NCLEX_TOPICS[0].key);
  const [questions, setQuestions] = useState("25");
  const [correct, setCorrect] = useState("");
  const [minutes, setMinutes] = useState("30");

  const maxTrend = Math.max(10, ...trend.map((t) => t.questions));
  const goalPct = exam.dailyGoal > 0 ? Math.min(100, Math.round((totals.todayQuestions / exam.dailyGoal) * 100)) : 0;
  const weekQuestions = trend.slice(-7).reduce((s, d) => s + d.questions, 0);
  const remainingToday = Math.max(0, exam.dailyGoal - totals.todayQuestions);
  const urgency = exam.set
    ? exam.daysLeft <= 14 ? { c: "#fb7185", l: "Final stretch — go hard" }
      : exam.daysLeft <= 30 ? { c: "#fbbf24", l: "Ramp up the volume" }
      : { c: "#22d3ee", l: "Steady build" }
    : null;

  function submit() {
    const q = parseInt(questions || "0", 10);
    if (!q) return;
    const c = correct === "" ? 0 : parseInt(correct, 10);
    const m = parseInt(minutes || "0", 10);
    run(async () => {
      await logNclexSession(topic, q, c, m);
      setCorrect("");
    });
  }

  return (
    <div className="space-y-4">
      {/* ── Exam countdown hero ── */}
      <div className="card relative overflow-hidden" style={{ background: "linear-gradient(160deg, rgba(34,211,238,0.14), rgba(13,19,34,0.6))" }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="label">{exam.name} · Exam Countdown</p>
            {exam.set ? (
              <>
                <p className="mt-1 text-5xl font-extrabold tabular-nums glow-text" style={{ color: urgency?.c ?? "#fff" }}>{exam.daysLeft}<span className="ml-2 text-base font-semibold text-slate-400">days</span></p>
                <p className="text-xs text-slate-400">{exam.examDateLabel} · {exam.weeksLeft} weeks out</p>
                {urgency && <p className="mt-0.5 text-[11px] font-bold" style={{ color: urgency.c }}>{urgency.l}</p>}
              </>
            ) : (
              <p className="mt-1 text-sm text-slate-300">Set your exam date to start the countdown.</p>
            )}
          </div>
          <div className="text-right">
            <p className="label">Readiness</p>
            <p className="mt-1 text-lg font-bold" style={{ color: readiness.color }}>{readiness.label}</p>
          </div>
        </div>
        {exam.set && (
          <p className="mt-2 rounded-lg bg-bg/50 px-3 py-2 text-xs text-slate-300">
            At your current pace of <b className="text-white">{exam.pacePerDay}/day</b>, you&apos;ll reach <b className="text-white tabular-nums">{exam.projectedQuestions.toLocaleString()}</b> total questions by exam day.
          </p>
        )}
        <ExamDateEditor exam={exam} disabled={pending} onSave={(iso, name) => run(() => setNclexExam(iso, name))} />
      </div>

      {/* ── Headline stats ── */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="Questions done" value={totals.totalQuestions.toLocaleString()} sub={`${totals.sessionCount} sessions`} accent="#22d3ee" />
        <StatTile label="Overall accuracy" value={`${totals.overallAccuracy}%`} sub={`target ${ACCURACY_TARGET}%+`} color={accuracyColor(totals.overallAccuracy)} accent={accuracyColor(totals.overallAccuracy)} />
        <StatTile label="Study streak" value={`${streak}🔥`} sub={streak === 0 ? "log a session" : "days in a row"} accent="#fbbf24" />
        <StatTile label="Today" value={`${totals.todayQuestions}/${exam.dailyGoal}`} sub={`${goalPct}% of goal`} color={goalPct >= 100 ? "#34f5c5" : "#e8edf6"} accent="#a3e635" />
      </div>
      <p className="px-1 text-xs text-slate-400">{readiness.note}</p>

      {/* ── Today's NCLEX Mission ── */}
      <div className="card" style={{ background: "linear-gradient(160deg, rgba(34,211,238,0.12), rgba(13,19,34,0.6))" }}>
        <div className="flex items-center justify-between">
          <p className="label text-neon-cyan">🎯 Today&apos;s NCLEX Mission</p>
          <span className="text-sm font-black text-neon-cyan tabular-nums">{totals.todayQuestions}/{exam.dailyGoal}</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg">
          <motion.div className="h-full rounded-full bg-neon-cyan" initial={{ width: 0 }} animate={{ width: `${goalPct}%` }} transition={{ duration: 0.7 }} style={{ boxShadow: "0 0 10px rgba(34,211,238,0.6)" }} />
        </div>
        <p className="mt-2 text-sm font-semibold text-white">
          {remainingToday > 0 ? `${remainingToday} more questions to hit today's goal.` : "Daily goal complete — great work. 🎉"}
        </p>
        <div className="mt-1 flex flex-wrap gap-x-4 text-[11px] text-slate-400">
          <span>This week: <span className="font-bold text-white tabular-nums">{weekQuestions}</span> questions</span>
          <span>Streak: <span className="font-bold text-neon-amber tabular-nums">{streak}🔥</span></span>
          {weak.length > 0 && <span>Focus weakest: <span className="font-bold text-neon-red">{weak[0].short}</span></span>}
        </div>
      </div>

      {/* ── Quick log ── */}
      <div className="card">
        <p className="label">Log a study session</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <select className="input col-span-2" value={topic} onChange={(e) => setTopic(e.target.value)}>
            {NCLEX_TOPICS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </select>
          <label className="text-xs text-slate-400">Questions<input className="input mt-1" inputMode="numeric" value={questions} onChange={(e) => setQuestions(e.target.value)} /></label>
          <label className="text-xs text-slate-400">Correct<input className="input mt-1" inputMode="numeric" placeholder="optional" value={correct} onChange={(e) => setCorrect(e.target.value)} /></label>
          <label className="text-xs text-slate-400">Minutes<input className="input mt-1" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} /></label>
          <div className="flex items-end">
            <button className="btn-neon w-full" disabled={pending} onClick={submit}>{pending ? "Saving…" : "Log session"}</button>
          </div>
        </div>
      </div>

      {/* ── Weak topics ── */}
      <div className="card">
        <div className="flex items-center justify-between">
          <p className="label">Weak topics</p>
          <span className="text-[11px] text-slate-500">below {ACCURACY_TARGET}% · ≥15 Qs</span>
        </div>
        {weak.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">No weak areas with enough data yet. Keep logging across topics to surface your gaps.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {weak.map((t) => (
              <div key={t.key} className="flex items-center gap-3">
                <span className="w-32 shrink-0 truncate text-xs text-slate-300" title={t.label}>{t.short}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-bg">
                  <div className="h-full rounded-full" style={{ width: `${t.accuracy}%`, background: t.color, boxShadow: `0 0 10px ${t.color}66` }} />
                </div>
                <span className="w-16 text-right text-xs font-bold tabular-nums" style={{ color: t.color }}>{t.accuracy}%</span>
                <span className="w-10 text-right text-[10px] text-slate-500 tabular-nums">{t.questions}Q</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Accuracy by topic (full coverage) ── */}
      <div className="card">
        <p className="label">Accuracy by category</p>
        <div className="mt-2 space-y-2">
          {stats.map((t) => (
            <div key={t.key} className="flex items-center gap-3">
              <span className="w-32 shrink-0 truncate text-xs text-slate-300" title={t.label}>{t.short}</span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-bg">
                <motion.div initial={{ width: 0 }} animate={{ width: `${t.hasData ? t.accuracy : 0}%` }} transition={{ duration: 0.6 }} className="h-full rounded-full" style={{ background: t.color, boxShadow: t.hasData ? `0 0 10px ${t.color}66` : "none" }} />
              </div>
              <span className="w-16 text-right text-xs font-bold tabular-nums" style={{ color: t.hasData ? t.color : "#475569" }}>{t.hasData ? `${t.accuracy}%` : "—"}</span>
              <span className="w-10 text-right text-[10px] text-slate-500 tabular-nums">{t.questions}Q</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 14-day question volume ── */}
      <div className="card">
        <p className="label">Last 14 days · questions/day</p>
        <div className="mt-3 flex h-24 items-end gap-1">
          {trend.map((d) => {
            const h = Math.max(2, Math.round((d.questions / maxTrend) * 100));
            const col = d.questions === 0 ? "#1e293b" : accuracyColor(d.accuracy);
            return (
              <div key={d.date} className="flex flex-1 flex-col items-center justify-end" title={`${d.date}: ${d.questions} Qs${d.questions ? ` · ${d.accuracy}%` : ""}`}>
                <div className="w-full rounded-t" style={{ height: `${h}%`, background: col }} />
              </div>
            );
          })}
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-slate-500"><span>14d ago</span><span>today</span></div>
      </div>

      {/* ── Recent sessions ── */}
      {recent.length > 0 && (
        <div className="card">
          <p className="label">Recent sessions</p>
          <div className="mt-2 space-y-1.5">
            {recent.map((s) => {
              const t = TOPIC_BY_KEY.get(s.topic);
              return (
                <div key={s.id} className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 py-2 text-xs">
                  <span className="w-14 shrink-0 text-slate-500 tabular-nums">{s.date.slice(5)}</span>
                  <span className="flex-1 truncate text-slate-300">{t?.short ?? s.topic}</span>
                  <span className="tabular-nums text-slate-400">{s.correct}/{s.questions}</span>
                  <span className="w-10 text-right font-bold tabular-nums" style={{ color: accuracyColor(s.accuracy) }}>{s.accuracy}%</span>
                  <button className="text-slate-600 hover:text-neon-red" disabled={pending} onClick={() => run(() => deleteNclexSession(s.id))} aria-label="delete">✕</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="px-1 pb-2 text-center text-[11px] text-slate-500">Categories &amp; weightings follow the NCSBN NCLEX-RN test plan. 65%+ is a common working benchmark, not a guarantee.</p>
    </div>
  );
}

function ExamDateEditor({ exam, onSave, disabled }: { exam: NclexData["exam"]; onSave: (iso: string | null, name: string) => void; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(exam.dateISO ? exam.dateISO.slice(0, 10) : "");
  const [name, setName] = useState(exam.name);
  if (!open) {
    return (
      <button className="mt-2 text-xs font-semibold text-neon-cyan hover:underline" onClick={() => setOpen(true)}>
        {exam.set ? "Edit exam date" : "+ Set exam date"}
      </button>
    );
  }
  return (
    <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-line bg-bg/40 p-3">
      <label className="text-xs text-slate-400">Exam<select className="input mt-1" value={name} onChange={(e) => setName(e.target.value)}><option>NCLEX-RN</option><option>NCLEX-PN</option><option>AHPRA / OSCE</option></select></label>
      <label className="text-xs text-slate-400">Date<input type="date" className="input mt-1" value={date} onChange={(e) => setDate(e.target.value)} /></label>
      <div className="col-span-2 flex gap-2">
        <button className="btn-neon flex-1" disabled={disabled} onClick={() => { onSave(date ? new Date(date).toISOString() : null, name); setOpen(false); }}>Save</button>
        <button className="rounded-xl border border-line px-4 text-xs text-slate-400" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </div>
  );
}
