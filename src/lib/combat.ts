// ─────────────────────────────────────────────────────────────────────────────
// AmanOS Dragon Combat Engine.
//
// The Dragon = addiction, procrastination, excuses, weakness, drift, missed
// potential. It weakens as you get stronger. This engine is PURE and fully
// DERIVED from real logged history — XP is never a stored, gameable counter.
//
// Design rule (enforced): XP comes only from real logged behaviour. Permanent
// progress (XP, Level, Rank, bosses, equipment) reflects cumulative real action.
// Current Dragon health reflects your CURRENT streak/discipline — so a relapse
// heals the Dragon now, but never erases the levels you earned. You restart the
// fight from experience, not from zero.
// ─────────────────────────────────────────────────────────────────────────────

import { dailyScore, type DayFacts, type DiscTargets } from "@/lib/discipline";
import { comboMultiplier } from "@/lib/damage";

export const XP = {
  clean: 20,
  nclex: 10,
  gym: 15,
  protein: 10,
  sleep: 10,
  bharatfare: 15,
  weeklyMission: 50,
} as const;

// ── Levels & ranks ────────────────────────────────────────────────────────────
// Cumulative XP to *reach* a level L is ceil(3.2 * L^2). One fully disciplined
// year (~32k XP incl. bosses/weeklies) lands around Level 100 — Freedom Master.
export function xpForLevel(level: number): number {
  return Math.ceil(3.2 * level * level);
}
export function levelFromXp(xp: number): number {
  return Math.max(1, Math.min(100, Math.floor(Math.sqrt(Math.max(0, xp) / 3.2))));
}

export const RANKS: { level: number; name: string }[] = [
  { level: 1, name: "Survivor" },
  { level: 5, name: "Fighter" },
  { level: 10, name: "Warrior" },
  { level: 20, name: "Commander" },
  { level: 30, name: "Champion" },
  { level: 50, name: "Dragon Slayer" },
  { level: 75, name: "Legend" },
  { level: 100, name: "Freedom Master" },
];
export function rankForLevel(level: number): { level: number; name: string } {
  let r = RANKS[0];
  for (const rank of RANKS) if (level >= rank.level) r = rank;
  return r;
}
export function nextRank(level: number): { level: number; name: string } | null {
  return RANKS.find((r) => r.level > level) ?? null;
}

// ── Bosses (milestone fights) — defeated permanently via best-ever streak ──────
export interface BossDef { key: string; day: number; name: string; reward: number; desc: string; final?: boolean }
export const BOSSES: BossDef[] = [
  { key: "b7", day: 7, name: "The Craving Beast", reward: 25, desc: "The first and loudest enemy — raw, physical cravings." },
  { key: "b30", day: 30, name: "The Withdrawal Wraith", reward: 50, desc: "Restless nights and mood swings made flesh." },
  { key: "b90", day: 90, name: "The Habit Hydra", reward: 100, desc: "Old routines that grow two heads for every one you cut." },
  { key: "b180", day: 180, name: "The Identity Phantom", reward: 150, desc: "The ghost of who you used to be, fighting to stay." },
  { key: "b365", day: 365, name: "The Dragon Sovereign", reward: 250, desc: "The addiction's true form. Defeat it and you are free.", final: true },
];

// ── Equipment (real habits → gear) ─────────────────────────────────────────────
export interface EquipmentDef { key: string; name: string; source: string; bonus: number; requirement: string }
export const EQUIPMENT: EquipmentDef[] = [
  { key: "armor", name: "Iron Armor", source: "Protein consistency", bonus: 10, requirement: "7 days in a row hitting protein" },
  { key: "strength", name: "Titan Strength", source: "Gym streak", bonus: 12, requirement: "3+ training days in the last 7" },
  { key: "blade", name: "Scholar Blade", source: "NCLEX study streak", bonus: 12, requirement: "5 study days in a row" },
  { key: "shield", name: "Recovery Shield", source: "Sleep consistency", bonus: 10, requirement: "7 days in a row hitting sleep" },
  { key: "crown", name: "Founder Crown", source: "BharatFare execution", bonus: 15, requirement: "5 business tasks in the last 7" },
];

