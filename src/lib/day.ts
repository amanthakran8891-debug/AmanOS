import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";

export const DEFAULT_SETTINGS = {
  proteinTarget: 140,
  waterTarget: 3000,
  sleepTarget: 8,
  caloriesTarget: 2200,
  stepsTarget: 8000,
  nclexHoursTarget: 4,
  dailyBudget: 1000,
  gymDaysTarget: 4,
  noJointGoalDays: 90,
};

function isUniqueViolation(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

/**
 * Race-safe get-or-create for a DayLog row.
 * Concurrent first-loads (homepage + /today + a refresh) can all miss the row
 * and try to create it, tripping the unique constraint on `date` (P2002).
 * We get → create → on P2002 re-fetch the row the winning request created.
 */
export async function ensureDay(date: string) {
  const existing = await prisma.dayLog.findUnique({ where: { date } });
  if (existing) return existing;
  try {
    return await prisma.dayLog.create({ data: { date } });
  } catch (e) {
    if (isUniqueViolation(e)) {
      const row = await prisma.dayLog.findUnique({ where: { date } });
      if (row) return row;
    }
    throw e;
  }
}

/** Race-safe get-or-create for the singleton Settings row (id = 1). */
export async function ensureSettings() {
  const existing = await prisma.settings.findUnique({ where: { id: 1 } });
  if (existing) return existing;
  try {
    return await prisma.settings.create({ data: { id: 1, ...DEFAULT_SETTINGS, lastJointAt: new Date() } });
  } catch (e) {
    if (isUniqueViolation(e)) {
      const row = await prisma.settings.findUnique({ where: { id: 1 } });
      if (row) return row;
    }
    throw e;
  }
}
