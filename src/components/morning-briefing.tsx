// AmanOS — Morning Briefing (presentational, pure). Military mission-briefing tone.
import type { MorningBriefing as MorningBriefingData } from "@/lib/rituals";
import { DailyBriefingCard } from "./daily-briefing";

const TONE: Record<string, string> = { good: "#34f5c5", warn: "#fbbf24", bad: "#fb7185" };

export function MorningBriefing({ data }: { data: MorningBriefingData }) {
  return (
    <div className="space-y-3">
      <div className="card border border-cyan-500/30" style={{ background: "linear-gradient(160deg, rgba(34,211,238,0.10), rgba(13,19,34,0.6))" }}>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">⛟ Mission Briefing</p>
        <h2 className="mt-1 text-xl font-extrabold text-white">Today’s Mission</h2>
        <p className="mt-1 text-[12px] text-slate-400">Read the threat. Hit the objective. Reach 2400 intact.</p>
      </div>

      {/* Core briefing (risk / ONE Thing / objectives / forecast) reused */}
      <DailyBriefingCard data={data.briefing} />

      {/* Sector status */}
      <div className="card">
        <p className="label">🛰 Sector Status</p>
        <div className="mt-2 space-y-1.5">
          {data.sectors.map((s) => (
            <div key={s.label} className="flex items-start justify-between gap-3 border-b border-line/40 py-1.5 last:border-0">
              <span className="flex items-center gap-2 text-[12px] font-semibold text-slate-200">
                <span className="inline-block h-2 w-2 rounded-full" style={{ background: TONE[s.tone] }} />
                {s.label}
              </span>
              <span className="text-right text-[11px] text-slate-400">{s.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
