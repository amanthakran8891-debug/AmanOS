// AmanOS — Phase 1, item 4: Money Saved (read-layer, no migration).
// Saved = (baseline units that WOULD have been consumed) − (units actually
// consumed), × price, never negative. Baseline per substance:
//   1) configured profile value if set (Settings.recJointsPerDay / NicotineGoal.baselinePerDay)
//   2) else fall back to the historical daily average from logged data.
import prisma from "@/lib/db";
import { JOINT_COST, CIGARETTE_COST } from "@/lib/pricing";
import type { SmokingSplit } from "@/lib/smoking-split";

const DAY = 86400000;

export interface SavedPeriod { saved: number; jointsAvoided: number; cigsAvoided: number }
export interface MoneySaved {
  today: SavedPeriod;
  last7: SavedPeriod;
  last30: SavedPeriod;
  year: SavedPeriod;
  lifetime: SavedPeriod;
  baseline: { jointsPerDay: number; cigsPerDay: number };
  hasReliableBaseline: boolean;
  /** Progress (0..100) toward each savings milestone, from lifetime saved. */
  goals: { p100: number; p500: number; p1000: number };
}

export interface MoneySavedInputs {
  jointsPerDayCfg: number; // configured (0 = not set)
  cigsPerDayCfg: number; // configured (0 = not set)
  lifetimeDays: number; // days since tracking began (>=1)
}

const r2 = (n: number) => Math.round(n * 100) / 100;
const pctTo = (v: number, target: number) => Math.max(0, Math.min(100, Math.round((v / target) * 100)));

function dayOfYear(now: Date): number {
  const start = new Date(now.getFullYear(), 0, 1).getTime();
  return Math.max(1, Math.floor((now.getTime() - start) / DAY) + 1);
}

/** Pure: compute money saved from the usage split + baselines. */
export function computeMoneySaved(split: SmokingSplit, inputs: MoneySavedInputs, now: Date = new Date()): MoneySaved {
  // Resolve baselines: configured value, else historical daily average from logged data.
  const jointsPerDay = inputs.jointsPerDayCfg > 0
    ? inputs.jointsPerDayCfg
    : (inputs.lifetimeDays > 0 ? split.joints.lifetime / inputs.lifetimeDays : 0);
  const cigsPerDay = inputs.cigsPerDayCfg > 0
    ? inputs.cigsPerDayCfg
    : (inputs.lifetimeDays > 0 ? split.cigarettes.lifetime / inputs.lifetimeDays : 0);

  const period = (days: number, actualJoints: number, actualCigs: number): SavedPeriod => {
    const jointsAvoided = Math.max(0, Math.round(jointsPerDay * days - actualJoints));
    const cigsAvoided = Math.max(0, Math.round(cigsPerDay * days - actualCigs));
    return { jointsAvoided, cigsAvoided, saved: r2(jointsAvoided * JOINT_COST + cigsAvoided * CIGARETTE_COST) };
  };

  const j = split.joints, c = split.cigarettes;
  const lifetime = period(inputs.lifetimeDays, j.lifetime, c.lifetime);
  return {
    today: period(1, j.today, c.today),
    last7: period(7, j.last7, c.last7),
    last30: period(30, j.last30, c.last30),
    year: period(dayOfYear(now), j.year, c.year),
    lifetime,
    baseline: { jointsPerDay: r2(jointsPerDay), cigsPerDay: r2(cigsPerDay) },
    hasReliableBaseline: jointsPerDay > 0 || cigsPerDay > 0,
    goals: { p100: pctTo(lifetime.saved, 100), p500: pctTo(lifetime.saved, 500), p1000: pctTo(lifetime.saved, 1000) },
  };
}

/** Loader: read baselines + tracking start from existing single-row models. */
export async function getMoneySavedInputs(now: Date = new Date()): Promise<MoneySavedInputs> {
  const ndb = prisma as unknown as { nicotineGoal: { findUnique: (a: unknown) => Promise<{ baselinePerDay: number; startedAt: Date } | null> } };
  const [settings, goal] = await Promise.all([
    prisma.settings.findUnique({ where: { id: 1 }, select: { recJointsPerDay: true, createdAt: true } }).catch(() => null),
    ndb.nicotineGoal.findUnique({ where: { id: 1 } }).catch(() => null),
  ]);
  const anchors = [settings?.createdAt?.getTime(), goal?.startedAt?.getTime()].filter((x): x is number => typeof x === "number");
  const startMs = anchors.length ? Math.min(...anchors) : now.getTime();
  const lifetimeDays = Math.max(1, Math.round((now.getTime() - startMs) / DAY));
  return {
    jointsPerDayCfg: settings?.recJointsPerDay ?? 0,
    cigsPerDayCfg: goal?.baselinePerDay ?? 0,
    lifetimeDays,
  };
}