// ── Campaign chapters ──────────────────────────────────────────────────────────
export interface ChapterDef { n: number; name: string; from: number; to: number; tagline: string }
export const CHAPTERS: ChapterDef[] = [
  { n: 1, name: "Withdrawal Valley", from: 0, to: 7, tagline: "Survive the first storm." },
  { n: 2, name: "Discipline Mountains", from: 7, to: 30, tagline: "Build the daily standard." },
  { n: 3, name: "Focus Forest", from: 30, to: 90, tagline: "Clarity and momentum return." },
  { n: 4, name: "Momentum Kingdom", from: 90, to: 180, tagline: "The new life takes hold." },
  { n: 5, name: "Freedom Citadel", from: 180, to: 365, tagline: "Reach permanent freedom." },
];

// ── Outputs ────────────────────────────────────────────────────────────────────
export interface BattleEntry { kind: "damage" | "retaliate"; amount: number; text: string }
export interface BattleDay { date: string; label: string; entries: BattleEntry[]; totalDamage: number }

export interface CombatState {
  xp: number;
  level: number;
  rank: string;
  nextRank: { level: number; name: string } | null;
  xpIntoLevel: number;
  xpForThisLevel: number;
  xpToNext: number;
  levelProgressPct: number;
  combatPower: number;
  maxed: boolean;
  dragon: { health: number; armor: number; attackPower: number; threat: string; threatColor: string };
  totals: { cleanDays: number; gymDays: number; studyDays: number; proteinDays: number; sleepDays: number; bharatfareDays: number; weeklyMissions: number; bossesDefeated: number };
  bosses: { key: string; day: number; name: string; desc: string; reward: number; status: "defeated" | "active" | "locked"; progressPct: number; final: boolean }[];
  equipment: { key: string; name: string; source: string; bonus: number; requirement: string; unlocked: boolean; progress: string }[];
  chapters: { n: number; name: string; tagline: string; status: "done" | "current" | "locked"; progressPct: number }[];
  currentChapter: number;
  battleLog: BattleDay[];
  victory: null | { milestone: number; bossName: string; improved: string; gained: string; next: string };
  todayCombo: { mult: number; label: string | null };
}

export interface CombatInput {
  days: DayFacts[]; // all-time, any order
  targets: DiscTargets;
  currentStreak: number;
  longestStreak: number;
  avg7Discipline: number;
  dragonPower: number; // current addiction strength 0..100 (from dragonState)
  craving: number; // today's craving 0..10
}

function isoWeekKey(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = (d.getDay() + 6) % 7; // Mon=0
  d.setDate(d.getDate() - day + 3); // nearest Thursday
  const firstThu = new Date(d.getFullYear(), 0, 4);
  const week = 1 + Math.round((d.getTime() - firstThu.getTime()) / 86400000 / 7);
  return `${d.getFullYear()}-W${week}`;
}

function runLength(sortedDesc: DayFacts[], pred: (d: DayFacts) => boolean): number {
  let n = 0;
  for (const d of sortedDesc) { if (pred(d)) n++; else break; }
  return n;
}

