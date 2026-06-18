"use client";

import { useMemo, useState } from "react";
import type { RecoveryTimeline } from "@/lib/recovery-timeline";
import { ZOOM_WINDOWS, withinDays } from "@/lib/recovery-timeline";

const DEFAULT_LIMIT = 12;

export function RecoveryTimelineCard({ timeline }: { timeline: RecoveryTimeline }) {
  const [days, setDays] = useState<number>(30);
  const [showAll, setShowAll] = useState(false);
  const now = Date.now();

  // Decluttered default = meaningful (non-minor) events only, newest first, capped.
  const inWindow = useMemo(() => withinDays(timeline.events, days, now).slice().reverse(), [timeline.events, days, now]);
  const meaningful = useMemo(() => inWindow.filter((e) => !e.minor), [inWindow]);
  const events = showAll ? inWindow : meaningful.slice(0, DEFAULT_LIMIT);
  const hiddenCount = inWindow.length - events.length;
  const windowStart = now - days * 86400000;
  const pos = (ms: number) => Math.max(0, Math.min(100, ((ms - windowStart) / (now - windowStart)) * 100));

  const counts = useMemo(() => {
    const w = withinDays(timeline.events, days, now);
    return {
      relapses: w.filter((e) => e.kind === "relapse").length,
      victories: w.filter((e) => e.kind === "victory").length,
      milestones: w.filter((e) => e.kind === "milestone").length,
    };
  }, [timeline.events, days, now]);

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <p className="label">Recovery Timeline</p>
        <div className="inline-flex rounded-lg border border-line bg-surface-2 p-0.5 text-[11px]">
          {ZOOM_WINDOWS.map((z) => (
            <button key={z.key} onClick={() => setDays(z.days)} className={`rounded-md px-2 py-1 font-semibold transition ${days === z.days ? "bg-neon-green/15 text-neon-green" : "text-slate-400"}`}>
              {z.label}
            </button>
          ))}
        </div>
      </div>

      {/* density strip */}
      <div className="relative mt-4 h-10 rounded-xl border border-line bg-bg">
        {withinDays(timeline.events, days, now).map((e, i) => (
          <span
            key={i}
            title={`${e.label}${e.detail ? " · " + e.detail : ""}`}
            className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ left: `${pos(e.ms)}%`, background: e.color, boxShadow: `0 0 8px ${e.color}` }}
          />
        ))}
        <span className="absolute -bottom-4 left-0 text-[9px] text-slate-600">{days}d ago</span>
        <span className="absolute -bottom-4 right-0 text-[9px] text-slate-600">today</span>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 text-[11px]">
        <span className="chip">💥 {counts.relapses} relapses</span>
        <span className="chip">🏅 {counts.victories} victories</span>
        <span className="chip">🏆 {counts.milestones} milestones</span>
        <span className="chip">Longest run: {timeline.longestPeriodDays}d</span>
      </div>

      {/* event list */}
      <div className="mt-3 max-h-80 space-y-1.5 overflow-y-auto pr-1">
        {events.length === 0 && <p className="text-sm text-slate-500">No key events in this window.</p>}
        {events.map((e, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/50 px-3 py-2">
            <span className="text-base">{e.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: e.color }}>{e.label}</p>
              {e.detail && <p className="text-[11px] text-slate-400">{e.detail}</p>}
            </div>
            <span className="text-[10px] tabular-nums text-slate-500">{new Date(e.ms).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
          </div>
        ))}
      </div>

      {hiddenCount > 0 && (
        <button onClick={() => setShowAll((s) => !s)} className="btn-ghost mt-3 w-full !py-2 text-xs">
          {showAll ? "Show key events only" : `View full timeline (+${hiddenCount} more)`}
        </button>
      )}
    </div>
  );
}
