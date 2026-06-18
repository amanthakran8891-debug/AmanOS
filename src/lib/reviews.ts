import prisma from "@/lib/db";
import { todayKey, addDaysKey, keyToDate } from "@/lib/dates";
import { dragonState, ratio } from "@/lib/score";
import { streakDaysFrom } from "@/lib/clean-time";

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const avg = (xs: number[]) => (xs.length ? sum(xs) / xs.length : 0);
const r0 = (n: number) => Math.round(n);
const r1 = (n: number) => Math.round(n * 10) / 10;
const pct = (a: number, b: number) => (b > 0 ? Math.round((a / b) * 100) : 0);

type Day = Awaited<ReturnType<typeof loadDays>>[number];

async function settings() {
  return (
    (await prisma.settings.findUnique({ where: { id: 1 } })) ?? {
      proteinTarget: 140,
      waterTarget: 3000,
      sleepTarget: 8,
      stepsTarget: 8000,
      nclexHoursTarget: 4,
      dailyBudget: 1000,
      gymDaysTarget: 4,
      noJointGoalDays: 90,
      longestStreakDays: 0,
      lastJointAt: null as Date | null,
    }
  );
}

function loadDays(startKey: string, endKey: string) {
  return prisma.dayLog.findMany({ where: { date: { gte: startKey, lte: endKey } }, orderBy: { date: "asc" } });
}
function loadExpenses(startKey: string, endKey: string) {
  return prisma.expense.findMany({ where: { date: { gte: startKey, lte: endKey } } });
}
async function countRelapses(startKey: string, endKey: string) {
  const start = keyToDate(startKey);
  const end = keyToDate(endKey);
  end.setHours(23, 59, 59, 999);
  return prisma.jointEvent.count({ where: { type: "relapse", at: { gte: start, lte: end } } });
}

/** Per-day dragon power using a running clean streak inside the range. */
function dragonSeries(days: Day[]) {
  let streak = 0;
  return days.map((d) => {
    streak = d.jointClean ? streak + 1 : 0;
    return { date: d.date, power: dragonState(d.lifeScore, streak).power, lifeScore: d.lifeScore };
  });
}

function healthConsistency(days: Day[], s: Awaited<ReturnType<typeof settings>>) {
  if (!days.length) return 0;
  const perDay = days.map(
    (d) =>
      (ratio(d.proteinG, s.proteinTarget) +
        ratio(d.waterMl, s.waterTarget) +
        ratio(d.sleepHours, s.sleepTarget) +
        ratio(d.steps, s.stepsTarget)) /
      4,
  );
  return Math.round(avg(perDay) * 100);
}

function spendByDay(expenses: { date: string; amount: number }[]) {
  const m: Record<string, number> = {};
  for (const e of expenses) m[e.date] = (m[e.date] ?? 0) + e.amount;
  return m;
}

// ── Weekly ───────────────────────────────────────────────────────────────────
export async function getWeeklyReview() {
  const end = todayKey();
  const start = addDaysKey(end, -6);
  const [days, expenses, relapses, review] = await Promise.all([
    loadDays(start, end),
    loadExpenses(start, end),
    countRelapses(start, end),
    prisma.review.findUnique({ where: { period_periodKey: { period: "week", periodKey: start } } }),
  ]);

  const best = days.length ? days.reduce((a, b) => (b.lifeScore > a.lifeScore ? b : a)) : null;
  const worst = days.length ? days.reduce((a, b) => (b.lifeScore < a.lifeScore ? b : a)) : null;

  return {
    period: "week" as const,
    periodKey: start,
    start,
    end,
    daysLogged: days.length,
    avgLifeScore: r0(avg(days.map((d) => d.lifeScore))),
    jointFreeDays: days.filter((d) => d.jointClean).length,
    relapses,
    gymSessions: days.filter((d) => d.gymDone).length,
    proteinAvg: r0(avg(days.map((d) => d.proteinG))),
    waterAvg: r0(avg(days.map((d) => d.waterMl))),
    sleepAvg: r1(avg(days.map((d) => d.sleepHours))),
    nclexHours: r1(sum(days.map((d) => d.nclexHours))),
    bharatfareTasks: days.filter((d) => d.bharatfareDone).length,
    totalSpend: r0(sum(expenses.map((e) => e.amount))),
    best: best ? { date: best.date, lifeScore: best.lifeScore } : null,
    worst: worst ? { date: worst.date, lifeScore: worst.lifeScore } : null,
    series: dragonSeries(days),
    lesson: review?.lesson ?? "",
    focus: review?.focus ?? "",
  };
}
export type WeeklyReview = Awaited<ReturnType<typeof getWeeklyReview>>;

