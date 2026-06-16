"use client";

import { useState, useTransition } from "react";
import { updateSettings, resetStreakAnchor } from "@/app/actions";
import { logout } from "@/app/login/actions";

type S = {
  proteinTarget: number;
  waterTarget: number;
  sleepTarget: number;
  stepsTarget: number;
  caloriesTarget: number;
  nclexHoursTarget: number;
  dailyBudget: number;
  gymDaysTarget: number;
  noJointGoalDays: number;
  weightGoal: number;
  lastJointAt: string | null;
};

const FIELDS: { key: keyof S; label: string; unit: string; step?: number }[] = [
  { key: "proteinTarget", label: "Protein target", unit: "g" },
  { key: "waterTarget", label: "Water target", unit: "ml", step: 250 },
  { key: "sleepTarget", label: "Sleep target", unit: "h", step: 0.5 },
  { key: "dailyBudget", label: "Daily budget", unit: "" },
  { key: "gymDaysTarget", label: "Gym days / week", unit: "days" },
  { key: "nclexHoursTarget", label: "NCLEX hours / day", unit: "h", step: 0.5 },
  { key: "noJointGoalDays", label: "No-joint goal", unit: "days" },
  { key: "stepsTarget", label: "Steps target", unit: "", step: 500 },
  { key: "caloriesTarget", label: "Calories target", unit: "kcal", step: 50 },
  { key: "weightGoal", label: "Weight goal", unit: "kg", step: 0.5 },
];

export function SettingsClient({ initial }: { initial: S }) {
  const [v, setV] = useState<S>(initial);
  const [anchor, setAnchor] = useState<string>(initial.lastJointAt ? initial.lastJointAt.slice(0, 16) : "");
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  const set = (k: keyof S, val: number) => { setV((p) => ({ ...p, [k]: val })); setSaved(false); };

  const save = () =>
    start(async () => {
      const { lastJointAt, ...nums } = v; // eslint-disable-line @typescript-eslint/no-unused-vars
      await updateSettings(nums as unknown as Record<string, number>);
      setSaved(true);
    });

  return (
    <div className="space-y-4">
      <div className="card grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="text-xs font-semibold text-slate-300">{f.label}{f.unit ? ` (${f.unit})` : ""}</span>
            <input
              type="number"
              step={f.step ?? 1}
              className="input mt-1"
              value={v[f.key] as number}
              onChange={(e) => set(f.key, Number(e.target.value))}
            />
          </label>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button className="btn-neon" disabled={pending} onClick={save}>{pending ? "Saving…" : "Save targets"}</button>
        {saved && <span className="text-xs text-neon-green">Saved ✓ — Life Score recalculated.</span>}
      </div>

      <div className="card">
        <p className="label text-neon-red">Clean streak anchor</p>
        <p className="mt-1 text-xs text-slate-400">Set the exact date/time of your last joint. This drives the Hourglass and your streak.</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input type="datetime-local" className="input max-w-[220px]" value={anchor} onChange={(e) => setAnchor(e.target.value)} />
          <button
            className="btn-ghost"
            disabled={pending || !anchor}
            onClick={() => start(async () => { await resetStreakAnchor(new Date(anchor)); })}
          >
            Update anchor
          </button>
        </div>
      </div>
    </div>
  );
}