export function computeCombat(input: CombatInput): CombatState {
  const { days, targets, currentStreak, longestStreak, avg7Discipline, dragonPower, craving } = input;
  const logged = days.filter((d) => d.hasData);
  const asc = [...logged].sort((a, b) => (a.date < b.date ? -1 : 1));
  const desc = [...asc].reverse();

  // ── XP totals (real behaviour only) ──
  const hit = {
    clean: (d: DayFacts) => d.jointClean,
    nclex: (d: DayFacts) => d.nclexHours > 0 || d.nclexQuestions > 0,
    gym: (d: DayFacts) => d.gymDone,
    protein: (d: DayFacts) => d.proteinG >= targets.proteinTarget,
    sleep: (d: DayFacts) => d.sleepHours >= targets.sleepTarget,
    bharatfare: (d: DayFacts) => d.bharatfareDone,
  };
  const totals = {
    cleanDays: asc.filter(hit.clean).length,
    studyDays: asc.filter(hit.nclex).length,
    gymDays: asc.filter(hit.gym).length,
    proteinDays: asc.filter(hit.protein).length,
    sleepDays: asc.filter(hit.sleep).length,
    bharatfareDays: asc.filter(hit.bharatfare).length,
    weeklyMissions: 0,
    bossesDefeated: BOSSES.filter((b) => longestStreak >= b.day).length,
  };

  // Weekly missions: a week with >=5 logged days and avg accountability >=75.
  const weeks = new Map<string, DayFacts[]>();
  for (const d of asc) { const k = isoWeekKey(d.date); (weeks.get(k) ?? weeks.set(k, []).get(k)!).push(d); }
  for (const arr of weeks.values()) {
    if (arr.length >= 5) {
      const avg = Math.round(arr.reduce((s, d) => s + dailyScore(d, targets).score, 0) / arr.length);
      if (avg >= 75) totals.weeklyMissions++;
    }
  }

  // XP is summed PER DAY so the combo multiplier (same one the damage engine
  // uses) compounds a day's stacked habits — Gym+NCLEX ×1.5, +Clean ×2. Still
  // 100% real logged actions: a day with no logged habit earns nothing, and
  // tapping is never an input.
  let xp = 0;
  for (const d of asc) {
    const dayBase =
      (hit.clean(d) ? XP.clean : 0) +
      (hit.nclex(d) ? XP.nclex : 0) +
      (hit.gym(d) ? XP.gym : 0) +
      (hit.protein(d) ? XP.protein : 0) +
      (hit.sleep(d) ? XP.sleep : 0) +
      (hit.bharatfare(d) ? XP.bharatfare : 0);
    if (dayBase === 0) continue;
    const { mult } = comboMultiplier(hit.gym(d), hit.nclex(d), hit.clean(d));
    xp += Math.round(dayBase * mult);
  }
  xp += totals.weeklyMissions * XP.weeklyMission;
  xp += BOSSES.filter((b) => longestStreak >= b.day).reduce((s, b) => s + b.reward, 0);

  // Today's combo (for the Arena) — derived from today's real logged habits.
  const todayFacts = desc[0];
  const todayCombo = todayFacts
    ? comboMultiplier(hit.gym(todayFacts), hit.nclex(todayFacts), hit.clean(todayFacts))
    : { mult: 1, label: null };

  const level = levelFromXp(xp);
  const maxed = level >= 100;
  const xpForThisLevelStart = xpForLevel(level);
  const xpForNextStart = xpForLevel(level + 1);
  const xpIntoLevel = xp - xpForThisLevelStart;
  const xpToNext = Math.max(0, xpForNextStart - xpForThisLevelStart);
  const levelProgressPct = maxed ? 100 : Math.min(100, Math.round((xpIntoLevel / Math.max(1, xpToNext)) * 100));

  // ── Equipment (current consistency) ──
  const gymLast7 = desc.slice(0, 7).filter(hit.gym).length;
  const bfLast7 = desc.slice(0, 7).filter(hit.bharatfare).length;
  const proteinRun = runLength(desc, hit.protein);
  const sleepRun = runLength(desc, hit.sleep);
  const studyRun = runLength(desc, hit.nclex);
  const equipState: Record<string, { unlocked: boolean; progress: string }> = {
    armor: { unlocked: proteinRun >= 7, progress: `${Math.min(proteinRun, 7)}/7 day streak` },
    strength: { unlocked: gymLast7 >= 3, progress: `${gymLast7}/3 in last 7` },
    blade: { unlocked: studyRun >= 5, progress: `${Math.min(studyRun, 5)}/5 day streak` },
    shield: { unlocked: sleepRun >= 7, progress: `${Math.min(sleepRun, 7)}/7 day streak` },
    crown: { unlocked: bfLast7 >= 5, progress: `${bfLast7}/5 in last 7` },
  };
  const equipment = EQUIPMENT.map((e) => ({ ...e, unlocked: equipState[e.key].unlocked, progress: equipState[e.key].progress }));
  const equipBonus = equipment.filter((e) => e.unlocked).reduce((s, e) => s + e.bonus, 0);

  const combatPower = level * 10 + equipBonus + totals.bossesDefeated * 20;

  // ── Dragon current status ──
  const health = Math.round(Math.max(0, Math.min(100, dragonPower)));
  const armor = Math.round(Math.max(0, Math.min(100, 100 - avg7Discipline)));
  const attackPower = Math.round(Math.max(0, Math.min(100, health * 0.7 + craving * 2)));
  const threat = health >= 70 ? "High" : health >= 40 ? "Moderate" : health >= 15 ? "Low" : "Minimal";
  const threatColor = health >= 70 ? "#fb7185" : health >= 40 ? "#fbbf24" : health >= 15 ? "#a3e635" : "#34f5c5";

  // ── Bosses status ──
  const firstUndefeated = BOSSES.find((b) => longestStreak < b.day);
  const bosses = BOSSES.map((b) => {
    const defeated = longestStreak >= b.day;
    const active = !defeated && b.key === firstUndefeated?.key;
    return {
      key: b.key, day: b.day, name: b.name, desc: b.desc, reward: b.reward, final: !!b.final,
      status: (defeated ? "defeated" : active ? "active" : "locked") as "defeated" | "active" | "locked",
      progressPct: defeated ? 100 : Math.min(100, Math.round((currentStreak / b.day) * 100)),
    };
  });

  // ── Campaign chapters ──
  const chapters = CHAPTERS.map((c) => {
    const status: "done" | "current" | "locked" = currentStreak >= c.to ? "done" : currentStreak >= c.from ? "current" : "locked";
    const progressPct = currentStreak >= c.to ? 100 : currentStreak < c.from ? 0 : Math.round(((currentStreak - c.from) / (c.to - c.from)) * 100);
    return { n: c.n, name: c.name, tagline: c.tagline, status, progressPct };
  });
  const currentChapter = (chapters.find((c) => c.status === "current")?.n) ?? (currentStreak >= 365 ? 5 : 1);

  // ── Battle log (last 14 logged days) ──
  const battleLog: BattleDay[] = desc.slice(0, 14).map((d) => {
    const entries: BattleEntry[] = [];
    if (hit.clean(d)) entries.push({ kind: "damage", amount: XP.clean, text: "Stayed clean" });
    if (hit.nclex(d)) entries.push({ kind: "damage", amount: XP.nclex, text: "NCLEX study logged" });
    if (hit.gym(d)) entries.push({ kind: "damage", amount: XP.gym, text: "Completed training" });
    if (hit.protein(d)) entries.push({ kind: "damage", amount: XP.protein, text: "Hit protein target" });
    if (hit.sleep(d)) entries.push({ kind: "damage", amount: XP.sleep, text: "Hit sleep target" });
    if (hit.bharatfare(d)) entries.push({ kind: "damage", amount: XP.bharatfare, text: "BharatFare mission done" });
    // Dragon retaliates on real misses.
    if (!d.jointClean) entries.push({ kind: "retaliate", amount: 25, text: "Relapse — the Dragon fed" });
    if (d.sleepHours > 0 && d.sleepHours < targets.sleepTarget) entries.push({ kind: "retaliate", amount: 5, text: "Sleep target missed" });
    if (d.proteinG > 0 && d.proteinG < targets.proteinTarget * 0.7) entries.push({ kind: "retaliate", amount: 5, text: "Protein fell short" });
    const totalDamage = entries.filter((e) => e.kind === "damage").reduce((s, e) => s + e.amount, 0);
    return {
      date: d.date,
      label: new Date(d.date + "T00:00:00").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
      entries,
      totalDamage,
    };
  }).filter((d) => d.entries.length > 0);

  // ── Victory (you are exactly at a milestone today) ──
  const milestoneBoss = BOSSES.find((b) => b.day === currentStreak);
  const victory = milestoneBoss
    ? {
        milestone: milestoneBoss.day,
        bossName: milestoneBoss.name,
        improved: victoryImproved(milestoneBoss.day),
        gained: `+${milestoneBoss.reward} XP, the "${milestoneBoss.name}" defeated, and permanent Dragon damage.`,
        next: victoryNext(milestoneBoss.day),
      }
    : null;

  return {
    xp, level, rank: rankForLevel(level).name, nextRank: nextRank(level),
    xpIntoLevel, xpForThisLevel: xpToNext, xpToNext, levelProgressPct, combatPower, maxed,
    dragon: { health, armor, attackPower, threat, threatColor },
    totals, bosses, equipment, chapters, currentChapter, battleLog, victory, todayCombo,
  };
}

function victoryImproved(day: number): string {
  switch (day) {
    case 7: return "Acute cravings have peaked and begun to fade. Sleep is starting to settle.";
    case 30: return "CB1 receptors are recovering toward baseline. Mood and focus are noticeably steadier.";
    case 90: return "Deep habit pathways have reorganised. Drive, clarity and discipline are markedly stronger.";
    case 180: return "Clean is becoming identity, not effort. Long-term stability is locked in.";
    case 365: return "A full year free. The addiction's hold is broken.";
    default: return "Real ground reclaimed from the Dragon.";
  }
}
function victoryNext(day: number): string {
  switch (day) {
    case 7: return "Next: The Withdrawal Wraith at 30 days. Protect your sleep and keep training.";
    case 30: return "Next: The Habit Hydra at 90 days. Compound the routine — don't coast.";
    case 90: return "Next: The Identity Phantom at 180 days. Become the person who doesn't need it.";
    case 180: return "Next: The Dragon Sovereign at 365 days. The final fight. Finish it.";
    case 365: return "The Dragon is defeated. Guard your freedom — it can always try to return.";
    default: return "Keep the streak alive and chase the next boss.";
  }
}
