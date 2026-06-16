// ─────────────────────────────────────────────────────────────────────────────
// AmanOS Recovery & Freedom engine — an ESTIMATED model, not a medical test.
//
// Every number here is a motivational estimate derived from published ranges for
// cannabis recovery. It is deliberately expressed as ranges + phases, never as a
// fake precise THC blood level. Key assumptions (documented for honesty):
//
//  • THC is fat-soluble and clears slowly. Terminal elimination half-life is short
//    for occasional use (~1.3 d) and much longer for chronic heavy use (~5–13 d).
//    We model a body-burden decay band using a low/high half-life per use level.
//  • Urine detection windows widen with use: occasional ~3 d, chronic daily ~30 d+.
//  • CB1 cannabinoid receptors down-regulate with heavy use and substantially
//    recover after ~2–4 weeks of abstinence (Hirvonen et al., 2012). Broader mood,
//    sleep and motivation normalisation continues over weeks to months.
//  • Acute withdrawal peaks days 1–3 and mostly eases within ~2 weeks; sleep can
//    take longer. (DSM-5 cannabis withdrawal course.)
//
// These are population ranges applied to one person — treat as guidance, not fact.
// ─────────────────────────────────────────────────────────────────────────────

export type UseLevel = "light" | "moderate" | "heavy" | "chronic";

export interface UseLevelSpec {
  key: UseLevel;
  label: string;
  blurb: string;
  /** Body-burden half-life band (days) used for the THC-burden curve. */
  halfLifeLow: number;
  halfLifeHigh: number;
  /** Urine detection window band (days). */
  detectLow: number;
  detectHigh: number;
  /** Recovery-speed modifier — heavier use recovers a little slower (τ multiplier). */
  tau: number;
}

export const USE_LEVELS: Record<UseLevel, UseLevelSpec> = {
  light: { key: "light", label: "Light / occasional", blurb: "A few times a month", halfLifeLow: 1.3, halfLifeHigh: 3, detectLow: 2, detectHigh: 4, tau: 0.8 },
  moderate: { key: "moderate", label: "Moderate", blurb: "A few times a week", halfLifeLow: 2.5, halfLifeHigh: 5, detectLow: 4, detectHigh: 10, tau: 1.0 },
  heavy: { key: "heavy", label: "Heavy", blurb: "Most days", halfLifeLow: 4, halfLifeHigh: 8, detectLow: 10, detectHigh: 21, tau: 1.2 },
  chronic: { key: "chronic", label: "Chronic daily", blurb: "Daily, long-term", halfLifeLow: 5, halfLifeHigh: 13, detectLow: 21, detectHigh: 45, tau: 1.4 },
};

export const SYMPTOM_KEYS = [
  "cravings", "anxiety", "irritability", "sleep", "appetite",
  "motivation", "focus", "mood", "restlessness", "boredom",
] as const;
export type SymptomKey = (typeof SYMPTOM_KEYS)[number];

/** For most symptoms, lower 0–10 is better. For these, HIGHER is better. */
export const POSITIVE_SYMPTOMS: SymptomKey[] = ["sleep", "appetite", "motivation", "focus", "mood"];

export const SYMPTOM_META: Record<SymptomKey, { label: string; icon: string; positive: boolean }> = {
  cravings: { label: "Cravings", icon: "🌫️", positive: false },
  anxiety: { label: "Anxiety", icon: "😰", positive: false },
  irritability: { label: "Irritability", icon: "😤", positive: false },
  sleep: { label: "Sleep quality", icon: "😴", positive: true },
  appetite: { label: "Appetite", icon: "🍽️", positive: true },
  motivation: { label: "Motivation", icon: "🚀", positive: true },
  focus: { label: "Focus", icon: "🎯", positive: true },
  mood: { label: "Mood", icon: "🙂", positive: true },
  restlessness: { label: "Sweating / restlessness", icon: "💦", positive: false },
  boredom: { label: "Boredom", icon: "🥱", positive: false },
};

