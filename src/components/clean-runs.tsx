"use client";

// AmanOS — Phase 1, item 1: Last 7 / 14 / 21 clean runs + Recovery Trend Summary.
// Pure presentational: receives pre-computed runs (most-recent first) and slices
// to the selected window. Summary recomputes for the visible window.
import { useState } from "react";
import { summarize, type CleanRun } from "@/lib/streak-history";

const WINDOWS = [7, 14, 21] as const;

const TYPE_STYLE: Record<string, string> = {
  Joint: "text-emerald-300",
  Cigarette: "text-amber-300",
  Both: "text-rose-300",
};

function trendBadge(t: "improving" | "stable" | "declining") {
  if (t === "improving") return <span className="text-neon-green">▲ Improving</span>;
  if (t === "declining") return <span className="text-neon-red">▼ Declining</span>;
  return <span className="text-slate-400">→ Stable</span>;
}

export function CleanRuns({ runs }: { runs: CleanRun[] }) {
  const [win, setWin] = useState<(typeof WINDOWS)[number]>(7);
  const visible = runs.slice(0, win);
  const summary = summarize(visible);
  const fmt = (k: string) => new Date(k + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="label">🧭 Clean Runs</p>
          <p className="mt-0.5 text-[11px] text-slate-500">Your recent clean streaks — duration, what ended it, and the cost.</p>
        </div>
        <div className="flex gap-1">
          {WINDOWS.map((w) => (
            <button
              key={w}
              onClick={() => setWin(w)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${win === w ? "bg-surface-2 text-slate-100" : "text-slate-500 hover:text-slate-300"}`}
            >
              Last {w}
            </button>
          ))}
        </div>
      </div>

      {/* Recovery Trend Summary */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-line bg-surface-2/50 p-2.5 text-center">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Avg streak</p>
          <p className="mt-0.5 text-lg font-bold text-slate-100">{summary.avgDays}<span className="text-xs font-normal text-slate-500">d</span></p>
        </div>
        <div className="rounded-xl border border-line bg-surface-2/50 p-2.5 text-center">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Best streak</p>
          <p className="mt-0.5 text-lg font-bold text-neon-green">{summary.bestDays}<span className="text-xs font-normal text-slate-500">d</span></p>
        </div>
        <div className="rounded-xl border border-line bg-surface-2/50 p-2.5 text-center">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Worst streak</p>
          <p className="mt-0.5 text-lg font-bold text-neon-amber">{summary.worstDays}<span className="text-xs font-normal text-slate-500">d</span></p>
        </div>
        <div className="rounded-xl border border-line bg-surface-2/50 p-2.5 text-center">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Trend</p>
          <p className="mt-0.5 text-sm font-bold">{trendBadge(summary.trend)}</p>
        </div>
      </div>

      {/* Runs table */}
      {visible.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">No relapse history logged yet — your clean run is unbroken. 🎉</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase tracking-wide text-slate-500">
                <th className="py-1.5 pr-2">#</th>
                <th className="py-1.5 pr-2">Start</th>
                <th className="py-1.5 pr-2">End</th>
                <th className="py-1.5 pr-2">Duration</th>
                <th className="py-1.5 pr-2">Relapse</th>
                <th className="py-1.5 pr-2 text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.index} className="border-b border-line/50">
                  <td className="py-1.5 pr-2 text-slate-500">{r.index}</td>
                  <td className="py-1.5 pr-2 text-slate-300">{fmt(r.startDate)}</td>
                  <td className="py-1.5 pr-2 text-slate-300">{r.ongoing ? <span className="text-neon-green">Ongoing</span> : fmt(r.endDate!)}</td>
                  <td className="py-1.5 pr-2 font-semibold text-slate-100">{r.durationDays}d</td>
                  <td className="py-1.5 pr-2">{r.ongoing ? <span className="text-slate-500">—</span> : <span className={TYPE_STYLE[r.endedByType ?? ""] ?? "text-slate-300"}>{r.endedByType}</span>}</td>
                  <td className="py-1.5 pr-2 text-right text-slate-300">{r.ongoing ? "—" : `£${r.cost.toFixed(2)}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
