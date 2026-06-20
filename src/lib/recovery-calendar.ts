// AmanOS — Phase 1, item 7: Clean/Use day calendar (read-layer, no migration).
// Classifies each calendar day from existing logs:
//   use     (red)    — a cannabis relapse OR nicotine use/relapse that day
//   craving (yellow) — a resisted craving logged, and NOT a use day
//   clean   (green)  — a tracked day with neither
//   none    (grey)   — before tracking began, or in the future
import prisma from "@/lib/db";

const DAY = 86400000;
const NIC_USE = new Set(["cigarette", "vape", "pouch", "cigar", "relapse"]);

export type CellStatus = "clean" | "use" | "craving" | "none";
export interface CalendarCell { date: string; status: CellStatus }
export interface CalendarSummary {
  cleanDays: number;
  useDays: number;
  cravingDays: number;
  successRate: number; // %
  currentStreak: number; // consecutive non-use days ending today
  bestStreak: number; // longest non-use run in the window
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Pure: build day cells for the last `days` days (oldest → today). */
export function buildCalendarCells(
  useDayKeys: Set<string>,
  cravingDayKeys: Set<string>,
  firstEventKey: string | null,
  days: number,
  now: Date = new Date(),
): CalendarCell[] {
  const todayK = dayKey(now);
  const cells: CalendarCell[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY);
    const k = dayKey(d);
    let status: CellStatus;
    if (k > todayK) status = "none";
    else if (firstEventKey && k < firstEventKey) status = "none";
    else if (useDayKeys.has(k)) status = "use";
    else if (cravingDayKeys.has(k)) status = "craving";
    else status = "clean";
    cells.push({ date: k, status });
  }
  return cells;
}

/** Pure: summarise a set of cells. */
export function summarizeCalendar(cells: CalendarCell[]): CalendarSummary {
  const tracked = cells.filter((c) => c.status !== "none");
  const cleanDays = tracked.filter((c) => c.status === "clean").length;
  const useDays = tracked.filter((c) => c.status === "use").length;
  const cravingDays = tracked.filter((c) => c.status === "craving").length;
  const total = tracked.length;
  const successRate = total ? Math.round(((cleanDays + cravingDays) / total) * 100) : 0;

  // Best non-use run within the window.
  let best = 0, run = 0;
  for (const c of cells) {
    if (c.status === "use" || c.status === "none") run = 0;
    else { run += 1; if (run > best) best = run; }
  }
  // Current streak: consecutive non-use days ending today (skip trailing future cells).
  let current = 0;
  for (let i = cells.length - 1; i >= 0; i--) {
    const s = cells[i].status;
    if (s === "none") { if (i === cells.length - 1) continue; else break; }
    if (s === "use") break;
    current += 1;
  }
  return { cleanDays, useDays, cravingDays, successRate, currentStreak: current, bestStreak: best };
}

/** Loader: read events and build a full 365-day cell array (slice client-side). */
export async function getRecoveryCalendar(now: Date = new Date()): Promise<{ cells: CalendarCell[] }> {
  const ndb = prisma as unknown as { nicotineEvent: { findMany: (a: unknown) => Promise<{ at: Date; type: string }[]> } };
  const [joints, nic, cravings] = await Promise.all([
    prisma.jointEvent.findMany({ where: { type: "relapse" }, select: { at: true } }).catch(() => [] as { at: Date }[]),
    ndb.nicotineEvent.findMany({ select: { at: true, type: true } }).catch(() => [] as { at: Date; type: string }[]),
    prisma.craving.findMany({ select: { at: true, outcome: true } }).catch(() => [] as { at: Date; outcome: string }[]),
  ]);

  const useDays = new Set<string>();
  const cravingDays = new Set<string>();
  let earliest: number | null = null;
  const mark = (d: Date) => { const t = d.getTime(); if (earliest === null || t < earliest) earliest = t; };

  for (const j of joints) { useDays.add(dayKey(j.at)); mark(j.at); }
  for (const n of nic) { if (NIC_USE.has(n.type)) { useDays.add(dayKey(n.at)); mark(n.at); } }
  for (const c of cravings) {
    mark(c.at);
    if (c.outcome !== "lost") cravingDays.add(dayKey(c.at)); // resisted → yellow candidate
  }
  // Remove craving-only marks that are actually use days (use wins the colour).
  for (const k of useDays) cravingDays.delete(k);

  const firstEventKey = earliest !== null ? dayKey(new Date(earliest)) : null;
  return { cells: buildCalendarCells(useDays, cravingDays, firstEventKey, 365, now) };
}
