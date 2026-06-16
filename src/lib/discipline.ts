// ─────────────────────────────────────────────────────────────────────────────
// AmanOS Discipline Engine — the accountability brain / "truth mirror".
// Answers one question per day: did I move forward, or did I drift?
// Pure functions, no I/O.
// ─────────────────────────────────────────────────────────────────────────────

export interface DayFacts {
  date: string;
  jointClean: boolean;
  proteinG: number;
  gymDone: boolean;
  nclexHours: number;
  nclexQuestions: number;
  bharatfareDone: boolean;
  sleepHours: number;
  checkinDone: boolean;
  recoveryCheckin: boolean; // a symptom log exists for the day
  hasData: boolean; // a DayLog row exists at all
}

export interface DiscTargets {
  proteinTarget: number;
  sleepTarget: number;
  nclexHoursTarget: number;
}

export interface ScorePart {
  key: string;
  label: string;
  earned: number;
  max: number;
  hit: "full" | "partial" | "miss";
}

export interface DailyScore {
  score: number; // 0..100
  parts: ScorePart[];
  band: "strong" | "partial" | "drift" | "none";
  color: string;
}

// Weights sum to 100. Tuned so the no-joint mission and study dominate.
const COMPONENTS = [
  { key: "clean", label: "Stayed clean", max: 25, kind: "bool" as const },
  { key: "nclex", label: "NCLEX / AHPRA", max: 15, kind: "ratio" as const },
  { key: "gym", label: "Trained", max: 13, kind: "bool" as const },
  { key: "protein", label: "Protein target", max: 12, kind: "ratio" as const },
  { key: "bharatfare", label: "BharatFare task", max: 10, kind: "bool" as const },
  { key: "sleep", label: "Sleep target", max: 10, kind: "ratio" as const },
  { key: "checkin", label: "Morning/Night check-in", max: 8, kind: "bool" as const },
  { key: "recovery", label: "Recovery check-in", max: 7, kind: "bool" as const },
];

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export const BAND_COLOR = { strong: "#34f5c5", partial: "#fbbf24", drift: "#fb7185", none: "#475569" } as const;

export function classify(score: number, hasData: boolean): DailyScore["band"] {
  if (!hasData) return "none";
  if (score >= 75) return "strong";
  if (score >= 45) return "partial";
  return "drift";
}

export function dailyScore(d: DayFacts, t: DiscTargets): DailyScore {
  const ratios: Record<string, number> = {
    clean: d.jointClean ? 1 : 0,
    nclex: Math.max(clamp01(d.nclexHours / Math.max(0.1, t.nclexHoursTarget)), d.nclexQuestions > 0 ? 0.5 : 0),
    gym: d.gymDone ? 1 : 0,
    protein: clamp01(d.proteinG / Math.max(1, t.proteinTarget)),
    bharatfare: d.bharatfareDone ? 1 : 0,
    sleep: clamp01(d.sleepHours / Math.max(1, t.sleepTarget)),
    checkin: d.checkinDone ? 1 : 0,
    recovery: d.recoveryCheckin ? 1 : 0,
  };

  const parts: ScorePart[] = COMPONENTS.map((c) => {
    const r = ratios[c.key] ?? 0;
    const earned = Math.round(c.max * r);
    const hit: ScorePart["hit"] = r >= 0.999 ? "full" : r > 0 ? "partial" : "miss";
    return { key: c.key, label: c.label, earned, max: c.max, hit };
  });

  const score = Math.round(parts.reduce((s, p) => s + p.earned, 0));
  const band = classify(score, d.hasData);
  return { score, parts, band, color: BAND_COLOR[band] };
}

export function average(scores: number[]): number {
  if (scores.length === 0) return 0;
  return Math.round(scores.reduce((s, n) => s + n, 0) / scores.length);
}

// ── Drift detection ──────────────────────────────────────────────────────────
export interface DriftFlag {
  key: string;
  title: string;
  detail: string;
  severity: "high" | "medium";
}

/** `days` ordered most-recent-first. Each item is the raw DayFacts. */
export function driftFlags(daysDesc: DayFacts[], t: DiscTargets, todayClean: boolean): DriftFlag[] {
  const flags: DriftFlag[] = [];
  const recent = (n: number) => daysDesc.slice(0, n);

  // Relapse — today not clean.
  if (!todayClean) {
    flags.push({ key: "relapse", title: "Relapse logged", detail: "Streak reset. Get back to clean today — momentum rebuilds fast.", severity: "high" });
  }

  // No gym for 3 days.
  const last3 = recent(3);
  if (last3.length === 3 && last3.every((d) => !d.gymDone)) {
    flags.push({ key: "gym", title: "Health momentum is dropping", detail: "No training in 3 days. Do something today — even a short session counts.", severity: "medium" });
  }

  // No NCLEX for 2 days.
  const last2 = recent(2);
  if (last2.length === 2 && last2.every((d) => d.nclexHours <= 0 && d.nclexQuestions <= 0)) {
    flags.push({ key: "nclex", title: "You are drifting in NCLEX", detail: "2 days without study. The exam date doesn't move — log questions today.", severity: "high" });
  }

  // Poor sleep 3 days (below 80% of target).
  if (last3.length === 3 && last3.every((d) => d.sleepHours > 0 && d.sleepHours < t.sleepTarget * 0.8)) {
    flags.push({ key: "sleep", title: "Sleep debt is building", detail: `3 nights under ${Math.round(t.sleepTarget * 0.8)}h. Poor sleep feeds cravings and kills focus.`, severity: "medium" });
  }

  // Protein missed 3 days (below 70% of target).
  if (last3.length === 3 && last3.every((d) => d.proteinG < t.proteinTarget * 0.7)) {
    flags.push({ key: "protein", title: "Protein is slipping", detail: "3 days under target. Muscle and recovery need the fuel.", severity: "medium" });
  }

  // BharatFare ignored 3 days.
  if (last3.length === 3 && last3.every((d) => !d.bharatfareDone)) {
    flags.push({ key: "bharatfare", title: "BharatFare is stalling", detail: "No business task in 3 days. One move a day compounds.", severity: "medium" });
  }

  return flags;
}

