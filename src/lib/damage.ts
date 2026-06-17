// ─────────────────────────────────────────────────────────────────────────────
// Dragon damage engine — turns REAL completed habits into damage on the dragon.
// Pure functions. Tapping is never a source of damage; only logged actions are.
// ─────────────────────────────────────────────────────────────────────────────

export interface DamageItem { key: string; icon: string; label: string; amount: number; done: boolean }

export interface TodayFactsLite {
  jointClean: boolean;
  gymDone: boolean;
  nclexHours: number;
  proteinG: number;
  spiritualDone: boolean;
  waterMl: number;
}
export interface DamageTargets { nclexHoursTarget: number; proteinTarget: number; waterTarget: number }

/** Per-action damage values (what each real habit takes off the dragon's HP). */
export const DAMAGE = { clean: 500, gym: 300, nclex: 250, protein: 100, gita: 50, water: 50 } as const;

export interface DailyDamage { items: DamageItem[]; base: number; multiplier: number; total: number; comboLabel: string | null }

/** Shared combo multiplier — stacking real logged habits compounds the reward.
 *  Used for BOTH damage and XP so the two can never disagree. Tapping is never
 *  an input here; only real completed actions are.
 *    Gym + NCLEX            → ×1.5
 *    Gym + NCLEX + Clean    → ×2  */
export function comboMultiplier(gym: boolean, nclex: boolean, clean: boolean): { mult: number; label: string | null } {
  if (gym && nclex && clean) return { mult: 2, label: "Gym + NCLEX + Clean ×2" };
  if (gym && nclex) return { mult: 1.5, label: "Gym + NCLEX ×1.5" };
  return { mult: 1, label: null };
}

export function dailyDamage(today: TodayFactsLite, t: DamageTargets): DailyDamage {
  const items: DamageItem[] = [
    { key: "clean", icon: "🚭", label: "Clean Day", amount: DAMAGE.clean, done: today.jointClean },
    { key: "gym", icon: "🏋", label: "Gym Complete", amount: DAMAGE.gym, done: today.gymDone },
    { key: "nclex", icon: "📚", label: "NCLEX Target", amount: DAMAGE.nclex, done: today.nclexHours >= Math.max(0.1, t.nclexHoursTarget) },
    { key: "protein", icon: "🥩", label: "Protein Goal", amount: DAMAGE.protein, done: today.proteinG >= Math.max(1, t.proteinTarget) },
    { key: "gita", icon: "🕉", label: "Gita Reading", amount: DAMAGE.gita, done: today.spiritualDone },
    { key: "water", icon: "💧", label: "Water Goal", amount: DAMAGE.water, done: today.waterMl >= Math.max(1, t.waterTarget) },
  ];
  const base = items.filter((i) => i.done).reduce((s, i) => s + i.amount, 0);

  // Combos — stacking real habits multiplies the damage (no tapping involved).
  const nclexHit = today.nclexHours >= Math.max(0.1, t.nclexHoursTarget);
  const { mult: multiplier, label: comboLabel } = comboMultiplier(today.gymDone, nclexHit, today.jointClean);

  return { items, base, multiplier, total: Math.round(base * multiplier), comboLabel };
}

/** Sum real daily damage across every logged day. Source = logged actions only,
 *  so lifetime damage can never be inflated by tapping. */
export function lifetimeDamageFromDays(
  days: { jointClean: boolean; gymDone: boolean; nclexHours: number; proteinG: number; spiritualDone: boolean; waterMl: number }[],
  t: DamageTargets,
): number {
  return days.reduce((sum, d) => sum + dailyDamage(d, t).total, 0);
}

// ── Dragon campaign — evolution stages defeated by cumulative real damage ──────
export interface CampaignStage { n: number; name: string; hp: number }

/** Each stage is a tougher dragon. You defeat one when your CUMULATIVE lifetime
 *  damage (real actions) clears its HP; the next stage then spawns automatically. */
export const CAMPAIGN_STAGES: CampaignStage[] = [
  { n: 1, name: "Massive Fire Dragon", hp: 10000 },
  { n: 2, name: "Shadow Dragon", hp: 25000 },
  { n: 3, name: "Ancient Demon Dragon", hp: 50000 },
  { n: 4, name: "King of Addiction", hp: 100000 },
  { n: 5, name: "Final Dragon", hp: 250000 },
];

