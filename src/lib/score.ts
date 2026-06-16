// ─────────────────────────────────────────────────────────────────────────────
// AmanOS scoring engine — Life Score + Dragon. Pure functions, no I/O.
// ─────────────────────────────────────────────────────────────────────────────

export interface DayInput {
  jointClean: boolean;
  proteinG: number;
  waterMl: number;
  sleepHours: number;
  steps: number;
  nclexHours: number;
  bharatfareDone: boolean;
  gymDone: boolean;
  spiritualDone: boolean;
}

export interface Targets {
  proteinTarget: number;
  waterTarget: number;
  sleepTarget: number;
  stepsTarget: number;
  nclexHoursTarget: number;
}

export const WEIGHTS = {
  noJoint: 30,
  health: 25,
  nclex: 20,
  bharatfare: 10,
  gym: 10,
  spiritual: 5,
} as const;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
export const ratio = (value: number, target: number) => (target > 0 ? clamp01(value / target) : 0);

export interface ScoreBreakdown {
  total: number; // 0..100
  parts: { label: string; earned: number; max: number }[];
  zone: "excellent" | "improving" | "offtrack";
  color: string;
}

export function lifeScore(day: DayInput, t: Targets): ScoreBreakdown {
  const noJoint = day.jointClean ? WEIGHTS.noJoint : 0;

  // Health = average of four sub-metrics, scaled to its weight.
  const healthRatio =
    (ratio(day.proteinG, t.proteinTarget) +
      ratio(day.waterMl, t.waterTarget) +
      ratio(day.sleepHours, t.sleepTarget) +
      ratio(day.steps, t.stepsTarget)) /
    4;
  const health = WEIGHTS.health * healthRatio;

  const nclex = WEIGHTS.nclex * ratio(day.nclexHours, t.nclexHoursTarget);
  const bharatfare = day.bharatfareDone ? WEIGHTS.bharatfare : 0;
  const gym = day.gymDone ? WEIGHTS.gym : 0;
  const spiritual = day.spiritualDone ? WEIGHTS.spiritual : 0;

  const total = Math.round(Math.max(0, Math.min(100, noJoint + health + nclex + bharatfare + gym + spiritual)));

  const zone: ScoreBreakdown["zone"] = total >= 75 ? "excellent" : total >= 45 ? "improving" : "offtrack";
  const color = zone === "excellent" ? "#34f5c5" : zone === "improving" ? "#fbbf24" : "#fb7185";

  return {
    total,
    zone,
    color,
    parts: [
      { label: "No Joint", earned: Math.round(noJoint), max: WEIGHTS.noJoint },
      { label: "Health", earned: Math.round(health), max: WEIGHTS.health },
      { label: "NCLEX / AHPRA", earned: Math.round(nclex), max: WEIGHTS.nclex },
      { label: "BharatFare", earned: Math.round(bharatfare), max: WEIGHTS.bharatfare },
      { label: "Gym", earned: Math.round(gym), max: WEIGHTS.gym },
      { label: "Life & Spiritual", earned: Math.round(spiritual), max: WEIGHTS.spiritual },
    ],
  };
}

// ── Dragon ──────────────────────────────────────────────────────────────────
// The dragon is the addiction. It WEAKENS as the life score rises and the clean
// streak grows; it STRENGTHENS on relapse / wasted days. Power 0 (defeated) → 100.

export interface DragonState {
  power: number; // 0..100 (higher = stronger addiction)
  health: number; // 0..100 (the dragon's own HP — inverse of your progress)
  size: number; // 0.35..1.25 render scale
  stage: 1 | 2 | 3 | 4 | 5 | 6;
  name: string;
  color: string;
}

const DRAGON_STAGES: { name: string; color: string }[] = [
  { name: "Massive Fire Dragon", color: "#fb7185" }, // 1 strongest
  { name: "Wounded Dragon", color: "#f97316" },
  { name: "Broken Dragon", color: "#fbbf24" },
  { name: "Fading Dragon", color: "#a3e635" },
  { name: "Dying Dragon", color: "#22d3ee" },
  { name: "Dragon Defeated", color: "#34f5c5" }, // 6 weakest
];

export interface DragonOpts {
  /** Today's craving intensity 0–10 — strong cravings feed (heal) the dragon. */
  cravingIntensity?: number;
  /** Today's Discipline (accountability) score 0–100 — discipline damages the dragon. */
  disciplineScore?: number;
}

export function dragonState(scoreTotal: number, streakDays: number, opts: DragonOpts = {}): DragonState {
  const streakFactor = clamp01(streakDays / 30) * 100; // 30 clean days = fully starved
  // The dragon's strength is driven by your behaviour. Today's Life Score already
  // bakes in the day's combat — every clean day, gym session, mission and good
  // sleep damages it; missing them feeds it. Streak = sustained pressure.
  // If a Discipline score is supplied, blend it into today's behaviour term so
  // accountability directly deals damage.
  const behaviour = opts.disciplineScore != null ? 0.7 * scoreTotal + 0.3 * opts.disciplineScore : scoreTotal;
  const progress = clamp01((0.6 * behaviour + 0.4 * streakFactor) / 100) * 100;
  let power = 100 - progress;
  // Cravings are the dragon's food — log a high craving and it claws back HP.
  const craving = Math.max(0, Math.min(10, opts.cravingIntensity ?? 0));
  power += (craving / 10) * 12; // up to +12
  power = Math.round(Math.max(0, Math.min(100, power)));

  let stageIdx: number;
  if (power >= 85) stageIdx = 0;
  else if (power >= 68) stageIdx = 1;
  else if (power >= 50) stageIdx = 2;
  else if (power >= 32) stageIdx = 3;
  else if (power >= 12) stageIdx = 4;
  else stageIdx = 5;

  const meta = DRAGON_STAGES[stageIdx];
  return {
    power,
    health: power, // dragon HP tracks its power
    size: 0.35 + (power / 100) * 0.9,
    stage: (stageIdx + 1) as DragonState["stage"],
    name: meta.name,
    color: meta.color,
  };
}

export function fmtClock(n: number) {
  return String(n).padStart(2, "0");
}
// (discipline + craving feed dragon damage; see dragonState opts)
