// AmanOS shared engine — GAMIFICATION.
// Generic tiers/levels/dragons/health-scores from any numeric value, so every
// command center (Finance Dragon, Nicotine Dragon, Wealth Level, Freedom Meter)
// uses one engine.

export interface Tier { name: string; min: number; color: string; icon: string }

export interface LevelState {
  index: number;
  tier: Tier;
  next: Tier | null;
  value: number;
  progressPct: number; // toward next tier
  toNext: number;
}

/** Where `value` sits within an ascending list of tiers. */
export function levelOf(value: number, tiers: Tier[]): LevelState {
  const sorted = [...tiers].sort((a, b) => a.min - b.min);
  let idx = 0;
  for (let i = 0; i < sorted.length; i++) if (value >= sorted[i].min) idx = i;
  const tier = sorted[idx];
  const next = sorted[idx + 1] ?? null;
  const span = next ? next.min - tier.min : 1;
  const progressPct = next ? Math.max(0, Math.min(100, Math.round(((value - tier.min) / span) * 100))) : 100;
  return { index: idx, tier, next, value, progressPct, toNext: next ? Math.max(0, next.min - value) : 0 };
}

/** A 0–100 health score from weighted 0..1 parts. */
export function healthScore(parts: { value: number; weight: number }[]): number {
  const wsum = parts.reduce((s, p) => s + p.weight, 0) || 1;
  const v = parts.reduce((s, p) => s + Math.max(0, Math.min(1, p.value)) * p.weight, 0) / wsum;
  return Math.round(v * 100);
}

/** A simple "meter" 0–100 toward a goal. */
export function meter(value: number, goal: number): number {
  return goal > 0 ? Math.max(0, Math.min(100, Math.round((value / goal) * 100))) : 0;
}

/** Generic dragon: stages defeated + current stage from a cumulative value. */
export interface DragonState { stagesDefeated: number; stageIndex: number; tier: Tier; next: Tier | null; progressPct: number }
export function dragonFrom(value: number, tiers: Tier[]): DragonState {
  const l = levelOf(value, tiers);
  return { stagesDefeated: l.index, stageIndex: l.index, tier: l.tier, next: l.next, progressPct: l.progressPct };
}

// Reusable tier ladders.
export const WEALTH_TIERS: Tier[] = [
  { name: "Surviving", min: 0, color: "#94a3b8", icon: "🪙" },
  { name: "Stabilising", min: 1000, color: "#38bdf8", icon: "💧" },
  { name: "Building", min: 5000, color: "#34d399", icon: "🌱" },
  { name: "Secure", min: 15000, color: "#a78bfa", icon: "🛡️" },
  { name: "Free", min: 40000, color: "#f59e0b", icon: "🦅" },
  { name: "Wealthy", min: 100000, color: "#facc15", icon: "👑" },
];
