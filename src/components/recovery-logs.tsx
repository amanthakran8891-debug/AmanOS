"use client";

// AmanOS — All Recovery Logs: honest per-day counts with a window filter.
import { useState } from "react";
import type { RecoveryDayLog, RecoveryLogTotals } from "@/lib/recovery-logs";

const WINDOWS = [
  { key: "today", label: "Today", days: 1 },
  { key: "7", label: "7d", days: 7 },
  { key: "14", label: "14d", days: 14 },
  { key: "30", label: "30d", days: 30 },
  { key: "all", label: "All", days: Infinity },
] as const;

function totalsOf(days: RecoveryDayLog[]): RecoveryLogTotals {
  const t: RecoveryLogTotals = { cravings: 0, resisted: 0, lost: 0, relapses: 0, bestDay: null, worstDay: null };
  for (const d of days) {
    t.cravings += d.cravings; t.resisted += d.resisted; t.lost += d.lost; t.relapses += d.relapses;
    if (d.resisted > 0 && (!t.bestDay || d.resisted > t.bestDay.resisted)) t.bestDay = { date: d.date, resisted: d.resisted };
    const bad = d.relapses * 10 + d.lost;
    const cur = t.worstDay ? t.worstDay.relapses * 10 + t.worstDay.lost : -1;
    if (bad > 0 && bad > cur) t.worstDay = { date: d.date, relapses: d.relapses, lost: d.lost };
  }
  return t;
}

const fmt = (k: string) => new Date(k + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export function RecoveryLogs({ days }: { days: RecoveryDayLog[] }) {
  const [win, setWin] = useState<(typeof WINDOWS)[number]["key"]>("7");
  const w = WINDOWS.find((x) => x.key === win)!;
  const todayK = new Date().toLocaleDateString("en-CA");
  const cutoff = w.days === Infinity ? "0000-00-00" : new Date(Date.now() - (w.days - 1) * 86400000).toLocaleDateString("en-CA");
  const visible = days.filter((d) => (w.key === "today" ? d.date === todayK : d.date >= cutoff));
  const t = totalsOf(visible);

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="label">📒 All Recovery Logs</p>
          <p className="mt-0.5 text-[11px] text-slate-500">Honest per-day counts — every craving and relapse, never hidden.</p>
        </div>
        <div className="flex gap-1">
          {WINDOWS.map((x) => (
            <button key={x.key} onClick={() => setWin(x.key)} className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition-colors ${win === x.key ? "bg-surface-2 text-slate-100" : "text-slate-500 hover:text-slate-300"}`}>{x.label}</button>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        <Stat label="Cravings" value={t.cravings} />
        <Stat label="Resisted" value={t.resisted} color="#34f5c5" />
        <Stat label="Lost" value={t.lost} color="#fb7185" />
        <Stat label="Relapses" value={t.relapses} color="#fb7185" />
        <Stat label="Best day" value={t.bestDay ? `${t.bestDay.resisted}✓` : "—"} sub={t.bestDay ? fmt(t.bestDay.date) : undefined} color="#34f5c5" />
        <Stat label="Worst day" value={t.worstDay ? `${t.worstDay.relapses}✕` : "—"} sub={t.worstDay ? fmt(t.worstDay.date) : undefined} color="#fb7185" />
      </div>

      {/* Table */}
      {visible.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">No logs in this window. 🎉</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase tracking-wide text-slate-500">
                <th className="py-1.5 pr-2">Date</th>
                <th className="py-1.5 pr-2 text-right">Crav</th>
                <th className="py-1.5 pr-2 text-right">Resisted</th>
                <th className="py-1.5 pr-2 text-right">Lost</th>
                <th className="py-1.5 pr-2 text-right">Relapse</th>
                <th className="py-1.5 pr-2 text-center">Clean</th>
                <th className="py-1.5 pr-2">Note</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((d) => (
                <tr key={d.date} className="border-b border-line/40 last:border-0">
                  <td className="py-1.5 pr-2 text-slate-300">{fmt(d.date)}</td>
                  <td className="py-1.5 pr-2 text-right text-slate-300">{d.cravings}</td>
                  <td className="py-1.5 pr-2 text-right text-emerald-300">{d.resisted}</td>
                  <td className="py-1.5 pr-2 text-right text-rose-300">{d.lost}</td>
                  <td className="py-1.5 pr-2 text-right font-semibold text-rose-300">{d.relapses}</td>
                  <td className="py-1.5 pr-2 text-center">{d.relapses > 0 || !d.cleanDay ? <span className="text-neon-red">✕</span> : <span className="text-neon-green">✓</span>}</td>
                  <td className="py-1.5 pr-2 max-w-[160px] truncate text-slate-500">{d.note ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/50 p-2 text-center">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-base font-bold" style={{ color: color ?? "#e2e8f0" }}>{value}</p>
      {sub && <p className="text-[9px] text-slate-500">{sub}</p>}
    </div>
  );
}
