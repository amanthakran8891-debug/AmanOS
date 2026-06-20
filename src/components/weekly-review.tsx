// AmanOS — Weekly CEO Review (presentational, pure). Full panel for /reports +
// a compact card for the Home cockpit that links through.
import Link from "next/link";
import type { WeeklyCeoReview, HabitAdherence } from "@/lib/weekly-review";

function habitColor(pct: number): string {
  return pct >= 80 ? "#34f5c5" : pct >= 50 ? "#fbbf24" : "#fb7185";
}

function HabitBar({ h }: { h: HabitAdherence }) {
  return (
    <div>
      <div className="flex justify-between text-[11px]">
        <span className="text-slate-400">{h.label}</span>
        <span className="font-semibold" style={{ color: habitColor(h.pct) }}>{h.metDays}/7</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div style={{ width: `${h.pct}%`, background: habitColor(h.pct) }} className="h-full" />
      </div>
    </div>
  );
}

export function WeeklyReviewPanel({ data: r }: { data: WeeklyCeoReview }) {
  const Row = ({ label, text }: { label: string; text: string }) => (
    <div className="border-b border-line/40 py-1.5 last:border-0">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-[13px] text-slate-200">{text}</p>
    </div>
  );

  return (
    <div className="card">
      <div>
        <p className="label">🗂️ Weekly CEO Review</p>
        <p className="mt-0.5 text-[11px] text-slate-500">{r.rangeLabel} · the whole Life OS in one glance.</p>
      </div>

      {/* Win / failure */}
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-neon-green/30 bg-neon-green/5 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Biggest win</p>
          <p className="mt-0.5 text-[13px] font-semibold text-neon-green">{r.biggestWin}</p>
        </div>
        <div className="rounded-xl border border-neon-red/30 bg-neon-red/5 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Biggest failure</p>
          <p className="mt-0.5 text-[13px] font-semibold text-neon-red">{r.biggestFailure}</p>
        </div>
      </div>

      {/* Best / weakest + money */}
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-line bg-surface-2/50 p-2.5 text-center"><p className="text-[10px] uppercase tracking-wide text-slate-500">Best habit</p><p className="mt-0.5 text-sm font-bold text-neon-green">{r.bestHabit ? `${r.bestHabit.label} ${r.bestHabit.pct}%` : "—"}</p></div>
        <div className="rounded-xl border border-line bg-surface-2/50 p-2.5 text-center"><p className="text-[10px] uppercase tracking-wide text-slate-500">Weakest habit</p><p className="mt-0.5 text-sm font-bold text-neon-red">{r.weakestHabit ? `${r.weakestHabit.label} ${r.weakestHabit.pct}%` : "—"}</p></div>
        <div className="rounded-xl border border-line bg-surface-2/50 p-2.5 text-center"><p className="text-[10px] uppercase tracking-wide text-slate-500">Money lost</p><p className="mt-0.5 text-sm font-bold text-neon-red">£{r.moneyLost.toFixed(2)}</p></div>
        <div className="rounded-xl border border-line bg-surface-2/50 p-2.5 text-center"><p className="text-[10px] uppercase tracking-wide text-slate-500">Money saved</p><p className="mt-0.5 text-sm font-bold text-neon-green">£{r.moneySaved.toFixed(2)}</p></div>
      </div>

      {/* Habit adherence */}
      <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-slate-400">Habit adherence (7d)</p>
      <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
        {r.habits.map((h) => <HabitBar key={h.key} h={h} />)}
      </div>

      {/* Domain summaries */}
      <div className="mt-3 rounded-xl border border-line bg-surface-2/40 p-3">
        <Row label="Recovery" text={r.summaries.recovery} />
        <Row label="NCLEX" text={r.summaries.nclex} />
        <Row label="Fitness" text={r.summaries.fitness} />
        <Row label="BharatFare" text={r.summaries.bharatfare} />
        <Row label="Career" text={r.summaries.career} />
        <Row label="Discipline" text={r.summaries.discipline} />
      </div>

      {/* Forward look */}
      <div className="mt-3 rounded-xl border border-neon-amber/30 bg-neon-amber/5 p-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Next week focus</p>
        <p className="mt-0.5 text-[13px] font-semibold text-slate-100">{r.nextWeekFocus}</p>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-slate-500">Monday’s ONE Thing</p>
        <p className="text-[13px] text-slate-200"><span className="text-neon-amber">{r.mondayOneThing.domain}:</span> {r.mondayOneThing.title}</p>
      </div>
    </div>
  );
}

export function WeeklyReviewMini({ data: r }: { data: WeeklyCeoReview }) {
  return (
    <Link href="/reports" className="card block transition hover:border-neon-amber/50">
      <div className="flex items-center justify-between">
        <p className="label">🗂️ Weekly CEO Review</p>
        <span className="text-[11px] font-semibold text-blue-300">Open →</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-[12px] sm:grid-cols-4">
        <span className="text-slate-300">Win: <span className="text-neon-green">{r.bestHabit ? r.bestHabit.label : "—"}</span></span>
        <span className="text-slate-300">Weak: <span className="text-neon-red">{r.weakestHabit ? r.weakestHabit.label : "—"}</span></span>
        <span className="text-slate-300">Lost: <span className="text-neon-red">£{r.moneyLost.toFixed(0)}</span></span>
        <span className="text-slate-300">Saved: <span className="text-neon-green">£{r.moneySaved.toFixed(0)}</span></span>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">Focus: {r.nextWeekFocus}</p>
    </Link>
  );
}
