// ─────────────────────────────────────────────────────────────────────────────
// AmanOS — Clean-Time Engine (the single recovery source of truth).
//
// Every surface that talks about the clean run — the Hourglass, Clean Time,
// Joint Recovery, the Recovery Forecast, the Streak Wall and the Longest Clean
// Run — must read its numbers from HERE. One anchor (`Settings.lastJointAt`),
// one set of pure functions, so the timer, the streak and the records can never
// disagree.
// ─────────────────────────────────────────────────────────────────────────────

import { elapsedSince } from "@/lib/dates";

/** Milestone days (kept in sync with the damage engine's reward ladder). */
export const MILESTONES = [1, 3, 7, 14, 30, 90, 180, 365] as const;

/** Earned titles at major milestones — the "Future Vision" ladder. */
export const MILESTONE_TITLES: { day: number; title: string }[] = [
  { day: 1, title: "Survivor" },
  { day: 7, title: "Fighter" },
  { day: 30, title: "Warrior" },
  { day: 90, title: "Dragon Slayer" },
  { day: 180, title: "Freedom Knight" },
  { day: 365, title: "Freedom Master" },
];

const DAY_MS = 86_400_000;

function toMs(at: Date | string | null): number | null {
  if (!at) return null;
  const ms = typeof at === "string" ? new Date(at).getTime() : at.getTime();
  return Number.isFinite(ms) ? ms : null;
}

/** Whole clean days since the anchor — THE canonical streak. Use this everywhere
 *  instead of re-deriving `Math.floor((Date.now() - lastJointAt) / 86400000)`. */
export function streakDaysFrom(lastJointAt: Date | string | null, now: number = Date.now()): number {
  const ms = toMs(lastJointAt);
  if (ms == null) return 0;
  return Math.max(0, Math.floor((now - ms) / DAY_MS));
}

/** Fractional clean days (for forecasts / smooth progress). */
export function cleanDaysFloat(lastJointAt: Date | string | null, now: number = Date.now()): number {
  const ms = toMs(lastJointAt);
  if (ms == null) return 0;
  return Math.max(0, (now - ms) / DAY_MS);
}

/** Total clean seconds since the anchor — drives the Best Clean Run record. */
export function cleanSecondsFrom(lastJointAt: Date | string | null, now: number = Date.now()): number {
  const ms = toMs(lastJointAt);
  if (ms == null) return 0;
  return Math.max(0, Math.floor((now - ms) / 1000));
}

/** Full y/m/d/h/m/s breakdown — the live Hourglass clock. */
export function cleanBreakdown(lastJointAt: Date | string | null, now: Date = new Date()) {
  const ms = toMs(lastJointAt);
  if (ms == null) return null;
  return elapsedSince(new Date(ms), now);
}

/** Display label for a milestone day. */
export function milestoneLabel(day: number): string {
  return day === 365 ? "Year 1" : `Day ${day}`;
}

/** Highest title earned at the given streak (null before Day 1). */
export function currentTitle(streakDays: number): string | null {
  let title: string | null = null;
  for (const m of MILESTONE_TITLES) if (streakDays >= m.day) title = m.title;
  return title;
}

/** The next title to unlock and how many days away it is. */
export function nextTitle(streakDays: number): { day: number; title: string; daysAway: number } | null {
  const upcoming = MILESTONE_TITLES.find((m) => m.day > streakDays);
  if (!upcoming) return null;
  return { day: upcoming.day, title: upcoming.title, daysAway: upcoming.day - streakDays };
}

/** Next milestone day on the visual goal track. */
export function nextMilestone(streakDays: number): number {
  return MILESTONES.find((m) => m > streakDays) ?? MILESTONES[MILESTONES.length - 1];
}

/** Format a duration (seconds) with hours/minutes/seconds kept — never just days.
 *  e.g. "0d 02h 01m 28s" or "12d 07h 33m 04s". */
export function fmtRun(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d}d ${p(h)}h ${p(m)}m ${p(sec)}s`;
}

/** Format a duration as "0d 04h 12m" (days + hours + minutes, no seconds) —
 *  keeps hours/minutes visible even on Day 0 so early progress never reads "0 days". */
export function fmtDurHM(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d}d ${p(h)}h ${p(m)}m`;
}

/** Best clean run ever, in seconds — the persisted record blended with the live
 *  run so an in-progress run that beats the record shows immediately. */
export function bestRunSeconds(storedBestSec: number, lastJointAt: Date | string | null, now: number = Date.now()): number {
  return Math.max(Math.max(0, Math.round(storedBestSec)), cleanSecondsFrom(lastJointAt, now));
}
