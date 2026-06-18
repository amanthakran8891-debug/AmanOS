// ─────────────────────────────────────────────────────────────────────────────
// AmanOS — Recovery Timeline (Phase 2, #8).
// A unified, zoomable history: relapses, cravings, clean periods, milestones and
// victories. Pure — the loader passes raw rows in; the client handles zoom.
// ─────────────────────────────────────────────────────────────────────────────

import { MILESTONES, MILESTONE_TITLES, milestoneLabel } from "@/lib/clean-time";

export type TimelineKind = "relapse" | "craving-won" | "craving-lost" | "milestone" | "victory" | "clean-start";

export interface TimelineEvent {
  at: string;        // ISO
  ms: number;        // epoch ms (for filtering/positioning)
  kind: TimelineKind;
  label: string;
  detail?: string;
  icon: string;
  color: string;
  count?: number;    // >1 when same-day events were grouped
  minor?: boolean;   // low-signal (resisted cravings, clean-restarts) — hidden by default
}

export interface CleanPeriod { startMs: number; endMs: number; days: number; ongoing: boolean }

export interface RecoveryTimeline {
  events: TimelineEvent[]; // sorted ascending
  cleanPeriods: CleanPeriod[];
  longestPeriodDays: number;
}

export interface TimelineInput {
  now?: Date;
  lastJointAt: string | null;
  streakDays: number;
  relapses: { at: string | Date }[];
  cravings: { at: string | Date; outcome: string; intensity?: number }[];
}

export const ZOOM_WINDOWS = [
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
  { key: "1y", label: "1 year", days: 365 },
] as const;

const COLORS = {
  relapse: "#fb7185",
  cravingWon: "#34d399",
  cravingLost: "#f97316",
  milestone: "#fbbf24",
  victory: "#a78bfa",
  cleanStart: "#22d3ee",
};

function dayKeyOf(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Group a list of timestamps by calendar day → one entry per day with count + latest ms. */
function groupByDay(msList: number[]): { ms: number; count: number }[] {
  const map = new Map<string, { ms: number; count: number }>();
  for (const ms of msList) {
    const k = dayKeyOf(ms);
    const e = map.get(k);
    if (e) { e.count++; e.ms = Math.max(e.ms, ms); }
    else map.set(k, { ms, count: 1 });
  }
  return [...map.values()];
}

export function buildTimeline(input: TimelineInput): RecoveryTimeline {
  const now = input.now ?? new Date();
  const events: TimelineEvent[] = [];

  const relapseMs = input.relapses
    .map((r) => new Date(r.at).getTime())
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

  // ── Relapses — collapse multiples on the same day ──
  for (const g of groupByDay(relapseMs)) {
    events.push({
      at: new Date(g.ms).toISOString(), ms: g.ms, kind: "relapse",
      label: g.count > 1 ? `${g.count} relapses logged` : "Relapse",
      detail: "Streak reset", icon: "💥", color: COLORS.relapse, count: g.count,
    });
  }

  // ── Cravings — split into victory / resisted / lost, grouped per day ──
  const victoryMs: number[] = [];
  const resistedMs: number[] = [];
  const lostMs: number[] = [];
  for (const c of input.cravings) {
    const ms = new Date(c.at).getTime();
    if (!Number.isFinite(ms)) continue;
    const won = c.outcome !== "lost";
    const strong = (c.intensity ?? 0) >= 7;
    if (won && strong) victoryMs.push(ms);
    else if (won) resistedMs.push(ms);
    else lostMs.push(ms);
  }
  for (const g of groupByDay(victoryMs)) {
    events.push({ at: new Date(g.ms).toISOString(), ms: g.ms, kind: "victory", label: g.count > 1 ? `${g.count} major victories` : "Major victory", detail: "Strong craving resisted", icon: "🏅", color: COLORS.victory, count: g.count });
  }
  for (const g of groupByDay(lostMs)) {
    events.push({ at: new Date(g.ms).toISOString(), ms: g.ms, kind: "craving-lost", label: g.count > 1 ? `${g.count} cravings lost` : "Craving lost", icon: "⚠️", color: COLORS.cravingLost, count: g.count });
  }
  for (const g of groupByDay(resistedMs)) {
    events.push({ at: new Date(g.ms).toISOString(), ms: g.ms, kind: "craving-won", label: g.count > 1 ? `${g.count} cravings resisted` : "Craving resisted", icon: "🛡", color: COLORS.cravingWon, count: g.count, minor: true });
  }

  // ── Clean periods (ungrouped, for accurate stats) ──
  const cleanPeriods: CleanPeriod[] = [];
  const anchorMs = input.lastJointAt ? new Date(input.lastJointAt).getTime() : null;
  for (let i = 0; i < relapseMs.length; i++) {
    const start = relapseMs[i];
    const end = i + 1 < relapseMs.length ? relapseMs[i + 1] : now.getTime();
    cleanPeriods.push({ startMs: start, endMs: end, days: Math.floor((end - start) / 86400000), ongoing: i + 1 >= relapseMs.length });
  }
  if (relapseMs.length === 0 && anchorMs) {
    cleanPeriods.push({ startMs: anchorMs, endMs: now.getTime(), days: Math.floor((now.getTime() - anchorMs) / 86400000), ongoing: true });
  }

  // ── Clean-run starts — only the LATEST start per day (collapse same-day loops) ──
  const startMsList = cleanPeriods.map((p) => p.startMs);
  if (anchorMs && !startMsList.includes(anchorMs)) startMsList.push(anchorMs);
  for (const g of groupByDay(startMsList)) {
    events.push({ at: new Date(g.ms).toISOString(), ms: g.ms, kind: "clean-start", label: "Clean run started", icon: "🌱", color: COLORS.cleanStart, minor: true });
  }

  // ── Milestones reached in the CURRENT run (always meaningful) ──
  if (anchorMs) {
    for (const m of MILESTONES) {
      if (input.streakDays >= m) {
        const ms = anchorMs + m * 86400000;
        if (ms <= now.getTime()) {
          const title = MILESTONE_TITLES.find((x) => x.day === m)?.title;
          events.push({ at: new Date(ms).toISOString(), ms, kind: "milestone", label: milestoneLabel(m), detail: title ? `${title} unlocked` : "Milestone reached", icon: "🏆", color: COLORS.milestone });
        }
      }
    }
  }

  events.sort((a, b) => a.ms - b.ms);
  const longestPeriodDays = cleanPeriods.reduce((mx, p) => Math.max(mx, p.days), 0);
  return { events, cleanPeriods, longestPeriodDays };
}

/** Meaningful (non-minor) events only — the default, decluttered view. */
export function meaningfulEvents(events: TimelineEvent[]): TimelineEvent[] {
  return events.filter((e) => !e.minor);
}

/** Filter events to a zoom window (client uses this). */
export function withinDays(events: TimelineEvent[], days: number, now: number = Date.now()): TimelineEvent[] {
  const cutoff = now - days * 86400000;
  return events.filter((e) => e.ms >= cutoff);
}
