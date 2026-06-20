// AmanOS — Phase 2, item 2: BharatFare CEO dashboard panel (presentational, pure).
import type { ReactNode } from "react";
import type { BharatfareCeo } from "@/lib/bharatfare-ceo";

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: ReactNode; color?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/50 p-2.5 text-center">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-base font-bold" style={{ color: color ?? "#e2e8f0" }}>{value}</p>
      {sub != null && <p className="text-[10px] text-slate-500">{sub}</p>}
    </div>
  );
}

function delta(n: number, money = false) {
  const s = `${n >= 0 ? "+" : ""}${money ? "£" : ""}${n}`;
  return <span className={n > 0 ? "text-neon-green" : n < 0 ? "text-neon-red" : "text-slate-400"}>{s}</span>;
}

function Graph({ points }: { points: BharatfareCeo["graph"] }) {
  const W = 300, H = 70, n = points.length;
  const max = Math.max(1, ...points.map((p) => p.revenue));
  const x = (i: number) => (n <= 1 ? 0 : (i / (n - 1)) * W);
  const y = (v: number) => H - (Math.max(0, v) / max) * H;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 70 }} preserveAspectRatio="none">
      {points.map((p, i) => (p.revenue <= 0 ? null : <rect key={p.date} x={x(i) - 2} y={y(p.revenue)} width={4} height={H - y(p.revenue)} fill="#22c55e" rx={1} />))}
    </svg>
  );
}

export function BharatfareCeoPanel({ data: d }: { data: BharatfareCeo }) {
  const bandColor = d.ceoScore >= 85 ? "#34f5c5" : d.ceoScore >= 65 ? "#a3e635" : d.ceoScore >= 40 ? "#22d3ee" : "#fb7185";

  if (!d.hasData) {
    return (
      <div className="card">
        <p className="label">💼 BharatFare CEO</p>
        <p className="mt-2 text-sm text-slate-400">No metrics yet. Add daily rows in <code className="text-slate-300">src/data/bharatfare-metrics.ts</code> to light up this dashboard.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div>
        <p className="label">💼 BharatFare CEO</p>
        <p className="mt-0.5 text-[11px] text-slate-500">Manual metrics (v0). Bookings &amp; profit are the truth — everything else is a leading signal.</p>
      </div>

      {/* CEO score */}
      <div className="mt-3 rounded-xl border border-line bg-surface-2/50 p-3 text-center">
        <p className="text-3xl font-extrabold" style={{ color: bandColor }}>{d.ceoScore}<span className="text-base text-slate-500">/100</span></p>
        <p className="mt-0.5 text-sm font-bold" style={{ color: bandColor }}>{d.band}</p>
        <p className="mt-1 text-[10px] text-slate-500">Revenue {d.scoreBreakdown.revenue} · Bookings {d.scoreBreakdown.bookings} · Conversion {d.scoreBreakdown.conversion} · Leads {d.scoreBreakdown.leads} · Growth {d.scoreBreakdown.growth}</p>
      </div>

      {/* Today */}
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
        <Stat label="Visitors" value={String(d.today.visitors)} />
        <Stat label="WA clicks" value={String(d.today.whatsappClicks)} />
        <Stat label="Leads" value={String(d.today.leads)} />
        <Stat label="Bookings" value={String(d.today.bookings)} color="#34f5c5" />
        <Stat label="Revenue" value={`£${d.today.revenue}`} color="#22c55e" />
        <Stat label="Profit" value={`£${d.today.profit}`} color="#22c55e" />
      </div>
      <p className="mt-1 text-center text-[10px] text-slate-500">today</p>

      {/* Week / month rollups */}
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Visitors 7d" value={String(d.week.visitors)} sub={`30d ${d.month.visitors}`} />
        <Stat label="Leads 7d" value={String(d.week.leads)} sub={`30d ${d.month.leads}`} />
        <Stat label="Bookings 7d" value={String(d.week.bookings)} color="#34f5c5" sub={`30d ${d.month.bookings}`} />
        <Stat label="Revenue 7d" value={`£${d.week.revenue}`} color="#22c55e" sub={`30d £${d.month.revenue}`} />
      </div>

      {/* Conversion + growth */}
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Stat label="Conversion" value={`${d.conversionRate}%`} sub="booking / lead (30d)" />
        <Stat label="Visitor→lead" value={`${d.visitorToLead}%`} sub="30d" />
        <div className="rounded-xl border border-line bg-surface-2/50 p-2.5 text-center">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Growth 7d</p>
          <p className="mt-0.5 text-base font-bold">{delta(d.growthPct)}%</p>
          <p className="text-[10px] text-slate-500">vs prev 7d</p>
        </div>
      </div>

      {/* Deltas */}
      <div className="mt-2 flex flex-wrap justify-around gap-2 rounded-xl border border-line bg-surface-2/40 p-2 text-[12px]">
        <span>Δ Revenue: {delta(d.deltas.revenue7, true)}</span>
        <span>Δ Leads: {delta(d.deltas.leads7)}</span>
        <span>Δ Bookings: {delta(d.deltas.bookings7)}</span>
      </div>

      {/* Trend */}
      <div className="mt-3 rounded-xl border border-line bg-surface-2/40 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Revenue — last 30 days</p>
        <div className="mt-2"><Graph points={d.graph} /></div>
      </div>
    </div>
  );
}
