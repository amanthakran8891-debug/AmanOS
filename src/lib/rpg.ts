// ─────────────────────────────────────────────────────────────────────────────
// AmanOS Life RPG Engine — Character attributes, Personal Records, Combos.
// Pure & fully derived from real logged history. Nothing here can be gamed:
// every attribute, record and combo is computed from actual DayLog behaviour.
// ─────────────────────────────────────────────────────────────────────────────

import { dailyScore, type DayFacts, type DiscTargets } from "@/lib/discipline";
import { addDaysKey } from "@/lib/dates";

// ── Attribute leveling ─────────────────────────────────────────────────────────
function attrLevel(xp: number): number {
  return Math.max(1, Math.min(99, Math.floor(Math.sqrt(Math.max(0, xp) / 6))));
}
function attrProgress(xp: number, level: number): number {
  const base = 6 * level * level;
  const next = 6 * (level + 1) * (level + 1);
  return Math.max(0, Math.min(100, Math.round(((xp - base) / Math.max(1, next - base)) * 100)));
}

const hit = {
  clean: (d: DayFacts) => d.jointClean,
  study: (d: DayFacts) => d.nclexHours > 0 || d.nclexQuestions > 0,
  gym: (d: DayFacts) => d.gymDone,
  protein: (d: DayFacts, t: DiscTargets) => d.proteinG >= t.proteinTarget,
  sleep: (d: DayFacts, t: DiscTargets) => d.sleepHours >= t.sleepTarget,
  bf: (d: DayFacts) => d.bharatfareDone,
};

function trailingRun(asc: DayFacts[], pred: (d: DayFacts) => boolean): number {
  let n = 0;
  for (let i = asc.length - 1; i >= 0; i--) { if (pred(asc[i])) n++; else break; }
  return n;
}
function maxRun(asc: DayFacts[], pred: (d: DayFacts) => boolean): { best: number; endDate: string | null } {
  let best = 0, cur = 0, bestEnd: string | null = null;
  for (const d of asc) {
    if (pred(d)) { cur++; if (cur > best) { best = cur; bestEnd = d.date; } }
    else cur = 0;
  }
  return { best, endDate: bestEnd };
}

/** Damage dealt to the Dragon on a given day = sum of the day's earned XP. */
export function dayDamage(d: DayFacts, t: DiscTargets): number {
  return (hit.clean(d) ? 20 : 0) + (hit.study(d) ? 10 : 0) + (hit.gym(d) ? 15 : 0) + (hit.protein(d, t) ? 10 : 0) + (hit.sleep(d, t) ? 10 : 0) + (hit.bf(d) ? 15 : 0);
}

export interface Attribute { key: string; label: string; icon: string; level: number; proof: string; color: string; progressPct: number }
export interface RpgRecord { key: string; label: string; value: string; date: string | null; icon: string; hint: string }
export interface Combo { key: string; label: string; icon: string; current: number; best: number; tiers: number[]; nextTier: number | null; active: boolean; color: string }

export interface RpgInput {
  factsAsc: DayFacts[];
  targets: DiscTargets;
  currentStreak: number;
  longestStreak: number;
  totalQuestions: number;
  spiritualDays: number;
  recoveryHighest: { score: number; date: string | null };
  combat: { level: number; rank: string; combatPower: number };
}

export interface RpgState {
  character: { level: number; rank: string; combatPower: number; attributes: Attribute[] };
  records: RpgRecord[];
  combos: Combo[];
}