// ── Recovery timeline phases ─────────────────────────────────────────────────
export interface Phase {
  from: number; // day (inclusive)
  to: number; // day (exclusive); Infinity for last
  title: string;
  body: string;
}

export const TIMELINE: Phase[] = [
  { from: 0, to: 1, title: "0–24 h · Early withdrawal", body: "THC leaving the bloodstream. Restlessness, irritability and the first cravings appear." },
  { from: 1, to: 4, title: "Days 1–3 · Peak cravings", body: "Cravings and irritability peak. Appetite and sleep dip. This is the hardest stretch — ride it out." },
  { from: 4, to: 8, title: "Days 4–7 · Sleep & mood swings", body: "Disrupted sleep and vivid dreams, mood swings. Body is recalibrating without THC." },
  { from: 8, to: 15, title: "Days 8–14 · Clarity returns", body: "Mental fog starts lifting. Cravings become shorter and less intense. Energy stabilising." },
  { from: 15, to: 31, title: "Days 15–30 · Dopamine rebuild", body: "Motivation and reward sensitivity rebuilding. CB1 receptors largely recovering toward baseline." },
  { from: 31, to: 91, title: "Days 30–90 · Deeper rewire", body: "Habits and brain pathways reorganising around a clean life. Focus and drive noticeably stronger." },
  { from: 91, to: 181, title: "90–180 · Identity shift", body: "Clean is becoming who you are, not what you're forcing. Long-term stability sets in." },
  { from: 181, to: Infinity, title: "365 · Freedom", body: "A full year free. The dragon is a memory. This is the life you built." },
];

