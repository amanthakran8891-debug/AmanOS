"use client";

import { useMemo, useState, useTransition } from "react";
import { motion } from "framer-motion";
import { MODES, GYM_BODY_PARTS, WORKOUTS, type Mode, type GymBodyPart, type Exercise } from "@/lib/workouts";
import { logGymSet, removeGymSet, updateGymSet } from "@/app/actions";

type TodaySet = { id: string; bodyPart: string; exercise: string; sets: number; reps: number; weightKg: number };

const repNum = (reps: string) => {
  const m = reps.match(/\d+/);
  return m ? Number(m[0]) : 0;
};

export function GymClient({
  suggestion,
  coaching,
  todaySets,
}: {
  suggestion: { bodyPart: GymBodyPart; reason: string; recovery: boolean };
  coaching: string;
  recency: Record<string, number | null>;
  todaySets: TodaySet[];
}) {
  const [mode, setMode] = useState<Mode>("Gym");
  const [bodyPart, setBodyPart] = useState<GymBodyPart>(suggestion.bodyPart);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<void>) => start(() => void fn());

  const planned: Exercise[] = WORKOUTS[bodyPart]?.[mode] ?? [];
  const doneNames = useMemo(() => new Set(todaySets.map((s) => s.exercise)), [todaySets]);
  const completed = planned.filter((e) => doneNames.has(e.name)).length;
  const pct = planned.length ? Math.round((completed / planned.length) * 100) : 0;

  const totalSets = todaySets.reduce((a, s) => a + s.sets, 0);
  const totalReps = todaySets.reduce((a, s) => a + s.sets * s.reps, 0);
  const volume = todaySets.reduce((a, s) => a + s.sets * s.reps * s.weightKg, 0);

  return (
    <div className="space-y-4">
      {/* Suggested workout */}
      <div className="card" style={{ background: "linear-gradient(160deg, rgba(251,113,133,0.10), rgba(13,19,34,0.55) 65%)" }}>
        <p className="label text-neon-red">Today&rsquo;s suggested workout</p>
        <p className="mt-1 text-xl font-extrabold text-white">
          {suggestion.recovery ? "Recovery / Cardio day" : `Train ${suggestion.bodyPart}`}
        </p>
        <p className="mt-1 text-sm text-slate-300">{suggestion.reason}</p>
        <p className="mt-2 text-sm font-semibold text-neon-green glow-text">“{coaching}”</p>
        {!suggestion.recovery && (
          <button className="btn-neon mt-3" onClick={() => setBodyPart(suggestion.bodyPart)}>Start {suggestion.bodyPart} →</button>
        )}
      </div>

      {/* Mode + body part selectors */}
      <div className="card-tight">
        <p className="label">Workout mode</p>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {MODES.map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${mode === m ? "border-neon-red/50 bg-neon-red/15 text-neon-red" : "border-line bg-surface-2 text-slate-300"}`}>{m}</button>
          ))}
        </div>
        <p className="label mt-3">Body part</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {GYM_BODY_PARTS.map((p) => (
            <button key={p} onClick={() => setBodyPart(p)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${bodyPart === p ? "border-neon-cyan/50 bg-neon-cyan/15 text-neon-cyan" : "border-line bg-surface-2 text-slate-300"}`}>{p}</button>
          ))}
        </div>
      </div>

      {/* Completion + totals */}
      <div className="grid grid-cols-4 gap-2">
        <div className="card-tight text-center"><p className="label">Done</p><p className="stat-value text-neon-green">{pct}%</p></div>
        <div className="card-tight text-center"><p className="label">Sets</p><p className="stat-value">{totalSets}</p></div>
        <div className="card-tight text-center"><p className="label">Reps</p><p className="stat-value">{totalReps}</p></div>
        <div className="card-tight text-center"><p className="label">Volume</p><p className="stat-value">{volume >= 1000 ? `${(volume / 1000).toFixed(1)}t` : `${volume}`}</p><p className="text-[9px] text-slate-500">kg</p></div>
      </div>

      {/* Planned exercises */}
      <div>
        <p className="label mb-2">{bodyPart} · {mode} {planned.length === 0 && <span className="text-slate-500">— no plan for this combo yet, pick another mode</span>}</p>
        <div className="space-y-2">
          {planned.map((e) => (
            <ExerciseCard key={e.name} ex={e} done={doneNames.has(e.name)} pending={pending} onLog={(w) => run(() => logGymSet(bodyPart, e.name, e.sets, repNum(e.reps), w))} />
          ))}
        </div>
      </div>

      {/* Today's logged sets — edit/delete */}
      {todaySets.length > 0 && (
        <div className="card">
          <p className="label">Logged today ({todaySets.length})</p>
          <div className="mt-2 space-y-2">
            {todaySets.map((s) => (
              <LoggedRow key={s.id} s={s} pending={pending}
                onUpdate={(sets, reps, w) => run(() => updateGymSet(s.id, sets, reps, w))}
                onDelete={() => run(() => removeGymSet(s.id))} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ExerciseCard({ ex, done, pending, onLog }: { ex: Exercise; done: boolean; pending: boolean; onLog: (weight: number) => void }) {
  const [open, setOpen] = useState(false);
  const [w, setW] = useState("");
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`rounded-2xl border p-3 ${done ? "border-neon-green/40 bg-neon-green/5" : "border-line bg-surface"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-white">{done && "✓ "}{ex.name}</p>
          <p className="text-xs text-slate-400">{ex.sets} × {ex.reps} · {ex.equipment} · <span className="text-slate-500">{ex.difficulty}</span></p>
        </div>
        <button className="btn-neon shrink-0" disabled={pending} onClick={() => onLog(Number(w) || 0)}>+ Log</button>
      </div>
      <p className="mt-1.5 text-xs font-medium text-neon-green/90">{ex.motivation}</p>
      <button onClick={() => setOpen((o) => !o)} className="mt-1 text-[11px] font-semibold text-slate-400 underline">{open ? "Hide tips" : "Form & progression tips"}</button>
      {open && (
        <div className="mt-1 space-y-1 text-xs text-slate-300">
          <p><span className="font-semibold text-slate-400">Form:</span> {ex.formTip}</p>
          <p><span className="font-semibold text-slate-400">Progress:</span> {ex.progressionTip}</p>
          <input className="input mt-1 max-w-[140px]" placeholder="weight kg (optional)" inputMode="decimal" value={w} onChange={(e) => setW(e.target.value)} />
        </div>
      )}
    </motion.div>
  );
}

function LoggedRow({ s, pending, onUpdate, onDelete }: { s: TodaySet; pending: boolean; onUpdate: (sets: number, reps: number, w: number) => void; onDelete: () => void }) {
  const [edit, setEdit] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [sets, setSets] = useState(String(s.sets));
  const [reps, setReps] = useState(String(s.reps));
  const [w, setW] = useState(String(s.weightKg));

  if (edit) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-neon-cyan/40 bg-surface-2 p-2">
        <span className="text-xs font-semibold text-white">{s.exercise}</span>
        <input className="input max-w-[60px]" inputMode="numeric" value={sets} onChange={(e) => setSets(e.target.value)} placeholder="sets" />
        <input className="input max-w-[60px]" inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} placeholder="reps" />
        <input className="input max-w-[70px]" inputMode="decimal" value={w} onChange={(e) => setW(e.target.value)} placeholder="kg" />
        <button className="btn-neon" disabled={pending} onClick={() => { onUpdate(Number(sets) || 0, Number(reps) || 0, Number(w) || 0); setEdit(false); }}>Save</button>
        <button className="btn-ghost" onClick={() => setEdit(false)}>Cancel</button>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-line bg-surface-2 px-3 py-2">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">{s.exercise}</p>
        <p className="text-xs text-slate-400">{s.bodyPart} · {s.sets}×{s.reps}{s.weightKg ? ` @ ${s.weightKg}kg` : ""}</p>
      </div>
      {confirm ? (
        <div className="flex shrink-0 gap-1">
          <button className="btn-danger !py-1 !text-xs" disabled={pending} onClick={onDelete}>Delete</button>
          <button className="btn-ghost !py-1 !text-xs" onClick={() => setConfirm(false)}>No</button>
        </div>
      ) : (
        <div className="flex shrink-0 gap-1">
          <button className="btn-ghost !px-2 !py-1 !text-xs" onClick={() => setEdit(true)}>Edit</button>
          <button className="btn-ghost !px-2 !py-1 !text-xs text-neon-red" onClick={() => setConfirm(true)}>Delete</button>
        </div>
      )}
    </div>
  );
}
