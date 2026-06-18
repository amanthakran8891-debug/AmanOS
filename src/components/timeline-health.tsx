"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { TimelineHealth } from "@/lib/timeline-health";
import { collapseRelapseDaysToOne } from "@/app/actions";

const SHORT_MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pretty = (date: string) => { const [, m, d] = date.split("-"); return `${Number(d)} ${SHORT_MONTH[Number(m) - 1]}`; };

export function TimelineHealthCard({ health }: { health: TimelineHealth }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string | null>(null);

  const collapseAll = () =>
    start(() => void collapseRelapseDaysToOne(health.suspiciousDays.map((d) => d.date)).then((n) => {
      setDone(`Collapsed ${n} duplicate relapse log${n === 1 ? "" : "s"}.`);
      router.refresh();
    }));

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <p className="label">🩺 Timeline Confidence</p>
        <span className="text-2xl font-black" style={{ color: health.color }}>{health.confidence}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg">
        <motion.div className="h-full rounded-full" style={{ background: health.color, boxShadow: `0 0 10px ${health.color}aa` }} initial={{ width: 0 }} animate={{ width: `${health.confidence}%` }} transition={{ duration: 0.8 }} />
      </div>
      <p className="mt-1 text-[11px] font-semibold" style={{ color: health.color }}>{health.band} trust · {health.totalRelapses} relapse logs</p>

      <ul className="mt-2 space-y-1">
        {health.flags.map((f, i) => (
          <li key={i} className="flex gap-2 text-[12px] text-slate-300"><span style={{ color: health.color }}>•</span>{f}</li>
        ))}
      </ul>

      {health.suspiciousDays.length > 0 && (
        <div className="mt-3 rounded-xl border border-neon-amber/30 bg-neon-amber/5 p-3">
          <p className="text-[11px] font-bold text-neon-amber">Suspicious days (likely test/duplicate data)</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {health.suspiciousDays.map((d) => (
              <span key={d.date} className="chip text-[11px]">{pretty(d.date)} · {d.count}×</span>
            ))}
          </div>
          {done ? (
            <p className="mt-2 text-sm font-semibold text-neon-green">{done}</p>
          ) : (
            <>
              <button className="btn-danger mt-2 w-full !py-2 text-xs" disabled={pending} onClick={collapseAll}>
                Collapse each day to a single relapse
              </button>
              <p className="mt-1.5 text-[10px] text-neon-red/80">⚠ Cannot be undone unless the database is restored from a backup.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
