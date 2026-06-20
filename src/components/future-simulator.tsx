"use client";

// AmanOS — Future Aman Simulator panel. Scenario toggle drives every domain's
// horizon table. All values are labelled estimates/projections, not predictions.
import { useState } from "react";
import Link from "next/link";
import { HORIZONS, type FutureSimulation, type Scenario, type Metric } from "@/lib/future-simulator";

const SCEN: { key: Scenario; label: string; color: string }[] = [
  { key: "continue", label: "Continue", color: "#22d3ee" },
  { key: "improve", label: "Improve +20%", color: "#34f5c5" },
  { key: "worsen", label: "Worsen −20%", color: "#fb7185" },
];

function fmt(v: number, unit: string): string {
  if (unit === "£") return `£${v.toLocaleString()}`;
  return `${v.toLocaleString()}${unit}`;
}

export function FutureSimulatorPanel({ data }: { data: FutureSimulation }) {
  const [scen, setScen] = useState<Scenario>("continue");

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="label">🔮 Future Aman Simulator</p>
          <p className="mt-0.5 text-[11px] text-slate-500">Where today’s habits lead — 30 / 90 / 180 / 365 days.</p>
        </div>
        <div className="flex gap-1">
          {SCEN.map((s) => (
            <button key={s.key} onClick={() => setScen(s.key)} className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${scen === s.key ? "bg-surface-2" : "text-slate-500 hover:text-slate-300"}`} style={scen === s.key ? { color: s.color } : undefined}>{s.label}</button>
          ))}
        </div>
      </div>

      {data.domains.map((d) => (
        <div key={d.key} className="mt-3">
          <p className="text-[11px] font-bold text-slate-200">{d.title}</p>
          <div className="mt-1 overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-line text-[10px] uppercase tracking-wide text-slate-500">
                  <th className="py-1 pr-2 text-left">Metric</th>
                  {HORIZONS.map((h) => <th key={h} className="py-1 pr-2 text-right">{h}d</th>)}
                </tr>
              </thead>
              <tbody>
                {d.metrics.map((m: Metric) => (
                  <tr key={m.label} className="border-b border-line/40 last:border-0">
                    <td className="py-1 pr-2 text-slate-400">{m.label}</td>
                    {m.scenarios[scen].map((v, i) => (
                      <td key={i} className="py-1 pr-2 text-right font-semibold text-slate-100">{fmt(v, m.unit)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {d.notes && <p className="mt-1 text-[11px] text-slate-500">{d.notes[scen]}</p>}
        </div>
      ))}

      <p className="mt-3 text-[10px] italic text-slate-500">{data.disclaimer}</p>
    </div>
  );
}

// Compact Home card — Continue scenario at 365 days, a few headline numbers.
function pick(data: FutureSimulation, domainKey: string, label: string): { v: number; unit: string } | null {
  const dom = data.domains.find((d) => d.key === domainKey);
  const m = dom?.metrics.find((x) => x.label === label);
  if (!m) return null;
  return { v: m.scenarios.continue[3], unit: m.unit }; // 365d
}

export function FutureMini({ data }: { data: FutureSimulation }) {
  const clean = pick(data, "recovery", "Clean days");
  const ready = pick(data, "nclex", "Readiness");
  const fit = pick(data, "fitness", "Fitness score");
  const saved = pick(data, "recovery", "Money saved");
  return (
    <Link href="/future" className="card block transition hover:border-neon-amber/50">
      <div className="flex items-center justify-between">
        <p className="label">🔮 Future Aman — 1 year (if you continue)</p>
        <span className="text-[11px] font-semibold text-blue-300">Open →</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-[12px] sm:grid-cols-4">
        {clean && <span className="text-slate-300">Clean: <span className="font-semibold text-neon-green">{clean.v}d</span></span>}
        {saved && <span className="text-slate-300">Saved: <span className="font-semibold text-neon-green">£{saved.v.toLocaleString()}</span></span>}
        {ready && <span className="text-slate-300">NCLEX: <span className="font-semibold text-slate-100">{ready.v}/100</span></span>}
        {fit && <span className="text-slate-300">Fitness: <span className="font-semibold text-slate-100">{fit.v}/100</span></span>}
      </div>
      <p className="mt-2 text-[10px] italic text-slate-500">Estimate, not a prediction.</p>
    </Link>
  );
}
