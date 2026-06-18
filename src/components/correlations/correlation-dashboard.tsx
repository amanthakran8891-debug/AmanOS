"use client";

import {
  ResponsiveContainer, ScatterChart, Scatter, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, ZAxis, Tooltip, Cell,
} from "recharts";
import { StatTile } from "@/components/bits";
import type { CorrelationReport, CorrelationCard } from "@/lib/correlations";
import { RISK_COLOR, type RiskResult } from "@/lib/engine/risk";

const card = "rounded-2xl border border-white/10 bg-[#0d1322]/60 p-4";
const h2 = "text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3";
const tip = { background: "#0d1322", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 } as const;

const CONF_COLOR: Record<string, string> = { high: "#34d399", medium: "#fbbf24", low: "#64748b" };
const DIR_ICON: Record<string, string> = { positive: "↑", negative: "↓", none: "→" };

function RiskPanel({ title, risk }: { title: string; risk: RiskResult }) {
  const c = RISK_COLOR[risk.level];
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: `${c}55`, background: `${c}0d` }}>
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        <span className="text-lg font-extrabold" style={{ color: c }}>{risk.level}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/5">
        <div className="h-full rounded-full" style={{ width: `${risk.score}%`, background: c }} />
      </div>
      <p className="mt-1 text-[11px] text-slate-500">{risk.score}/100</p>
      {risk.reasons.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-[12px] text-slate-300">
          {risk.reasons.slice(0, 5).map((r, i) => <li key={i}>• {r}</li>)}
        </ul>
      )}
    </div>
  );
}

function Card({ c }: { c: CorrelationCard }) {
  const cc = CONF_COLOR[c.confidence];
  return (
    <div className={card}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-white">{c.name}</p>
        <span className="text-lg font-extrabold" style={{ color: c.direction === "negative" ? "#34d399" : c.direction === "positive" ? "#fb7185" : "#64748b" }}>{DIR_ICON[c.direction]}</span>
      </div>
      <p className="mt-1 text-[13px] leading-snug text-slate-300">{c.explanation}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
        <span>strength: <b className="text-slate-300">{c.strength}</b></span>
        <span>r = <b className="text-slate-300">{c.r}</b></span>
        <span>n = <b className="text-slate-300">{c.n}</b></span>
        <span style={{ color: cc }}>● {c.confidence} confidence</span>
      </div>
    </div>
  );
}

