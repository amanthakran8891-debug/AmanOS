// AmanOS — the ONE Thing card (presentational, pure). The single highest-priority
// action for today. Rendered at the top of Home/CEO cockpit and the Today page.
import type { OneThing } from "@/lib/one-thing";

const DOMAIN_COLOR: Record<string, string> = {
  Recovery: "#34f5c5",
  Career: "#fb7185",
  NCLEX: "#22d3ee",
  Fitness: "#a3e635",
  BharatFare: "#22c55e",
  Keystone: "#fbbf24",
};

export function OneThingCard({ data: t }: { data: OneThing }) {
  const color = DOMAIN_COLOR[t.domain] ?? "#fbbf24";
  return (
    <div className="card border" style={{ borderColor: `${color}55`, background: `linear-gradient(160deg, ${color}14, rgba(13,19,34,0.55))` }}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>★ Today’s ONE Thing</p>
        <span className="chip" style={{ color, borderColor: `${color}55` }}>{t.domain}</span>
      </div>

      <p className="mt-1.5 text-lg font-extrabold leading-snug text-white">
        {t.title}
        {t.done && <span className="ml-2 align-middle text-xs font-semibold text-neon-green">✓ done today</span>}
      </p>

      <p className="mt-1 text-[13px] text-slate-300">{t.why}</p>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
        <span className="rounded-lg border border-line bg-surface-2/60 px-2.5 py-1 text-slate-300">⏱ {t.timeEstimate}</span>
        <span className="rounded-lg border border-line bg-surface-2/60 px-2.5 py-1 font-semibold" style={{ color }}>+{t.xp} XP</span>
        <span className="rounded-lg border border-neon-red/30 bg-neon-red/10 px-2.5 py-1 text-neon-red/90">If ignored: {t.consequence}</span>
      </div>
    </div>
  );
}
