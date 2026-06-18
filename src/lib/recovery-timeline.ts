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

export function buildTimeline(input: TimelineInput): RecoveryTimeline {
  const now = input.now ?? new Date();
  const events: TimelineEvent[] = [];

  const relapseMs = input.relapses
    .map((r) => new Date(r.at).getTime())
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

  for (const ms of relapseMs) {
    events.push({ at: new Date(ms).toISOString(), ms, kind: "relapse", label: "Relapse", detail: "Streak reset", icon: "💥", color: COLORS.relapse });
  }

  for (const c of input.cravings) {
    const ms = new Date(c.at).getTime();
    if (!Number.isFinite(ms)) continue;
    const won = c.outcome !== "lost";
    const strong = (c.intensity ?? 0) >= 7;
    if (won && strong) {
      events.push({ at: new Date(ms).toISOString(), ms, kind: "victory", label: "Major victory", detail: `Resisted a ${c.intensity}/10 craving`, icon: "🏅", color: COLORS.victory });
    } else {
      events.push({
        at: new Date(ms).toISOString(), ms,
        kind: won ? "craving-won" : "craving-lost",
        label: won ? "Craving resisted" : "Craving lost",
        detail: c.intensity ? `${c.intensity}/10` : undefined,
        icon: won ? "🛡" : "⚠️",
        color: won ? COLORS.cravingWon : COLORS.cravingLost,
      });
    }
  }

  // Clean periods: between consecutive relapses, plus the current ongoing run.
  const cleanPeriods: CleanPeriod[] = [];
  const anchorMs = input.lastJointAt ? new Date(input.lastJointAt).getTime() : null;
  const boundaries = [...relapseMs];
  // each relapse starts a new clean period that ends at the next relapse (or now)
  for (let i = 0; i < boundaries.length; i++) {
    const start = boundaries[i];
    const end = i + 1 < boundaries.length ? boundaries[i + 1] : now.getTime();
    const ongoing = i + 1 >= boundaries.length;
    cleanPeriods.push({ startMs: start, endMs: end, days: Math.floor((end - start) / 86400000), ongoing });
    events.push({ at: new Date(start).toISOString(), ms: start, kind: "clean-start", label: "Clean run started", icon: "🌱", color: COLORS.cleanStart });
  }
  // If there were no relapses but we have an anchor, the whole run is one period.
  if (boundaries.length === 0 && anchorMs) {
    cleanPeriods.push({ startMs: anchorMs, endMs: now.getTime(), days: Math.floor((now.getTime() - anchorMs) / 86400000), ongoing: true });
    events.push({ at: new Date(anchorMs).toISOString(), ms: anchorMs, kind: "clean-start", label: "Clean run started", icon: "🌱", color: COLORS.cleanStart });
  }

  // Milestones reached in the CURRENT run.
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

/** Filter events to a zoom window (client uses this). */
export function withinDays(events: TimelineEvent[], days: number, now: number = Date.now()): TimelineEvent[] {
  const cutoff = now - days * 86400000;
  return events.filter((e) => e.ms >= cutoff);
}
