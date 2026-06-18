// ─────────────────────────────────────────────────────────────────────────────
// AmanOS — Smoke Serpent Battle System (Phase 4.5).
// Turns the nicotine analytics into a living-enemy battle: HP/1000, threat state,
// today's damage, arena actions, missions, honest cost, gated intelligence and a
// rank progression. Pure — composes the existing NicotineReport + today context.
// ─────────────────────────────────────────────────────────────────────────────

import type { ThreatBand } from "@/lib/battle";
import type { NicotineReport, NicotineGoalRow, NicotineRecovery } from "@/lib/nicotine";
import { threatBand, THREAT_VISUAL, threatToHp, rankFor } from "@/lib/battle";
export type { ThreatBand } from "@/lib/battle";
export interface SerpentState {
  hpCurrent: number;   // 0..1000 (higher = stronger enemy)
  hpMax: number;       // 1000
  threatPct: number;   // 0..100
  threat: ThreatBand;
  color: string;       // eye / accent colour
  eye: string;         // eye colour
  posture: string;     // short descriptor
  heavySmoke: boolean;
  warningPulse: boolean;
}

export interface DamageItem { key: string; icon: string; label: string; hp: number; done: boolean; count?: number }
export interface SerpentDamage { items: DamageItem[]; total: number; healedToday: number }

export interface SerpentMission { key: string; icon: string; label: string; reward: string; rewardKind: "hp" | "xp"; done: boolean; action: "gym" | "craving-won" | "passive" }
export interface SerpentMissionBoard { missions: SerpentMission[]; completed: number; total: number }

export interface SerpentRank { min: number; name: string; icon: string }
export const SERPENT_RANKS: SerpentRank[] = [
  { min: 0, name: "Smoke Novice", icon: "🌫" },
  { min: 1, name: "Craving Fighter", icon: "💪" },
  { min: 7, name: "Serpent Hunter", icon: "🏹" },
  { min: 30, name: "Nicotine Slayer", icon: "⚔" },
  { min: 90, name: "Freedom Walker", icon: "🚶" },
  { min: 365, name: "Freedom Master", icon: "👑" },
];

export interface SerpentProgress {
  rank: SerpentRank;
  next: SerpentRank | null;
  freeDays: number;
  progressPct: number;
  daysToNext: number;
}

export interface LockedSystem { key: string; label: string; icon: string; unlocksInDays: number; locked: boolean }

export interface SerpentCost {
  assumptions: { cigsPerDay: number; pricePerUnit: number; pricePerPack: number; packSize: number };
  daily: number; monthly: number; yearly: number; fiveYear: number; tenYear: number;
  savedSoFar: number; spentLogged: number; currency: string;
}

export interface SerpentIntel { enough: boolean; insights: string[] }

