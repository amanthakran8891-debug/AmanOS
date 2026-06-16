"use client";

import type { WeeklyReview, MonthlyReview } from "@/lib/reviews";

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCsv(title: string, rows: [string, string | number][]) {
  return `${title}\nMetric,Value\n` + rows.map(([k, v]) => `"${k}","${String(v).replace(/"/g, '""')}"`).join("\n") + "\n";
}

function weeklyRows(w: WeeklyReview): [string, string | number][] {
  return [
    ["Period", `${w.start} to ${w.end}`],
    ["Days logged", w.daysLogged],
    ["Avg Life Score", w.avgLifeScore],
    ["Joint-free days", w.jointFreeDays],
    ["Relapses", w.relapses],
    ["Gym sessions", w.gymSessions],
    ["Protein avg (g)", w.proteinAvg],
    ["Water avg (ml)", w.waterAvg],
    ["Sleep avg (h)", w.sleepAvg],
    ["NCLEX hours", w.nclexHours],
    ["BharatFare tasks", w.bharatfareTasks],
    ["Total spend", w.totalSpend],
    ["Best day", w.best ? `${w.best.date} (${w.best.lifeScore})` : "—"],
    ["Worst day", w.worst ? `${w.worst.date} (${w.worst.lifeScore})` : "—"],
    ["Lesson", w.lesson || "—"],
    ["Next focus", w.focus || "—"],
  ];
}

function monthlyRows(m: MonthlyReview): [string, string | number][] {
  return [
    ["Month", m.periodKey],
    ["Days logged", m.daysLogged],
    ["Avg Life Score", m.avgLifeScore],
    ["Weight change (kg)", m.weightChange ?? "—"],
    ["Joint-free %", m.jointFreePct],
    ["Relapses", m.relapses],
    ["Gym consistency %", m.gymConsistency],
    ["Gym sessions", m.gymSessions],
    ["Nutrition consistency %", m.nutritionConsistency],
    ["Protein avg (g)", m.proteinAvg],
    ["NCLEX hours", m.nclexHours],
    ["NCLEX questions", m.nclexQuestions],
    ["BharatFare rate %", m.bharatfareRate],
    ["Total spend", m.totalSpend],
    ["Dragon power start→end", `${m.dragonStartPower}% -> ${m.dragonEndPower}%`],
    ["Achievements unlocked", m.achievementsUnlocked.length],
    ...m.spendByCategory.map((c) => [`Spend · ${c.category}`, c.amount] as [string, number]),
    ["Lesson", m.lesson || "—"],
    ["Next focus", m.focus || "—"],
  ];
}

export function ReportsClient({ weekly, monthly }: { weekly: WeeklyReview; monthly: MonthlyReview }) {
  const w = weeklyRows(weekly);
  const m = monthlyRows(monthly);

  return (
    <div className="space-y-4">
      <Card title="Weekly Report" subtitle={`${weekly.start} → ${weekly.end}`} rows={w}>
        <button className="btn-neon" onClick={() => download(`amanos-weekly-${weekly.start}.csv`, toCsv("AmanOS Weekly Report", w), "text/csv")}>Download CSV</button>
        <button className="btn-ghost" onClick={() => download(`amanos-weekly-${weekly.start}.json`, JSON.stringify(weekly, null, 2), "application/json")}>JSON</button>
      </Card>

      <Card title="Monthly Report" subtitle={monthly.periodKey} rows={m}>
        <button className="btn-neon" onClick={() => download(`amanos-monthly-${monthly.periodKey}.csv`, toCsv("AmanOS Monthly Report", m), "text/csv")}>Download CSV</button>
        <button className="btn-ghost" onClick={() => download(`amanos-monthly-${monthly.periodKey}.json`, JSON.stringify(monthly, null, 2), "application/json")}>JSON</button>
      </Card>

      <div className="flex flex-wrap gap-2">
        <button className="btn-ghost" onClick={() => download(`amanos-all-${weekly.end}.json`, JSON.stringify({ weekly, monthly }, null, 2), "application/json")}>Download everything (JSON)</button>
        <button className="btn-ghost" onClick={() => window.print()}>Print / Save as PDF</button>
      </div>
    </div>
  );
}

function Card({ title, subtitle, rows, children }: { title: string; subtitle: string; rows: [string, string | number][]; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="label">{title}</p>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
        <div className="flex gap-2">{children}</div>
      </div>
      <div className="mt-3 max-h-64 overflow-auto rounded-xl border border-line">
        <table className="w-full text-left text-xs">
          <tbody>
            {rows.map(([k, v], i) => (
              <tr key={k + i} className={i % 2 ? "bg-surface-2/40" : ""}>
                <td className="px-3 py-1.5 text-slate-400">{k}</td>
                <td className="px-3 py-1.5 text-right font-medium tabular-nums text-white">{String(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
