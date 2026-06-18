"use client";

import type { IntelligenceReport } from "@/lib/coach";

export function IntelligenceReportCard({ report }: { report: IntelligenceReport }) {
  return (
    <div className="card">
      <p className="label text-neon-cyan">Recovery Intelligence Report</p>
      <p className="mt-1 text-[15px] font-semibold text-white">{report.headline}</p>

      {!report.enoughData ? (
        <p className="mt-3 text-sm text-slate-400">Keep logging cravings and daily habits — after about 10 tracked days, this report shows exactly what helps and what hurts your recovery.</p>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-neon-green/80">What helped recovery</p>
            <div className="mt-2 space-y-1.5">
              {report.helped.length === 0 && <p className="text-xs text-slate-500">No clear protective pattern yet.</p>}
              {report.helped.map((i) => (
                <div key={i.key} className="rounded-xl border border-neon-green/30 bg-neon-green/5 px-3 py-2">
                  <p className="text-sm font-semibold text-white">{i.label}</p>
                  <p className="text-[11px] text-neon-green">↓ {i.detail} <span className="text-slate-500">(n={i.n})</span></p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-neon-red/80">What increased risk</p>
            <div className="mt-2 space-y-1.5">
              {report.hurt.length === 0 && <p className="text-xs text-slate-500">No clear risk pattern this period.</p>}
              {report.hurt.map((i) => (
                <div key={i.key} className="rounded-xl border border-neon-red/30 bg-neon-red/5 px-3 py-2">
                  <p className="text-sm font-semibold text-white">{i.label}</p>
                  <p className="text-[11px] text-neon-red">↑ {i.detail} <span className="text-slate-500">(n={i.n})</span></p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <p className="mt-3 text-[10px] text-slate-500">Correlations from your last 42 days · directional, not medical advice.</p>
    </div>
  );
}
