"use client";

import { useState, useTransition } from "react";
import type { DashboardData } from "@/lib/data";
import { removeFood, updateFood, removeExpense, removeJointEvent, setNote } from "@/app/actions";

export function EntriesCard({ data }: { data: DashboardData }) {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<void>) => start(() => void fn());

  const todayExpenses = data.budget.monthExpenses.filter((e) => e.date === data.date);
  const events = data.jointEvents.slice(0, 6);

  return (
    <div className="card">
      <p className="label">Entries &amp; Notes <span className="text-slate-500">· edit / delete to fix mistakes</span></p>

      {/* Foods */}
      <Section title={`Food (${data.foods.length})`}>
        {data.foods.length === 0 && <Empty>No food logged yet.</Empty>}
        {data.foods.map((f) => (
          <FoodRow key={f.id} f={f} pending={pending}
            onSave={(name, p, c) => run(() => updateFood(f.id, name, p, c))}
            onDelete={() => run(() => removeFood(f.id))} />
        ))}
      </Section>

      {/* Expenses */}
      <Section title={`Expenses today (${todayExpenses.length})`}>
        {todayExpenses.length === 0 && <Empty>No expenses today.</Empty>}
        {todayExpenses.map((e) => (
          <DeletableRow key={e.id} pending={pending} onDelete={() => run(() => removeExpense(e.id))}
            left={<span className="text-sm text-white">{e.category}{e.note ? ` · ${e.note}` : ""}</span>}
            right={<span className="text-sm font-bold tabular-nums text-white">{e.amount.toLocaleString()}</span>} />
        ))}
      </Section>

      {/* Cravings & relapses */}
      <Section title={`Cravings & relapses (${events.length})`}>
        {events.length === 0 && <Empty>None logged.</Empty>}
        {events.map((j) => (
          <DeletableRow key={j.id} pending={pending} onDelete={() => run(() => removeJointEvent(j.id))}
            left={<span className={`text-sm ${j.type === "relapse" ? "text-neon-red" : "text-slate-200"}`}>{j.type === "relapse" ? "Relapse" : "Craving"}{j.craving ? ` · ${j.craving}` : ""}{j.trigger ? ` · ${j.trigger}` : ""}{j.intensity ? ` · ${j.intensity}/10` : ""}</span>}
            right={<span className="text-[10px] text-slate-500">{new Date(j.at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>} />
        ))}
      </Section>

      {/* Daily note */}
      <div className="mt-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Daily note</p>
        <NoteEditor initial={data.today.notes} pending={pending} onSave={(t) => run(() => setNote(t))} />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</p>
      <div className="mt-1 space-y-1.5">{children}</div>
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-slate-500">{children}</p>;
}

function DeletableRow({ left, right, pending, onDelete }: { left: React.ReactNode; right: React.ReactNode; pending: boolean; onDelete: () => void }) {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2">
      <div className="min-w-0 flex-1">{left}</div>
      {right}
      {confirm ? (
        <span className="flex shrink-0 gap-1">
          <button className="btn-danger !px-2 !py-1 !text-xs" disabled={pending} onClick={onDelete}>Delete</button>
          <button className="btn-ghost !px-2 !py-1 !text-xs" onClick={() => setConfirm(false)}>No</button>
        </span>
      ) : (
        <button className="shrink-0 text-xs text-neon-red/80 hover:text-neon-red" onClick={() => setConfirm(true)}>✕</button>
      )}
    </div>
  );
}

function FoodRow({ f, pending, onSave, onDelete }: { f: { id: string; name: string; proteinG: number; calories: number }; pending: boolean; onSave: (name: string, p: number, c: number) => void; onDelete: () => void }) {
  const [edit, setEdit] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [name, setName] = useState(f.name);
  const [p, setP] = useState(String(f.proteinG));
  const [c, setC] = useState(String(f.calories));
  if (edit) {
    return (
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-neon-violet/40 bg-surface-2 p-2">
        <input className="input max-w-[140px]" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input max-w-[60px]" inputMode="numeric" value={p} onChange={(e) => setP(e.target.value)} placeholder="g" />
        <input className="input max-w-[70px]" inputMode="numeric" value={c} onChange={(e) => setC(e.target.value)} placeholder="kcal" />
        <button className="btn-neon" disabled={pending} onClick={() => { onSave(name, Number(p) || 0, Number(c) || 0); setEdit(false); }}>Save</button>
        <button className="btn-ghost" onClick={() => setEdit(false)}>Cancel</button>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2">
      <span className="min-w-0 flex-1 truncate text-sm text-white">{f.name}</span>
      <span className="text-xs text-slate-400">{f.proteinG}g · {f.calories}kcal</span>
      {confirm ? (
        <span className="flex shrink-0 gap-1">
          <button className="btn-danger !px-2 !py-1 !text-xs" disabled={pending} onClick={onDelete}>Delete</button>
          <button className="btn-ghost !px-2 !py-1 !text-xs" onClick={() => setConfirm(false)}>No</button>
        </span>
      ) : (
        <span className="flex shrink-0 gap-1">
          <button className="btn-ghost !px-2 !py-1 !text-xs" onClick={() => setEdit(true)}>Edit</button>
          <button className="text-xs text-neon-red/80 hover:text-neon-red" onClick={() => setConfirm(true)}>✕</button>
        </span>
      )}
    </div>
  );
}

function NoteEditor({ initial, pending, onSave }: { initial: string; pending: boolean; onSave: (t: string) => void }) {
  const [t, setT] = useState(initial);
  const [saved, setSaved] = useState(false);
  return (
    <div className="mt-1">
      <textarea className="input h-20 resize-none" value={t} onChange={(e) => { setT(e.target.value); setSaved(false); }} placeholder="How did today go? Wins, struggles, lessons…" />
      <div className="mt-1 flex items-center gap-2">
        <button className="btn-neon !py-1 !text-xs" disabled={pending} onClick={() => { onSave(t); setSaved(true); }}>Save note</button>
        {saved && <span className="text-xs text-neon-green">Saved ✓</span>}
      </div>
    </div>
  );
}
