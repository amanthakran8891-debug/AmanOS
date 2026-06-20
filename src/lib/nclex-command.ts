// AmanOS — Phase 2, item 1: NCLEX Command Center (read-layer, no migration).
// Layers expanded metrics on top of the existing nclex.ts engine + NclexSession
// data: goal progress, required pace, windowed accuracy + trend, category status,
// top-3 weak areas, study streaks, a numeric 0–100 readiness score, a 30-day
// graph, and a pace-based future predictor (clearly an estimate).
import prisma from "@/lib/db";
import { ensureSettings } from "@/lib/day";
import { todayKey, lastNDays, addDaysKey } from "@/lib/dates";
import {
  NCLEX_TOPICS, ACCURACY_TARGET, topicStats, weakTopics, examCountdown,
  type TopicStat,
} from "@/lib/nclex";

export const GOAL_QUESTIONS = 2500; // default total-question goal (no settings field yet)
const DAY = 86400000;

export type CategoryStatus = "Strong" | "Needs Work" | "Critical" | "No data";
export interface CategoryRow extends TopicStat { status: CategoryStatus }

export interface NclexCommand {
  // Countdown
  examSet: boolean;
  examDateLabel: string | null;
  daysLeft: number;
  weeksLeft: number;
  // Progress
  totalQuestions: number;
  goal: number;
  remaining: number;
  pctComplete: number;
  // Pace
  requiredPerDay: number;
  requiredPerWeek: number;
  pacePerDay: number; // recent (7-day) actual
  onTrack: boolean;
  // Accuracy
  overallAccuracy: number;
  acc7: number; acc7Count: number;
  acc30: number; acc30Count: number;
  accuracyTrend: "improving" | "stable" | "declining";
  // Categories + weak areas
  categories: CategoryRow[];
  weakAreas: { rank: number; label: string; accuracy: number; questions: number }[];
  // Streaks + volume
  currentStreak: number;
  bestStreak: number;
  questionsThisWeek: number;
  questionsThisMonth: number;
  // Readiness
  readinessScore: number; // 0..100
  readinessBand: "Not Ready" | "Building Base" | "Exam Ready" | "Strong Pass Probability";
  readinessBreakdown: { volume: number; accuracy: number; consistency: number; coverage: number };
  // Graph
  graph: { date: string; questions: number; roll7: number | null; roll30: number | null }[];
  // Predictor (estimates)
  expectedCompletion: string | null; // label or null
  probabilityHitGoal: number | null; // 0..100, null if no exam date
  recommendedDailyTarget: number;
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const acc = (q: number, c: number) => (q > 0 ? Math.round((c / q) * 100) : 0);

function statusOf(s: TopicStat): CategoryStatus {
  if (!s.hasData) return "No data";
  if (s.accuracy >= 75) return "Strong";
  if (s.accuracy >= 50) return "Needs Work";
  return "Critical";
}

function bestStudyStreak(dayKeys: Set<string>): number {
  const sorted = [...dayKeys].sort();
  let best = 0, run = 0, prev: string | null = null;
  for (const k of sorted) {
    const contiguous = prev !== null && new Date(k + "T00:00:00").getTime() - new Date(prev + "T00:00:00").getTime() === DAY;
    run = contiguous ? run + 1 : 1;
    if (run > best) best = run;
    prev = k;
  }
  return best;
}

export async function getNclexCommand(now: Date = new Date()): Promise<NclexCommand> {
  const today = todayKey(now);
  const settings = await ensureSettings();
  const sessions = await prisma.nclexSession.findMany({ orderBy: { createdAt: "desc" } }).catch(() => [] as { date: string; topic: string; questions: number; correct: number }[]);

  const totalQuestions = sessions.reduce((s, r) => s + r.questions, 0);
  const totalCorrect = sessions.reduce((s, r) => s + r.correct, 0);
  const overallAccuracy = acc(totalQuestions, totalCorrect);

  // Per-day aggregation.
  const byDay = new Map<string, { q: number; c: number }>();
  for (const r of sessions) {
    const a = byDay.get(r.date) ?? { q: 0, c: 0 };
    a.q += r.questions; a.c += r.correct; byDay.set(r.date, a);
  }
  const windowAgg = (n: number, offset = 0) => {
    const keys = new Set(lastNDays(n, addDaysKey(today, -offset)));
    let q = 0, c = 0;
    for (const [k, v] of byDay) if (keys.has(k)) { q += v.q; c += v.c; }
    return { q, c };
  };
  const w7 = windowAgg(7), w30 = windowAgg(30), prev7 = windowAgg(7, 7);

  // Pace + required.
  const pacePerDay = Math.round((w7.q / 7) * 10) / 10;
  const countdown = examCountdown(settings.nclexExamDate ? settings.nclexExamDate.toISOString() : null, totalQuestions, pacePerDay);
  const remaining = Math.max(0, GOAL_QUESTIONS - totalQuestions);
  const requiredPerDay = remaining <= 0 ? 0 : countdown.set && countdown.daysLeft > 0 ? Math.ceil(remaining / countdown.daysLeft) : Math.ceil(remaining / 30);
  const onTrack = remaining <= 0 || pacePerDay >= requiredPerDay;

  // Accuracy trend (7d vs prev-7d), needs a little data each side.
  const acc7 = acc(w7.q, w7.c), accPrev7 = acc(prev7.q, prev7.c);
  let accuracyTrend: NclexCommand["accuracyTrend"] = "stable";
  if (w7.q >= 10 && prev7.q >= 10) accuracyTrend = acc7 - accPrev7 > 2 ? "improving" : acc7 - accPrev7 < -2 ? "declining" : "stable";

  // Categories + weak areas.
  const stats = topicStats(sessions.map((r) => ({ topic: r.topic, questions: r.questions, correct: r.correct })));
  const categories: CategoryRow[] = stats.map((s) => ({ ...s, status: statusOf(s) }));
  const weakAreas = weakTopics(stats).slice(0, 3).map((s, i) => ({ rank: i + 1, label: s.label, accuracy: s.accuracy, questions: s.questions }));

  // Streaks.
  const studyDays = new Set(sessions.map((r) => r.date));
  const dayKeysDesc = lastNDays(180, today).slice().reverse();
  let currentStreak = 0;
  for (let i = 0; i < dayKeysDesc.length; i++) {
    const k = dayKeysDesc[i];
    if (studyDays.has(k)) currentStreak++;
    else if (i === 0) continue; // not studied yet today doesn't break it
    else break;
  }
  const bestStreak = bestStudyStreak(studyDays);

  // Readiness 0–100 (Volume 35 / Accuracy 35 / Consistency 15 / Coverage 15).
  const volume = clamp((totalQuestions / GOAL_QUESTIONS) * 100);
  const accuracyScore = clamp(((overallAccuracy - 40) / (85 - 40)) * 100); // 40%→0, 85%→100
  const daysStudiedLast14 = lastNDays(14, today).filter((k) => studyDays.has(k)).length;
  const consistency = clamp((daysStudiedLast14 / 14) * 100);
  const coveredTopics = stats.filter((s) => s.questions >= 15 && s.accuracy >= ACCURACY_TARGET).length;
  const coverage = clamp((coveredTopics / NCLEX_TOPICS.length) * 100);
  const readinessScore = Math.round(0.35 * volume + 0.35 * accuracyScore + 0.15 * consistency + 0.15 * coverage);
  const readinessBand: NclexCommand["readinessBand"] =
    readinessScore >= 85 ? "Strong Pass Probability" : readinessScore >= 65 ? "Exam Ready" : readinessScore >= 40 ? "Building Base" : "Not Ready";

  // 30-day graph with rolling 7/30-day average questions/day.
  const last30 = lastNDays(30, today);
  const graph = last30.map((k) => {
    const q = byDay.get(k)?.q ?? 0;
    const trailing = (w: number) => {
      const ks = lastNDays(w, k);
      let sum = 0; for (const kk of ks) sum += byDay.get(kk)?.q ?? 0;
      return Math.round((sum / w) * 10) / 10;
    };
    return { date: k, questions: q, roll7: trailing(7), roll30: trailing(30) };
  });

  // Predictor (estimates only).
  const expectedCompletion = remaining <= 0
    ? "Goal already reached"
    : pacePerDay > 0
      ? new Date(now.getTime() + Math.ceil(remaining / pacePerDay) * DAY).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
      : null;
  let probabilityHitGoal: number | null = null;
  if (countdown.set) {
    if (remaining <= 0) probabilityHitGoal = 100;
    else {
      const projected = totalQuestions + pacePerDay * countdown.daysLeft;
      // Honest bounded estimate centred on pace vs requirement.
      const ratio = requiredPerDay > 0 ? pacePerDay / requiredPerDay : (projected >= GOAL_QUESTIONS ? 2 : 0);
      probabilityHitGoal = Math.round(clamp(50 + (ratio - 1) * 50, 5, 95));
    }
  }
  const recommendedDailyTarget = remaining <= 0 ? 0 : countdown.set && countdown.daysLeft > 0 ? requiredPerDay : Math.ceil(remaining / 30);

  return {
    examSet: countdown.set,
    examDateLabel: countdown.examDateLabel,
    daysLeft: countdown.daysLeft,
    weeksLeft: countdown.weeksLeft,
    totalQuestions,
    goal: GOAL_QUESTIONS,
    remaining,
    pctComplete: Math.round((totalQuestions / GOAL_QUESTIONS) * 100),
    requiredPerDay,
    requiredPerWeek: requiredPerDay * 7,
    pacePerDay,
    onTrack,
    overallAccuracy,
    acc7, acc7Count: w7.q,
    acc30: acc(w30.q, w30.c), acc30Count: w30.q,
    accuracyTrend,
    categories,
    weakAreas,
    currentStreak,
    bestStreak,
    questionsThisWeek: w7.q,
    questionsThisMonth: w30.q,
    readinessScore,
    readinessBand,
    readinessBreakdown: { volume: Math.round(volume), accuracy: Math.round(accuracyScore), consistency: Math.round(consistency), coverage: Math.round(coverage) },
    graph,
    expectedCompletion,
    probabilityHitGoal,
    recommendedDailyTarget,
  };
}
