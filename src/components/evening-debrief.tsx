// AmanOS — Evening Debrief (presentational, pure). CEO after-action-review tone.
import type { EveningDebrief as EveningDebriefData } from "@/lib/rituals";

const VERDICT_COLOR: Record<string, string> = { Won: "#34f5c5", Partial: "#fbbf24", Drift: "#fb7185" };

export function EveningDebrief({ data: e }: { data: EveningDebriefData }) {
  const vc = VERDICT_COLOR[e.verdict];
  return (
    <div className="space-y-3">
      <div className="card border border-violet-500/30" style={{ background: "linear-gradient(160deg, rgba(167,139,250,0.10), rgba(13,19,34,0.6))" }}>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300">📋 After-Action Review</p>
        <h2 className="mt-1 text-xl font-extrabold text-white">Today’s Debrief</h2>
        <p className="mt-1 text-[12px] text-slate-400">Judge the day honestly. Set tomorrow up to win.</p>
      </div>

      {/* Verdict + score */}
      <div className="card text-center">
        <p className="label">Verdict</p>
        <p className="mt-1 text-3xl font-extrabold" style={{ color: vc }}>{e.verdict === "Won" ? "WON ✓" : e.verdict === "Partial" ? "PARTIAL" : "DRIFT ✕"}</p>
        <p className="mt-1 text-[13px] text-slate-300">Score achieved: <span className="font-bold" style={{ color: vc }}>{e.achievedScore}/100</span></p>
      </div>

      {/* Executed vs missed */}
      <div className="card grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Completed ({e.completed.length})</p>
          <ul className="mt-1.5 space-y-1 text-[12px]">
            {e.completed.length ? e.completed.map((x) => <li key={x} className="text-neon-green">✓ {x}</li>) : <li className="text-slate-500">—</li>}
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Missed ({e.missed.length})</p>
          <ul className="mt-1.5 space-y-1 text-[12px]">
            {e.missed.length ? e.missed.map((x) => <li key={x} className="text-rose-300">✕ {x}</li>) : <li className="text-neon-green">None — full sweep 🎉</li>}
          </ul>
        </div>
      </div>

      {/* Win / failure */}
      <div className="card grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-neon-green/30 bg-neon-green/5 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Biggest win</p>
          <p className="mt-0.5 text-[13px] font-semibold text-neon-green">{e.biggestWin}</p>
        </div>
        <div className="rounded-xl border border-neon-red/30 bg-neon-red/5 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Biggest failure</p>
          <p className="mt-0.5 text-[13px] font-semibold text-neon-red">{e.biggestFailure}</p>
        </div>
      </div>

      {/* Point ledger */}
      {e.pointLedger.length > 0 && (
        <div className="card">
          <p className="label">What cost points</p>
          <div className="mt-2 space-y-1 text-[12px]">
            {e.pointLedger.map((p) => (
              <div key={p.label} className="flex items-center justify-between">
                <span className="text-slate-300">{p.label}</span>
                <span className="font-semibold text-neon-red">−{p.lost}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tomorrow setup */}
      <div className="card border border-neon-amber/30" style={{ background: "linear-gradient(160deg, rgba(251,191,36,0.08), rgba(13,19,34,0.55))" }}>
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Tomorrow’s setup</p>
        <p className="mt-0.5 text-[13px] text-slate-100"><span className="text-neon-amber">ONE Thing:</span> {e.tomorrowOneThing.title} <span className="text-[10px] text-slate-500">({e.tomorrowOneThing.domain})</span></p>
        <p className="mt-1 text-[12px] text-slate-300"><span className="text-slate-500">Starting risk (est.):</span> <span style={{ color: VERDICT_COLOR[e.tomorrowRisk.level === "Low" ? "Won" : e.tomorrowRisk.level === "Elevated" ? "Partial" : "Drift"] }}>{e.tomorrowRisk.level}</span> — {e.tomorrowRisk.note}</p>
      </div>
    </div>
  );
}
