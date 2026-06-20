// AmanOS — All Recovery Logs (read-layer, no migration).
// Honest per-day counts of cravings, resisted/lost, relapses and clean status.
// Multiple events in a single day are counted in full — never collapsed.
import prisma from "@/lib/db";
import { todayKey } from "@/lib/dates";

const NIC_RELAPSE = new Set(["relapse"]); // nicotine relapse events

export interface RecoveryDayLog {
  date: string;
  cravings: number; // total craving events logged
  resisted: number; // cravings won
  lost: number; // cravings lost
  relapses: number; // relapse events (cannabis + nicotine)
  cleanDay: boolean; // DayLog.jointClean (true unless a relapse marked the day)
  note: string | null;
}

export interface RecoveryLogTotals {
  cravings: number;
  resisted: number;
  lost: number;
  relapses: number;
  bestDay: { date: string; resisted: number } | null; // most cravings resisted in a day
  worstDay: { date: string; relapses: number; lost: number } | null; // most relapses/losses
}

export interface RecoveryLogs {
  days: RecoveryDayLog[]; // newest first
  totals: RecoveryLogTotals;
  today: RecoveryDayLog;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const EMPTY = (date: string): RecoveryDayLog => ({ date, cravings: 0, resisted: 0, lost: 0, relapses: 0, cleanDay: true, note: null });

/** Load ALL recovery logs aggregated per day (newest first). Filtering by window
 *  is done client-side so the user can switch Today/7/14/30/All with no refetch. */
export async function getRecoveryLogs(now: Date = new Date()): Promise<RecoveryLogs> {
  const ndb = prisma as unknown as { nicotineEvent: { findMany: (a: unknown) => Promise<{ at: Date; type: string }[]> } };
  const [cravings, joints, nicotine, dayRows] = await Promise.all([
    prisma.craving.findMany({ select: { at: true, outcome: true } }).catch(() => [] as { at: Date; outcome: string }[]),
    prisma.jointEvent.findMany({ select: { at: true, type: true } }).catch(() => [] as { at: Date; type: string }[]),
    ndb.nicotineEvent.findMany({ select: { at: true, type: true } }).catch(() => [] as { at: Date; type: string }[]),
    prisma.dayLog.findMany({ select: { date: true, jointClean: true, notes: true } }).catch(() => [] as { date: string; jointClean: boolean; notes: string | null }[]),
  ]);

  const map = new Map<string, RecoveryDayLog>();
  const get = (k: string) => { let d = map.get(k); if (!d) { d = EMPTY(k); map.set(k, d); } return d; };

  for (const c of cravings) {
    const d = get(dayKey(c.at));
    d.cravings += 1;
    if (c.outcome === "lost") d.lost += 1; else d.resisted += 1;
  }
  for (const j of joints) {
    const d = get(dayKey(j.at));
    if (j.type === "relapse") d.relapses += 1;
    else if (j.type === "craving") d.cravings += 1; // legacy craving events without outcome → counted, neutral
  }
  for (const n of nicotine) {
    if (NIC_RELAPSE.has(n.type)) get(dayKey(n.at)).relapses += 1;
  }
  for (const r of dayRows) {
    const d = get(r.date);
    d.cleanDay = r.jointClean;
    d.note = r.notes ?? null;
  }

  const days = [...map.values()].sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first

  // Totals + best/worst across ALL days.
  const totals: RecoveryLogTotals = { cravings: 0, resisted: 0, lost: 0, relapses: 0, bestDay: null, worstDay: null };
  for (const d of days) {
    totals.cravings += d.cravings; totals.resisted += d.resisted; totals.lost += d.lost; totals.relapses += d.relapses;
    if (d.resisted > 0 && (!totals.bestDay || d.resisted > totals.bestDay.resisted)) totals.bestDay = { date: d.date, resisted: d.resisted };
    const badness = d.relapses * 10 + d.lost;
    const curBad = totals.worstDay ? totals.worstDay.relapses * 10 + totals.worstDay.lost : -1;
    if (badness > 0 && badness > curBad) totals.worstDay = { date: d.date, relapses: d.relapses, lost: d.lost };
  }

  const tk = todayKey(now);
  const today = map.get(tk) ?? EMPTY(tk);

  return { days, totals, today };
}
