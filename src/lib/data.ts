import prisma from "@/lib/db";
import { todayKey, lastNDays } from "@/lib/dates";
import { lifeScore, dragonState, type Targets } from "@/lib/score";
import { BODY_PARTS } from "@/lib/exercises";
import { ensureDay, ensureSettings } from "@/lib/day";

export async function getDashboardData() {
  const date = todayKey();

  // Race-safe get-or-create (handles concurrent first-loads → no P2002).
  const settings = await ensureSettings();
  const today = await ensureDay(date);

  const dayKeys = lastNDays(30, date);
  const history = await prisma.dayLog.findMany({
    where: { date: { in: dayKeys } },
    orderBy: { date: "asc" },
  });
  const byDate = new Map(history.map((d) => [d.date, d]));

  const [foods, gymSets, monthExpenses, jointEvents, achievements] = await Promise.all([
    prisma.foodEntry.findMany({ where: { date }, orderBy: { createdAt: "desc" } }),
    prisma.gymSet.findMany({ where: { date }, orderBy: { createdAt: "desc" } }),
    prisma.expense.findMany({ where: { date: { startsWith: date.slice(0, 7) } }, orderBy: { createdAt: "desc" } }),
    prisma.jointEvent.findMany({ orderBy: { at: "desc" }, take: 30 }),
    prisma.achievement.findMany(),
  ]);

  const targets: Targets = {
    proteinTarget: settings.proteinTarget,
    waterTarget: settings.waterTarget,
    sleepTarget: settings.sleepTarget,
    stepsTarget: settings.stepsTarget,
    nclexHoursTarget: settings.nclexHoursTarget,
  };

  const score = lifeScore(
    {
      jointClean: today.jointClean,
      proteinG: today.proteinG,
      waterMl: today.waterMl,
      sleepHours: today.sleepHours,
      steps: today.steps,
      nclexHours: today.nclexHours,
      bharatfareDone: today.bharatfareDone,
      gymDone: today.gymDone,
      spiritualDone: today.spiritualDone,
    },
    targets,
  );

  const streakDays = settings.lastJointAt
    ? Math.max(0, Math.floor((Date.now() - settings.lastJointAt.getTime()) / 86400000))
    : 0;
  const dragon = dragonState(score.total, streakDays);

  // Muscle recovery — days since each body part was last trained.
  const partRecency: Record<string, number | null> = {};
  for (const part of BODY_PARTS) {
    const last = await prisma.gymSet.findFirst({ where: { bodyPart: part }, orderBy: { date: "desc" } });
    partRecency[part] = last ? Math.max(0, Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000)) : null;
  }

  const monthSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const todaySpent = monthExpenses.filter((e) => e.date === date).reduce((s, e) => s + e.amount, 0);

  // Serialize for the client.
  return {
    date,
    settings: {
      proteinTarget: settings.proteinTarget,
      waterTarget: settings.waterTarget,
      sleepTarget: settings.sleepTarget,
      caloriesTarget: settings.caloriesTarget,
      stepsTarget: settings.stepsTarget,
      nclexHoursTarget: settings.nclexHoursTarget,
      dailyBudget: settings.dailyBudget,
      gymDaysTarget: settings.gymDaysTarget,
      noJointGoalDays: settings.noJointGoalDays,
      weightGoal: settings.weightGoal,
      lastJointAt: settings.lastJointAt ? settings.lastJointAt.toISOString() : null,
      longestStreakDays: settings.longestStreakDays,
    },
    today: {
      jointClean: today.jointClean,
      weightKg: today.weightKg,
      bodyFat: today.bodyFat,
      waterMl: today.waterMl,
      proteinG: today.proteinG,
      caloriesKcal: today.caloriesKcal,
      sleepHours: today.sleepHours,
      steps: today.steps,
      nclexHours: today.nclexHours,
      nclexQuestions: today.nclexQuestions,
      bharatfareDone: today.bharatfareDone,
      gymDone: today.gymDone,
      spiritualDone: today.spiritualDone,
      lifeScore: today.lifeScore,
      notes: today.notes ?? "",
    },
    score,
    dragon,
    streakDays,
    history: dayKeys.map((k) => {
      const d = byDate.get(k);
      return {
        date: k,
        lifeScore: d?.lifeScore ?? 0,
        weightKg: d?.weightKg ?? null,
        proteinG: d?.proteinG ?? 0,
        sleepHours: d?.sleepHours ?? 0,
        steps: d?.steps ?? 0,
        nclexHours: d?.nclexHours ?? 0,
        bharatfareDone: d?.bharatfareDone ?? false,
        jointClean: d?.jointClean ?? true,
        gymDone: d?.gymDone ?? false,
      };
    }),
    foods: foods.map((f) => ({ id: f.id, name: f.name, proteinG: f.proteinG, calories: f.calories })),
    gymSets: gymSets.map((g) => ({ id: g.id, bodyPart: g.bodyPart, exercise: g.exercise, sets: g.sets, reps: g.reps, weightKg: g.weightKg })),
    partRecency,
    budget: { dailyBudget: settings.dailyBudget, todaySpent, monthSpent, monthExpenses: monthExpenses.map((e) => ({ id: e.id, date: e.date, category: e.category, amount: e.amount, note: e.note })) },
    jointEvents: jointEvents.map((j) => ({ id: j.id, at: j.at.toISOString(), type: j.type, craving: j.craving, trigger: j.trigger, intensity: j.intensity })),
    achievements: achievements.map((a) => a.key),
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
