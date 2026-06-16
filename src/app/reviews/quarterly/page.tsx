import { getQuarterlyReview } from "@/lib/reviews";
import { PageHeader, StatTile, Bar, Delta, Empty } from "@/components/bits";
import { ReviewNotes } from "@/components/review-notes";
import { ReviewTabs } from "@/components/nav";

export const dynamic = "force-dynamic";

export default async function QuarterlyReviewPage() {
  const r = await getQuarterlyReview();
  const ba = r.beforeAfter;

  const rows: { label: string; from: number; to: number; unit: string; invert?: boolean }[] = [
    { label: "Life Score", from: ba.lifeScore[0], to: ba.lifeScore[1], unit: "" },
    { label: "Weight", from: ba.weight[0], to: ba.weight[1], unit: "kg", invert: true },
    { label: "Clean %", from: ba.cleanPct[0], to: ba.cleanPct[1], unit: "%" },
    { label: "Protein avg", from: ba.proteinAvg[0], to: ba.proteinAvg[1], unit: "g" },
    { label: "NCLEX hrs/day", from: ba.nclexHours[0], to: ba.nclexHours[1], unit: "h" },
  ];

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-6">
      <PageHeader title="Quarterly Review" subtitle={`${r.periodKey} · transformation`} accent="#fbbf24" />
      <ReviewTabs />

      {r.daysLogged === 0 ? (
        <Empty>No data this quarter yet — your transformation report builds as you log days.</Empty>
      ) : (
        <>
          <section className="card">
            <p className="label text-neon-amber">Transformation Summary</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-200">
              Over {r.daysLogged} logged days you stayed clean {r.addictionRecovery}% of the time
              {r.currentStreak > 0 ? `, riding a ${r.currentStreak}-day streak` : ""}. Discipline averaged{" "}
              <span className="font-bold text-neon-green">{r.disciplineScore}</span>/100, health consistency{" "}
              <span className="font-bold text-neon-cyan">{r.healthScore}</span>%, study{" "}
              <span className="font-bold text-neon-amber">{r.studyConsistency}</span>% of days, and BharatFare{" "}
              <span className="font-bold text-neon-cyan">{r.businessConsistency}</span>% of days.
            </p>
          </section>

          <section className="mt-4 card">
            <p className="label">Before vs After <span className="text-slate-500">(first half → second half)</span></p>
            <div className="mt-3 space-y-2">
              {rows.map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-xl border border-line bg-surface-2 px-3 py-2">
                  <span className="text-sm text-slate-300">{row.label}</span>
                  <span className="tabular-nums text-sm text-white">
                    {row.from}{row.unit} <span className="text-slate-600">→</span> {row.to}{row.unit}{" "}
                    <span className="ml-2 text-xs"><Delta from={row.from} to={row.to} unit={row.unit} invert={row.invert} /></span>
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatTile label="Discipline" value={r.disciplineScore} accent="#34f5c5" color="#34f5c5" />
            <StatTile label="Health" value={`${r.healthScore}%`} accent="#22d3ee" />
            <StatTile label="Recovery" value={`${r.addictionRecovery}%`} accent="#34f5c5" />
            <StatTile label="Finance" value={`${r.financialDiscipline}%`} accent="#a3e635" />
            <StatTile label="Study" value={`${r.studyConsistency}%`} accent="#fbbf24" />
            <StatTile label="Business" value={`${r.businessConsistency}%`} accent="#a78bfa" />
          </section>

          <section className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="card">
              <p className="label text-neon-green">Top 3 Wins</p>
              <ol className="mt-2 space-y-2">
                {r.wins.map((w, i) => (
                  <li key={w.name} className="flex items-center gap-3">
                    <span className="text-lg">{["🥇", "🥈", "🥉"][i]}</span>
                    <span className="flex-1 text-sm text-white">{w.name}</span>
                    <span className="text-sm font-bold text-neon-green">{w.value}%</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="card">
              <p className="label text-neon-red">Top 3 Weaknesses</p>
              <div className="mt-2 space-y-2">
                {r.weaknesses.map((w) => (
                  <Bar key={w.name} label={w.name} right={`${w.value}%`} value={w.value} color="#fb7185" />
                ))}
              </div>
            </div>
          </section>

          <section className="mt-4">
            <ReviewNotes period="quarter" periodKey={r.periodKey} lesson={r.lesson} focus={r.focus} lessonLabel="Biggest lesson of the quarter" focusLabel="Next quarter battle plan" />
          </section>
        </>
      )}
    </main>
  );
}