export interface CampaignState {
  lifetimeDamage: number;
  dragonsDefeated: number;
  stageIndex: number; // 0..4
  stageNumber: number; // 1..5
  stageName: string;
  stageMaxHp: number;
  damageIntoStage: number; // damage dealt to the current dragon
  currentHp: number; // remaining HP of the current dragon
  hpPct: number; // currentHp / maxHp, 0..100
  nextEvolutionAt: number; // cumulative lifetime damage that clears the current stage
  toNextEvolution: number; // remaining damage to the next defeat
  allCleared: boolean;
}

/** Pure: derive the whole campaign state from cumulative lifetime damage. */
export function dragonCampaign(lifetimeDamage: number): CampaignState {
  const dmg = Math.max(0, Math.round(lifetimeDamage));
  let cum = 0; // cumulative HP of fully-defeated stages
  let defeated = 0;
  for (const s of CAMPAIGN_STAGES) {
    if (dmg >= cum + s.hp) { cum += s.hp; defeated++; } else break;
  }
  const allCleared = defeated >= CAMPAIGN_STAGES.length;
  const idx = allCleared ? CAMPAIGN_STAGES.length - 1 : defeated;
  const stage = CAMPAIGN_STAGES[idx];
  const damageIntoStage = allCleared ? stage.hp : dmg - cum;
  const currentHp = allCleared ? 0 : Math.max(0, stage.hp - damageIntoStage);
  const nextEvolutionAt = cum + stage.hp;
  return {
    lifetimeDamage: dmg,
    dragonsDefeated: defeated,
    stageIndex: idx,
    stageNumber: stage.n,
    stageName: stage.name,
    stageMaxHp: stage.hp,
    damageIntoStage,
    currentHp,
    hpPct: Math.round((currentHp / stage.hp) * 100),
    nextEvolutionAt,
    toNextEvolution: allCleared ? 0 : Math.max(0, nextEvolutionAt - dmg),
    allCleared,
  };
}

// ── Dragon HP / stage / threat (from the 0–100 addiction-power signal) ────────
export interface DragonHp { hp: number; maxHp: number; pct: number; stage: string; threat: string; threatColor: string }

const STAGE_NAMES = [
  "Ancient Fire Dragon", // strongest
  "Wounded Fire Dragon",
  "Broken Dragon",
  "Fading Dragon",
  "Dying Dragon",
  "Defeated Dragon", // weakest
];

/** power 0..100 (higher = stronger addiction). HP scales to maxHp; lower HP = you're winning. */
export function dragonHp(power: number, maxHp = 10000): DragonHp {
  const p = Math.max(0, Math.min(100, power));
  const hp = Math.round((p / 100) * maxHp);
  let stageIdx: number;
  if (p >= 85) stageIdx = 0; else if (p >= 68) stageIdx = 1; else if (p >= 50) stageIdx = 2;
  else if (p >= 32) stageIdx = 3; else if (p >= 12) stageIdx = 4; else stageIdx = 5;
  const threat = p >= 85 ? "EXTREME" : p >= 68 ? "HIGH" : p >= 50 ? "SEVERE" : p >= 32 ? "MODERATE" : p >= 12 ? "LOW" : "DEFEATED";
  const threatColor = p >= 68 ? "#fb7185" : p >= 50 ? "#f97316" : p >= 32 ? "#fbbf24" : p >= 12 ? "#a3e635" : "#34f5c5";
  return { hp, maxHp, pct: p, stage: STAGE_NAMES[stageIdx], threat, threatColor };
}

// ── Milestone rewards ─────────────────────────────────────────────────────────
export const MILESTONES = [1, 3, 7, 14, 30, 90, 180, 365] as const;
export const MILESTONE_REWARDS: { day: number; label: string; reward: string }[] = [
  { day: 1, label: "Day 1", reward: "Dragon −2%" },
  { day: 3, label: "Day 3", reward: "+50 XP" },
  { day: 7, label: "Day 7", reward: "New Badge" },
  { day: 14, label: "Day 14", reward: "New Title" },
  { day: 30, label: "Day 30", reward: "Dragon Evolution Break" },
  { day: 90, label: "Day 90", reward: "Freedom Rank" },
  { day: 180, label: "Day 180", reward: "Guardian Rank" },
  { day: 365, label: "Year 1", reward: "Dragon Slayer" },
];

/** Format a duration (seconds) as "13h 04m" or "5d 03h". */
export function fmtDur(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d >= 1) return `${d}d ${String(h).padStart(2, "0")}h`;
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
}
