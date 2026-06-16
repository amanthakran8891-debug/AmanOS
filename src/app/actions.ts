"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/db";
import { todayKey } from "@/lib/dates";
import { lifeScore, type DayInput, type Targets } from "@/lib/score";
import { ensureDay, ensureSettings as getSettings } from "@/lib/day";

function toTargets(s: { proteinTarget: number; waterTarget: number; sleepTarget: number; stepsTarget: number; nclexHoursTarget: number }): Targets {
  return {
    proteinTarget: s.proteinTarget,
    waterTarget: s.waterTarget,
    sleepTarget: s.sleepTarget,
    stepsTarget: s.stepsTarget,
    nclexHoursTarget: s.nclexHoursTarget,
  };
}

/** Recompute and persist the life score for a given day. */
async function recompute(date: string) {
  const [day, settings] = await Promise.all([prisma.dayLog.findUnique({ where: { date } }), getSettings()]);
  if (!day) return;
  const input: DayInput = {
    jointClean: day.jointClean,
    proteinG: day.proteinG,
    waterMl: day.waterMl,
    sleepHours: day.sleepHours,
    steps: day.steps,
    nclexHours: day.nclexHours,
    bharatfareDone: day.bharatfareDone,
    gymDone: day.gymDone,
    spiritualDone: day.spiritualDone,
  };
  const { total } = lifeScore(input, toTargets(settings));
  await prisma.dayLog.update({ where: { date }, data: { lifeScore: total } });
  await checkAchievements();
}

function streakDaysFrom(lastJointAt: Date | null): number {
  if (!lastJointAt) return 0;
  return Math.max(0, Math.floor((Date.now() - lastJointAt.getTime()) / 86400000));
}

async function unlock(key: string) {
  await prisma.achievement.upsert({ where: { key }, update: {}, create: { key } });
}

