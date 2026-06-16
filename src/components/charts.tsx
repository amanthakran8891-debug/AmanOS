"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Row = { date: string; lifeScore: number; weightKg: number | null; proteinG: number; sleepHours: number };

const dayLabel = (d: string) => d.slice(5); // MM-DD

const tooltipStyle = {
  background: "#0d1322",
  border: "1px solid #1e2942",
  borderRadius: 12,
  color: "#e8edf6",
  fontSize: 12,
};

export function LifeScoreTrend({ data }: { data: Row[] }) {
  return (
    <div className="card">
      <p className="label">Life Score · 30 days</p>
      <div className="mt-2 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="ls" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34f5c5" stopOpacity={0.7} />
                <stop offset="100%" stopColor="#34f5c5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#16203a" vertical={false} />
            <XAxis dataKey="date" tickFormatter={dayLabel} tick={{ fill: "#64748b", fontSize: 10 }} interval={6} />
            <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={dayLabel} />
            <Area type="monotone" dataKey="lifeScore" stroke="#34f5c5" strokeWidth={2} fill="url(#ls)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ProteinTrend({ data, target }: { data: Row[]; target: number }) {
  return (
    <div className="card">
      <p className="label">Protein · 30 days (target {target}g)</p>
      <div className="mt-2 h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
            <CartesianGrid stroke="#16203a" vertical={false} />
            <XAxis dataKey="date" tickFormatter={dayLabel} tick={{ fill: "#64748b", fontSize: 10 }} interval={6} />
            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
            <Tooltip contentStyle={tooltipStyle} labelFormatter={dayLabel} />
            <Bar dataKey="proteinG" fill="#a78bfa" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function WeightTrend({ data }: { data: Row[] }) {
  const pts = data.filter((d) => d.weightKg != null);
  return (
    <div className="card">
      <p className="label">Weight · 30 days</p>
      <div className="mt-2 h-44">
        {pts.length < 2 ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-500">Log weight on 2+ days to see the trend.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pts} margin={{ top: 6, right: 6, left: -22, bottom: 0 }}>
              <CartesianGrid stroke="#16203a" vertical={false} />
              <XAxis dataKey="date" tickFormatter={dayLabel} tick={{ fill: "#64748b", fontSize: 10 }} />
              <YAxis domain={["auto", "auto"]} tick={{ fill: "#64748b", fontSize: 10 }} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={dayLabel} />
              <Line type="monotone" dataKey="weightKg" stroke="#22d3ee" strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
