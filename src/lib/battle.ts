// ─────────────────────────────────────────────────────────────────────────────
// AmanOS — Shared Battle Engine (Phase 5).
//
// One framework for every enemy. The Fire Dragon (cannabis) and the Smoke
// Serpent (nicotine) are skins over the SAME mechanics: threat → HP, damage
// actions, missions, ranks. Build new enemies by supplying config, never by
// duplicating logic. (Serpent is migrated now; the Dragon adopts this next pass.)
// ─────────────────────────────────────────────────────────────────────────────

export type ThreatBand = "LOW" | "MODERATE" | "HIGH" | "EXTREME";

/** Canonical 4-band threat mapping from a 0–100 threat percentage. */
export function threatBand(pct: number): ThreatBand {
  const p = Math.max(0, Math.min(100, pct));
  return p >= 75 ? "EXTREME" : p >= 50 ? "HIGH" : p >= 25 ? "MODERATE" : "LOW";
}

export interface ThreatVisual { color: string; eye: string; heavySmoke: boolean; warningPulse: boolean }
export const THREAT_VISUAL: Record<ThreatBand, ThreatVisual> = {
  LOW: { color: "#34d399", eye: "#34d399", heavySmoke: false, warningPulse: false },
  MODERATE: { color: "#fbbf24", eye: "#fbbf24", heavySmoke: false, warningPulse: false },
  HIGH: { color: "#fb923c", eye: "#fb923c", heavySmoke: true, warningPulse: false },
  EXTREME: { color: "#fb7185", eye: "#ff4d57", heavySmoke: true, warningPulse: true },
};

/** HP/maxHP from a threat percentage (higher threat = stronger enemy). */
export function threatToHp(pct: number, maxHp = 1000): { hpCurrent: number; hpMax: number; threatPct: number } {
  const threatPct = Math.max(0, Math.min(100, Math.round(pct)));
  return { hpCurrent: Math.round((threatPct / 100) * maxHp), hpMax: maxHp, threatPct };
}

// ── Damage ────────────────────────────────────────────────────────────────────
export interface DamageAction { key: string; icon: string; label: string; hp: number; done: boolean; count?: number }
export function sumDamage(items: DamageAction[]): number {
  return items.reduce((s, i) => (i.done ? s + i.hp : s), 0);
}

// ── Missions ──────────────────────────────────────────────────────────────────
export interface BattleMission { key: string; icon: string; label: string; reward: string; rewardKind: "hp" | "xp"; done: boolean; action: string }
export function missionProgress(missions: BattleMission[]): { completed: number; total: number; pct: number } {
  const completed = missions.filter((m) => m.done).length;
  const total = missions.length || 1;
  return { completed, total, pct: Math.round((completed / total) * 100) };
}

// ── Ranks / progression ───────────────────────────────────────────────────────
export interface Rank { min: number; name: string; icon: string }
export interface RankProgress<T extends Rank> { rank: T; next: T | null; value: number; progressPct: number; toNext: number }
export function rankFor<T extends Rank>(value: number, ranks: T[]): RankProgress<T> {
  const sorted = [...ranks].sort((a, b) => a.min - b.min);
  let rank = sorted[0];
  for (const r of sorted) if (value >= r.min) rank = r;
  const next = sorted.find((r) => r.min > value) ?? null;
  const span = next ? next.min - rank.min : 1;
  const progressPct = next ? Math.max(0, Math.min(100, Math.round(((value - rank.min) / span) * 100))) : 100;
  return { rank, next, value, progressPct, toNext: next ? Math.max(0, next.min - value) : 0 };
}
