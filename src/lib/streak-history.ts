// AmanOS — Phase 1, item 1: Clean-run history (read-layer, no schema change).
// Derives clean streaks from relapse events. A "boundary" is a calendar day on
// which at least one relapse occurred; a clean run is the stretch between two
// consecutive boundaries. Relapse type is Joint / Cigarette / Both depending on
// which substances were logged that day; cost uses the canonical pricing.
import { JOINT_COST, CIGARETTE_COST } from "@/lib/pricing";

export type RelapseKind = "joint" | "cigarette";
export type RelapseType = "Joint" | "Cigarette" | "Both";

export interface RelapseInput {
  at: Date | string;
  kind: RelapseKind;
}

export interface CleanRun {
  /** 1 = most recent run. */
  index: number;
  startDate: string; // "YYYY-MM-DD" (first clean day of the run)
  endDate: string | null; // relapse day that ended it; null = ongoing
  durationDays: number;
  ongoing: boolean;
  endedByType: RelapseType | null; // null for the ongoing run
  cost: number; // £ cost of the relapse that ended it (0 for ongoing)
}

export interface StreakSummary {
  runsCount: number;
  avgDays: number;
  bestDays: number;
  worstDays: number;
  trend: "improving" | "stable" | "declining";
}

export interface StreakHistory {
  runs: CleanRun[]; // most-recent first
  summary: StreakSummary;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function parseDay(key: string): Date {
  return new Date(key + "T00:00:00");
}
function addDays(key: string, n: number): string {
  const d = parseDay(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}
function diffDays(fromKey: string, toKey: string): number {
  return Math.max(0, Math.round((parseDay(toKey).getTime() - parseDay(fromKey).getTime()) / 86400000));
}

interface Boundary { day: string; type: RelapseType; cost: number; }

/** Collapse relapse events into one boundary per calendar day, typed + costed. */
function toBoundaries(relapses: RelapseInput[]): Boundary[] {
  const byDay = new Map<string, Set<RelapseKind>>();
  for (const r of relapses) {
    const d = typeof r.at === "string" ? new Date(r.at) : r.at;
    if (isNaN(d.getTime())) continue;
    const k = dayKey(d);
    const set = byDay.get(k) ?? new Set<RelapseKind>();
    set.add(r.kind);
    byDay.set(k, set);
  }
  return [...byDay.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([day, kinds]) => {
      const hasJ = kinds.has("joint");
      const hasC = kinds.has("cigarette");
      const type: RelapseType = hasJ && hasC ? "Both" : hasJ ? "Joint" : "Cigarette";
      const cost = (hasJ ? JOINT_COST : 0) + (hasC ? CIGARETTE_COST : 0);
      return { day, type, cost };
    });
}

/** Summary stats over a set of runs (ongoing included in avg/best/worst). */
export function summarize(runs: CleanRun[]): StreakSummary {
  if (runs.length === 0) return { runsCount: 0, avgDays: 0, bestDays: 0, worstDays: 0, trend: "stable" };
  const durations = runs.map((r) => r.durationDays);
  const avg = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  const best = Math.max(...durations);
  const worst = Math.min(...durations);

  // Trend: compare avg duration of the older half vs the newer half of COMPLETED
  // runs (chronological). Longer recent clean runs = improving.
  const completedChrono = runs.filter((r) => !r.ongoing).slice().reverse(); // oldest→newest
  let trend: StreakSummary["trend"] = "stable";
  if (completedChrono.length >= 2) {
    const mid = Math.floor(completedChrono.length / 2);
    const older = completedChrono.slice(0, mid);
    const newer = completedChrono.slice(mid);
    const mean = (xs: CleanRun[]) => xs.reduce((a, b) => a + b.durationDays, 0) / Math.max(1, xs.length);
    const delta = mean(newer) - mean(older);
    trend = delta > 1 ? "improving" : delta < -1 ? "declining" : "stable";
  }
  return { runsCount: runs.length, avgDays: avg, bestDays: best, worstDays: worst, trend };
}

/** Build the full clean-run history (most recent first) + summary. */
export function buildStreakHistory(relapses: RelapseInput[], now: Date = new Date()): StreakHistory {
  const boundaries = toBoundaries(relapses);
  const todayK = dayKey(now);
  const runs: CleanRun[] = [];

  // Completed runs: the clean stretch between consecutive relapse boundaries.
  for (let i = 1; i < boundaries.length; i++) {
    const prev = boundaries[i - 1];
    const end = boundaries[i];
    runs.push({
      index: 0,
      startDate: addDays(prev.day, 1),
      endDate: end.day,
      durationDays: diffDays(prev.day, end.day),
      ongoing: false,
      endedByType: end.type,
      cost: end.cost,
    });
  }
  // Ongoing run: from the day after the last relapse to today.
  if (boundaries.length > 0) {
    const last = boundaries[boundaries.length - 1];
    runs.push({
      index: 0,
      startDate: addDays(last.day, 1),
      endDate: null,
      durationDays: diffDays(last.day, todayK),
      ongoing: true,
      endedByType: null,
      cost: 0,
    });
  }

  runs.reverse(); // most recent first
  runs.forEach((r, i) => (r.index = i + 1));
  return { runs, summary: summarize(runs) };
}
