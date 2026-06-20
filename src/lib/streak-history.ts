// AmanOS — Phase 1 item 1 (upgraded): exact-duration clean-run history.
// Now timestamp-precise (days + hours + minutes), not day-bucketed — because in
// early recovery hours matter more than days. A clean run is the gap between two
// consecutive relapse events; near-simultaneous events (≤2 min, e.g. a joint and
// a cigarette in the same incident) merge into one boundary typed "Both".
import prisma from "@/lib/db";
import { JOINT_COST, CIGARETTE_COST } from "@/lib/pricing";

export type RelapseKind = "joint" | "cigarette";
export type RelapseType = "Joint" | "Cigarette" | "Both";

export interface RelapseInput { at: Date | string; kind: RelapseKind }

export interface CleanRun {
  index: number; // 1 = most recent
  startISO: string; // first clean moment (the previous relapse timestamp)
  endISO: string | null; // relapse that ended it; null = ongoing
  durationMs: number;
  ongoing: boolean;
  endedByType: RelapseType | null;
  cost: number; // £ of the relapse that ended it (0 for ongoing)
}

export interface StreakSummary {
  runsCount: number;
  avgMs: number;
  bestMs: number;
  worstMs: number;
  trend: "improving" | "stable" | "declining";
}

export interface StreakHistory { runs: CleanRun[]; summary: StreakSummary }

const CLUSTER_MS = 2 * 60000; // merge relapses within 2 minutes into one boundary

/** "0d 14h 51m" — exact, never rounded to whole days. */
export function formatDHM(ms: number): string {
  const t = Math.max(0, Math.floor(ms));
  const d = Math.floor(t / 86400000);
  const h = Math.floor((t % 86400000) / 3600000);
  const m = Math.floor((t % 3600000) / 60000);
  return `${d}d ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
}

interface Boundary { atMs: number; type: RelapseType; cost: number }

function toBoundaries(relapses: RelapseInput[]): Boundary[] {
  const evts = relapses
    .map((r) => ({ atMs: (typeof r.at === "string" ? new Date(r.at) : r.at).getTime(), kind: r.kind }))
    .filter((e) => !isNaN(e.atMs))
    .sort((a, b) => a.atMs - b.atMs);

  const out: Boundary[] = [];
  let cluster: typeof evts = [];
  const flush = () => {
    if (cluster.length === 0) return;
    const hasJ = cluster.some((e) => e.kind === "joint");
    const hasC = cluster.some((e) => e.kind === "cigarette");
    const type: RelapseType = hasJ && hasC ? "Both" : hasJ ? "Joint" : "Cigarette";
    out.push({ atMs: cluster[0].atMs, type, cost: (hasJ ? JOINT_COST : 0) + (hasC ? CIGARETTE_COST : 0) });
    cluster = [];
  };
  for (const e of evts) {
    if (cluster.length === 0) { cluster = [e]; continue; }
    if (e.atMs - cluster[0].atMs <= CLUSTER_MS) cluster.push(e);
    else { flush(); cluster = [e]; }
  }
  flush();
  return out;
}

export function summarize(runs: CleanRun[]): StreakSummary {
  if (runs.length === 0) return { runsCount: 0, avgMs: 0, bestMs: 0, worstMs: 0, trend: "stable" };
  const ds = runs.map((r) => r.durationMs);
  const avgMs = Math.round(ds.reduce((a, b) => a + b, 0) / ds.length);
  const bestMs = Math.max(...ds);
  const worstMs = Math.min(...ds);
  const completedChrono = runs.filter((r) => !r.ongoing).slice().reverse(); // oldest→newest
  let trend: StreakSummary["trend"] = "stable";
  if (completedChrono.length >= 2) {
    const mid = Math.floor(completedChrono.length / 2);
    const mean = (xs: CleanRun[]) => xs.reduce((a, b) => a + b.durationMs, 0) / Math.max(1, xs.length);
    const delta = mean(completedChrono.slice(mid)) - mean(completedChrono.slice(0, mid));
    const HOUR = 3600000;
    trend = delta > HOUR ? "improving" : delta < -HOUR ? "declining" : "stable";
  }
  return { runsCount: runs.length, avgMs, bestMs, worstMs, trend };
}

export function buildStreakHistory(relapses: RelapseInput[], now: Date = new Date()): StreakHistory {
  const b = toBoundaries(relapses);
  const runs: CleanRun[] = [];
  for (let i = 1; i < b.length; i++) {
    runs.push({
      index: 0,
      startISO: new Date(b[i - 1].atMs).toISOString(),
      endISO: new Date(b[i].atMs).toISOString(),
      durationMs: b[i].atMs - b[i - 1].atMs,
      ongoing: false,
      endedByType: b[i].type,
      cost: b[i].cost,
    });
  }
  if (b.length > 0) {
    const last = b[b.length - 1];
    runs.push({
      index: 0,
      startISO: new Date(last.atMs).toISOString(),
      endISO: null,
      durationMs: Math.max(0, now.getTime() - last.atMs),
      ongoing: true,
      endedByType: null,
      cost: 0,
    });
  }
  runs.reverse();
  runs.forEach((r, i) => (r.index = i + 1));
  return { runs, summary: summarize(runs) };
}

/** Loader: merge cannabis + nicotine relapses into exact clean-run history. */
export async function getCleanRuns(now: Date = new Date()): Promise<StreakHistory> {
  const ndb = prisma as unknown as { nicotineEvent: { findMany: (a: unknown) => Promise<{ at: Date }[]> } };
  const [joints, nicotine] = await Promise.all([
    prisma.jointEvent.findMany({ where: { type: "relapse" }, select: { at: true } }).catch(() => [] as { at: Date }[]),
    ndb.nicotineEvent.findMany({ where: { type: "relapse" }, select: { at: true } }).catch(() => [] as { at: Date }[]),
  ]);
  const relapses: RelapseInput[] = [
    ...joints.map((j) => ({ at: j.at, kind: "joint" as const })),
    ...nicotine.map((n) => ({ at: n.at, kind: "cigarette" as const })),
  ];
  return buildStreakHistory(relapses, now);
}