// ── Monthly ──────────────────────────────────────────────────────────────────
export async function getMonthlyReview() {
  const end = todayKey();
  const monthKey = end.slice(0, 7); // YYYY-MM
  const start = `${monthKey}-01`;
  const s = await settings();
  const [days, expenses, relapses, review] = await Promise.all([
    loadDays(start, end),
    loadExpenses(start, end),
    countRelapses(start, end),
    prisma.review.findUnique({ where: { period_periodKey: { period: "month", periodKey: monthKey } } }),
  ]);

  const weighed = days.filter((d) => d.weightKg != null) as (Day & { weightKg: number })[];
  const weightChange = weighed.length >= 2 ? r1(weighed[weighed.length - 1].weightKg - weighed[0].weightKg) : null;

  const gymDays = days.filter((d) => d.gymDone).length;
  const weeks = Math.max(1, days.length / 7);
  const gymConsistency = Math.min(100, Math.round((gymDays / weeks / s.gymDaysTarget) * 100));
  const proteinHit = days.filter((d) => d.proteinG >= s.proteinTarget).length;

  const byCat: Record<string, number> = {};
  for (const e of expenses) byCat[e.category] = (byCat[e.category] ?? 0) + e.amount;

  const ach = await prisma.achievement.findMany({
    where: { unlockedAt: { gte: keyToDate(start), lte: (() => { const d = keyToDate(end); d.setHours(23, 59, 59, 999); return d; })() } },
  });
  const series = dragonSeries(days);

  return {
    period: "month" as const,
    periodKey: monthKey,
    start,
    end,
    daysLogged: days.length,
    weightChange,
    weightStart: weighed[0]?.weightKg ?? null,
    weightEnd: weighed[weighed.length - 1]?.weightKg ?? null,
    jointFreePct: pct(days.filter((d) => d.jointClean).length, days.length),
    relapses,
    gymConsistency,
    gymSessions: gymDays,
    nutritionConsistency: pct(proteinHit, days.length),
    proteinAvg: r0(avg(days.map((d) => d.proteinG))),
    nclexHours: r1(sum(days.map((d) => d.nclexHours))),
    nclexQuestions: sum(days.map((d) => d.nclexQuestions)),
    bharatfareRate: pct(days.filter((d) => d.bharatfareDone).length, days.length),
    bharatfareDays: days.filter((d) => d.bharatfareDone).length,
    spendByCategory: Object.entries(byCat).map(([category, amount]) => ({ category, amount: r0(amount) })).sort((a, b) => b.amount - a.amount),
    totalSpend: r0(sum(expenses.map((e) => e.amount))),
    avgLifeScore: r0(avg(days.map((d) => d.lifeScore))),
    lifeScoreTrend: series.map((x) => ({ date: x.date, lifeScore: x.lifeScore })),
    dragonStartPower: series[0]?.power ?? 100,
    dragonEndPower: series[series.length - 1]?.power ?? 100,
    achievementsUnlocked: ach.map((a) => a.key),
    lesson: review?.lesson ?? "",
    focus: review?.focus ?? "",
  };
}
export type MonthlyReview = Awaited<ReturnType<typeof getMonthlyReview>>;

