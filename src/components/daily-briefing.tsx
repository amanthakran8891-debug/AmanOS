// AmanOS — Live Daily Briefing card (presentational, pure).
import type { DailyBriefing } from "@/lib/daily-briefing";

export function DailyBriefingCard({ data: b }: { data: DailyBriefing }) {
  const lift = b.expectedScore - b.currentScore;
  const drop = b.currentScore - b.driftScore;
  return (
    <div className="card border border-neon-amber/30" style={{ background: "linear-gradient(160deg, rgba(251,191,36,0.10), rgba(13,19,34,0.55))" }}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-neon-amber">☀ Daily Command Briefing</p>

      {/* Risk + ONE Thing */}
      <div className="mt-2 space-y-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Biggest risk today</p>
          <p className="text-[13px] font-semibold text-neon-red">{b.biggestRisk.title}</p>
          <p className="text-[11px] text-slate-400">{b.biggestRisk.detail}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Your ONE Thing</p>
          <p className="text-[13px] font-semibold text-slate-100">{b.oneThing.title} <span className="text-[10px] font-normal text-slate-500">({b.oneThing.domain})</span></p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Avoid</p>
          <p className="text-[12px] text-amber-200/90">{b.avoid}</p>
        </div>
      </div>

      {/* Must complete before midnight */}
      <div className="mt-3 rounded-xl border border-line bg-surface-2/50 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Complete before midnight {b.remainingCount > 0 ? <span className="text-neon-red">· {b.remainingCount} left</span> : <span className="text-neon-green">· all done ✓</span>}</p>
        <ul className="mt-1.5 space-y-1">
          {b.tasks.map((t) => (
            <li key={t.label} className="flex items-center gap-2 text-[12px]">
              <span className={t.done ? "text-neon-green" : "text-slate-500"}>{t.done ? "✓" : "▢"}</span>
              <span className={t.done ? "text-slate-500 line-through" : "text-slate-200"}>{t.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Execute vs drift */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-neon-green/30 bg-neon-green/5 p-3 text-center">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">If you execute</p>
          <p className="mt-0.5 text-2xl font-extrabold text-neon-green">{b.expectedScore}<span className="text-xs text-slate-500">/100</span></p>
          <p className="text-[10px] text-slate-500">{lift >= 0 ? `+${lift}` : lift} vs now ({b.currentScore})</p>
        </div>
        <div className="rounded-xl border border-neon-red/30 bg-neon-red/5 p-3 text-center">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">If you drift</p>
          <p className="mt-0.5 text-2xl font-extrabold text-neon-red">{b.driftScore}<span className="text-xs text-slate-500">/100</span></p>
          <p className="text-[10px] text-slate-500">−{drop} + streak reset</p>
        </div>
      </div>
      <p className="mt-2 text-[10px] italic text-slate-500">{b.driftDamage}</p>
    </div>
  );
}
