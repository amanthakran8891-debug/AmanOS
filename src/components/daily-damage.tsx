"use client";

import Link from "next/link";
import type { DashboardData } from "@/lib/data";
import { dailyDamage } from "@/lib/damage";

export function DailyDamage({ data }: { data: DashboardData }) {
  const { today, settings } = data;
  const dmg = dailyDamage(
    { jointClean: today.jointClean, gymDone: today.gymDone, nclexHours: today.nclexHours, proteinG: today.proteinG, spiritualDone: today.spiritualDone, waterMl: today.waterMl },
    { nclexHoursTarget: settings.nclexHoursTarget, proteinTarget: settings.proteinTarget, waterTarget: settings.waterTarget },
  );

  return (
    <Link href="/combat" className="card block transition hover:border-neon-red/40">
      <div className="flex items-center justify-between">
        <p className="label">⚔ Today&apos;s Damage</p>
        <span className="text-2xl font-extrabold tabular-nums text-neon-red">−{dmg.total.toLocaleString()}<span className="text-xs font-normal text-slate-500"> HP</span></span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {dmg.items.map((i) => (
          <div key={i.key} className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-[13px] ${i.done ? "border-neon-green/40 bg-neon-green/10" : "border-line bg-surface-2 opacity-60"}`}>
            <span className="truncate text-slate-200">{i.icon} {i.label}</span>
            <span className={`shrink-0 font-bold tabular-nums ${i.done ? "text-neon-green" : "text-slate-600"}`}>{i.done ? `−${i.amount}` : `+${i.amount}`}</span>
          </div>
        ))}
      </div>
      {dmg.comboLabel && <p className="mt-2 text-center text-xs font-bold text-neon-amber">🔥 {dmg.comboLabel} → {dmg.total.toLocaleString()} total damage</p>}
      <p className="mt-2 text-center text-[11px] text-slate-500">Every real action damages the dragon. Tapping does nothing — only logged habits.</p>
    </Link>
  );
}
