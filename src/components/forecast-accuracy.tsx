"use client";

interface AccuracyExample { date: string; band: string; relapsed: boolean; correct: boolean }
interface ForecastAccuracy { pct: number; sample: number; recent: AccuracyExample[] }

const SHORT_MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pretty = (date: string) => { const [, m, d] = date.split("-"); return `${Number(d)} ${SHORT_MONTH[Number(m) - 1]}`; };

export function ForecastAccuracyCard({ accuracy }: { accuracy: ForecastAccuracy }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="label text-neon-cyan">Forecast Accuracy</p>
          <p className="text-[11px] text-slate-500">Last 30 days · {accuracy.sample} resolved day{accuracy.sample === 1 ? "" : "s"}</p>
        </div>
        <p className="text-3xl font-black text-neon-cyan">{accuracy.pct}%</p>
      </div>

      {accuracy.sample < 5 ? (
        <p className="mt-3 text-sm text-slate-400">Calibrating — each day the forecast is recorded and checked against what actually happened. Accuracy sharpens over the first few weeks.</p>
      ) : (
        <div className="mt-3 space-y-1.5">
          {accuracy.recent.map((e) => (
            <div key={e.date} className="flex items-center justify-between rounded-xl border border-line bg-surface-2/50 px-3 py-2 text-[12px]">
              <span className="text-slate-400">{pretty(e.date)}</span>
              <span className="text-slate-300">Forecast: <span className="font-semibold">{e.band}</span></span>
              <span className={e.relapsed ? "text-neon-red" : "text-neon-green"}>{e.relapsed ? "Relapse" : "Clean"}</span>
              <span className={e.correct ? "text-neon-green" : "text-slate-500"}>{e.correct ? "✓ correct" : "✕ miss"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
