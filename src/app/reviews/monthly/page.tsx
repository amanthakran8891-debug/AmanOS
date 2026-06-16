import { getMonthlyReview, getNclexAnalytics, getBharatfareAnalytics } from "@/lib/reviews";
import { PageHeader, StatTile, Bar, Delta, Empty, Mini } from "@/components/bits";
import { LifeScoreTrend } from "@/components/charts";
import { ReviewNotes } from "@/components/review-notes";
import { Ring } from "@/components/ring";
import { ReviewTabs } from "@/components/nav";

export const dynamic = "force-dynamic";

const CAT_COLORS: Record<string, string> = {
  Food: "#fb7185", Travel: "#22d3ee", Gym: "#a3e635", Medical: "#f97316",
  Education: "#fbbf24", Bills: "#a78bfa", Entertainment: "#34f5c5", Other: "#94a3b8",
};

export default async function MonthlyReviewPage() {
  const [r, nclex, bf] = await Promise.all([getMonthlyReview(), getNclexAnalytics(30), getBharatfareAnalytics(30)]);
  const chart = r.lifeScoreTrend.map((s) => ({ date: s.date, lifeScore: s.lifeScore, weightKg: null, proteinG: 0, sleepHours: 0 }));
  const maxCat = Math.max(1, ...r.spendByCategory.map((c) => c.amount));

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-6">
      <PageHeader title="Monthly Review" subtitle={`${r.periodKey} · ${r.daysLogged} days logged`} accent="#a78bfa" />
      <ReviewTabs />

      {r.daysLogged === 0 ? (
        <Empty>Nothing logged this month yet.</Empty>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <StatTile label="Weight Change" value={r.weightChange == null ? "—" : <>{r.weightChange > 0 ? "+" : ""}{r.weightChange}kg</>} sub={r.weightStart != null && r.weightEnd != null ? `${r.weightStart} → ${r.weightEnd}` : "log 2+ days"} color={r.weightChange != null && r.weightChange <= 0 ? "#34f5c5" : "#e8edf6"} />
            <StatTile label="Joint-Free" value={`${r.jointFreePct}%`} sub={`${r.relapses} relapse(s)`} color={r.jointFreePct >= 90 ? "#34f5c5" : r.jointFreePct >= 60 ? "#fbbf24" : "#fb7185"} />
            <StatTile label="Avg Life Score" value={r.avgLifeScore} accent="#34f5c5" color="#34f5c5" />
            <StatTile label="Achievements" value={r.achievementsUnlocked.length} sub="unlocked this month" accent="#fbbf24" />
          </section>

          <section className="mt-4 card">
            <p className="label">Consistency</p>
            <div className="mt-3 space-y-3">
              <Bar label="Gym consistency" right={`${r.gymConsistency}% · ${r.gymSessions} sessions`} value={r.gymConsistency} color="#fb7185" />
              <Bar label="Nutrition (protein target)" right={`${r.nutritionConsistency}% · avg ${r.proteinAvg}g`} value={r.nutritionConsistency} color="#a78bfa" />
              <Bar label="BharatFare" right={`${r.bharatfareRate}% · ${r.bharatfareDays} days`} value={r.bharatfareRate} color="#22d3ee" />
            </div>
          </section>

          <section className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="card">
              <p className="label text-neon-amber">NCLEX / AHPRA Progress</p>
              <p className="mt-1 text-2xl font-bold text-white">{r.nclexHours}h <span className="text-sm font-normal text-slate-400">· {r.nclexQuestions.toLocaleString()} questions</span></p>
            </div>
            <div className="card">
              <p className="label">Dragon Power Change</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-white">{r.dragonStartPower}% <span className="text-slate-600">→</span> {r.dragonEndPower}% <span className="ml-2 text-sm"><Delta from={r.dragonStartPower} to={r.dragonEndPower} unit="%" invert /></span></p>
              <p className="text-[11px] text-slate-400">Lower is better — the addiction weakening.</p>
            </div>
          </section>

          <section className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="card">
              <p className="label">Spending by Category · {r.totalSpend.toLocaleString()} total</p>
              <div className="mt-3 space-y-2">
                {r.spendByCategory.length === 0 && <p className="text-sm text-slate-400">No expenses logged.</p>}
                {r.spendByCategory.map((c) => (
                  <Bar key={c.category} label={c.category} right={c.amount.toLocaleString()} value={c.amount} max={maxCat} color={CAT_COLORS[c.category] ?? "#94a3b8"} />
                ))}
              </div>
            </div>
            <LifeScoreTrend data={chart} />
          </section>

          {/* Detailed NCLEX / BharatFare analytics (30-day) */}
          <section className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label text-neon-amber">NCLEX / AHPRA Analytics · 30d</p>
                  <p className="mt-1 text-2xl font-bold text-white">{nclex.totalHours}h <span className="text-sm font-normal text-slate-400">· {nclex.totalQuestions.toLocaleString()} Qs</span></p>
                </div>
                <Ring value={nclex.readiness} max={100} size={84} stroke={9} color="#fbbf24" center={<span className="text-sm font-bold text-white">{nclex.readiness}%</span>} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <Mini label="Study days" value={`${nclex.studyDays}`} />
                <Mini label="Avg / study day" value={`${nclex.avgHoursPerStudyDay}h`} />
                <Mini label="Current streak" value={`${nclex.currentStreak}d`} />
                <Mini label="Longest streak" value={`${nclex.longestStreak}d`} />
              </div>
              <p className="mt-2 text-[10px] text-slate-500">Readiness = progress toward {300}h + {3000} questions.</p>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label text-neon-cyan">BharatFare Analytics · 30d</p>
                  <p className="mt-1 text-2xl font-bold text-white">{bf.completionRate}% <span className="text-sm font-normal text-slate-400">· {bf.doneDays}/{bf.daysLogged} days</span></p>
                </div>
                <Ring value={bf.completionRate} max={100} size={84} stroke={9} color="#22d3ee" center={<span className="text-sm font-bold text-white">{bf.completionRate}%</span>} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <Mini label="Current streak" value={`${bf.currentStreak}d`} />
                <Mini label="Longest streak" value={`${bf.longestStreak}d`} />
              </div>
              <p className="mt-2 text-[10px] text-slate-500">Daily-improvement completion. Add revenue/leads tracking later via a schema field.</p>
            </div>
          </section>

          <section className="mt-4">
            <ReviewNotes period="month" periodKey={r.periodKey} lesson={r.lesson} focus={r.focus} lessonLabel="Lesson of the month" focusLabel="Next month focus" />
          </section>
        </>
      )}
    </main>
  );
}