export function currentPhase(cleanDays: number): number {
  return TIMELINE.findIndex((p) => cleanDays >= p.from && cleanDays < p.to);
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
/** Saturating recovery curve: 0 → 100 as days grow, reaching ~63% at τ days. */
const sat = (days: number, tau: number) => 100 * (1 - Math.exp(-days / Math.max(1, tau)));

export interface RecoveryScores {
  brain: number;
  sleep: number;
  motivation: number;
  focus: number;
  craving: number;
  habit: number;
  cardio: number;
  energy: number;
  freedom: number;
}

export interface BurdenPoint { day: number; low: number; high: number }

export interface RecoveryModel {
  cleanDays: number;
  level: UseLevelSpec;
  scores: RecoveryScores;
  burden: { points: BurdenPoint[]; lowPct: number; highPct: number; caption: string };
  detection: { low: number; high: number; clearedLikely: boolean };
  phaseIndex: number;
  withdrawalPhase: string;
  brainPhase: string;
  confidence: "low" | "medium" | "high";
  confidenceNote: string;
}

export interface SymptomAvg { key: SymptomKey; value: number; samples: number }

export interface RecoveryInput {
  cleanDays: number;
  level: UseLevel;
  longestStreak: number;
  /** 7-day average per symptom (0–10), with sample counts. */
  symptomAvg?: Partial<Record<SymptomKey, number>>;
  symptomLogCount?: number; // logs in the last ~14 days
}

/** Normalise a symptom to a 0..1 "good" factor (handles positive/negative direction). */
function goodFactor(key: SymptomKey, avg?: Partial<Record<SymptomKey, number>>): number | null {
  const raw = avg?.[key];
  if (raw == null) return null;
  const v = clamp(raw, 0, 10) / 10;
  return POSITIVE_SYMPTOMS.includes(key) ? v : 1 - v;
}

/** Blend a base curve value with a symptom signal (bounded ±15 pts). */
function withSymptom(base: number, factor: number | null): number {
  if (factor == null) return base;
  return clamp(base + (factor - 0.5) * 30); // factor 0→-15, 1→+15
}

/**
 * Recovery scores as a continuous function of clean time. `d` may be FRACTIONAL
 * (days, including the fraction since the last joint), which lets the UI tick the
 * numbers up in real time. Returns unrounded values. Every curve is a documented
 * saturating recovery model — small, realistic gains, never unrealistic jumps.
 */
export function recoveryScoresAt(
  d: number,
  levelKey: UseLevel,
  avg: Partial<Record<SymptomKey, number>> | undefined,
  longestStreak: number,
): RecoveryScores {
  const level = USE_LEVELS[levelKey] ?? USE_LEVELS.chronic;
  const t = level.tau;
  // Relapse resilience: a floor from your best-ever streak so nothing snaps to zero.
  const expFloor = clamp((longestStreak / 90) * 35, 0, 35);

  const brain = withSymptom(Math.max(sat(d, 45 * t), expFloor * 0.7), goodFactor("focus", avg));
  const habit = Math.max(clamp((d / (66 * t)) * 100), expFloor); // ~66 days to wire a habit
  const motivation = withSymptom(sat(d, 25 * t), goodFactor("motivation", avg));
  const focus = withSymptom(sat(d, 35 * t), goodFactor("focus", avg));
  const craving = withSymptom(sat(d, 18 * t), goodFactor("cravings", avg));
  const sleepDip = d < 10 ? -Math.max(0, 12 - d) * 1.5 : 0;
  const sleep = withSymptom(clamp(sat(d, 30 * t) + sleepDip), goodFactor("sleep", avg));
  // Cardiovascular / lung recovery — slow (weeks to months).
  const cardio = Math.max(sat(d, 40 * t), expFloor * 0.5);
  // Energy — dips early, then climbs; tied to sleep quality.
  const energy = withSymptom(clamp(sat(d, 16 * t) + (d < 7 ? -Math.max(0, 8 - d) * 1.2 : 0)), goodFactor("sleep", avg));

  const streakBonus = clamp((d / 365) * 100);
  const freedom = clamp(
    0.30 * streakBonus + 0.18 * habit + 0.13 * brain + 0.10 * craving + 0.09 * motivation + 0.07 * focus + 0.07 * sleep + 0.03 * cardio + 0.03 * energy,
  );

  return { brain, sleep, motivation, focus, craving, habit, cardio, energy, freedom };
}

function roundScores(s: RecoveryScores): RecoveryScores {
  return {
    brain: Math.round(s.brain), sleep: Math.round(s.sleep), motivation: Math.round(s.motivation),
    focus: Math.round(s.focus), craving: Math.round(s.craving), habit: Math.round(s.habit),
    cardio: Math.round(s.cardio), energy: Math.round(s.energy), freedom: Math.round(s.freedom),
  };
}

export function recoveryModel(input: RecoveryInput): RecoveryModel {
  const level = USE_LEVELS[input.level] ?? USE_LEVELS.chronic;
  const d = Math.max(0, input.cleanDays);
  const avg = input.symptomAvg;

  const scores = roundScores(recoveryScoresAt(d, input.level, avg, input.longestStreak));

  // THC burden band (% of starting body burden remaining).
  const maxDay = Math.max(30, level.detectHigh);
  const points: BurdenPoint[] = [];
  const step = Math.max(1, Math.round(maxDay / 30));
  for (let day = 0; day <= maxDay; day += step) {
    points.push({
      day,
      high: Math.round(100 * Math.pow(0.5, day / level.halfLifeHigh)), // slower clearance = higher remaining
      low: Math.round(100 * Math.pow(0.5, day / level.halfLifeLow)),
    });
  }
  const lowPct = Math.round(100 * Math.pow(0.5, d / level.halfLifeLow));
  const highPct = Math.round(100 * Math.pow(0.5, d / level.halfLifeHigh));

  // Confidence — based on how much of YOUR data informs the estimate.
  const logs = input.symptomLogCount ?? 0;
  let confidence: RecoveryModel["confidence"] = "low";
  let confidenceNote = "Estimate is generic until you log daily symptoms — add a few check-ins to personalise it.";
  if (logs >= 10 && d >= 7) {
    confidence = "high";
    confidenceNote = "Tuned to your recent symptom check-ins and clean time.";
  } else if (logs >= 4) {
    confidence = "medium";
    confidenceNote = "Partly personalised — keep logging symptoms to raise confidence.";
  }

  const phaseIndex = currentPhase(d);
  const wd = d < 1 ? "Early withdrawal" : d < 4 ? "Acute peak" : d < 15 ? "Easing" : "Past acute withdrawal";
  const brainPhase = d < 14 ? "Receptors recovering" : d < 30 ? "Receptors near baseline" : d < 90 ? "Networks reorganising" : "Stabilised";

  return {
    cleanDays: d,
    level,
    scores,
    burden: {
      points,
      lowPct,
      highPct,
      caption: "Estimated THC burden reduction based on heavy-use recovery ranges.",
    },
    detection: { low: level.detectLow, high: level.detectHigh, clearedLikely: d > level.detectHigh },
    phaseIndex,
    withdrawalPhase: wd,
    brainPhase,
    confidence,
    confidenceNote,
  };
}

export const SCORE_META: { key: keyof RecoveryScores; label: string; icon: string; color: string }[] = [
  { key: "freedom", label: "Freedom Score", icon: "🕊️", color: "#34f5c5" },
  { key: "brain", label: "Brain Recovery", icon: "🧠", color: "#a78bfa" },
  { key: "sleep", label: "Sleep Recovery", icon: "😴", color: "#22d3ee" },
  { key: "motivation", label: "Motivation", icon: "🚀", color: "#fbbf24" },
  { key: "focus", label: "Focus", icon: "🎯", color: "#34f5c5" },
  { key: "craving", label: "Craving Control", icon: "🛡️", color: "#a3e635" },
  { key: "habit", label: "Habit Rewire", icon: "🔁", color: "#22d3ee" },
  { key: "cardio", label: "Cardio Recovery", icon: "❤️", color: "#fb7185" },
  { key: "energy", label: "Energy Recovery", icon: "⚡", color: "#fbbf24" },
];

// ── Body timeline — "what is happening inside my body?" ────────────────────────
export interface BodyPhase { day: number; title: string; body: string }
export const BODY_TIMELINE: BodyPhase[] = [
  { day: 1, title: "Day 1 · THC leaving the blood", body: "Acute blood levels drop. Restlessness and irritability begin." },
  { day: 3, title: "Day 3 · Cravings peak", body: "Cravings, irritability and appetite changes hit their hardest. The worst is now." },
  { day: 7, title: "Day 7 · Sleep starts improving", body: "Sleep and dreams begin to settle as the brain recalibrates without THC." },
  { day: 14, title: "Day 14 · Mental clarity returning", body: "Brain fog lifts; focus, memory and mood grow steadier." },
  { day: 30, title: "Day 30 · Motivation rebuilding", body: "Dopamine sensitivity and drive recover; CB1 receptors return toward baseline." },
  { day: 90, title: "Day 90 · Major recovery", body: "Deep cognitive and habit recovery. Energy, focus and discipline markedly stronger." },
  { day: 180, title: "Day 180 · Long-term stabilization", body: "Clean is the baseline. Cardiovascular and lung function keep improving." },
  { day: 365, title: "Day 365 · Freedom", body: "A full year free — long-term brain and body stability achieved." },
];
export function bodyPhase(cleanDays: number): { currentIndex: number; current: BodyPhase | null; next: BodyPhase | null } {
  let idx = -1;
  for (let i = 0; i < BODY_TIMELINE.length; i++) if (cleanDays >= BODY_TIMELINE[i].day) idx = i;
  return { currentIndex: idx, current: idx >= 0 ? BODY_TIMELINE[idx] : null, next: BODY_TIMELINE[idx + 1] ?? null };
}
