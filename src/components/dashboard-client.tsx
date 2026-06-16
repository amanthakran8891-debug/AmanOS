"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import type { DashboardData } from "@/lib/data";
import type { Verse } from "@/lib/gita";
import type { Wisdom } from "@/lib/wisdom";
import { Ring, MiniRing } from "./ring";
import { Dragon } from "./dragon";
import { Hourglass } from "./hourglass";
import { GitaCard } from "./gita-card";
import { WisdomCard } from "./wisdom-card";
import { MissionCard } from "./mission-card";
import { QuickActions } from "./quick-actions";
import { FutureSelf } from "./future-self";
import { BodyMap } from "./body-map";
import { LifeScoreTrend, ProteinTrend, WeightTrend } from "./charts";
import {
  BODY_PARTS,
  EXERCISES,
  PART_COLORS,
  QUICK_FOODS,
  EXPENSE_CATEGORIES,
  TRIGGERS,
  CRAVING_TIMES,
  PLANNER_BLOCKS,
} from "@/lib/exercises";
import {
  addWater,
  addFood,
  removeFood,
  setField,
  toggleFlag,
  logGymSet,
  addExpense,
  relapse,
  markCleanToday,
  addCraving,
} from "@/app/actions";

const ACHIEVEMENTS: { key: string; label: string; icon: string }[] = [
  { key: "first-clean-day", label: "First Clean Day", icon: "🌱" },
  { key: "7-days-clean", label: "7 Days Clean", icon: "🔥" },
  { key: "30-days-clean", label: "30 Days Clean", icon: "💎" },
  { key: "100-days-clean", label: "100 Days Clean", icon: "👑" },
  { key: "protein-master", label: "Protein Master", icon: "🥩" },
  { key: "gym-warrior", label: "Gym Warrior", icon: "🏋️" },
  { key: "nclex-grinder", label: "NCLEX Grinder", icon: "📚" },
  { key: "bharatfare-builder", label: "BharatFare Builder", icon: "✈️" },
  { key: "life-commander", label: "Life Commander", icon: "⚡" },
];

