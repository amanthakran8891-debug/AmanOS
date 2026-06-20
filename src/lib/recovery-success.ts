// AmanOS — Phase 1, item 5: Recovery Success Rate (read-layer, no migration).
// A relapse never zeroes progress: success = clean days / total days since the
// first quit attempt. A "use day" is any calendar day with a cannabis relapse
// (JointEvent) OR a nicotine use/relapse (NicotineEvent). Clean day = neither.
import prisma from "@/lib/db";

const DAY = 86400000;
const NIC_USE = new Set(["cigarette", "vape", "pouch", "cigar", "relapse"]);

export interface RecoverySuccess {
  daysSinceFirstAttempt: number;
  cleanDays: number;
  useDays: number;
  successRate: number; // %
  last7Rate: number; // %
  last30Rate: number; // %
  bestCleanPeriodDays: number; // longest consecutive clean run
  worstRelapsePeriodDays: number; // longest consecutive use run
  anchorDate: string | null; // first quit attempt (YYYY-MM-DD)
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function parseDay(k: string): number { return new Date(k + "T00:00:00").getTime(); }

/** Pure: success metrics from the set of use-day keys + an anchor date. */
export function computeRecoverySuccess(useDayKeys: Set<string>, anchorKey: string | null, now: Date = new Date()): RecoverySuccess {
  const todayK = dayKey(now);
  if (!anchorKey) {
    return { daysSinceFirstAttempt: 0, cleanDays: 0, useDays: 0, successRate: 100, last7Rate: 100, last30Rate: 100, bestCleanPeriodDays: 0, worstRelapsePeriodDays: 0, anchorDate: null };
  }
  // Build the ordered list of day keys from anchor → today (inclusive).
  const startMs = parseDay(anchorKey);
  const endMs = parseDay(todayK);
  const days: { key: string; use: boolean }[] = [];
  for (let t = startMs; t <= endMs; t += DAY) {
    const k = dayKey(new Date(t));
    days.push({ key: k, use: useDayKeys.has(k) });
  }
  const total = days.length;
  const useDays = days.filter((d) => d.use).length;
  const cleanDays = total - useDays;
  const rate = (clean: number, denom: number) => (denom > 0 ? Math.round((clean / denom) * 100) : 100);

  // Windowed rates (denominator capped to days actually tracked).
  const windowRate = (n: number) => {
    const slice = days.slice(Math.max(0, days.length - n));
    const clean = slice.filter((d) => !d.use).length;
    return rate(clean, slice.length);
  };

  // Longest consecutive clean / use runs.
  let bestClean = 0, worstUse = 0, runClean = 0, runUse = 0;
  for (const d of days) {
    if (d.use) { runUse += 1; runClean = 0; } else { runClean += 1; runUse = 0; }
    if (runClean > bestClean) bestClean = runClean;
    if (runUse > worstUse) worstUse = runUse;
  }

  return {
    daysSinceFirstAttempt: total,
    cleanDays,
    useDays,
    successRate: rate(cleanDays, total),
    last7Rate: windowRate(7),
    last30Rate: windowRate(30),
    bestCleanPeriodDays: bestClean,
    worstRelapsePeriodDays: worstUse,
    anchorDate: anchorKey,
  };
}

/** Loader: read relapse/use days from existing models + the first-attempt anchor. */
export async function getRecoverySuccess(now: Date = new Date()): Promise<RecoverySuccess> {
  const ndb = prisma as unknown as { nicotineEvent: { findMany: (a: unknown) => Promise<{ at: Date; type: string }[]> } };
  const [joints, nic, settings] = await Promise.all([
    prisma.jointEvent.findMany({ where: { type: "relapse" }, select: { at: true } }).catch(() => [] as { at: Date }[]),
    ndb.nicotineEvent.findMany({ select: { at: true, type: true } }).catch(() => [] as { at: Date; type: string }[]),
    prisma.settings.findUnique({ where: { id: 1 }, select: { createdAt: true } }).catch(() => null),
  ]);

  const useDays = new Set<string>();
  let earliest: number | null = null;
  const note = (d: Date) => { useDays.add(dayKey(d)); const t = d.getTime(); if (earliest === null || t < earliest) earliest = t; };
  for (const j of joints) note(j.at);
  for (const n of nic) if (NIC_USE.has(n.type)) note(n.at);

  // First quit attempt = earliest of (first logged use day, Settings.createdAt).
  const anchors = [earliest, settings?.createdAt?.getTime()].filter((x): x is number => typeof x === "number");
  const anchorKey = anchors.length ? dayKey(new Date(Math.min(...anchors))) : null;

  return computeRecoverySuccess(useDays, anchorKey, now);
}
