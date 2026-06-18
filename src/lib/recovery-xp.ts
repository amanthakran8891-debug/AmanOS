// ─────────────────────────────────────────────────────────────────────────────
// AmanOS — Recovery XP System (Phase 2, #3).
//
// XP is fully DERIVED from real logged recovery behaviour (never a static stored
// counter), using the spec's reward schedule. Level/rank reuse the combat curve
// so the two progression systems stay consistent.
// ─────────────────────────────────────────────────────────────────────────────

import { levelFromXp, xpForLevel, rankForLevel, nextRank } from "@/lib/combat";

/** Exact reward schedule (Phase 2 spec). */
export const RECOVERY_XP = {
  cleanHour: 1,
  cravingDefeated: 10,
  missionCompleted: 25,
  cleanDay: 50,
  gymCleanCombo: 100,
  cleanWeek: 200,
} as const;

export interface XpLine { key: string; label: string; xp: number }

export interface RecoveryXpInput {
  streakDays: number;
  today: {
    jointClean: boolean;
    gymDone: boolean;
    cleanHours: number;       // clean hours accrued so far today (0..24)
    cravingsWon: number;      // cravings defeated today
    missions: number;         // Dragon Attack / recovery missions completed today
    cleanWeekCompletedToday: boolean; // a 7-day boundary crossed today
  };
  lifetime: {
    cleanDays: number;
    cleanHours: number;       // approx total clean hours ever
    cravingsWon: number;
    missions: number;
    gymCleanComboDays: number;
  };
}

export interface RecoveryXp {
  today: { total: number; lines: XpLine[] };
  lifetime: { total: number; lines: XpLine[] };
  level: {
    level: number;
    rank: string;
    nextRankName: string | null;
    nextRankLevel: number | null;
    xpIntoLevel: number;
    xpToNext: number;
    progressPct: number;
  };
}

export function computeRecoveryXp(input: RecoveryXpInput): RecoveryXp {
  const r = RECOVERY_XP;
  const tIn = input.today;

  const todayLines: XpLine[] = [
    { key: "cleanHour", label: `Clean hours ×${tIn.cleanHours}`, xp: tIn.cleanHours * r.cleanHour },
    { key: "craving", label: `Cravings defeated ×${tIn.cravingsWon}`, xp: tIn.cravingsWon * r.cravingDefeated },
    { key: "mission", label: `Recovery missions ×${tIn.missions}`, xp: tIn.missions * r.missionCompleted },
    { key: "cleanDay", label: "Clean day", xp: tIn.jointClean ? r.cleanDay : 0 },
    { key: "combo", label: "Gym + Clean combo", xp: tIn.jointClean && tIn.gymDone ? r.gymCleanCombo : 0 },
    { key: "cleanWeek", label: "Clean week completed", xp: tIn.cleanWeekCompletedToday ? r.cleanWeek : 0 },
  ];
  const todayTotal = todayLines.reduce((s, l) => s + l.xp, 0);

  const L = input.lifetime;
  const cleanWeeks = Math.floor(L.cleanDays / 7);
  const lifeLines: XpLine[] = [
    { key: "cleanHour", label: "Clean hours", xp: Math.round(L.cleanHours) * r.cleanHour },
    { key: "craving", label: "Cravings defeated", xp: L.cravingsWon * r.cravingDefeated },
    { key: "mission", label: "Recovery missions", xp: L.missions * r.missionCompleted },
    { key: "cleanDay", label: "Clean days", xp: L.cleanDays * r.cleanDay },
    { key: "combo", label: "Gym + Clean combos", xp: L.gymCleanComboDays * r.gymCleanCombo },
    { key: "cleanWeek", label: "Clean weeks", xp: cleanWeeks * r.cleanWeek },
  ];
  const lifetimeTotal = lifeLines.reduce((s, l) => s + l.xp, 0);

  const level = levelFromXp(lifetimeTotal);
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const span = Math.max(1, next - base);
  const intoLevel = Math.max(0, lifetimeTotal - base);
  const nr = nextRank(level);

  return {
    today: { total: todayTotal, lines: todayLines.filter((l) => l.xp > 0) },
    lifetime: { total: lifetimeTotal, lines: lifeLines.filter((l) => l.xp > 0) },
    level: {
      level,
      rank: rankForLevel(level).name,
      nextRankName: nr?.name ?? null,
      nextRankLevel: nr?.level ?? null,
      xpIntoLevel: intoLevel,
      xpToNext: Math.max(0, next - lifetimeTotal),
      progressPct: Math.min(100, Math.round((intoLevel / span) * 100)),
    },
  };
}
