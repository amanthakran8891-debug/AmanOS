"use client";

import { useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from "recharts";
import { StatTile } from "@/components/bits";
import { DOW, type CravingAnalytics, type NameCount } from "@/lib/cravings";
import { removeCraving } from "@/app/actions";

interface RecentRow { id: string; at: string; intensity: number; trigger: string | null; location: string | null; emotion: string | null; outcome: string }

const card = "rounded-2xl border border-white/10 bg-[#0d1322]/60 p-4";
const h2 = "text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3";

function NameTable({ rows }: { rows: NameCount[] }) {
  if (!rows.length) return <p className="text-sm text-slate-500">No data yet.</p>;
  const max = rows[0].count || 1;
  return (
    <div className="space-y-1.5">
      {rows.slice(0, 6).map((r) => (
        <div key={r.name} className="flex items-center gap-2 text-sm">
          <span className="w-24 shrink-0 text-slate-300 capitalize">{r.name.replace(/-/g, " ")}</span>
          <div className="h-2 flex-1 rounded bg-white/5">
            <div className="h-2 rounded bg-amber-400/70" style={{ width: `${(r.count / max) * 100}%` }} />
          </div>
          <span className="w-10 shrink-0 text-right text-slate-400">{r.count}</span>
        </div>
      ))}
    </div>
  );
}

export function CravingDashboard({ a, recent }: { a: CravingAnalytics; recent: RecentRow[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const hourData = a.byHour.map((count, h) => ({ h: `${String(h).padStart(2, "0")}`, count }));
  const intensityData = a.byIntensity.map((count, i) => ({ i: i + 1, count }));
  const dailyData = a.daily.slice(-30);
  const heatMax = Math.max(1, ...a.heatmap.flat());

  return (
    <div className="space-y-4">
      {/* ── Headline stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Cravings won" value={a.won} accent="#34f5c5" color="#34f5c5" />
        <StatTile label="Cravings lost" value={a.lost} accent="#ff5470" color="#ff5470" />
        <StatTile label="Victory rate" value={`${a.victoryRate}%`} accent="#f59e0b" />
        <StatTile label="Avg intensity" value={a.avgIntensity} sub="of 10" accent="#a78bfa" />
      </div>

      {/* ── Danger insights ── */}
      <div className={card}>
        <p className={h2}>Where the danger is</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
          <div><span className="text-slate-500">Most dangerous hour</span><br /><span className="font-semibold text-amber-300">{a.mostDangerousHour}</span></div>
          <div><span className="text-slate-500">Most dangerous day</span><br /><span className="font-semibold text-amber-300">{a.mostDangerousDay}</span></div>
          <div><span className="text-slate-500">Most dangerous place</span><br /><span className="font-semibold text-amber-300 capitalize">{a.mostDangerousLocation.replace(/-/g, " ")}</span></div>
          <div><span className="text-slate-500">Top trigger</span><br /><span className="font-semibold text-amber-300 capitalize">{a.topTrigger.replace(/-/g, " ")}</span></div>
          <div><span className="text-slate-500">Top emotion</span><br /><span className="font-semibold text-amber-300 capitalize">{a.topEmotion}</span></div>
          <div><span className="text-slate-500">Last 7d vs prev</span><br /><span className={`font-semibold ${a.trendPct > 0 ? "text-red-400" : "text-emerald-400"}`}>{a.trendPct > 0 ? "+" : ""}{a.trendPct}%</span></div>
        </div>
      </div>

      {/* ── Daily trend ── */}
      <div className={card}>
        <p className={h2}>Cravings over time (last 30 days)</p>
        {dailyData.length ? (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={dailyData} margin={{ top: 5, right: 8, bottom: 0, left: -20 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#64748b" }} tickFormatter={(d) => String(d).slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#0d1322", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2} dot={false} name="cravings" />
              <Line type="monotone" dataKey="lost" stroke="#ff5470" strokeWidth={1.5} dot={false} name="lost" />
            </LineChart>
          </ResponsiveContainer>
        ) : <p className="text-sm text-slate-500">Log a craving to start the trend.</p>}
      </div>

      {/* ── By hour ── */}
      <div className={card}>
        <p className={h2}>By hour of day</p>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={hourData} margin={{ top: 5, right: 8, bottom: 0, left: -24 }}>
            <XAxis dataKey="h" tick={{ fontSize: 9, fill: "#64748b" }} interval={2} />
            <YAxis tick={{ fontSize: 10, fill: "#64748b" }} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "#0d1322", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {hourData.map((d, i) => <Cell key={i} fill={d.count === Math.max(...a.byHour) && d.count > 0 ? "#ff5470" : "#f59e0b"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Heatmap day×hour ── */}
      <div className={card}>
        <p className={h2}>Heatmap — day × hour</p>
        <div className="overflow-x-auto">
          <div className="min-w-[560px]">
            <div className="flex pl-9 text-[9px] text-slate-500">
              {Array.from({ length: 24 }, (_, h) => <span key={h} className="w-[22px] text-center">{h % 3 === 0 ? h : ""}</span>)}
            </div>
            {a.heatmap.map((row, d) => (
              <div key={d} className="flex items-center">
                <span className="w-9 text-[10px] text-slate-400">{DOW[d]}</span>
                {row.map((c, h) => (
                  <span key={h} className="m-[1px] h-[18px] w-[20px] rounded-sm" title={`${DOW[d]} ${h}:00 — ${c}`}
                    style={{ background: c ? `rgba(245,158,11,${0.15 + 0.85 * (c / heatMax)})` : "rgba(255,255,255,0.04)" }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Intensity + breakdowns ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={card}>
          <p className={h2}>Intensity distribution</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={intensityData} margin={{ top: 5, right: 8, bottom: 0, left: -24 }}>
              <XAxis dataKey="i" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#0d1322", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#a78bfa" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className={card}><p className={h2}>By trigger</p><NameTable rows={a.byTrigger} /></div>
        <div className={card}><p className={h2}>By location</p><NameTable rows={a.byLocation} /></div>
        <div className={card}><p className={h2}>By emotion</p><NameTable rows={a.byEmotion} /></div>
      </div>

      {/* ── Recent log ── */}
      <div className={card}>
        <p className={h2}>Recent cravings</p>
        {recent.length ? (
          <div className="space-y-1.5">
            {recent.map((r) => (
              <div key={r.id} className="flex items-center gap-2 text-sm">
                <span className={`w-12 shrink-0 text-xs font-semibold ${r.outcome === "lost" ? "text-red-400" : "text-emerald-400"}`}>{r.outcome === "lost" ? "LOST" : "WON"}</span>
                <span className="w-10 shrink-0 text-slate-400">{r.intensity}/10</span>
                <span className="flex-1 truncate text-slate-300 capitalize">{[r.trigger, r.location, r.emotion].filter(Boolean).map((x) => String(x).replace(/-/g, " ")).join(" · ") || "—"}</span>
                <span className="shrink-0 text-xs text-slate-500">{new Date(r.at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                <button disabled={busy === r.id} onClick={async () => { setBusy(r.id); await removeCraving(r.id); setBusy(null); }} className="shrink-0 text-xs text-slate-600 hover:text-red-400">✕</button>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-slate-500">No cravings logged yet.</p>}
      </div>
    </div>
  );
}
