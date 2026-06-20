"use client";

// AmanOS — Phase 1, item 7: Clean/Use day calendar heatmap (presentational).
// Receives a 365-cell array (oldest → today); slices to the selected window and
// recomputes the summary client-side. GitHub-style grid: 7 rows, week columns.
import { useState } from "react";
import { summarizeCalendar, type CalendarCell } from "@/lib/recovery-calendar";

const WINDOWS = [30, 90, 365] as const;
const COLOR: Record<string, string> = {
  clean: "#22c55e",   // green
  use: "#ef4444",     // red
  craving: "#facc15", // yellow
  none: "#1e293b",    // grey
};

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/50 p-2.5 text-center">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-base font-bold" style={{ color: color ?? "#e2e8f0" }}>{value}</p>
    </div>
  );
}

export function RecoveryCalendar({ cells }: { cells: CalendarCell[] }) {
  const [win, setWin] = useState<(typeof WINDOWS)[number]>(30);
  const visible = cells.slice(Math.max(0, cells.length - win));
  const s = summarizeCalendar(visible);

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="label">🗓️ Clean / Use Calendar</p>
          <p className="mt-0.5 text-[11px] text-slate-500">Green = clean · Red = used · Yellow = craving resisted · Grey = no data.</p>
        </div>
        <div className="flex gap-1">
          {WINDOWS.map((w) => (
            <button
              key={w}
              onClick={() => setWin(w)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${win === w ? "bg-surface-2 text-slate-100" : "text-slate-500 hover:text-slate-300"}`}
            >
              {w}d
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap — 7 rows (days), columns flow weekly */}
      <div className="mt-3 overflow-x-auto">
        <div
          className="grid w-max gap-[3px]"
          style={{ gridTemplateRows: "repeat(7, 1fr)", gridAutoFlow: "column" }}
        >
          {visible.map((c) => (
            <div
              key={c.date}
              title={`${c.date} — ${c.status}`}
              className="h-3 w-3 rounded-[3px]"
              style={{ background: COLOR[c.status] }}
            />
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="Clean days" value={String(s.cleanDays)} color="#22c55e" />
        <Stat label="Use days" value={String(s.useDays)} color="#ef4444" />
        <Stat label="Craving-only" value={String(s.cravingDays)} color="#facc15" />
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Stat label="Success rate" value={`${s.successRate}%`} color="#34f5c5" />
        <Stat label="Current streak" value={`${s.currentStreak}d`} color="#22c55e" />
        <Stat label="Best streak" value={`${s.bestStreak}d`} color="#34f5c5" />
      </div>
    </div>
  );
}
