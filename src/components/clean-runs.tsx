"use client";

// AmanOS — Last 7 / 14 / 21 / 28 clean runs, exact d/h/m durations + live ongoing.
import { useEffect, useState } from "react";
import { summarize, formatDHM, type CleanRun } from "@/lib/streak-history";

const WINDOWS = [7, 14, 21, 28] as const;

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

const fmtTs = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function CleanRuns({ runs }: { runs: CleanRun[] }) {
  const [win, setWin] = useState<(typeof WINDOWS)[number]>(7);
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Live tick for the ongoing run (updates the most-recent run's duration).
  useEffect(() => {
    const hasOngoing = runs.some((r) => r.ongoing);
    if (!hasOngoing) return;
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, [runs]);

  const live = (r: CleanRun) => (r.ongoing ? Math.max(0, nowMs - new Date(r.startISO).getTime()) : r.durationMs);
  const visible = runs.slice(0, win);
  const summary = summarize(visible.map((r) => ({ ...r, durationMs: live(r) })));

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="label">🧭 Clean Runs</p>
          <p className="mt-0.5 text-[11px] text-slate-500">Exact clean time — days, hours, minutes. Hours matter in early recovery.</p>
        </div>
        <div className="flex gap-1">
          {WINDOWS.map((w) => (
            <button
              key={w}
              onClick={() => setWin(w)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${win === w ? "bg-surface-2 text-slate-100" : "text-slate-500 hover:text-slate-300"}`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Trend summary */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-line bg-surface-2/50 p-2.5 text-center">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Avg streak</p>
          <p className="mt-0.5 text-sm font-bold text-slate-100">{formatDHM(summary.avgMs)}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface-2/50 p-2.5 text-center">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Best streak</p>
          <p className="mt-0.5 text-sm font-bold text-neon-green">{formatDHM(summary.bestMs)}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface-2/50 p-2.5 text-center">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Worst streak</p>
          <p className="mt-0.5 text-sm font-bold text-neon-amber">{formatDHM(summary.worstMs)}</p>
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
                <th className="py-1.5 pr-2">Duration</th>
                <th className="py-1.5 pr-2">Start → End</th>
                <th className="py-1.5 pr-2">Relapse</th>
                <th className="py-1.5 pr-2 text-right">Cost</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.index} className="border-b border-line/50">
                  <td className="py-1.5 pr-2 text-slate-500">{r.index}</td>
                  <td className="py-1.5 pr-2 font-semibold text-slate-100">{formatDHM(live(r))}{r.ongoing && <span className="ml-1 text-[10px] text-neon-green">live</span>}</td>
                  <td className="py-1.5 pr-2 text-slate-400">{fmtTs(r.startISO)} → {r.ongoing ? <span className="text-neon-green">Ongoing</span> : fmtTs(r.endISO!)}</td>
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
