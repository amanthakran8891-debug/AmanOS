"use client";

import { useState, useTransition } from "react";
import type { DashboardData } from "@/lib/data";
import { MiniRing } from "./ring";
import { EntriesCard } from "./entries-card";
import { BodyMap } from "./body-map";
import { QUICK_FOODS, EXPENSE_CATEGORIES } from "@/lib/exercises";
import { addWater, addFood, setField, addExpense } from "@/app/actions";

const ACHIEVEMENTS = [
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

export function EntriesClient({ data }: { data: DashboardData }) {
  const { today, settings, budget, partRecency } = data;
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<void>) => start(() => void fn());

  return (
    <div className="space-y-4">
      {/* Protein + Water */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card-tight">
          <MiniRing value={today.proteinG} max={settings.proteinTarget} color="#a78bfa" title="Protein" display={`${today.proteinG}g`} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {QUICK_FOODS.slice(0, 4).map((f) => (
              <button key={f.name} className="chip hover:border-neon-violet/60" disabled={pending} onClick={() => run(() => addFood(f.name, f.proteinG, f.calories))}>+{f.proteinG}g</button>
            ))}
          </div>
        </div>
        <div className="card-tight">
          <MiniRing value={today.waterMl} max={settings.waterTarget} color="#22d3ee" title="Water" display={`${(today.waterMl / 1000).toFixed(1)}L`} />
          <div className="mt-2 flex gap-1.5">
            <button className="chip" disabled={pending} onClick={() => run(() => addWater(250))}>+250ml</button>
            <button className="chip" disabled={pending} onClick={() => run(() => addWater(500))}>+500ml</button>
          </div>
        </div>
      </div>

      {/* Steppers + weight */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stepper title="Sleep" value={today.sleepHours} max={settings.sleepTarget} suffix="h" step={0.5} color="#34f5c5" pending={pending} onSet={(v) => run(() => setField("sleepHours", v))} />
        <Stepper title="Steps" value={today.steps} max={settings.stepsTarget} suffix="" step={1000} color="#60a5fa" pending={pending} onSet={(v) => run(() => setField("steps", v))} />
        <Stepper title="NCLEX h" value={today.nclexHours} max={settings.nclexHoursTarget} suffix="h" step={0.5} color="#fbbf24" pending={pending} onSet={(v) => run(() => setField("nclexHours", v))} />
        <WeightBox current={today.weightKg} goal={settings.weightGoal} pending={pending} onSet={(v) => run(() => setField("weightKg", v))} />
      </div>

      {/* Budget add */}
      <BudgetBox budget={budget} pending={pending} onAdd={(c, a, n) => run(() => addExpense(c, a, n))} />

      {/* Body map */}
      <BodyMap recency={partRecency} />

      {/* Full entry CRUD: food / expenses / cravings / relapses / notes */}
      <EntriesCard data={data} />

      {/* Achievements */}
      <div className="card">
        <p className="label">Achievements</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {ACHIEVEMENTS.map((a) => {
            const unlocked = data.achievements.includes(a.key);
            return (
              <div key={a.key} className={`rounded-xl border p-3 text-center transition ${unlocked ? "border-neon-green/40 bg-neon-green/10" : "border-line bg-surface-2 opacity-50"}`}>
                <div className={`text-2xl ${unlocked ? "" : "grayscale"}`}>{a.icon}</div>
                <p className="mt-1 text-[10px] font-semibold text-slate-200">{a.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stepper({ title, value, max, suffix, step, color, pending, onSet }: { title: string; value: number; max: number; suffix: string; step: number; color: string; pending: boolean; onSet: (v: number) => void }) {
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

function WeightBox({ current, goal, pending, onSet }: { current: number | null; goal: number | null; pending: boolean; onSet: (v: number) => void }) {
  const [val, setVal] = useState(current ? String(current) : "");
  return (
    <div className="card-tight flex flex-col justify-center">
      <p className="label">Weight</p>
      <p className="mt-1 text-lg font-bold text-white">{current ?? "—"}<span className="text-[10px] text-slate-400"> kg{goal ? ` · goal ${goal}` : ""}</span></p>
      <div className="mt-1 flex gap-1">
        <input className="input max-w-[70px]" placeholder="kg" inputMode="decimal" value={val} onChange={(e) => setVal(e.target.value)} />
        <button className="btn-neon !px-2" disabled={pending || !val} onClick={() => { const v = Number(val); if (v > 0) onSet(v); }}>Log</button>
      </div>
    </div>
  );
}

function BudgetBox({ budget, pending, onAdd }: { budget: DashboardData["budget"]; pending: boolean; onAdd: (c: string, a: number, n: string) => void }) {
  const [cat, setCat] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [amt, setAmt] = useState("");
  const [note, setNote] = useState("");
  const remaining = budget.dailyBudget - budget.todaySpent;
  return (
    <div className="card">
      <div className="flex items-end justify-between">
        <div><p className="label">Daily Budget</p><p className={`text-2xl font-bold tabular-nums ${remaining < 0 ? "text-neon-red" : "text-white"}`}>{remaining.toLocaleString()}<span className="ml-1 text-xs text-slate-400">left / {budget.dailyBudget}</span></p></div>
        <p className="text-xs text-slate-400">Month: {budget.monthSpent.toLocaleString()}</p>
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