function fmtDate(d: string | null): string | null {
  if (!d) return null;
  return new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function computeRpg(input: RpgInput): RpgState {
  const { factsAsc, targets, currentStreak, longestStreak, totalQuestions, spiritualDays, recoveryHighest, combat } = input;
  const t = targets;
  const logged = factsAsc.filter((d) => d.hasData);

  const studyDays = logged.filter(hit.study).length;
  const gymSessions = logged.filter(hit.gym).length;
  const cleanDaysLifetime = logged.filter(hit.clean).length;
  const proteinDaysL = logged.filter((d) => hit.protein(d, t)).length;
  const bfDays = logged.filter(hit.bf).length;
  const discSum = logged.reduce((s, d) => s + dailyScore(d, t).score, 0);
  const strongDays = logged.filter((d) => dailyScore(d, t).score >= 75).length;
  const avgDisc = logged.length ? Math.round(discSum / logged.length) : 0;

  // ── Attributes ──
  const xp = {
    discipline: Math.round(discSum * 0.3),
    knowledge: studyDays * 8 + Math.round(totalQuestions * 0.5),
    strength: gymSessions * 16,
    recovery: cleanDaysLifetime * 10 + currentStreak * 6,
    business: bfDays * 22,
    wisdom: spiritualDays * 14,
  };
  const mk = (key: string, label: string, icon: string, color: string, x: number, proof: string): Attribute => {
    const level = attrLevel(x);
    return { key, label, icon, color, level, proof, progressPct: attrProgress(x, level) };
  };
  const attributes: Attribute[] = [
    mk("discipline", "Discipline", "⚖", "#fbbf24", xp.discipline, `${avgDisc} avg · ${strongDays} strong days`),
    mk("knowledge", "Knowledge", "📚", "#22d3ee", xp.knowledge, `${studyDays} study days · ${totalQuestions.toLocaleString()} Qs`),
    mk("strength", "Strength", "💪", "#fb7185", xp.strength, `${gymSessions} sessions`),
    mk("recovery", "Recovery", "🛡", "#34f5c5", xp.recovery, `${cleanDaysLifetime} clean days · ${currentStreak}d streak`),
    mk("business", "Business", "✈", "#a3e635", xp.business, `${bfDays} tasks shipped`),
    mk("wisdom", "Wisdom", "🕉", "#a78bfa", xp.wisdom, `${spiritualDays} spiritual days`),
  ];

  // ── Personal records ──
  const cleanMax = maxRun(logged, hit.clean);
  const studyMax = maxRun(logged, hit.study);
  let bestDay = { score: 0, date: null as string | null };
  let bestDmg = { dmg: 0, date: null as string | null };
  for (const d of logged) {
    const s = dailyScore(d, t).score;
    if (s > bestDay.score) bestDay = { score: s, date: d.date };
    const dmg = dayDamage(d, t);
    if (dmg > bestDmg.dmg) bestDmg = { dmg, date: d.date };
  }
  const { best: bestWeek, endDate: bestWeekEnd } = bestWindow(logged, t, 7, 4);
  const { best: bestMonth, endDate: bestMonthEnd } = bestWindow(logged, t, 30, 12);
  const bestCleanStreak = Math.max(longestStreak, cleanMax.best, currentStreak);

  const records: RpgRecord[] = [
    { key: "clean", label: "Best Clean Streak", value: `${bestCleanStreak} days`, date: fmtDate(cleanMax.endDate), icon: "🚭", hint: currentStreak >= bestCleanStreak && currentStreak > 0 ? "Live record — beat it today" : "All-time best" },
    { key: "disc", label: "Best Discipline Day", value: `${bestDay.score}`, date: fmtDate(bestDay.date), icon: "⚖", hint: "Highest single-day score" },
    { key: "week", label: "Best Week", value: `${bestWeek} avg`, date: fmtDate(bestWeekEnd), icon: "📅", hint: "Top 7-day average" },
    { key: "month", label: "Best Month", value: `${bestMonth} avg`, date: fmtDate(bestMonthEnd), icon: "🗓", hint: "Top 30-day average" },
    { key: "dmg", label: "Highest Dragon Damage", value: `${bestDmg.dmg}`, date: fmtDate(bestDmg.date), icon: "⚔", hint: "Most damage in one day" },
    { key: "nclex", label: "Longest NCLEX Streak", value: `${studyMax.best} days`, date: fmtDate(studyMax.endDate), icon: "📚", hint: "Consecutive study days" },
    { key: "recovery", label: "Highest Recovery Score", value: `${recoveryHighest.score}`, date: fmtDate(recoveryHighest.date), icon: "🛡", hint: "Peak Freedom score" },
  ];

  // ── Combos ──
  const mkCombo = (key: string, label: string, icon: string, color: string, current: number, best: number, tiers: number[]): Combo => ({
    key, label, icon, color, current, best, tiers, nextTier: tiers.find((x) => x > current) ?? null, active: current > 0,
  });
  const combos: Combo[] = [
    mkCombo("clean", "Clean", "🚭", "#34f5c5", currentStreak, bestCleanStreak, [3, 7, 14, 30, 90, 180, 365]),
    mkCombo("nclex", "NCLEX", "📚", "#22d3ee", trailingRun(logged, hit.study), studyMax.best, [3, 7, 14, 30]),
    mkCombo("protein", "Protein", "🥩", "#fb7185", trailingRun(logged, (d) => hit.protein(d, t)), maxRun(logged, (d) => hit.protein(d, t)).best, [3, 7, 14, 30]),
    mkCombo("gym", "Gym", "💪", "#a3e635", trailingRun(logged, hit.gym), maxRun(logged, hit.gym).best, [3, 7, 14, 21]),
    mkCombo("discipline", "Discipline", "⚖", "#fbbf24", trailingRun(logged, (d) => dailyScore(d, t).score >= 60), maxRun(logged, (d) => dailyScore(d, t).score >= 60).best, [3, 7, 14, 30]),
  ];

  return { character: { ...combat, attributes }, records, combos };
}

/** Best rolling calendar-window average of the discipline score. */
function bestWindow(logged: DayFacts[], t: DiscTargets, span: number, minDays: number): { best: number; endDate: string | null } {
  if (logged.length === 0) return { best: 0, endDate: null };
  const scoreByDate = new Map(logged.map((d) => [d.date, dailyScore(d, t).score]));
  const first = logged[0].date;
  const last = logged[logged.length - 1].date;
  let best = 0, endDate: string | null = null;
  let cursor = first;
  // Walk the start day across the whole logged range.
  let guard = 0;
  while (cursor <= last && guard < 2000) {
    let sum = 0, present = 0, windowEnd = cursor;
    for (let i = 0; i < span; i++) {
      const k = addDaysKey(cursor, i);
      if (scoreByDate.has(k)) { sum += scoreByDate.get(k)!; present++; windowEnd = k; }
    }
    if (present >= minDays) {
      const avg = Math.round(sum / present);
      if (avg > best) { best = avg; endDate = windowEnd; }
    }
    cursor = addDaysKey(cursor, 1);
    guard++;
  }
  return { best, endDate };
}
