// AmanOS — Phase 1, item 6: Craving Victory Rate panel (presentational, pure).
import type { CravingVictory } from "@/lib/craving-victory";

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-2/50 p-2.5 text-center">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-lg font-bold" style={{ color: color ?? "#e2e8f0" }}>{value}</p>
      {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
    </div>
  );
}

export function CravingVictoryPanel({ data }: { data: CravingVictory }) {
  const rateColor = data.victoryRate >= 80 ? "#34f5c5" : data.victoryRate >= 50 ? "#fbbf24" : "#fb7185";
  const winPct = (rate: number, count: number) => (count > 0 ? `${rate}%` : "—");

  return (
    <div className="card">
      <div>
        <p className="label">🛡️ Craving Victory Rate</p>
        <p className="mt-0.5 text-[11px] text-slate-500">Every craving you resist is a win. Logged from your craving history.</p>
      </div>

      {/* Headline */}
      <div className="mt-3 rounded-xl border border-line bg-surface-2/50 p-3 text-center">
        <p className="text-3xl font-extrabold" style={{ color: rateColor }}>{data.total > 0 ? `${data.victoryRate}%` : "—"}</p>
        <p className="mt-0.5 text-[12px] text-slate-300">{data.won} resisted · {data.lost} lost · {data.total} total</p>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Stat label="Last 7 days" value={winPct(data.last7Rate, data.last7Count)} sub={`${data.last7Count} cravings`} />
        <Stat label="Last 30 days" value={winPct(data.last30Rate, data.last30Count)} sub={`${data.last30Count} cravings`} />
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        <Stat label="Strongest resisted" value={data.strongestResisted > 0 ? `${data.strongestResisted}/10` : "—"} color="#34f5c5" />
        <Stat label="Danger window" value={data.mostDangerousWindow} />
        <Stat label="Top trigger" value={data.topTrigger} />
      </div>
    </div>
  );
}
