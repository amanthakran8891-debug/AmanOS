// AmanOS — Phase 1, item 8: Discipline Score History (read-layer, no migration).
// All derived from DayLog.lifeScore (+ jointClean for the clean streak). Thresholds
// match the app: strong day >= 75, drift day < 45.
import prisma from "@/lib/db";

const DAY = 86400000;
export const STRONG = 75;
export const DRIFT = 45;

export interface PeriodTrend {
  days: number;
  avg: number;
  best: number;
  worst: number;
  strongDays: number;
  driftDays: number;
  improvement: number; // avg − previous equal-period avg
  direction: "improving" | "stable" | "declining";
}
export interface DisciplineGraphPoint { date: string; score: number | null; roll7: number | null; roll28: number | null }
export interface PersonalRecords {
  highestScore: number;
  highest7Avg: number;
  highest14Avg: number;
  highest28Avg: number;
  longestStrongStreak: number;
  longestCleanStreak: number;
  bestMonth: { month: string; avg: number } | null;
}
export interface DisciplineHistory {
  trends: { d7: PeriodTrend; d14: PeriodTrend; d21: PeriodTrend; d28: PeriodTrend };
  consistencyScore: number;
  consistencyAvg: number;
  records: PersonalRecords;
  graph: DisciplineGraphPoint[];
}

interface Row { date: string; lifeScore: number; jointClean: boolean }

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function mean(xs: number[]): number { return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0; }
function stddev(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

function windowRows(rows: Row[], todayKey: string, fromKey: string): Row[] {
  return rows.filter((r) => r.date >= fromKey && r.date <= todayKey);
}

function trendFor(rows: Row[], now: Date, n: number): PeriodTrend {
  const todayKey = dayKey(now);
  const curFrom = dayKey(new Date(now.getTime() - (n - 1) * DAY));
  const prevFrom = dayKey(new Date(now.getTime() - (2 * n - 1) * DAY));
  const prevTo = dayKey(new Date(now.getTime() - n * DAY));

  const cur = windowRows(rows, todayKey, curFrom).map((r) => r.lifeScore);
  const prev = rows.filter((r) => r.date >= prevFrom && r.date <= prevTo).map((r) => r.lifeScore);

  const avg = Math.round(mean(cur));
  const prevAvg = Math.round(mean(prev));
  const improvement = cur.length && prev.length ? avg - prevAvg : 0;
  const direction = improvement > 1 ? "improving" : improvement < -1 ? "declining" : "stable";
  return {
    days: n,
    avg,
    best: cur.length ? Math.max(...cur) : 0,
    worst: cur.length ? Math.min(...cur) : 0,
    strongDays: cur.filter((s) => s >= STRONG).length,
    driftDays: cur.filter((s) => s < DRIFT).length,
    improvement,
    direction,
  };
}

/** Steadiness-rewarding consistency over the last 28 logged days.
 *  consistency = 0.5·mean + 0.5·steadiness, steadiness = 100·(1 − stddev/mean).
 *  → a steady 65 scores ~82; a 100/20 sawtooth scores below its own mean. */
function consistency(rows: Row[], now: Date): { score: number; avg: number } {
  const from = dayKey(new Date(now.getTime() - 27 * DAY));
  const scores = windowRows(rows, dayKey(now), from).map((r) => r.lifeScore);
  if (scores.length === 0) return { score: 0, avg: 0 };
  const m = mean(scores);
  const cv = m > 0 ? stddev(scores) / m : 1;
  const steadiness = Math.max(0, Math.min(100, 100 * (1 - cv)));
  return { score: Math.round(0.5 * m + 0.5 * steadiness), avg: Math.round(m) };
}

function rollingMax(scores: number[], w: number): number {
  if (scores.length < w) return scores.length ? Math.round(mean(scores)) : 0;
  let best = 0;
  for (let i = 0; i + w <= scores.length; i++) best = Math.max(best, mean(scores.slice(i, i + w)));
  return Math.round(best);
}

function longestRun(rows: Row[], pred: (r: Row) => boolean): number {
  // Date-gap aware: a missing calendar day breaks the run.
  let best = 0, run = 0, prev: string | null = null;
  for (const r of rows) {
    const contiguous = prev !== null && (new Date(r.date + "T00:00:00").getTime() - new Date(prev + "T00:00:00").getTime()) === DAY;
    if (pred(r)) run = contiguous ? run + 1 : 1; else run = 0;
    if (run > best) best = run;
    prev = r.date;
  }
  return best;
}

function records(rows: Row[]): PersonalRecords {
  const scores = rows.map((r) => r.lifeScore);
  // Best month: group by YYYY-MM, require >= 3 logged days to qualify.
  const byMonth = new Map<string, number[]>();
  for (const r of rows) { const m = r.date.slice(0, 7); (byMonth.get(m) ?? byMonth.set(m, []).get(m)!).push(r.lifeScore); }
  let bestMonth: { month: string; avg: number } | null = null;
  for (const [month, xs] of byMonth) {
    if (xs.length < 3) continue;
    const a = Math.round(mean(xs));
    if (!bestMonth || a > bestMonth.avg) bestMonth = { month, avg: a };
  }
  return {
    highestScore: scores.length ? Math.max(...scores) : 0,
    highest7Avg: rollingMax(scores, 7),
    highest14Avg: rollingMax(scores, 14),
    highest28Avg: rollingMax(scores, 28),
    longestStrongStreak: longestRun(rows, (r) => r.lifeScore >= STRONG),
    longestCleanStreak: longestRun(rows, (r) => r.jointClean),
    bestMonth,
  };
}

function graph(rows: Row[], now: Date): DisciplineGraphPoint[] {
  const scoreByDate = new Map(rows.map((r) => [r.date, r.lifeScore]));
  const pts: DisciplineGraphPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY);
    const k = dayKey(d);
    const score = scoreByDate.has(k) ? scoreByDate.get(k)! : null;
    const trailing = (w: number) => {
      const fromMs = d.getTime() - (w - 1) * DAY;
      const xs: number[] = [];
      for (const [dk, sc] of scoreByDate) {
        const t = new Date(dk + "T00:00:00").getTime();
        if (t >= fromMs && t <= d.getTime()) xs.push(sc);
      }
      return xs.length ? Math.round(mean(xs)) : null;
    };
    pts.push({ date: k, score, roll7: trailing(7), roll28: trailing(28) });
  }
  return pts;
}

/** Pure builder over DayLog rows (sorted ascending by date). */
export function buildDisciplineHistory(rows: Row[], now: Date = new Date()): DisciplineHistory {
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const c = consistency(sorted, now);
  return {
    trends: {
      d7: trendFor(sorted, now, 7),
      d14: trendFor(sorted, now, 14),
      d21: trendFor(sorted, now, 21),
      d28: trendFor(sorted, now, 28),
    },
    consistencyScore: c.score,
    consistencyAvg: c.avg,
    records: records(sorted),
    graph: graph(sorted, now),
  };
}

/** Loader. */
export async function getDisciplineHistory(now: Date = new Date()): Promise<DisciplineHistory> {
  const rows = await prisma.dayLog.findMany({ select: { date: true, lifeScore: true, jointClean: true }, orderBy: { date: "asc" } }).catch(() => [] as Row[]);
  return buildDisciplineHistory(rows as Row[], now);
}