// ── Momentum (positive streaks) ───────────────────────────────────────────────
export interface Momentum {
  key: string;
  title: string;
  icon: string;
  value: number;
  target: number;
  hit: boolean;
}

/** Count consecutive days (most-recent-first) satisfying a predicate. */
function runLength(daysDesc: DayFacts[], pred: (d: DayFacts) => boolean): number {
  let n = 0;
  for (const d of daysDesc) {
    if (pred(d)) n++;
    else break;
  }
  return n;
}

export function momentum(daysDesc: DayFacts[], t: DiscTargets, cleanStreakDays: number): Momentum[] {
  const gymRun = runLength(daysDesc, (d) => d.gymDone);
  const nclexRun = runLength(daysDesc, (d) => d.nclexHours > 0 || d.nclexQuestions > 0);
  const proteinRun = runLength(daysDesc, (d) => d.proteinG >= t.proteinTarget);
  return [
    { key: "clean", title: "Clean days", icon: "🚭", value: cleanStreakDays, target: 3, hit: cleanStreakDays >= 3 },
    { key: "gym", title: "Gym days", icon: "🏋", value: gymRun, target: 3, hit: gymRun >= 3 },
    { key: "nclex", title: "NCLEX study days", icon: "📚", value: nclexRun, target: 5, hit: nclexRun >= 5 },
    { key: "protein", title: "Protein consistency", icon: "🥩", value: proteinRun, target: 7, hit: proteinRun >= 7 },
  ];
}

// ── Weekly accountability report ───────────────────────────────────────────────
export interface WeeklyReport {
  totalScore: number; // average of the 7 daily scores
  bestHabit: { label: string; pct: number } | null;
  weakestHabit: { label: string; pct: number } | null;
  biggestWin: string;
  biggestFailure: string;
  nextFocus: string;
}

const LABELS: Record<string, string> = Object.fromEntries(COMPONENTS.map((c) => [c.key, c.label]));

export function weeklyReport(weekDays: { facts: DayFacts; score: DailyScore }[]): WeeklyReport {
  const withData = weekDays.filter((w) => w.facts.hasData);
  const totalScore = average(withData.map((w) => w.score.score));

  // Per-component hit rate across the week.
  const rate: Record<string, { earned: number; max: number }> = {};
  for (const c of COMPONENTS) rate[c.key] = { earned: 0, max: 0 };
  for (const w of withData) for (const p of w.score.parts) { rate[p.key].earned += p.earned; rate[p.key].max += p.max; }

  const pcts = COMPONENTS.map((c) => ({ key: c.key, label: c.label, pct: rate[c.key].max > 0 ? Math.round((rate[c.key].earned / rate[c.key].max) * 100) : 0 }));
  const ranked = [...pcts].sort((a, b) => b.pct - a.pct);
  const best = withData.length ? ranked[0] : null;
  const weakest = withData.length ? ranked[ranked.length - 1] : null;

  const cleanDays = withData.filter((w) => w.facts.jointClean).length;
  const strongDays = withData.filter((w) => w.score.band === "strong").length;
  const driftDays = withData.filter((w) => w.score.band === "drift").length;

  const biggestWin = !withData.length
    ? "No data logged this week."
    : cleanDays === withData.length && withData.length >= 5
      ? `A fully clean week — ${cleanDays}/${withData.length} days.`
      : best
        ? `${best.label} held strong at ${best.pct}%.`
        : `${strongDays} strong day${strongDays === 1 ? "" : "s"}.`;

  const biggestFailure = !withData.length
    ? "Nothing tracked — log daily so the mirror can be honest."
    : weakest && weakest.pct < 60
      ? `${weakest.label} fell to ${weakest.pct}% — the week's weak link.`
      : driftDays > 0
        ? `${driftDays} drift day${driftDays === 1 ? "" : "s"} pulled the average down.`
        : "No major failure — keep the standard high.";

  const nextFocus = weakest ? `Rebuild ${LABELS[weakest.key] ?? weakest.label}. Make it non-negotiable for 7 days.` : "Protect the streak and grow study volume.";

  return { totalScore, bestHabit: best, weakestHabit: weakest, biggestWin, biggestFailure, nextFocus };
}