export interface SerpentToday {
  nicotineUsedToday: boolean;
  cravingsWonToday: number;
  gymDone: boolean;
  waterMl: number;
  waterTarget: number;
  pastDangerWindow: boolean;
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

// ── Threat / HP ───────────────────────────────────────────────────────────────
export function serpentState(report: NicotineReport): SerpentState {
  const pct = clamp(Math.round(0.55 * report.dragon.hp + 0.45 * report.riskToday.score));
  const { hpCurrent, hpMax, threatPct } = threatToHp(pct);
  const threat = threatBand(threatPct);
  const v = THREAT_VISUAL[threat];
  const posture = {
    LOW: "Relaxed, slow breathing",
    MODERATE: "Stirring — light smoke",
    HIGH: "Coiled and alert",
    EXTREME: "Aggressive — heavy smoke, tail shaking",
  }[threat];
  return { hpCurrent, hpMax, threatPct, threat, color: v.color, eye: v.eye, posture, heavySmoke: v.heavySmoke, warningPulse: v.warningPulse };
}

// ── Today's damage / Arena actions ────────────────────────────────────────────
export function serpentDamage(today: SerpentToday): SerpentDamage {
  const waterHit = today.waterTarget > 0 && today.waterMl >= today.waterTarget;
  const cravings = Math.max(0, today.cravingsWonToday);
  const items: DamageItem[] = [
    { key: "craving", icon: "🛡", label: "Resist craving", hp: 25 * Math.max(1, cravings), done: cravings > 0, count: cravings },
    { key: "gym", icon: "🏋", label: "Complete gym", hp: 50, done: today.gymDone },
    { key: "water", icon: "💧", label: "Water target", hp: 25, done: waterHit },
    { key: "window", icon: "🕛", label: "Survive danger window", hp: 75, done: today.pastDangerWindow && !today.nicotineUsedToday },
    { key: "midnight", icon: "🌙", label: "Reach midnight clean", hp: 100, done: !today.nicotineUsedToday },
  ];
  // earned damage = sum of completed actions (craving counts each resist)
  const total = items.reduce((s, i) => {
    if (!i.done) return s;
    return s + (i.key === "craving" ? 25 * cravings : i.hp);
  }, 0);
  const healedToday = today.nicotineUsedToday ? 150 : 0;
  return { items, total, healedToday };
}

// ── Mission Board ─────────────────────────────────────────────────────────────
export function serpentMissions(today: SerpentToday): SerpentMissionBoard {
  const missions: SerpentMission[] = [
    { key: "midnight", icon: "🚭", label: "No nicotine until midnight", reward: "−50 HP", rewardKind: "hp", done: !today.nicotineUsedToday, action: "passive" },
    { key: "gym", icon: "🏋", label: "Complete gym session", reward: "−25 HP", rewardKind: "hp", done: today.gymDone, action: "gym" },
    { key: "rule15", icon: "⏱", label: "Use the 15-minute rule", reward: "+10 XP", rewardKind: "xp", done: today.cravingsWonToday > 0, action: "craving-won" },
    { key: "logcraving", icon: "📝", label: "Log a craving instead of using", reward: "+15 XP", rewardKind: "xp", done: today.cravingsWonToday > 0, action: "craving-won" },
  ];
  return { missions, completed: missions.filter((m) => m.done).length, total: missions.length };
}

// ── Progression ───────────────────────────────────────────────────────────────
export function serpentProgress(freeDays: number): SerpentProgress {
  const r = rankFor(freeDays, SERPENT_RANKS);
  return { rank: r.rank, next: r.next, freeDays, progressPct: r.progressPct, daysToNext: r.toNext };
}

// ── Locked systems (progressive unlock) ───────────────────────────────────────
export function lockedSystems(daysLogged: number): LockedSystem[] {
  const defs = [
    { key: "heatmap", label: "Trigger Heatmap", icon: "🔥", at: 7 },
    { key: "correlations", label: "Correlation Engine", icon: "🧠", at: 10 },
    { key: "forecast", label: "Forecast Accuracy", icon: "🎯", at: 14 },
    { key: "tod", label: "Time-of-Day Analysis", icon: "🕐", at: 7 },
  ];
  return defs.map((d) => ({ key: d.key, label: d.label, icon: d.icon, unlocksInDays: Math.max(0, d.at - daysLogged), locked: daysLogged < d.at }));
}

// ── Honest cost ───────────────────────────────────────────────────────────────
export function serpentCost(goal: NicotineGoalRow, rec: NicotineRecovery, currency = "£"): SerpentCost {
  const cigsPerDay = Math.max(0, goal.baselinePerDay);
  const pricePerUnit = Math.max(0, goal.pricePerUnit);
  const packSize = 20;
  const daily = Math.round(cigsPerDay * pricePerUnit * 100) / 100;
  const monthly = Math.round(daily * 30);
  const yearly = Math.round(daily * 365);
  return {
    assumptions: { cigsPerDay, pricePerUnit, pricePerPack: Math.round(pricePerUnit * packSize * 100) / 100, packSize },
    daily, monthly, yearly, fiveYear: yearly * 5, tenYear: yearly * 10,
    // saved & spent both priced at the SAME pricePerUnit so the numbers reconcile.
    savedSoFar: Math.round(rec.moneySaved), spentLogged: Math.round(rec.moneySpent), currency,
  };
}

// ── Intelligence (confidence-gated) ───────────────────────────────────────────
export function serpentIntel(report: NicotineReport): SerpentIntel {
  const out: string[] = [];
  if (report.dragon.strongestWindow && report.dragon.strongestWindow !== "—") out.push(`Most nicotine events occur around ${report.dragon.strongestWindow}.`);
  const trig = report.graphs.triggers[0];
  if (trig && trig.count >= 3) out.push(`Strongest trigger: ${trig.name} (${trig.count} logs).`);
  for (const line of report.insights) if (!out.includes(line)) out.push(line);
  const enough = report.daysLogged >= 7 && out.length > 0;
  return { enough, insights: enough ? out.slice(0, 6) : [] };
}

// ── Top-level battle bundle ───────────────────────────────────────────────────
export interface SerpentBattle {
  state: SerpentState;
  damage: SerpentDamage;
  missions: SerpentMissionBoard;
  progress: SerpentProgress;
  locked: LockedSystem[];
  cost: SerpentCost;
  intel: SerpentIntel;
  freeMs: number;
  analyticsUnlocked: boolean;
  needMoreDays: number;
}

export function buildSerpentBattle(report: NicotineReport, today: SerpentToday): SerpentBattle {
  return {
    state: serpentState(report),
    damage: serpentDamage(today),
    missions: serpentMissions(today),
    progress: serpentProgress(report.recovery.freeDays),
    locked: lockedSystems(report.daysLogged),
    cost: serpentCost(report.goal, report.recovery),
    intel: serpentIntel(report),
    freeMs: report.recovery.freeMs,
    analyticsUnlocked: report.daysLogged >= 7,
    needMoreDays: report.needMoreDays,
  };
}

