"use client";

import { useTransition } from "react";
import { motion } from "framer-motion";
import type { DashboardData } from "@/lib/data";
import { Ring } from "./ring";
import { CheckinCard } from "./checkin-card";
import { OneThingCard } from "./one-thing";
import type { OneThing } from "@/lib/one-thing";
import { addWater, addFood, setField, toggleFlag, relapse, markCleanToday } from "@/app/actions";

export function TodayClient({ data, dateLabel, oneThing }: { data: DashboardData; dateLabel: string; oneThing?: OneThing }) {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<void>) => start(() => void fn());
  const { today, settings, score, streakDays } = data;

  const items: { key: string; title: string; done: boolean; detail: string; action?: React.ReactNode }[] = [
    {
      key: "joint",
      title: "Stay clean today",
      done: today.jointClean,
      detail: today.jointClean ? `${streakDays}-day streak alive` : "Relapsed today",
      action: today.jointClean ? (
        <button className="btn-danger !py-1 !text-xs" disabled={pending} onClick={() => run(() => relapse("", ""))}>Slip</button>
      ) : (
        <button className="btn-neon !py-1 !text-xs" disabled={pending} onClick={() => run(() => markCleanToday())}>Undo</button>
      ),
    },
    {
      key: "protein",
      title: "Hit protein target",
      done: today.proteinG >= settings.proteinTarget,
      detail: `${today.proteinG} / ${settings.proteinTarget}g`,
      action: <button className="btn-ghost !py-1 !text-xs" disabled={pending} onClick={() => run(() => addFood("Protein Shake", 25, 130))}>+25g</button>,
    },
    {
      key: "water",
      title: "Hit water target",
      done: today.waterMl >= settings.waterTarget,
      detail: `${(today.waterMl / 1000).toFixed(1)} / ${(settings.waterTarget / 1000).toFixed(1)}L`,
      action: <button className="btn-ghost !py-1 !text-xs" disabled={pending} onClick={() => run(() => addWater(500))}>+500ml</button>,
    },
    {
      key: "sleep",
      title: "Log sleep",
      done: today.sleepHours >= settings.sleepTarget,
      detail: `${today.sleepHours} / ${settings.sleepTarget}h`,
      action: <button className="btn-ghost !py-1 !text-xs" disabled={pending} onClick={() => run(() => setField("sleepHours", +(today.sleepHours + 0.5).toFixed(1)))}>+0.5h</button>,
    },
    {
      key: "nclex",
      title: "NCLEX study",
      done: today.nclexHours >= settings.nclexHoursTarget,
      detail: `${today.nclexHours} / ${settings.nclexHoursTarget}h`,
      action: <button className="btn-ghost !py-1 !text-xs" disabled={pending} onClick={() => run(() => setField("nclexHours", +(today.nclexHours + 0.5).toFixed(1)))}>+0.5h</button>,
    },
    { key: "gym", title: "Gym session", done: today.gymDone, detail: today.gymDone ? "Done" : "Not yet", action: <Toggle pending={pending} onClick={() => run(() => toggleFlag("gymDone"))} done={today.gymDone} /> },
    { key: "bharatfare", title: "BharatFare task", done: today.bharatfareDone, detail: today.bharatfareDone ? "Done" : "Not yet", action: <Toggle pending={pending} onClick={() => run(() => toggleFlag("bharatfareDone"))} done={today.bharatfareDone} /> },
    { key: "spiritual", title: "Spiritual / Gita", done: today.spiritualDone, detail: today.spiritualDone ? "Done" : "Not yet", action: <Toggle pending={pending} onClick={() => run(() => toggleFlag("spiritualDone"))} done={today.spiritualDone} /> },
  ];

  const completed = items.filter((i) => i.done).length;

  return (
    <main className="mx-auto max-w-xl px-4 pb-24 pt-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <p className="label">{dateLabel}</p>
          <h1 className="text-2xl font-extrabold text-white">Today’s Command</h1>
        </div>
        <Ring value={score.total} max={100} size={72} stroke={9} color={score.color} center={<span className="text-base font-bold text-white">{score.total}</span>} />
      </header>

      {/* ONE Thing — the single highest-priority action today */}
      {oneThing && (
        <div className="mb-3">
          <OneThingCard data={oneThing} />
        </div>
      )}

      {/* Morning / Night check-in */}
      <div className="mb-3">
        <CheckinCard data={data} />
      </div>

      <div className="mb-3 flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg">
          <motion.div className="h-full rounded-full bg-neon-green" initial={{ width: 0 }} animate={{ width: `${(completed / items.length) * 100}%` }} transition={{ duration: 0.6 }} />
        </div>
        <span className="text-sm font-bold text-neon-green">{completed}/{items.length}</span>
      </div>

      <div className="space-y-2">
        {items.map((it, i) => (
          <motion.div
            key={it.key}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition ${it.done ? "border-neon-green/40 bg-neon-green/10" : "border-line bg-surface"}`}
          >
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold ${it.done ? "border-neon-green bg-neon-green text-bg" : "border-line text-transparent"}`}>✓</span>
            <div className="min-w-0 flex-1">
              <p className={`text-[15px] font-semibold ${it.done ? "text-slate-300" : "text-white"}`}>{it.title}</p>
              <p className="text-xs text-slate-400">{it.detail}</p>
            </div>
            {it.action}
          </motion.div>
        ))}
      </div>

      {completed === items.length && (
        <motion.p initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-5 text-center text-lg font-bold text-neon-green glow-text">
          Perfect day. The dragon is starving. 🐉
        </motion.p>
      )}
    </main>
  );
}

function Toggle({ done, pending, onClick }: { done: boolean; pending: boolean; onClick: () => void }) {
  return (
    <button className={done ? "btn-neon !py-1 !text-xs" : "btn-ghost !py-1 !text-xs"} disabled={pending} onClick={onClick}>
      {done ? "Undo" : "Done"}
    </button>
  );
}