// ── Quarterly ────────────────────────────────────────────────────────────────
export async function getQuarterlyReview() {
  const end = todayKey();
  const now = keyToDate(end);
  const q = Math.floor(now.getMonth() / 3); // 0..3
  const start = `${now.getFullYear()}-${String(q * 3 + 1).padStart(2, "0")}-01`;
  const quarterKey = `${now.getFullYear()}-Q${q + 1}`;
  const s = await settings();
  const [days, expenses, relapses, review] = await Promise.all([
    loadDays(start, end),
    loadExpenses(start, end),
    countRelapses(start, end),
    prisma.review.findUnique({ where: { period_periodKey: { period: "quarter", periodKey: quarterKey } } }),
  ]);

  const mid = Math.floor(days.length / 2);
  const first = days.slice(0, mid);
  const last = days.slice(mid);
  const wAvg = (xs: Day[]) => avg(xs.filter((d) => d.weightKg != null).map((d) => d.weightKg as number));

  const cleanPct = pct(days.filter((d) => d.jointClean).length, days.length);
  const disciplineScore = r0(avg(days.map((d) => d.lifeScore)));
  const healthScore = healthConsistency(days, s);
  const studyConsistency = pct(days.filter((d) => d.nclexHours > 0).length, days.length);
  const businessConsistency = pct(days.filter((d) => d.bharatfareDone).length, days.length);

  const spendDay = spendByDay(expenses);
  const spendDays = Object.keys(spendDay).length;
  const underBudgetDays = Object.values(spendDay).filter((v) => v <= s.dailyBudget).length;
  const financialDiscipline = pct(underBudgetDays, spendDays);

  const gymDays = days.filter((d) => d.gymDone).length;
  const gymConsistency = Math.min(100, Math.round((gymDays / Math.max(1, days.length / 7) / s.gymDaysTarget) * 100));

  const cats = [
    { name: "Addiction Recovery", value: cleanPct },
    { name: "Health", value: healthScore },
    { name: "Study (NCLEX)", value: studyConsistency },
    { name: "Business (BharatFare)", value: businessConsistency },
    { name: "Gym", value: gymConsistency },
    { name: "Finance", value: financialDiscipline },
  ];

  return {
    period: "quarter" as const,
    periodKey: quarterKey,
    start,
    end,
    daysLogged: days.length,
    beforeAfter: {
      lifeScore: [r0(avg(first.map((d) => d.lifeScore))), r0(avg(last.map((d) => d.lifeScore)))],
      weight: [r1(wAvg(first)), r1(wAvg(last))],
      cleanPct: [pct(first.filter((d) => d.jointClean).length, first.length), pct(last.filter((d) => d.jointClean).length, last.length)],
      proteinAvg: [r0(avg(first.map((d) => d.proteinG))), r0(avg(last.map((d) => d.proteinG)))],
      nclexHours: [r1(avg(first.map((d) => d.nclexHours))), r1(avg(last.map((d) => d.nclexHours)))],
    },
    disciplineScore,
    healthScore,
    addictionRecovery: cleanPct,
    currentStreak: streakDaysFrom(s.lastJointAt),
    financialDiscipline,
    studyConsistency,
    businessConsistency,
    gymConsistency,
    relapses,
    totalSpend: r0(sum(expenses.map((e) => e.amount))),
    wins: [...cats].sort((a, b) => b.value - a.value).slice(0, 3),
    weaknesses: [...cats].sort((a, b) => a.value - b.value).slice(0, 3),
    lifeScoreTrend: dragonSeries(days).map((x) => ({ date: x.date, lifeScore: x.lifeScore })),
    lesson: review?.lesson ?? "",
    focus: review?.focus ?? "",
  };
}
export type QuarterlyReview = Awaited<ReturnType<typeof getQuarterlyReview>>;

// ── NCLEX / BharatFare analytics ──────────────────────────────────────────────
const READINESS_HOURS = 300;
const READINESS_QUESTIONS = 3000;

export async function getNclexAnalytics(rangeDays = 90) {
  const end = todayKey();
  const start = addDaysKey(end, -(rangeDays - 1));
  const s = await settings();
  const days = await loadDays(start, end);
  const totalHours = r1(sum(days.map((d) => d.nclexHours)));
  const totalQuestions = sum(days.map((d) => d.nclexQuestions));
  const studyDays = days.filter((d) => d.nclexHours > 0).length;

  let streak = 0;
  let longest = 0;
  for (const d of days) {
    streak = d.nclexHours > 0 ? streak + 1 : 0;
    longest = Math.max(longest, streak);
  }
  const readiness = Math.min(100, Math.round(((totalHours / READINESS_HOURS + totalQuestions / READINESS_QUESTIONS) / 2) * 100));

  return {
    rangeDays,
    totalHours,
    totalQuestions,
    studyDays,
    avgHoursPerStudyDay: r1(studyDays ? totalHours / studyDays : 0),
    hitTargetDays: days.filter((d) => d.nclexHours >= s.nclexHoursTarget).length,
    currentStreak: streak,
    longestStreak: longest,
    readiness,
    trend: days.map((d) => ({ date: d.date, hours: d.nclexHours, questions: d.nclexQuestions })),
  };
}
export type NclexAnalytics = Awaited<ReturnType<typeof getNclexAnalytics>>;

export async function getBharatfareAnalytics(rangeDays = 90) {
  const end = todayKey();
  const start = addDaysKey(end, -(rangeDays - 1));
  const days = await loadDays(start, end);
  const doneDays = days.filter((d) => d.bharatfareDone).length;

  let streak = 0;
  let longest = 0;
  for (const d of days) {
    streak = d.bharatfareDone ? streak + 1 : 0;
    longest = Math.max(longest, streak);
  }
  return {
    rangeDays,
    completionRate: pct(doneDays, days.length),
    doneDays,
    daysLogged: days.length,
    currentStreak: streak,
    longestStreak: longest,
    trend: days.map((d) => ({ date: d.date, done: d.bharatfareDone ? 1 : 0 })),
  };
}
export type BharatfareAnalytics = Awaited<ReturnType<typeof getBharatfareAnalytics>>;