export function DashboardClient({ data, verse, wisdom, dateLabel }: { data: DashboardData; verse: Verse; wisdom: Wisdom; dateLabel: string }) {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<void>) => start(() => void fn());

  const { today, score, dragon, settings, streakDays, history, foods, gymSets, partRecency, budget } = data;
  const zoneText = score.zone === "excellent" ? "Excellent" : score.zone === "improving" ? "Improving" : "Off Track";

  return (
    <div className={`mx-auto max-w-6xl px-4 pb-24 pt-6 ${pending ? "opacity-95" : ""}`}>
      {/* Top bar */}
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-neon-green to-neon-violet text-sm font-black text-bg">A</span>
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight text-white">AmanOS</p>
            <p className="text-[10px] text-slate-500">CEO of your life</p>
          </div>
        </div>
        <span className="chip" style={{ color: score.color, borderColor: `${score.color}55` }}>● {zoneText}</span>
      </header>

      {/* Daily Wisdom (rotating header) */}
      <WisdomCard wisdom={wisdom} dateLabel={dateLabel} />

      {/* Hero: Life Score + Dragon */}
      <section className="mt-4 grid gap-4 lg:grid-cols-5">
        <div className="card lg:col-span-2" style={{ background: "linear-gradient(160deg, rgba(52,245,197,0.07), rgba(13,19,34,0.55) 65%)" }}>
          <div className="flex items-center gap-5">
            <Ring
              value={score.total}
              max={100}
              size={150}
              stroke={14}
              color={score.color}
              center={
                <>
                  <span className="text-4xl font-extrabold tabular-nums text-white">{score.total}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Life Score</span>
                </>
              }
            />
            <div className="flex-1 space-y-1.5">
              {score.parts.map((p) => (
                <div key={p.label}>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-300">{p.label}</span>
                    <span className="tabular-nums text-slate-400">
                      {p.earned}/{p.max}
                    </span>
                  </div>
                  <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-bg">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: score.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(p.earned / p.max) * 100}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-3">
          <Dragon dragon={dragon} />
        </div>
      </section>

      {/* Hourglass + Joint Recovery */}
      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <Hourglass lastJointAt={settings.lastJointAt} />
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="label">Joint Recovery</p>
              <p className="mt-1 text-3xl font-extrabold tabular-nums text-neon-green glow-text">{streakDays}<span className="ml-1 text-base font-semibold text-slate-400">day streak</span></p>
              <p className="text-xs text-slate-400">Longest: {Math.max(settings.longestStreakDays, streakDays)} days</p>
            </div>
            <div className="text-right">
              <p className="label">Today</p>
              <p className={`text-lg font-bold ${today.jointClean ? "text-neon-green" : "text-neon-red"}`}>{today.jointClean ? "Clean ✓" : "Relapsed"}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {!today.jointClean && (
              <button className="btn-neon" disabled={pending} onClick={() => run(() => markCleanToday())}>
                Mark clean today
              </button>
            )}
            <RelapseButton pending={pending} onRelapse={(trigger, note) => run(() => relapse(trigger, note))} />
            <CravingButton pending={pending} onLog={(c, t, i) => run(() => addCraving(c, t, i))} />
          </div>
        </div>
      </section>

      {/* Today's Mission */}
      <section className="mt-4">
        <MissionCard data={data} />
      </section>

      {/* Quick Actions — phone mode */}
      <section className="mt-4">
        <QuickActions data={data} />
      </section>

      {/* Future Self */}
      <section className="mt-4">
        <FutureSelf data={data} />
      </section>

      {/* Bhagavad Gita */}
      <section className="mt-4">
        <GitaCard verse={verse} />
      </section>

      <footer className="mt-8 text-center text-xs text-slate-600">AmanOS · Life Command Center — built to make every day count.</footer>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StepperCard({ title, value, max, color, suffix, step, pending, onSet }: { title: string; value: number; max: number; color: string; suffix: string; step: number; pending: boolean; onSet: (v: number) => void }) {
  const display = suffix === "" ? value.toLocaleString() : `${value}${suffix}`;
  return (
    <div className="card-tight">
      <MiniRing value={value} max={max} color={color} title={title} display={display} />
      <div className="mt-2 flex items-center justify-center gap-2">
        <button className="btn-ghost h-8 w-8 !p-0" disabled={pending || value <= 0} onClick={() => onSet(Math.max(0, +(value - step).toFixed(1)))}>−</button>
        <button className="btn-ghost h-8 w-8 !p-0" disabled={pending} onClick={() => onSet(+(value + step).toFixed(1))}>+</button>
      </div>
    </div>
  );
}

function FlagCard({ title, done, color, pending, onToggle }: { title: string; done: boolean; color: string; pending: boolean; onToggle: () => void }) {
  return (
    <button className="card-tight flex flex-col items-center justify-center gap-2 transition" style={done ? { borderColor: `${color}66`, background: `${color}12` } : undefined} disabled={pending} onClick={onToggle}>
      <div className="flex h-[92px] w-[92px] items-center justify-center rounded-full border-[9px]" style={{ borderColor: done ? color : "#16203a", color }}>
        <span className="text-2xl">{done ? "✓" : "○"}</span>
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</span>
    </button>
  );
}

function RelapseButton({ pending, onRelapse }: { pending: boolean; onRelapse: (t: string, n: string) => void }) {
  const [open, setOpen] = useState(false);
  const [trigger, setTrigger] = useState<string>(TRIGGERS[0]);
  if (!open) return <button className="btn-danger" onClick={() => setOpen(true)}>Log relapse</button>;
  return (
    <div className="flex w-full flex-wrap items-center gap-2 rounded-xl border border-neon-red/30 bg-neon-red/5 p-2">
      <select className="input max-w-[150px]" value={trigger} onChange={(e) => setTrigger(e.target.value)}>
        {TRIGGERS.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <button className="btn-danger" disabled={pending} onClick={() => { onRelapse(trigger, ""); setOpen(false); }}>Confirm reset</button>
      <button className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
    </div>
  );
}

function CravingButton({ pending, onLog }: { pending: boolean; onLog: (c: string, t: string, i: number) => void }) {
  const [open, setOpen] = useState(false);
  const [craving, setCraving] = useState<string>(CRAVING_TIMES[0]);
  const [trigger, setTrigger] = useState<string>(TRIGGERS[0]);
  const [intensity, setIntensity] = useState(5);
  if (!open) return <button className="btn-ghost" onClick={() => setOpen(true)}>Log craving</button>;
  return (
    <div className="flex w-full flex-wrap items-center gap-2 rounded-xl border border-line bg-surface-2 p-2">
      <select className="input max-w-[120px]" value={craving} onChange={(e) => setCraving(e.target.value)}>{CRAVING_TIMES.map((c) => <option key={c}>{c}</option>)}</select>
      <select className="input max-w-[120px]" value={trigger} onChange={(e) => setTrigger(e.target.value)}>{TRIGGERS.map((t) => <option key={t}>{t}</option>)}</select>
      <input type="range" min={1} max={10} value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} className="accent-neon-violet" />
      <span className="text-xs text-slate-300">{intensity}/10</span>
      <button className="btn-neon" disabled={pending} onClick={() => { onLog(craving, trigger, intensity); setOpen(false); }}>Save · resisted</button>
    </div>
  );
}

function BudgetCard({ budget, pending, onAdd }: { budget: DashboardData["budget"]; pending: boolean; onAdd: (c: string, a: number, n: string) => void }) {
  const [cat, setCat] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [amt, setAmt] = useState("");
  const [note, setNote] = useState("");
  const remaining = budget.dailyBudget - budget.todaySpent;
  return (
    <div className="card">
      <p className="label">Daily Budget</p>
      <div className="mt-1 flex items-end justify-between">
        <p className={`text-2xl font-bold tabular-nums ${remaining < 0 ? "text-neon-red" : "text-white"}`}>{remaining.toLocaleString()}<span className="ml-1 text-xs text-slate-400">left / {budget.dailyBudget}</span></p>
        <p className="text-xs text-slate-400">Month: {budget.monthSpent.toLocaleString()}</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, (budget.todaySpent / Math.max(1, budget.dailyBudget)) * 100)}%`, background: remaining < 0 ? "#fb7185" : "#34f5c5" }} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select className="input max-w-[130px]" value={cat} onChange={(e) => setCat(e.target.value)}>{EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
        <input className="input max-w-[90px]" placeholder="amount" inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value)} />
        <input className="input max-w-[120px]" placeholder="note" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="btn-neon" disabled={pending || !amt} onClick={() => { const a = Number(amt); if (a > 0) { onAdd(cat, a, note); setAmt(""); setNote(""); } }}>Add</button>
      </div>
    </div>
  );
}

function WeightCard({ current, goal, pending, onSet }: { current: number | null; goal: number | null; pending: boolean; onSet: (v: number) => void }) {
  const [val, setVal] = useState(current ? String(current) : "");
  return (
    <div className="card">
      <p className="label">Weight</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-white">{current ?? "—"}<span className="ml-1 text-xs text-slate-400">kg{goal ? ` · goal ${goal}` : ""}</span></p>
      <div className="mt-3 flex gap-2">
        <input className="input max-w-[110px]" placeholder="kg" inputMode="decimal" value={val} onChange={(e) => setVal(e.target.value)} />
        <button className="btn-neon" disabled={pending || !val} onClick={() => { const v = Number(val); if (v > 0) onSet(v); }}>Log</button>
      </div>
    </div>
  );
}

function GymCard({ gymSets, pending, onLog }: { gymSets: DashboardData["gymSets"]; pending: boolean; onLog: (bp: string, ex: string, s: number, r: number, w: number) => void }) {
  const [bp, setBp] = useState<string>(BODY_PARTS[0]);
  const [ex, setEx] = useState<string>(EXERCISES[BODY_PARTS[0]][0]);
  const [sets, setSets] = useState("3");
  const [reps, setReps] = useState("10");
  const [w, setW] = useState("");
  return (
    <div className="card">
      <p className="label">Gym · log a set</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <select className="input" value={bp} onChange={(e) => { setBp(e.target.value); setEx(EXERCISES[e.target.value as keyof typeof EXERCISES][0]); }}>
          {BODY_PARTS.map((p) => <option key={p} style={{ color: PART_COLORS[p] }}>{p}</option>)}
        </select>
        <select className="input" value={ex} onChange={(e) => setEx(e.target.value)}>
          {EXERCISES[bp as keyof typeof EXERCISES].map((e) => <option key={e}>{e}</option>)}
        </select>
        <input className="input" placeholder="sets" inputMode="numeric" value={sets} onChange={(e) => setSets(e.target.value)} />
        <input className="input" placeholder="reps" inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} />
        <input className="input col-span-2" placeholder="weight kg (optional)" inputMode="decimal" value={w} onChange={(e) => setW(e.target.value)} />
      </div>
      <button className="btn-neon mt-2 w-full" disabled={pending} onClick={() => onLog(bp, ex, Number(sets) || 0, Number(reps) || 0, Number(w) || 0)}>Log set</button>
      {gymSets.length > 0 && (
        <div className="mt-2 max-h-24 space-y-1 overflow-auto text-xs text-slate-300">
          {gymSets.slice(0, 5).map((g) => (
            <div key={g.id} className="flex justify-between">
              <span style={{ color: PART_COLORS[g.bodyPart as keyof typeof PART_COLORS] }}>{g.exercise}</span>
              <span className="text-slate-400">{g.sets}×{g.reps}{g.weightKg ? ` @${g.weightKg}kg` : ""}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Planner() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const total = PLANNER_BLOCKS.length;
  const completed = Object.values(done).filter(Boolean).length;
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <p className="label">Daily Planner</p>
        <span className="chip text-neon-green">{Math.round((completed / total) * 100)}% done</span>
      </div>
      <div className="mt-3 space-y-1.5">
        {PLANNER_BLOCKS.map((b) => (
          <button key={b.key} onClick={() => setDone((d) => ({ ...d, [b.key]: !d[b.key] }))} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${done[b.key] ? "border-neon-green/40 bg-neon-green/10" : "border-line bg-surface-2"}`}>
            <span className={`flex h-5 w-5 items-center justify-center rounded-md border text-[11px] ${done[b.key] ? "border-neon-green bg-neon-green text-bg" : "border-line text-transparent"}`}>✓</span>
            <span className="w-24 font-mono text-xs text-slate-400">{b.time}</span>
            <span className={`text-sm font-medium ${done[b.key] ? "text-slate-400 line-through" : "text-white"}`}>{b.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