async function checkAchievements() {
  const settings = await getSettings();
  const streak = streakDaysFrom(settings.lastJointAt);
  if (streak >= 1) await unlock("first-clean-day");
  if (streak >= 7) await unlock("7-days-clean");
  if (streak >= 30) await unlock("30-days-clean");
  if (streak >= 100) await unlock("100-days-clean");

  const today = await prisma.dayLog.findUnique({ where: { date: todayKey() } });
  if (today) {
    if (today.proteinG >= settings.proteinTarget) await unlock("protein-master");
    if (today.gymDone) await unlock("gym-warrior");
    if (today.nclexHours >= settings.nclexHoursTarget) await unlock("nclex-grinder");
    if (today.bharatfareDone) await unlock("bharatfare-builder");
    if (today.lifeScore >= 90) await unlock("life-commander");
  }
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function addWater(ml: number) {
  const date = todayKey();
  const day = await ensureDay(date);
  await prisma.dayLog.update({ where: { date }, data: { waterMl: Math.max(0, day.waterMl + ml) } });
  await recompute(date);
  revalidatePath("/");
}

export async function setField(
  field: "sleepHours" | "steps" | "nclexHours" | "nclexQuestions" | "weightKg" | "bodyFat" | "caloriesKcal",
  value: number,
) {
  const date = todayKey();
  await ensureDay(date);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.dayLog.update({ where: { date }, data: { [field]: value } } as any);
  await recompute(date);
  revalidatePath("/");
}

export async function toggleFlag(flag: "bharatfareDone" | "gymDone" | "spiritualDone") {
  const date = todayKey();
  const day = await ensureDay(date);
  const current = (day as unknown as Record<string, boolean>)[flag];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.dayLog.update({ where: { date }, data: { [flag]: !current } } as any);
  await recompute(date);
  revalidatePath("/");
}

export async function addFood(name: string, proteinG: number, calories: number) {
  const date = todayKey();
  await ensureDay(date);
  await prisma.foodEntry.create({ data: { date, name, proteinG, calories } });
  await syncFood(date);
  revalidatePath("/");
}

export async function removeFood(id: string) {
  const entry = await prisma.foodEntry.findUnique({ where: { id } });
  if (!entry) return;
  await prisma.foodEntry.delete({ where: { id } });
  await syncFood(entry.date);
  revalidatePath("/");
}

async function syncFood(date: string) {
  const agg = await prisma.foodEntry.aggregate({
    where: { date },
    _sum: { proteinG: true, calories: true },
  });
  await ensureDay(date);
  await prisma.dayLog.update({
    where: { date },
    data: { proteinG: agg._sum.proteinG ?? 0, caloriesKcal: agg._sum.calories ?? 0 },
  });
  await recompute(date);
}

export async function logGymSet(bodyPart: string, exercise: string, sets: number, reps: number, weightKg: number) {
  const date = todayKey();
  await ensureDay(date);
  await prisma.gymSet.create({ data: { date, bodyPart, exercise, sets, reps, weightKg } });
  await prisma.dayLog.update({ where: { date }, data: { gymDone: true } });
  await recompute(date);
  revalidatePath("/");
  revalidatePath("/gym");
}

export async function addExpense(category: string, amount: number, note: string) {
  const date = todayKey();
  await ensureDay(date);
  await prisma.expense.create({ data: { date, category, amount, note: note || null } });
  revalidatePath("/");
}

export async function addCraving(craving: string, trigger: string, intensity: number) {
  await prisma.jointEvent.create({ data: { type: "craving", craving, trigger, intensity } });
  revalidatePath("/");
}

// ── Edit / delete (correct mistakes easily) ──────────────────────────────────
export async function updateFood(id: string, name: string, proteinG: number, calories: number) {
  const entry = await prisma.foodEntry.findUnique({ where: { id } });
  if (!entry) return;
  await prisma.foodEntry.update({ where: { id }, data: { name, proteinG, calories } });
  await syncFood(entry.date);
  revalidatePath("/");
}

export async function removeExpense(id: string) {
  await prisma.expense.delete({ where: { id } }).catch(() => {});
  revalidatePath("/");
}

export async function updateExpense(id: string, category: string, amount: number, note: string) {
  await prisma.expense.update({ where: { id }, data: { category, amount, note: note || null } }).catch(() => {});
  revalidatePath("/");
}

export async function removeGymSet(id: string) {
  const set = await prisma.gymSet.findUnique({ where: { id } });
  if (!set) return;
  await prisma.gymSet.delete({ where: { id } });
  const remaining = await prisma.gymSet.count({ where: { date: set.date } });
  if (remaining === 0) {
    await prisma.dayLog.update({ where: { date: set.date }, data: { gymDone: false } }).catch(() => {});
    await recompute(set.date);
  }
  revalidatePath("/");
  revalidatePath("/gym");
}

export async function updateGymSet(id: string, sets: number, reps: number, weightKg: number) {
  await prisma.gymSet.update({ where: { id }, data: { sets, reps, weightKg } }).catch(() => {});
  revalidatePath("/");
  revalidatePath("/gym");
}

export async function removeJointEvent(id: string) {
  await prisma.jointEvent.delete({ where: { id } }).catch(() => {});
  revalidatePath("/");
}

export async function setNote(text: string) {
  const date = todayKey();
  await ensureDay(date);
  await prisma.dayLog.update({ where: { date }, data: { notes: text || null } });
  revalidatePath("/");
}

/** Joint smoked — relapse. Resets the clean streak / hourglass, strengthens the dragon. */
export async function relapse(trigger: string, note: string) {
  const settings = await getSettings();
  const prevStreak = streakDaysFrom(settings.lastJointAt);
  await prisma.jointEvent.create({ data: { type: "relapse", trigger: trigger || null, note: note || null } });
  await prisma.settings.update({
    where: { id: 1 },
    data: {
      lastJointAt: new Date(),
      longestStreakDays: Math.max(settings.longestStreakDays, prevStreak),
    },
  });
  const date = todayKey();
  await ensureDay(date);
  await prisma.dayLog.update({ where: { date }, data: { jointClean: false } });
  await recompute(date);
  revalidatePath("/");
}

/** Re-affirm a clean day (undo an accidental relapse toggle for today). */
export async function markCleanToday() {
  const date = todayKey();
  await ensureDay(date);
  await prisma.dayLog.update({ where: { date }, data: { jointClean: true } });
  await recompute(date);
  revalidatePath("/");
}

export async function resetStreakAnchor(to: Date) {
  await prisma.settings.update({ where: { id: 1 }, data: { lastJointAt: to } });
  revalidatePath("/");
}

export async function updateSettings(data: Record<string, number>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await prisma.settings.update({ where: { id: 1 }, data: data as any });
  await recompute(todayKey());
  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/today");
}

export async function saveReview(period: string, periodKey: string, lesson: string, focus: string) {
  await prisma.review.upsert({
    where: { period_periodKey: { period, periodKey } },
    update: { lesson: lesson || null, focus: focus || null },
    create: { period, periodKey, lesson: lesson || null, focus: focus || null },
  });
  revalidatePath(`/reviews/${period === "week" ? "weekly" : period === "month" ? "monthly" : "quarterly"}`);
}
