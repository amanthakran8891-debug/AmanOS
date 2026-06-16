// ─────────────────────────────────────────────────────────────────────────────
// NCLEX / AHPRA engine — Client Need categories + pure analytics. No I/O.
// Category names and percentage ranges follow the NCSBN NCLEX-RN test plan.
// ─────────────────────────────────────────────────────────────────────────────

export interface NclexTopic {
  key: string;
  label: string;
  short: string;
  /** Approx share of the exam (NCSBN test-plan midpoint, %). */
  weight: number;
}

export const NCLEX_TOPICS: NclexTopic[] = [
  { key: "mgmt-care", label: "Management of Care", short: "Mgmt of Care", weight: 18 },
  { key: "safety-infection", label: "Safety & Infection Control", short: "Safety/Infection", weight: 13 },
  { key: "health-promo", label: "Health Promotion & Maintenance", short: "Health Promo", weight: 9 },
  { key: "psychosocial", label: "Psychosocial Integrity", short: "Psychosocial", weight: 9 },
  { key: "basic-care", label: "Basic Care & Comfort", short: "Basic Care", weight: 9 },
  { key: "pharm", label: "Pharmacological & Parenteral Therapies", short: "Pharmacology", weight: 16 },
  { key: "risk-reduction", label: "Reduction of Risk Potential", short: "Risk Reduction", weight: 12 },
  { key: "physio-adapt", label: "Physiological Adaptation", short: "Physio Adaptation", weight: 14 },
];

export const TOPIC_BY_KEY = new Map(NCLEX_TOPICS.map((t) => [t.key, t]));

/** A safe passing target most NCLEX coaches use as the working benchmark. */
export const ACCURACY_TARGET = 65; // %

export function accuracyColor(pct: number): string {
  if (pct >= 75) return "#34f5c5"; // strong
  if (pct >= ACCURACY_TARGET) return "#a3e635"; // on track
  if (pct >= 50) return "#fbbf24"; // shaky
  return "#fb7185"; // weak
}

export interface TopicStat {
  key: string;
  label: string;
  short: string;
  weight: number;
  questions: number;
  correct: number;
  accuracy: number; // %, 0 if no data
  color: string;
  hasData: boolean;
}

export function topicStats(rows: { topic: string; questions: number; correct: number }[]): TopicStat[] {
  const agg = new Map<string, { q: number; c: number }>();
  for (const r of rows) {
    const a = agg.get(r.topic) ?? { q: 0, c: 0 };
    a.q += r.questions;
    a.c += r.correct;
    agg.set(r.topic, a);
  }
  return NCLEX_TOPICS.map((t) => {
    const a = agg.get(t.key) ?? { q: 0, c: 0 };
    const accuracy = a.q > 0 ? Math.round((a.c / a.q) * 100) : 0;
    return {
      key: t.key,
      label: t.label,
      short: t.short,
      weight: t.weight,
      questions: a.q,
      correct: a.c,
      accuracy,
      color: a.q > 0 ? accuracyColor(accuracy) : "#475569",
      hasData: a.q > 0,
    };
  });
}

/** Weak topics = enough sample (≥15 Qs) AND accuracy below the passing benchmark. */
export function weakTopics(stats: TopicStat[]): TopicStat[] {
  return stats
    .filter((s) => s.questions >= 15 && s.accuracy < ACCURACY_TARGET)
    .sort((a, b) => a.accuracy - b.accuracy);
}

/** Consecutive days (ending today or yesterday) with at least one logged study day.
 *  `dayKeysDesc` = ordered list of date keys from today backwards. */
export function studyStreak(daysWithStudy: Set<string>, dayKeysDesc: string[]): number {
  let streak = 0;
  for (let i = 0; i < dayKeysDesc.length; i++) {
    const k = dayKeysDesc[i];
    if (daysWithStudy.has(k)) streak++;
    else if (i === 0) continue; // allow "haven't studied yet today" without breaking
    else break;
  }
  return streak;
}

export interface ExamCountdown {
  set: boolean;
  daysLeft: number;
  weeksLeft: number;
  examDateLabel: string | null;
  /** Questions you'll have completed by exam day at your current daily pace. */
  projectedQuestions: number;
  pacePerDay: number;
}

export function examCountdown(examDateISO: string | null, totalQuestions: number, recentDailyPace: number): ExamCountdown {
  if (!examDateISO) {
    return { set: false, daysLeft: 0, weeksLeft: 0, examDateLabel: null, projectedQuestions: totalQuestions, pacePerDay: recentDailyPace };
  }
  const exam = new Date(examDateISO);
  const daysLeft = Math.max(0, Math.ceil((exam.getTime() - Date.now()) / 86400000));
  return {
    set: true,
    daysLeft,
    weeksLeft: Math.round((daysLeft / 7) * 10) / 10,
    examDateLabel: exam.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }),
    projectedQuestions: Math.round(totalQuestions + recentDailyPace * daysLeft),
    pacePerDay: Math.round(recentDailyPace),
  };
}

/** A coach-style readiness read — honest, never a pass guarantee. */
export function readiness(overallAccuracy: number, totalQuestions: number, weakCount: number): { label: string; color: string; note: string } {
  if (totalQuestions < 300) {
    return { label: "Building base", color: "#22d3ee", note: "Volume first — most candidates do 1,500–3,000+ practice questions." };
  }
  if (overallAccuracy >= 70 && weakCount === 0) {
    return { label: "Exam-ready zone", color: "#34f5c5", note: "Accuracy and coverage both strong. Keep sharp, stay rested." };
  }
  if (overallAccuracy >= ACCURACY_TARGET) {
    return { label: "On track", color: "#a3e635", note: weakCount > 0 ? `Close gaps in ${weakCount} weak ${weakCount === 1 ? "area" : "areas"}.` : "Hold this line and grow volume." };
  }
  return { label: "Needs work", color: "#fb7185", note: "Lift accuracy toward 65%+ before exam day. Review rationales, not just answers." };
}