export function CorrelationDashboard({ r }: { r: CorrelationReport }) {
  if (!r.enoughData) {
    return (
      <div className={card + " text-center"}>
        <p className="text-4xl">🧠</p>
        <p className="mt-2 text-lg font-bold text-white">Not enough data yet</p>
        <p className="mt-1 text-sm text-slate-400">Log about {r.needMoreDays} more day{r.needMoreDays === 1 ? "" : "s"} of cravings, sleep, gym and spending and the correlation engine will start finding your patterns.</p>
        <p className="mt-1 text-[11px] text-slate-600">{r.daysLogged} day(s) of signal so far.</p>
      </div>
    );
  }

  const shown = r.cards.filter((c) => c.enough);
  const weak = r.cards.filter((c) => !c.enough);
  const g = r.graphs;

  return (
    <div className="space-y-4">
      {/* ── Recovery AI forecast ── */}
      <div className={card}>
        <p className={h2}>🤖 Recovery AI — relapse forecast (cannabis)</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <RiskPanel title="Today" risk={r.cannabisRiskToday} />
          <RiskPanel title="Tomorrow" risk={r.cannabisRiskTomorrow} />
        </div>
        {r.cannabisRiskToday.suggestions.length > 0 && (
          <div className="mt-3 rounded-xl border border-sky-400/20 bg-sky-400/5 p-3">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-sky-300">Defensive actions</p>
            <ul className="space-y-0.5 text-[12.5px] text-slate-200">
              {r.cannabisRiskToday.suggestions.slice(0, 5).map((s, i) => <li key={i}>→ {s}</li>)}
            </ul>
          </div>
        )}
        <p className="mt-2 text-[11px] text-slate-600">Nicotine relapse forecast appears in the 🚬 Nicotine Command Center, on the same engine.</p>
      </div>

      {/* ── Insight feed ── */}
      {r.insights.length > 0 && (
        <div className={card}>
          <p className={h2}>💡 Insight feed</p>
          <ul className="space-y-1.5">
            {r.insights.map((t, i) => (
              <li key={i} className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-[13px] text-slate-200">{t}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Risk patterns ── */}
      {r.patterns.length > 0 && (
        <div className={card}>
          <p className={h2}>⚠ Risk patterns detected</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {r.patterns.map((p) => {
              const col = p.severity === "danger" ? "#ff5470" : p.severity === "warn" ? "#fbbf24" : "#38bdf8";
              return (
                <div key={p.key} className="rounded-xl border p-3" style={{ borderColor: `${col}40` }}>
                  <p className="text-sm font-semibold" style={{ color: col }}>{p.title}</p>
                  <p className="mt-0.5 text-[12.5px] text-slate-300">{p.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Correlation cards ── */}
      <div>
        <p className={h2}>🔗 Correlations found</p>
        {shown.length ? (
          <div className="grid gap-3 sm:grid-cols-2">{shown.map((c) => <Card key={c.id} c={c} />)}</div>
        ) : (
          <div className={card}><p className="text-sm text-slate-400">No strong relationships yet — keep logging and they&apos;ll surface here.</p></div>
        )}
        {weak.length > 0 && (
          <p className="mt-2 text-[11px] text-slate-600">{weak.length} more relationship{weak.length === 1 ? "" : "s"} being watched (not enough data or too weak to call).</p>
        )}
      </div>

      {/* ── Graphs ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className={card}>
          <p className={h2}>Sleep vs cravings</p>
          {g.sleepVsCraving.length >= 3 ? (
            <ResponsiveContainer width="100%" height={170}>
              <ScatterChart margin={{ top: 5, right: 10, bottom: 5, left: -22 }}>
                <XAxis type="number" dataKey="sleep" name="sleep" unit="h" tick={{ fontSize: 10, fill: "#64748b" }} domain={[0, "dataMax"]} />
                <YAxis type="number" dataKey="craving" name="craving" tick={{ fontSize: 10, fill: "#64748b" }} />
                <ZAxis range={[40, 40]} />
                <Tooltip contentStyle={tip} cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={g.sleepVsCraving} fill="#38bdf8" />
              </ScatterChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-500">Need more sleep + craving days.</p>}
        </div>
        <div className={card}>
          <p className={h2}>Spending vs cravings</p>
          {g.spendVsCraving.length >= 3 ? (
            <ResponsiveContainer width="100%" height={170}>
              <ScatterChart margin={{ top: 5, right: 10, bottom: 5, left: -22 }}>
                <XAxis type="number" dataKey="craving" name="craving" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis type="number" dataKey="spend" name="spend" unit="£" tick={{ fontSize: 10, fill: "#64748b" }} />
                <ZAxis range={[40, 40]} />
                <Tooltip contentStyle={tip} cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={g.spendVsCraving} fill="#fb7185" />
              </ScatterChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-500">Need more spend + craving days.</p>}
        </div>
        <div className={card}>
          <p className={h2}>Cravings by day of week</p>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={g.cravingByDow} margin={{ top: 5, right: 8, bottom: 0, left: -24 }}>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip contentStyle={tip} />
              <Bar dataKey="avg" radius={[3, 3, 0, 0]}>
                {g.cravingByDow.map((d, i) => <Cell key={i} fill={d.avg >= Math.max(...g.cravingByDow.map((x) => x.avg)) && d.avg > 0 ? "#ff5470" : "#f59e0b"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className={card}>
          <p className={h2}>Relapse risk trend (30d)</p>
          {g.riskTrend.length >= 3 ? (
            <ResponsiveContainer width="100%" height={170}>
              <LineChart data={g.riskTrend} margin={{ top: 5, right: 8, bottom: 0, left: -24 }}>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#64748b" }} interval={4} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} />
                <Tooltip contentStyle={tip} />
                <Line type="monotone" dataKey="risk" stroke="#fb7185" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-500">Building the trend…</p>}
        </div>
        <div className={card + " sm:col-span-2"}>
          <p className={h2}>Discipline vs clean time</p>
          {g.disciplineVsClean.length >= 3 ? (
            <ResponsiveContainer width="100%" height={180}>
              <ScatterChart margin={{ top: 5, right: 10, bottom: 5, left: -18 }}>
                <XAxis type="number" dataKey="clean" name="clean days" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis type="number" dataKey="discipline" name="life score" domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} />
                <ZAxis range={[40, 40]} />
                <Tooltip contentStyle={tip} cursor={{ strokeDasharray: "3 3" }} />
                <Scatter data={g.disciplineVsClean} fill="#34d399" />
              </ScatterChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-slate-500">Need more days with a life score.</p>}
        </div>
      </div>

      {/* ── Summary tiles ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Cravings won" value={r.cravingSummary.won} color="#34f5c5" accent="#34f5c5" />
        <StatTile label="Cravings lost" value={r.cravingSummary.lost} color="#ff5470" accent="#ff5470" />
        <StatTile label="Victory rate" value={`${r.cravingSummary.victoryRate}%`} accent="#f59e0b" />
        <StatTile label="Days of signal" value={r.daysLogged} accent="#38bdf8" />
      </div>
    </div>
  );
}
