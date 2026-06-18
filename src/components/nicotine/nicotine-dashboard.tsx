"use client";

import { useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, Cell,
} from "recharts";
import { StatTile } from "@/components/bits";
import type { NicotineReport } from "@/lib/nicotine";
import { RISK_COLOR } from "@/lib/engine/risk";
import { removeNicotineEvent } from "@/app/actions";

const card = "rounded-2xl border border-white/10 bg-[#0d1322]/60 p-4";
const h2 = "text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3";
const tip = { background: "#0d1322", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 } as const;
const gbp = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;

interface RecentRow { id: string; at: string; type: string; quantity: number; cost: number; trigger: string | null; outcome: string | null; shift: string | null }

function riskColor(score: number) { return score >= 70 ? RISK_COLOR.SEVERE : score >= 45 ? RISK_COLOR.HIGH : score >= 22 ? RISK_COLOR.MODERATE : RISK_COLOR.LOW; }

export function NicotineDashboard({ r, recent }: { r: NicotineReport; recent: RecentRow[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const rec = r.recovery;
  const d = r.dragon;
  const freeLabel = rec.freeDays >= 1 ? `${rec.freeDays}d` : `${Math.floor(rec.freeMs / 3600000)}h`;

  return (
    <div className="space-y-4">
      {/* ── Dragon ── */}
      <div className={card} style={{ borderColor: `${d.stage.tier.color}55` }}>
        <div className="flex items-center justify-between">
          <div>
            <p className={h2 + " mb-0"}>Nicotine Dragon</p>
            <p className="text-xl font-extrabold" style={{ color: d.stage.tier.color }}>{d.stage.tier.icon} {d.stage.tier.name}</p>
            <p className="text-[11px] text-slate-500">Threat: <b style={{ color: d.threat === "HIGH" ? "#ff5470" : d.threat === "MODERATE" ? "#fbbf24" : "#34d399" }}>{d.threat}</b> · damage dealt {d.damageDealt}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-slate-500">Dragon HP</p>
            <p className="text-2xl font-extrabold" style={{ color: d.hp > 50 ? "#ff5470" : "#34d399" }}>{d.hp}</p>
          </div>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
          <div className="h-full rounded-full" style={{ width: `${d.hp}%`, background: d.hp > 50 ? "#ff5470" : "#34d399" }} />
        </div>
        <p className="mt-2 text-[11px] text-slate-500">Weaknesses: {d.weaknesses.join(", ")} · strongest craving window {d.strongestWindow}. Every resisted craving damages it; every cigarette heals it.</p>
      </div>

      {/* ── Recovery tiles ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Nicotine-free" value={freeLabel} sub={`longest ${rec.longestFreeDays}d`} color="#34d399" accent="#34d399" />
        <StatTile label="Cigarettes avoided" value={rec.unitsAvoided} sub={`${Math.round(rec.nicotineAvoidedMg)}mg nicotine`} color="#38bdf8" accent="#38bdf8" />
        <StatTile label="Money saved" value={gbp(rec.moneySaved)} sub={`${gbp(rec.moneySpent)} spent`} color="#34d399" accent="#34d399" />
        <StatTile label="Life regained" value={`${Math.round(rec.lifeRegainedHours)}h`} sub="≈11 min/cig" color="#a78bfa" accent="#a78bfa" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Cravings won" value={rec.cravingsWon} color="#34f5c5" accent="#34f5c5" />
        <StatTile label="Cravings lost" value={rec.cravingsLost} color="#ff5470" accent="#ff5470" />
        <StatTile label="Victory rate" value={`${rec.victoryRate}%`} accent="#f59e0b" />
        <StatTile label="Relapses" value={rec.relapses} color="#fb7185" accent="#fb7185" />
      </div>

      {/* ── Recovery AI forecast ── */}
      <div className={card}>
        <p className={h2}>🤖 Recovery AI — nicotine relapse forecast</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[["Today", r.riskToday.score, r.riskToday.level], ["Tomorrow", r.riskTomorrow.score, r.riskTomorrow.level], ["7-day", r.risk7d, ""], ["30-day", r.risk30d, ""]].map(([label, score, level], i) => (
            <div key={i} className="rounded-xl border p-3 text-center" style={{ borderColor: `${riskColor(Number(score))}55`, background: `${riskColor(Number(score))}0d` }}>
              <p className="text-[11px] uppercase tracking-wider text-slate-400">{label}</p>
              <p className="text-2xl font-extrabold" style={{ color: riskColor(Number(score)) }}>{score}</p>
              {level ? <p className="text-[10px] font-bold" style={{ color: riskColor(Number(score)) }}>{level}</p> : <p className="text-[10px] text-slate-500">/100</p>}
            </div>
          ))}
        </div>
        {r.riskToday.reasons.length > 0 && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 p-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Why</p>
              <ul className="space-y-0.5 text-[12.5px] text-slate-300">{r.riskToday.reasons.slice(0, 5).map((x, i) => <li key={i}>• {x}</li>)}</ul>
            </div>
            <div className="rounded-xl border border-orange-400/20 bg-orange-400/5 p-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-orange-300">Defensive actions</p>
              <ul className="space-y-0.5 text-[12.5px] text-slate-200">{r.riskToday.suggestions.slice(0, 5).map((x, i) => <li key={i}>→ {x}</li>)}</ul>
            </div>
          </div>
        )}
      </div>

      {/* ── Insights ── */}
      {r.insights.length > 0 && (
        <div className={card}>
          <p className={h2}>💡 Evidence-backed insights</p>
          <ul className="space-y-1.5">{r.insights.map((t, i) => <li key={i} className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-[13px] text-slate-200">{t}</li>)}</ul>
        </div>
      )}

      {/* ── Correlation cards ── */}
      {(() => { const shown = r.cards.filter((c) => c.enough); return shown.length ? (
        <div>
          <p className={h2}>🔗 Nicotine correlations</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {shown.map((c) => (
              <div key={c.id} className={card}>
                <p className="text-sm font-bold text-white">{c.name}</p>
                <p className="mt-1 text-[13px] leading-snug text-slate-300">{c.explanation}</p>
                <p className="mt-2 text-[11px] text-slate-500">{c.strength} · r={c.r} · n={c.n} · {c.confidence} confidence</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className={card}><p className="text-sm text-slate-400">Correlations need ~7 days of data — keep logging cravings, slips and sleep. {r.needMoreDays > 0 ? `Need ${r.needMoreDays} more day(s).` : ""}</p></div>
      ); })()}

      {/* ── Finance integration ── */}
      <div className={card} style={{ borderColor: "#f59e0b44" }}>
        <p className={h2}>💸 The cost of the habit</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile label="Nicotine lifetime" value={gbp(r.finance.nicotineLifetime)} color="#fb7185" accent="#fb7185" />
          <StatTile label="Cannabis lifetime" value={gbp(r.finance.cannabisLifetime)} color="#fb7185" accent="#fb7185" />
          <StatTile label="Combined" value={gbp(r.finance.combinedLifetime)} color="#fb7185" accent="#fb7185" />
          <StatTile label="5-yr cost" value={gbp(r.finance.cost5yr)} color="#f59e0b" accent="#f59e0b" />
          <StatTile label="10-yr cost" value={gbp(r.finance.cost10yr)} color="#f59e0b" accent="#f59e0b" />
          <StatTile label="Freedom Fund 10yr" value={gbp(r.finance.freedomFund10yr)} sub="if quit + invested" color="#34d399" accent="#34d399" />
        </div>
        <p className="mt-2 rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-sm text-emerald-200">If you stop nicotine today and invest the money monthly: <b>{gbp(r.finance.freedomFund10yr)}</b> after 10 years.</p>
      </div>

      {/* ── Graphs ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={card}>
          <p className={h2}>Use over time (30d)</p>
          <ResponsiveContainer width="100%" height={160}><BarChart data={r.graphs.useOverTime} margin={{ top: 5, right: 8, bottom: 0, left: -24 }}><XAxis dataKey="date" tick={{ fontSize: 9, fill: "#64748b" }} interval={4} /><YAxis tick={{ fontSize: 10, fill: "#64748b" }} allowDecimals={false} /><Tooltip contentStyle={tip} /><Bar dataKey="use" fill="#fb7185" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer>
        </div>
        <div className={card}>
          <p className={h2}>Cravings over time (30d)</p>
          <ResponsiveContainer width="100%" height={160}><LineChart data={r.graphs.cravingsOverTime} margin={{ top: 5, right: 8, bottom: 0, left: -24 }}><XAxis dataKey="date" tick={{ fontSize: 9, fill: "#64748b" }} interval={4} /><YAxis tick={{ fontSize: 10, fill: "#64748b" }} allowDecimals={false} /><Tooltip contentStyle={tip} /><Line type="monotone" dataKey="cravings" stroke="#f59e0b" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer>
        </div>
        <div className={card}>
          <p className={h2}>Cost over time (cumulative)</p>
          <ResponsiveContainer width="100%" height={160}><AreaChart data={r.graphs.costOverTime} margin={{ top: 5, right: 8, bottom: 0, left: -20 }}><XAxis dataKey="date" tick={{ fontSize: 9, fill: "#64748b" }} interval={4} /><YAxis tick={{ fontSize: 10, fill: "#64748b" }} /><Tooltip contentStyle={tip} formatter={(v: number) => gbp(v)} /><Area type="monotone" dataKey="cost" stroke="#fb7185" fill="#fb7185" fillOpacity={0.2} /></AreaChart></ResponsiveContainer>
        </div>
        <div className={card}>
          <p className={h2}>Hourly heatmap</p>
          <ResponsiveContainer width="100%" height={160}><BarChart data={r.graphs.byHour} margin={{ top: 5, right: 8, bottom: 0, left: -24 }}><XAxis dataKey="h" tick={{ fontSize: 9, fill: "#64748b" }} interval={2} /><YAxis tick={{ fontSize: 10, fill: "#64748b" }} allowDecimals={false} /><Tooltip contentStyle={tip} /><Bar dataKey="count" radius={[3, 3, 0, 0]}>{r.graphs.byHour.map((x, i) => <Cell key={i} fill={x.count === Math.max(...r.graphs.byHour.map((y) => y.count)) && x.count > 0 ? "#ff5470" : "#fb923c"} />)}</Bar></BarChart></ResponsiveContainer>
        </div>
        <div className={card}>
          <p className={h2}>Predicted relapse trend</p>
          <ResponsiveContainer width="100%" height={160}><LineChart data={r.graphs.riskTrend} margin={{ top: 5, right: 8, bottom: 0, left: -24 }}><XAxis dataKey="date" tick={{ fontSize: 9, fill: "#64748b" }} interval={4} /><YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} /><Tooltip contentStyle={tip} /><Line type="monotone" dataKey="risk" stroke="#fb7185" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer>
        </div>
        <div className={card}>
          <p className={h2}>Free-days streak</p>
          <ResponsiveContainer width="100%" height={160}><AreaChart data={r.graphs.streakTrend} margin={{ top: 5, right: 8, bottom: 0, left: -24 }}><XAxis dataKey="date" tick={{ fontSize: 9, fill: "#64748b" }} interval={4} /><YAxis tick={{ fontSize: 10, fill: "#64748b" }} /><Tooltip contentStyle={tip} /><Area type="monotone" dataKey="freeDays" stroke="#34d399" fill="#34d399" fillOpacity={0.2} /></AreaChart></ResponsiveContainer>
        </div>
      </div>

      {/* ── Triggers + shifts ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={card}>
          <p className={h2}>Trigger breakdown</p>
          {r.graphs.triggers.length ? <div className="space-y-1.5">{r.graphs.triggers.map((t) => { const max = r.graphs.triggers[0].count || 1; return (
            <div key={t.name} className="flex items-center gap-2 text-sm"><span className="w-24 shrink-0 capitalize text-slate-300">{t.name.replace(/-/g, " ")}</span><div className="h-2 flex-1 rounded bg-white/5"><div className="h-2 rounded bg-orange-400/70" style={{ width: `${(t.count / max) * 100}%` }} /></div><span className="w-8 text-right text-slate-400">{t.count}</span></div>
          ); })}</div> : <p className="text-sm text-slate-500">No triggers logged yet.</p>}
        </div>
        <div className={card}>
          <p className={h2}>By nursing shift</p>
          {r.shifts.length ? <table className="w-full text-sm"><thead><tr className="text-[11px] text-slate-500"><th className="text-left font-medium">Shift</th><th className="text-right font-medium">Use</th><th className="text-right font-medium">Cravings</th></tr></thead><tbody>{r.shifts.map((s) => <tr key={s.shift}><td className="capitalize text-slate-300">{s.shift}</td><td className="text-right text-slate-300">{s.use}</td><td className="text-right text-slate-300">{s.cravings}</td></tr>)}</tbody></table> : <p className="text-sm text-slate-500">Tag shifts when logging to see day/night/off patterns.</p>}
        </div>
      </div>

      {/* ── Badges ── */}
      <div className={card}>
        <p className={h2}>🏅 Badges</p>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-3">
          {r.badges.map((b) => (
            <div key={b.key} className={`rounded-xl border p-2 text-center ${b.earned ? "border-amber-400/40 bg-amber-400/10" : "border-white/5 opacity-40"}`}>
              <p className="text-xl">{b.icon}</p>
              <p className="text-[11px] font-semibold text-slate-200">{b.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent ── */}
      <div className={card}>
        <p className={h2}>Recent events</p>
        {recent.length ? <div className="space-y-1.5">{recent.map((e) => (
          <div key={e.id} className="flex items-center gap-2 text-sm">
            <span className={`w-16 shrink-0 text-xs font-semibold ${e.type === "craving" ? (e.outcome === "lost" ? "text-red-400" : "text-emerald-400") : "text-orange-300"}`}>{e.type === "craving" ? (e.outcome === "lost" ? "LOST" : "WON") : e.type.toUpperCase()}</span>
            <span className="flex-1 truncate capitalize text-slate-300">{[e.trigger, e.shift ? `${e.shift} shift` : "", e.cost ? gbp(e.cost) : ""].filter(Boolean).join(" · ") || "—"}</span>
            <span className="shrink-0 text-xs text-slate-500">{new Date(e.at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
            <button disabled={busy === e.id} onClick={async () => { setBusy(e.id); await removeNicotineEvent(e.id); setBusy(null); }} className="shrink-0 text-xs text-slate-600 hover:text-red-400">✕</button>
          </div>
        ))}</div> : <p className="text-sm text-slate-500">No nicotine events logged yet.</p>}
      </div>
    </div>
  );
}
