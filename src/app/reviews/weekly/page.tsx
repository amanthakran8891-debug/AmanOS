import { getWeeklyReview } from "@/lib/reviews";
import { PageHeader, StatTile, Empty } from "@/components/bits";
import { LifeScoreTrend } from "@/components/charts";
import { ReviewNotes } from "@/components/review-notes";
import { ReviewTabs } from "@/components/nav";

export const dynamic = "force-dynamic";

export default async function WeeklyReviewPage() {
  const r = await getWeeklyReview();
  const chart = r.series.map((s) => ({ date: s.date, lifeScore: s.lifeScore, weightKg: null, proteinG: 0, sleepHours: 0 }));

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-6">
      <PageHeader title="Weekly Review" subtitle={`${r.start} → ${r.end}`} accent="#34f5c5" />
      <ReviewTabs />

      {r.daysLogged === 0 ? (
        <Empty>No data logged this week yet. Track a day on the dashboard and your review fills in automatically.</Empty>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatTile label="Avg Life Score" value={r.avgLifeScore} accent="#34f5c5" color="#34f5c5" />
            <StatTile label="Joint-Free Days" value={`${r.jointFreeDays}/${r.daysLogged}`} accent="#34f5c5" />
            <StatTile label="Relapses" value={r.relapses} color={r.relapses ? "#fb7185" : "#34f5c5"} />
            <StatTile label="Gym Sessions" value={r.gymSessions} accent="#fb7185" />
            <StatTile label="BharatFare Tasks" value={r.bharatfareTasks} accent="#22d3ee" />
            <StatTile label="Protein Avg" value={`${r.proteinAvg}g`} accent="#a78bfa" />
            <StatTile label="Water Avg" value={`${(r.waterAvg / 1000).toFixed(1)}L`} accent="#22d3ee" />
            <StatTile label="Sleep Avg" value={`${r.sleepAvg}h`} accent="#34f5c5" />
            <StatTile label="NCLEX Hours" value={`${r.nclexHours}h`} accent="#fbbf24" />
            <StatTile label="Total Spend" value={r.totalSpend.toLocaleString()} accent="#fb7185" />
          </section>

          <section className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="card">
              <p className="label text-neon-green">Best Day</p>
              {r.best ? <p className="mt-1 text-lg font-bold text-white">{r.best.date} · <span className="text-neon-green">{r.best.lifeScore}</span></p> : <p className="text-sm text-slate-400">—</p>}
            </div>
            <div className="card">
              <p className="label text-neon-red">Worst Day</p>
              {r.worst ? <p className="mt-1 text-lg font-bold text-white">{r.worst.date} · <span className="text-neon-red">{r.worst.lifeScore}</span></p> : <p className="text-sm text-slate-400">—</p>}
            </div>
          </section>

          <section className="mt-4">
            <LifeScoreTrend data={chart} />
          </section>

          <section className="mt-4">
            <ReviewNotes period="week" periodKey={r.periodKey} lesson={r.lesson} focus={r.focus} lessonLabel="Lesson of the week" focusLabel="Next week focus" />
          </section>
        </>
      )}
    </main>
  );
}
