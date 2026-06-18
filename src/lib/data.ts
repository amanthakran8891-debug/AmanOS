import prisma from "@/lib/db";
import { todayKey, lastNDays, addDaysKey, keyToDate } from "@/lib/dates";
import { lifeScore, dragonState, type Targets } from "@/lib/score";
import { BODY_PARTS } from "@/lib/exercises";
import { ensureDay, ensureSettings } from "@/lib/day";
import { topicStats, weakTopics, studyStreak, examCountdown, readiness } from "@/lib/nclex";
import { recoveryModel, recoveryScoresAt, SYMPTOM_KEYS, TIMELINE as RECOVERY_TIMELINE, type SymptomKey, type UseLevel } from "@/lib/recovery";
import { dailyScore, driftFlags, momentum, weeklyReport, type DayFacts, type DiscTargets } from "@/lib/discipline";
import { computeCombat } from "@/lib/combat";
import { dailyDamage, lifetimeDamageFromDays, dragonCampaign } from "@/lib/damage";
import { streakDaysFrom, cleanSecondsFrom } from "@/lib/clean-time";
import { predictRisk } from "@/lib/prediction";
import { computeRecoveryXp } from "@/lib/recovery-xp";
import { computeDragonIntel } from "@/lib/dragon-intel";
import { computeCost } from "@/lib/cost";
import { ruleBasedBriefing, weeklyIntelligenceReport } from "@/lib/coach";
import { buildTimeline } from "@/lib/recovery-timeline";
import { futureMessages, nextFutureMessage } from "@/lib/future-messages";
import { cravingAnalytics, type CravingRow } from "@/lib/cravings";
import { buildMissionBoard } from "@/lib/missions";
import { timelineHealth } from "@/lib/timeline-health";
import { computeCeo } from "@/lib/ceo";
import { computeRpg } from "@/lib/rpg";
import { progressPct as gitaProgressPct, LOADED_VERSES, TOTAL_VERSES, HAS_VERSES, getVerse } from "@/lib/gita-library";
import { HAS_CHALISA, CHALISA_LINES } from "@/lib/chalisa";

export async function getDashboardData() {
  const date = todayKey();

  // Race-safe get-or-create (handles concurrent first-loads → no P2002).
  const settings = await ensureSettings();
  const today = await ensureDay(date);

  const dayKeys = lastNDays(30, date);
  const history = await prisma.dayLog.findMany({
    where: { date: { in: dayKeys } },
    orderBy: { date: "asc" },
  });
  const byDate = new Map(history.map((d) => [d.date, d]));

  const [foods, gymSets, monthExpenses, jointEvents, achievements, todaySymptom] = await Promise.all([
    prisma.foodEntry.findMany({ where: { date }, orderBy: { createdAt: "desc" } }),
    prisma.gymSet.findMany({ where: { date }, orderBy: { createdAt: "desc" } }),
    prisma.expense.findMany({ where: { date: { startsWith: date.slice(0, 7) } }, orderBy: { createdAt: "desc" } }),
    prisma.jointEvent.findMany({ orderBy: { at: "desc" }, take: 30 }),
    prisma.achievement.findMany(),
    prisma.symptomLog.findUnique({ where: { date } }),
  ]);

  const targets: Targets = {
    proteinTarget: settings.proteinTarget,
    waterTarget: settings.waterTarget,
    sleepTarget: settings.sleepTarget,
    stepsTarget: settings.stepsTarget,
    nclexHoursTarget: settings.nclexHoursTarget,
  };

  const score = lifeScore(
    {
      jointClean: today.jointClean,
      proteinG: today.proteinG,
      waterMl: today.waterMl,
      sleepHours: today.sleepHours,
      steps: today.steps,
      nclexHours: today.nclexHours,
      bharatfareDone: today.bharatfareDone,
      gymDone: today.gymDone,
      spiritualDone: today.spiritualDone,
    },
    targets,
  );

  const streakDays = streakDaysFrom(settings.lastJointAt);
  const disciplineToday = dailyScore(
    {
      date,
      jointClean: today.jointClean,
      proteinG: today.proteinG,
      gymDone: today.gymDone,
      nclexHours: today.nclexHours,
      nclexQuestions: today.nclexQuestions,
      bharatfareDone: today.bharatfareDone,
      sleepHours: today.sleepHours,
      checkinDone: today.checkinDone,
      recoveryCheckin: !!todaySymptom,
      hasData: true,
    },
    { proteinTarget: settings.proteinTarget, sleepTarget: settings.sleepTarget, nclexHoursTarget: settings.nclexHoursTarget },
  ).score;

  const dragon = dragonState(score.total, streakDays, { cravingIntensity: todaySymptom?.cravings ?? 0, disciplineScore: disciplineToday });
  const combat = await buildCombatState(settings);
  const intel = await loadRecoveryIntel(settings, today);

  // Muscle recovery — days since each body part was last trained.
  const partRecency: Record<string, number | null> = {};
  for (const part of BODY_PARTS) {
    const last = await prisma.gymSet.findFirst({ where: { bodyPart: part }, orderBy: { date: "desc" } });
    partRecency[part] = last ? Math.max(0, Math.floor((Date.now() - new Date(last.date).getTime()) / 86400000)) : null;
  }

  const monthSpent = monthExpenses.reduce((s, e) => s + e.amount, 0);
  const todaySpent = monthExpenses.filter((e) => e.date === date).reduce((s, e) => s + e.amount, 0);

  // Serialize for the client.
  return {
    date,
    settings: {
      proteinTarget: settings.proteinTarget,
      waterTarget: settings.waterTarget,
      sleepTarget: settings.sleepTarget,
      caloriesTarget: settings.caloriesTarget,
      stepsTarget: settings.stepsTarget,
      nclexHoursTarget: settings.nclexHoursTarget,
      dailyBudget: settings.dailyBudget,
      gymDaysTarget: settings.gymDaysTarget,
      noJointGoalDays: settings.noJointGoalDays,
      weightGoal: settings.weightGoal,
      lastJointAt: settings.lastJointAt ? settings.lastJointAt.toISOString() : null,
      longestStreakDays: settings.longestStreakDays,
      bestCleanRunSec: settings.bestCleanRunSec,
    },
    records: {
      bestCleanRunSec: Math.max(settings.bestCleanRunSec, settings.lastJointAt ? Math.floor((Date.now() - settings.lastJointAt.getTime()) / 1000) : 0),
      highestLifeScore: combat.records.highestLifeScore,
      bestDisciplineScore: combat.records.bestDisciplineScore,
      highestDamageDay: combat.records.highestDamageDay,
      totalCleanDays: combat.records.totalCleanDays,
    },
    today: {
      jointClean: today.jointClean,
      weightKg: today.weightKg,
      bodyFat: today.bodyFat,
      waterMl: today.waterMl,
      proteinG: today.proteinG,
      caloriesKcal: today.caloriesKcal,
      sleepHours: today.sleepHours,
      steps: today.steps,
      nclexHours: today.nclexHours,
      nclexQuestions: today.nclexQuestions,
      bharatfareDone: today.bharatfareDone,
      gymDone: today.gymDone,
      spiritualDone: today.spiritualDone,
      lifeScore: today.lifeScore,
      notes: today.notes ?? "",
    },
    score,
    dragon,
    streakDays,
    disciplineToday,
    // Recovery Intelligence (Phase 2) — surfaced on the dashboard, recovery-first.
    forecast: intel.forecast,
    coach: intel.coach,
    recoveryXp: intel.recoveryXp,
    missionBoard: intel.missionBoard,
    dragonAttackStats: intel.dragonAttackStats,
    combat: {
      level: combat.level,
      rank: combat.rank,
      xp: combat.xp,
      xpIntoLevel: combat.xpIntoLevel,
      xpToNext: combat.xpToNext,
      levelProgressPct: combat.levelProgressPct,
      combatPower: combat.combatPower,
      maxed: combat.maxed,
      nextRank: combat.nextRank,
      currentChapter: combat.currentChapter,
      dragon: combat.dragon,
    },
    history: dayKeys.map((k) => {
      const d = byDate.get(k);
      return {
        date: k,
        lifeScore: d?.lifeScore ?? 0,
        weightKg: d?.weightKg ?? null,
        proteinG: d?.proteinG ?? 0,
        sleepHours: d?.sleepHours ?? 0,
        steps: d?.steps ?? 0,
        nclexHours: d?.nclexHours ?? 0,
        bharatfareDone: d?.bharatfareDone ?? false,
        jointClean: d?.jointClean ?? true,
        gymDone: d?.gymDone ?? false,
      };
    }),
    foods: foods.map((f) => ({ id: f.id, name: f.name, proteinG: f.proteinG, calories: f.calories })),
    gymSets: gymSets.map((g) => ({ id: g.id, bodyPart: g.bodyPart, exercise: g.exercise, sets: g.sets, reps: g.reps, weightKg: g.weightKg })),
    partRecency,
    budget: { dailyBudget: settings.dailyBudget, todaySpent, monthSpent, monthExpenses: monthExpenses.map((e) => ({ id: e.id, date: e.date, category: e.category, amount: e.amount, note: e.note })) },
    jointEvents: jointEvents.map((j) => ({ id: j.id, at: j.at.toISOString(), type: j.type, craving: j.craving, trigger: j.trigger, intensity: j.intensity })),
    achievements: achievements.map((a) => a.key),
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;

// ── NCLEX / AHPRA Command Center ─────────────────────────────────────────────
export async function getNclexData() {
  const date = todayKey();
  const settings = await ensureSettings();

  const sessions = await prisma.nclexSession.findMany({ orderBy: { createdAt: "desc" } });

  const totalQuestions = sessions.reduce((s, r) => s + r.questions, 0);
  const totalCorrect = sessions.reduce((s, r) => s + r.correct, 0);
  const totalMinutes = sessions.reduce((s, r) => s + r.minutes, 0);
  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const stats = topicStats(sessions.map((r) => ({ topic: r.topic, questions: r.questions, correct: r.correct })));
  const weak = weakTopics(stats);

  // Study streak — days with at least one session.
  const dayKeysDesc = lastNDays(120, date).slice().reverse(); // today first
  const studyDays = new Set(sessions.map((r) => r.date));
  const streak = studyStreak(studyDays, dayKeysDesc);

  // 7-day pace (questions/day) and 14-day trend.
  const last7 = new Set(lastNDays(7, date));
  const last7Questions = sessions.filter((r) => last7.has(r.date)).reduce((s, r) => s + r.questions, 0);
  const pace = last7Questions / 7;

  const trendKeys = lastNDays(14, date);
  const byDay = new Map<string, { q: number; c: number }>();
  for (const r of sessions) {
    const a = byDay.get(r.date) ?? { q: 0, c: 0 };
    a.q += r.questions;
    a.c += r.correct;
    byDay.set(r.date, a);
  }
  const trend = trendKeys.map((k) => {
    const a = byDay.get(k) ?? { q: 0, c: 0 };
    return { date: k, questions: a.q, accuracy: a.q > 0 ? Math.round((a.c / a.q) * 100) : 0 };
  });

  const todayQuestions = byDay.get(date)?.q ?? 0;
  const countdown = examCountdown(settings.nclexExamDate ? settings.nclexExamDate.toISOString() : null, totalQuestions, pace);
  const ready = readiness(overallAccuracy, totalQuestions, weak.length);

  return {
    date,
    exam: {
      name: settings.nclexExamName,
      dateISO: settings.nclexExamDate ? settings.nclexExamDate.toISOString() : null,
      dailyGoal: settings.nclexDailyQGoal,
      ...countdown,
    },
    totals: { totalQuestions, totalCorrect, overallAccuracy, totalMinutes, totalHours: Math.round((totalMinutes / 60) * 10) / 10, todayQuestions, sessionCount: sessions.length },
    streak,
    readiness: ready,
    stats,
    weak,
    trend,
    recent: sessions.slice(0, 15).map((r) => ({
      id: r.id,
      date: r.date,
      topic: r.topic,
      questions: r.questions,
      correct: r.correct,
      minutes: r.minutes,
      accuracy: r.questions > 0 ? Math.round((r.correct / r.questions) * 100) : 0,
    })),
  };
}

export type NclexData = Awaited<ReturnType<typeof getNclexData>>;

// ── Recovery & Freedom Command Center ────────────────────────────────────────
export async function getRecoveryData() {
  const date = todayKey();
  const settings = await ensureSettings();

  const cleanDays = streakDaysFrom(settings.lastJointAt);

  // Last 14 days of symptom logs → 7-day averages feed the model; today's row pre-fills the tracker.
  const recentKeys = lastNDays(14, date);
  const last7Keys = new Set(lastNDays(7, date));
  const symptomLogs = await prisma.symptomLog.findMany({ where: { date: { in: recentKeys } }, orderBy: { date: "asc" } });

  const sums: Record<string, { total: number; n: number }> = {};
  for (const k of SYMPTOM_KEYS) sums[k] = { total: 0, n: 0 };
  for (const row of symptomLogs) {
    if (!last7Keys.has(row.date)) continue;
    for (const k of SYMPTOM_KEYS) {
      sums[k].total += (row as unknown as Record<string, number>)[k] ?? 0;
      sums[k].n += 1;
    }
  }
  const symptomAvg: Partial<Record<SymptomKey, number>> = {};
  for (const k of SYMPTOM_KEYS) if (sums[k].n > 0) symptomAvg[k] = sums[k].total / sums[k].n;

  const model = recoveryModel({
    cleanDays,
    level: (settings.recUseLevel as UseLevel) ?? "chronic",
    longestStreak: settings.longestStreakDays,
    symptomAvg,
    symptomLogCount: symptomLogs.length,
  });

  const todayLog = symptomLogs.find((r) => r.date === date) ?? null;

  // Symptom trend (freedom-relevant): cravings over 14 days for a quick line.
  const byDate = new Map(symptomLogs.map((r) => [r.date, r]));
  const symptomTrend = recentKeys.map((k) => {
    const r = byDate.get(k);
    return { date: k, cravings: r?.cravings ?? null, mood: r?.mood ?? null, logged: !!r };
  });

  return {
    date,
    cleanDays,
    lastJointAt: settings.lastJointAt ? settings.lastJointAt.toISOString() : null,
    profile: {
      recUseLevel: settings.recUseLevel,
      recJointsPerDay: settings.recJointsPerDay,
      recUseYears: settings.recUseYears,
      recActivityLevel: settings.recActivityLevel,
      recExerciseFreq: settings.recExerciseFreq,
      recBaselineWeight: settings.recBaselineWeight,
    },
    model,
    today: todayLog
      ? {
          cravings: todayLog.cravings, anxiety: todayLog.anxiety, irritability: todayLog.irritability,
          sleep: todayLog.sleep, appetite: todayLog.appetite, motivation: todayLog.motivation,
          focus: todayLog.focus, mood: todayLog.mood, restlessness: todayLog.restlessness, boredom: todayLog.boredom,
          note: todayLog.note ?? "",
        }
      : null,
    symptomTrend,
    longestStreak: settings.longestStreakDays,
    cleanSeconds: cleanSecondsFrom(settings.lastJointAt),
    bestCleanRunSec: Math.max(settings.bestCleanRunSec, cleanSecondsFrom(settings.lastJointAt)),
    // For real-time client-side ticking of the recovery scores.
    liveInputs: { level: settings.recUseLevel, symptomAvg, longestStreak: settings.longestStreakDays },
  };
}

export type RecoveryData = Awaited<ReturnType<typeof getRecoveryData>>;

// ── Discipline Engine — the accountability brain ──────────────────────────────
function monthKeys(date: string): string[] {
  const [y, m] = date.split("-").map(Number);
  const days = new Date(y, m, 0).getDate();
  const out: string[] = [];
  for (let d = 1; d <= days; d++) out.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
  return out;
}

export async function getDisciplineData() {
  const date = todayKey();
  const settings = await ensureSettings();
  const targets: DiscTargets = {
    proteinTarget: settings.proteinTarget,
    sleepTarget: settings.sleepTarget,
    nclexHoursTarget: settings.nclexHoursTarget,
  };

  const windowKeys = Array.from(new Set([...lastNDays(40, date), ...monthKeys(date)]));
  const [logs, symptoms] = await Promise.all([
    prisma.dayLog.findMany({ where: { date: { in: windowKeys } } }),
    prisma.symptomLog.findMany({ where: { date: { in: windowKeys } }, select: { date: true } }),
  ]);
  const logMap = new Map(logs.map((d) => [d.date, d]));
  const symptomDays = new Set(symptoms.map((s) => s.date));

  const facts = (k: string): DayFacts => {
    const d = logMap.get(k);
    return {
      date: k,
      jointClean: d?.jointClean ?? false,
      proteinG: d?.proteinG ?? 0,
      gymDone: d?.gymDone ?? false,
      nclexHours: d?.nclexHours ?? 0,
      nclexQuestions: d?.nclexQuestions ?? 0,
      bharatfareDone: d?.bharatfareDone ?? false,
      sleepHours: d?.sleepHours ?? 0,
      checkinDone: d?.checkinDone ?? false,
      recoveryCheckin: symptomDays.has(k),
      hasData: !!d,
    };
  };

  const cleanStreakDays = streakDaysFrom(settings.lastJointAt);

  const todayScore = dailyScore(facts(date), targets);
  const yKey = addDaysKey(date, -1);
  const yesterdayScore = dailyScore(facts(yKey), targets);

  const last7 = lastNDays(7, date).map((k) => dailyScore(facts(k), targets));
  const last30 = lastNDays(30, date).map((k) => dailyScore(facts(k), targets));
  const avg7 = Math.round(last7.filter((s) => s.band !== "none").reduce((s, x, _, a) => s + x.score / a.length, 0)) || 0;
  const avg30 = Math.round(last30.filter((s) => s.band !== "none").reduce((s, x, _, a) => s + x.score / a.length, 0)) || 0;

  // Recent days, most-recent-first (skip today for drift so a fresh morning isn't a false flag).
  const recentDesc = lastNDays(30, addDaysKey(date, -1)).reverse().map(facts);
  const flags = driftFlags(recentDesc, targets, facts(date).jointClean);
  const mo = momentum(recentDesc, targets, cleanStreakDays);

  // Weekly report — last 7 days.
  const weekDays = lastNDays(7, date).map((k) => { const f = facts(k); return { facts: f, score: dailyScore(f, targets) }; });
  const report = weeklyReport(weekDays);

  // Calendar — current month with per-day band + breakdown.
  const calendar = monthKeys(date).map((k) => {
    const f = facts(k);
    const s = dailyScore(f, targets);
    return {
      date: k,
      future: k > date,
      score: s.score,
      band: s.band,
      color: s.color,
      parts: s.parts.map((p) => ({ key: p.key, label: p.label, hit: p.hit })),
    };
  });

  return {
    date,
    today: { score: todayScore.score, band: todayScore.band, color: todayScore.color, parts: todayScore.parts },
    yesterday: { score: yesterdayScore.score, band: yesterdayScore.band, hasData: facts(yKey).hasData },
    avg7,
    avg30,
    flags,
    momentum: mo,
    report,
    calendar,
    monthLabel: keyToDate(date).toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
  };
}

export type DisciplineData = Awaited<ReturnType<typeof getDisciplineData>>;

// ── Dragon Combat — XP / Level / Bosses / Equipment / Campaign ─────────────────
type SettingsRow = Awaited<ReturnType<typeof ensureSettings>>;
type DayLogRow = Awaited<ReturnType<typeof ensureDay>>;

function emptyFacts(date: string): DayFacts {
  return { date, jointClean: false, proteinG: 0, gymDone: false, nclexHours: 0, nclexQuestions: 0, bharatfareDone: false, sleepHours: 0, checkinDone: false, recoveryCheckin: false, hasData: false };
}
function dayLogToFacts(d: DayLogRow, symptomDays: Set<string>): DayFacts {
  return {
    date: d.date,
    jointClean: d.jointClean,
    proteinG: d.proteinG,
    gymDone: d.gymDone,
    nclexHours: d.nclexHours,
    nclexQuestions: d.nclexQuestions,
    bharatfareDone: d.bharatfareDone,
    sleepHours: d.sleepHours,
    checkinDone: d.checkinDone,
    recoveryCheckin: symptomDays.has(d.date),
    hasData: true,
  };
}

async function buildCombatState(settings: SettingsRow) {
  const date = todayKey();
  const allDays = await prisma.dayLog.findMany({ orderBy: { date: "asc" } });
  const allDates = allDays.map((d) => d.date);
  const [symptoms, todaySymptom] = await Promise.all([
    prisma.symptomLog.findMany({ where: { date: { in: allDates.length ? allDates : [date] } }, select: { date: true } }),
    prisma.symptomLog.findUnique({ where: { date } }),
  ]);
  const symptomDays = new Set(symptoms.map((s) => s.date));
  const targetsDisc: DiscTargets = { proteinTarget: settings.proteinTarget, sleepTarget: settings.sleepTarget, nclexHoursTarget: settings.nclexHoursTarget };

  const facts = allDays.map((d) => dayLogToFacts(d, symptomDays));
  const factsByDate = new Map(facts.map((f) => [f.date, f]));
  const factFor = (k: string): DayFacts => factsByDate.get(k) ?? emptyFacts(k);

  const currentStreak = streakDaysFrom(settings.lastJointAt);
  const longestStreak = Math.max(settings.longestStreakDays, currentStreak);

  const last7 = lastNDays(7, date).map((k) => dailyScore(factFor(k), targetsDisc).score);
  const avg7Discipline = Math.round(last7.reduce((s, n) => s + n, 0) / 7);

  const craving = todaySymptom?.cravings ?? 0;
  const todayRow = allDays.find((d) => d.date === date);
  let dragonPower: number;
  if (todayRow) {
    const ls = lifeScore(
      { jointClean: todayRow.jointClean, proteinG: todayRow.proteinG, waterMl: todayRow.waterMl, sleepHours: todayRow.sleepHours, steps: todayRow.steps, nclexHours: todayRow.nclexHours, bharatfareDone: todayRow.bharatfareDone, gymDone: todayRow.gymDone, spiritualDone: todayRow.spiritualDone },
      { proteinTarget: settings.proteinTarget, waterTarget: settings.waterTarget, sleepTarget: settings.sleepTarget, stepsTarget: settings.stepsTarget, nclexHoursTarget: settings.nclexHoursTarget },
    ).total;
    const disc = dailyScore(factFor(date), targetsDisc).score;
    dragonPower = dragonState(ls, currentStreak, { cravingIntensity: craving, disciplineScore: disc }).power;
  } else {
    dragonPower = dragonState(0, currentStreak, { cravingIntensity: craving }).power;
  }

  const combat = computeCombat({ days: facts, targets: targetsDisc, currentStreak, longestStreak, avg7Discipline, dragonPower, craving });

  // ── Lifetime Damage + campaign (real logged actions only, persisted) ──
  const dmgTargets = { nclexHoursTarget: settings.nclexHoursTarget, proteinTarget: settings.proteinTarget, waterTarget: settings.waterTarget };
  const computedLifetime = lifetimeDamageFromDays(allDays, dmgTargets);
  // Monotonic ratchet: never let a stored achievement regress if a past day is
  // edited down or damage values are retuned (a defeated dragon stays defeated).
  const prevState = await prisma.dragonState.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
  const lifetimeDamage = Math.max(prevState.lifetimeDamage, computedLifetime);
  const campaign = dragonCampaign(lifetimeDamage);
  if (
    lifetimeDamage !== prevState.lifetimeDamage ||
    campaign.dragonsDefeated !== prevState.dragonsDefeated ||
    campaign.stageIndex !== prevState.stageIndex
  ) {
    await prisma.dragonState.update({
      where: { id: 1 },
      data: { lifetimeDamage, dragonsDefeated: campaign.dragonsDefeated, stageIndex: campaign.stageIndex },
    });
  }

  const todayDamage = dailyDamage(
    {
      jointClean: todayRow?.jointClean ?? false,
      gymDone: todayRow?.gymDone ?? false,
      nclexHours: todayRow?.nclexHours ?? 0,
      proteinG: todayRow?.proteinG ?? 0,
      spiritualDone: todayRow?.spiritualDone ?? false,
      waterMl: todayRow?.waterMl ?? 0,
    },
    dmgTargets,
  );

  // ── Permanent recovery records (career stats, derived from the full log) ──
  const bestDisciplineScore = facts.reduce((mx, f) => Math.max(mx, dailyScore(f, targetsDisc).score), 0);
  const highestDamageDay = allDays.reduce((mx, d) => Math.max(mx, dailyDamage(d, dmgTargets).total), 0);
  const highestLifeScore = allDays.reduce((mx, d) => Math.max(mx, d.lifeScore), 0);
  const totalCleanDays = allDays.filter((d) => d.jointClean).length;
  const records = { bestDisciplineScore, highestDamageDay, highestLifeScore, totalCleanDays };

  return { ...combat, campaign, lifetimeDamage, dragonsDefeated: campaign.dragonsDefeated, todayDamage, records };
}

export async function getCombatData() {
  const settings = await ensureSettings();
  const state = await buildCombatState(settings);
  return { date: todayKey(), ...state };
}

export type CombatData = Awaited<ReturnType<typeof getCombatData>>;

// ── CEO Dashboard — the cockpit synthesis ─────────────────────────────────────
export async function getCeoData() {
  const date = todayKey();
  const settings = await ensureSettings();
  const targetsDisc: DiscTargets = { proteinTarget: settings.proteinTarget, sleepTarget: settings.sleepTarget, nclexHoursTarget: settings.nclexHoursTarget };

  const windowKeys = lastNDays(42, date);
  const [logs, symptomDates, todaySymptom, recovery, nclex] = await Promise.all([
    prisma.dayLog.findMany({ where: { date: { in: windowKeys } } }),
    prisma.symptomLog.findMany({ where: { date: { in: windowKeys } }, select: { date: true } }),
    prisma.symptomLog.findUnique({ where: { date } }),
    getRecoveryData(),
    getNclexData(),
  ]);
  const logMap = new Map(logs.map((d) => [d.date, d]));
  const symptomDays = new Set(symptomDates.map((s) => s.date));
  const factsDesc = windowKeys.slice().reverse().map((k) => { const d = logMap.get(k); return d ? dayLogToFacts(d, symptomDays) : emptyFacts(k); });
  const todayFacts = factsDesc[0];
  const disciplineToday = dailyScore(todayFacts, targetsDisc).score;

  const currentStreak = streakDaysFrom(settings.lastJointAt);
  const craving = todaySymptom?.cravings ?? 0;
  const todayRow = logMap.get(date);
  const dragonSt = todayRow
    ? dragonState(
        lifeScore(
          { jointClean: todayRow.jointClean, proteinG: todayRow.proteinG, waterMl: todayRow.waterMl, sleepHours: todayRow.sleepHours, steps: todayRow.steps, nclexHours: todayRow.nclexHours, bharatfareDone: todayRow.bharatfareDone, gymDone: todayRow.gymDone, spiritualDone: todayRow.spiritualDone },
          { proteinTarget: settings.proteinTarget, waterTarget: settings.waterTarget, sleepTarget: settings.sleepTarget, stepsTarget: settings.stepsTarget, nclexHoursTarget: settings.nclexHoursTarget },
        ).total,
        currentStreak,
        { cravingIntensity: craving, disciplineScore: disciplineToday },
      )
    : dragonState(0, currentStreak, { cravingIntensity: craving });
  const health = dragonSt.power;
  const dragon = {
    health,
    threat: health >= 70 ? "High" : health >= 40 ? "Moderate" : health >= 15 ? "Low" : "Minimal",
    threatColor: health >= 70 ? "#fb7185" : health >= 40 ? "#fbbf24" : health >= 15 ? "#a3e635" : "#34f5c5",
  };

  const phaseTitle = (RECOVERY_TIMELINE[recovery.model.phaseIndex]?.title ?? "Early recovery").replace(/^[^·]+·\s*/, "");
  const examDaysLeft = nclex.exam.set ? nclex.exam.daysLeft : null;
  const behindPace = nclex.exam.set && nclex.exam.daysLeft > 0 ? nclex.exam.pacePerDay < nclex.exam.dailyGoal * 0.6 : false;

  const ceo = computeCeo({
    factsDesc,
    targets: targetsDisc,
    disciplineToday,
    dragon,
    recovery: { phaseTitle, freedom: recovery.model.scores.freedom, cleanDays: recovery.cleanDays },
    nclex: {
      readinessLabel: nclex.readiness.label,
      readinessColor: nclex.readiness.color,
      overallAccuracy: nclex.totals.overallAccuracy,
      totalQuestions: nclex.totals.totalQuestions,
      dailyGoal: nclex.exam.dailyGoal,
      todayQuestions: nclex.totals.todayQuestions,
      examDaysLeft,
      behindPace,
    },
    todayCraving: craving,
  });

  return { date, ...ceo };
}

export type CeoData = Awaited<ReturnType<typeof getCeoData>>;

// ── Life RPG — Character / Personal Records / Combos ──────────────────────────
export async function getRpgData() {
  const date = todayKey();
  const settings = await ensureSettings();
  const targetsDisc: DiscTargets = { proteinTarget: settings.proteinTarget, sleepTarget: settings.sleepTarget, nclexHoursTarget: settings.nclexHoursTarget };

  const [allDays, symptomDates, combatState, qAgg, spiritualReads] = await Promise.all([
    prisma.dayLog.findMany({ orderBy: { date: "asc" } }),
    prisma.symptomLog.findMany({ select: { date: true } }),
    getCombatData(),
    prisma.nclexSession.aggregate({ _sum: { questions: true } }),
    prisma.spiritualReadingLog.findMany({ select: { date: true } }),
  ]);
  const symptomDays = new Set(symptomDates.map((s) => s.date));
  const factsAsc = allDays.map((d) => dayLogToFacts(d, symptomDays));
  // Wisdom = distinct days of real spiritual activity (Gita/Chalisa reading,
  // reflections, or the daily Gita flag) — never inflated.
  const spiritualSet = new Set<string>();
  for (const d of allDays) if (d.spiritualDone) spiritualSet.add(d.date);
  for (const r of spiritualReads) spiritualSet.add(r.date);
  const spiritualDays = spiritualSet.size;
  const totalQuestions = qAgg._sum.questions ?? 0;

  const currentStreak = streakDaysFrom(settings.lastJointAt);
  const longestStreak = Math.max(settings.longestStreakDays, currentStreak);
  const recoveryHighest = {
    score: Math.round(recoveryScoresAt(longestStreak, settings.recUseLevel as UseLevel, undefined, longestStreak).freedom),
    date: currentStreak >= longestStreak && currentStreak > 0 ? date : null,
  };

  const rpg = computeRpg({
    factsAsc,
    targets: targetsDisc,
    currentStreak,
    longestStreak,
    totalQuestions,
    spiritualDays,
    recoveryHighest,
    combat: { level: combatState.level, rank: combatState.rank, combatPower: combatState.combatPower },
  });

  return { date, ...rpg };
}

export type RpgData = Awaited<ReturnType<typeof getRpgData>>;

// ── Spiritual Command Center ──────────────────────────────────────────────────
function spiritualStreak(dateSet: Set<string>, todayK: string): { current: number; best: number } {
  // current — consecutive days ending today (today may be unread yet → don't break)
  let current = 0;
  const back = lastNDays(420, todayK).slice().reverse(); // today first
  for (let i = 0; i < back.length; i++) {
    if (dateSet.has(back[i])) current++;
    else if (i === 0) continue;
    else break;
  }
  // best — longest run across all logged dates
  const sorted = [...dateSet].sort();
  let best = 0, run = 0, prev: string | null = null;
  for (const d of sorted) {
    if (prev && addDaysKey(prev, 1) === d) run++; else run = 1;
    if (run > best) best = run;
    prev = d;
  }
  return { current, best };
}

export async function getSpiritualData() {
  const date = todayKey();
  const [progress, marks, notes, logs] = await Promise.all([
    prisma.spiritualProgress.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} }),
    prisma.spiritualMark.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.spiritualNote.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.spiritualReadingLog.findMany({ orderBy: { date: "desc" } }),
  ]);

  const dateSet = new Set(logs.map((l) => l.date));
  const streak = spiritualStreak(dateSet, date);
  const todayKinds = new Set(logs.filter((l) => l.date === date).map((l) => l.kind));
  const lastVerse = getVerse(progress.gitaChapter, progress.gitaVerse) ?? null;

  return {
    date,
    gita: {
      chapter: progress.gitaChapter,
      verse: progress.gitaVerse,
      progressPct: gitaProgressPct(progress.gitaChapter, progress.gitaVerse),
      loaded: LOADED_VERSES,
      total: TOTAL_VERSES,
      hasVerses: HAS_VERSES,
      lastVerseTranslation: lastVerse?.translation ?? null,
    },
    chalisa: { line: progress.chalisaLine, hasText: HAS_CHALISA, lineCount: CHALISA_LINES.length },
    bookmarks: marks.filter((m) => m.type === "bookmark").map((m) => ({ kind: m.kind, ref: m.ref })),
    favourites: marks.filter((m) => m.type === "favourite").map((m) => ({ kind: m.kind, ref: m.ref })),
    notes: notes.map((n) => ({ id: n.id, kind: n.kind, ref: n.ref, text: n.text })),
    streak,
    readingDays: dateSet.size,
    today: { readGita: todayKinds.has("gita"), readChalisa: todayKinds.has("chalisa"), wroteReflection: todayKinds.has("reflection") },
  };
}

export type SpiritualData = Awaited<ReturnType<typeof getSpiritualData>>;

// ── Recovery Intelligence System (Phase 2) ────────────────────────────────────
// One assembler powers both the dashboard surface and the /intelligence page, so
// every system reads the same recovery source of truth.
function localDayKey(d: Date | string): string {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

const CANNABIS_CATEGORIES = new Set(["weed", "cannabis", "joint", "joints", "marijuana"]);

async function loadRecoveryIntel(settings: SettingsRow, todayRow: DayLogRow) {
  const now = new Date();
  const date = todayKey();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adb = prisma as any;

  const [allDays, jointEvents, cravingRows, dragonAttacks, txns, expenses] = await Promise.all([
    prisma.dayLog.findMany({ orderBy: { date: "asc" } }),
    prisma.jointEvent.findMany({ orderBy: { at: "desc" } }),
    prisma.craving.findMany({ orderBy: { at: "desc" } }),
    adb.dragonAttack.findMany({ orderBy: { at: "desc" } }).catch(() => [] as { at: Date; survived: boolean }[]),
    prisma.transaction.findMany({ where: { kind: "expense" } }).catch(() => []),
    prisma.expense.findMany().catch(() => []),
  ]);

  const streakDays = streakDaysFrom(settings.lastJointAt);
  const cleanSec = cleanSecondsFrom(settings.lastJointAt);
  const targets = { proteinTarget: settings.proteinTarget, sleepTarget: settings.sleepTarget, nclexHoursTarget: settings.nclexHoursTarget };

  const todayFacts = {
    jointClean: todayRow.jointClean, gymDone: todayRow.gymDone, sleepHours: todayRow.sleepHours,
    proteinG: todayRow.proteinG, nclexHours: todayRow.nclexHours, bharatfareDone: todayRow.bharatfareDone, spiritualDone: todayRow.spiritualDone,
  };

  // ── Event streams ──
  const relapseEvents = [
    ...jointEvents.filter((j) => j.type === "relapse").map((j) => ({ at: j.at })),
    ...cravingRows.filter((c) => c.outcome === "lost").map((c) => ({ at: c.at })),
  ];
  const cravingEventsAt = [
    ...cravingRows.map((c) => ({ at: c.at })),
    ...jointEvents.filter((j) => j.type === "craving").map((j) => ({ at: j.at })),
  ];
  const cravingRowsForAnalytics: CravingRow[] = [
    ...cravingRows.map((c) => ({ at: c.at, intensity: c.intensity, trigger: c.trigger, location: c.location, emotion: c.emotion, outcome: c.outcome })),
    ...jointEvents.filter((j) => j.type === "craving").map((j) => ({ at: j.at, intensity: j.intensity, trigger: j.trigger, location: null, emotion: null, outcome: "won" })),
  ];

  // ── #1 Prediction ──
  const forecast = predictRisk({
    now, streakDays, today: todayFacts, targets,
    relapses: relapseEvents, cravings: cravingEventsAt,
    recentDays: allDays.map((d) => ({ date: d.date, jointClean: d.jointClean })),
  });

  const analytics = cravingAnalytics(cravingRowsForAnalytics, now);
  const topTriggers = analytics.byTrigger.filter((t) => t.name !== "unknown").slice(0, 3).map((t) => ({ name: t.name, count: t.count }));
  const topEmotions = analytics.byEmotion.filter((t) => t.name !== "unknown").slice(0, 3).map((t) => ({ name: t.name, count: t.count }));

  // ── #3 Recovery XP ──
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const anchorMs = settings.lastJointAt ? new Date(settings.lastJointAt).getTime() : null;
  const cleanStartMs = anchorMs ? Math.max(startOfDay.getTime(), anchorMs) : startOfDay.getTime();
  const cleanHoursToday = todayFacts.jointClean && anchorMs ? Math.min(24, Math.max(0, Math.floor((now.getTime() - cleanStartMs) / 3600000))) : 0;
  const todayCravingsWon = cravingRows.filter((c) => c.outcome === "won" && localDayKey(c.at) === date).length
    + jointEvents.filter((j) => j.type === "craving" && localDayKey(j.at) === date).length;
  const todayMissions = dragonAttacks.filter((a: { at: Date; survived: boolean }) => a.survived && localDayKey(a.at) === date).length;
  const cleanDaysLifetime = allDays.filter((d) => d.jointClean).length;
  const recoveryXp = computeRecoveryXp({
    streakDays,
    today: { jointClean: todayFacts.jointClean, gymDone: todayFacts.gymDone, cleanHours: cleanHoursToday, cravingsWon: todayCravingsWon, missions: todayMissions, cleanWeekCompletedToday: streakDays > 0 && streakDays % 7 === 0 },
    lifetime: {
      cleanDays: cleanDaysLifetime,
      cleanHours: cleanDaysLifetime * 24 + Math.floor(cleanSec / 3600) % 24,
      cravingsWon: cravingRows.filter((c) => c.outcome === "won").length + jointEvents.filter((j) => j.type === "craving").length,
      missions: dragonAttacks.filter((a: { survived: boolean }) => a.survived).length,
      gymCleanComboDays: allDays.filter((d) => d.jointClean && d.gymDone).length,
    },
  });

  // ── #5 Dragon Intelligence ──
  const dragonIntel = computeDragonIntel({
    today: { jointClean: todayFacts.jointClean, gymDone: todayFacts.gymDone, proteinG: todayFacts.proteinG, nclexHours: todayFacts.nclexHours, spiritualDone: todayFacts.spiritualDone },
    targets: { proteinTarget: settings.proteinTarget, nclexHoursTarget: settings.nclexHoursTarget },
    topTriggers, topEmotions,
    dangerWindowLabel: forecast.window?.label ?? (analytics.mostDangerousHour !== "—" ? analytics.mostDangerousHour : null),
    riskiestDay: analytics.mostDangerousDay !== "—" ? analytics.mostDangerousDay : null,
  });

  // ── #7 Cost ──
  const spend = [
    ...txns.filter((t) => CANNABIS_CATEGORIES.has((t.category || "").toLowerCase())).map((t) => ({ date: t.date, amount: t.amount })),
    ...expenses.filter((e) => CANNABIS_CATEGORIES.has((e.category || "").toLowerCase())).map((e) => ({ date: e.date, amount: e.amount })),
  ];
  const last30Keys = new Set(lastNDays(30, date));
  const cost = computeCost({
    currency: "£", spend, nowKey: date, thirtyAgoKey: addDaysKey(date, -30),
    useDaysLifetime: allDays.filter((d) => !d.jointClean).length,
    useDaysLast30: allDays.filter((d) => !d.jointClean && last30Keys.has(d.date)).length,
    jointsPerDay: settings.recJointsPerDay, pricePerJoint: 5,
    nclexHoursTarget: settings.nclexHoursTarget, gymDaysPerWeek: settings.gymDaysTarget,
  });

  // ── #9 Daily Coach ──
  const coach = ruleBasedBriefing({
    name: "Aman", streakDays, riskBand: forecast.band, riskScore: forecast.score,
    topRiskReason: forecast.reasons[0] ?? null, dangerWindowLabel: forecast.window?.label ?? null,
    protectiveToday: forecast.protective, gymDoneToday: todayFacts.gymDone,
    nextBestMove: forecast.nextBestMove?.action ?? null, cleanWeeksMilestoneSoon: null,
  });

  // ── #4 Weekly Intelligence Report (last 42 days) ──
  const reportKeys = lastNDays(42, date);
  const byDate = new Map(allDays.map((d) => [d.date, d]));
  const cravingsByDay: Record<string, number> = {};
  for (const k of reportKeys) cravingsByDay[k] = 0;
  for (const c of cravingRowsForAnalytics) { const k = localDayKey(c.at); if (k in cravingsByDay) cravingsByDay[k]++; }
  const flagByDay = (pred: (d: DayLogRow) => boolean) => {
    const o: Record<string, boolean> = {};
    for (const k of reportKeys) { const d = byDate.get(k); o[k] = d ? pred(d) : false; }
    return o;
  };
  const report = weeklyIntelligenceReport({
    cravingsByDay,
    flags: [
      { key: "gym", label: "Gym days", helpful: true, byDay: flagByDay((d) => d.gymDone) },
      { key: "study", label: "Study days", helpful: true, byDay: flagByDay((d) => d.nclexHours >= Math.max(0.1, settings.nclexHoursTarget)) },
      { key: "spiritual", label: "Spiritual days", helpful: true, byDay: flagByDay((d) => d.spiritualDone) },
      { key: "poor-sleep", label: "Poor-sleep nights", helpful: false, byDay: flagByDay((d) => d.sleepHours > 0 && d.sleepHours < 6) },
    ],
  });

  // ── #8 Timeline ──
  const timeline = buildTimeline({
    now,
    lastJointAt: settings.lastJointAt ? new Date(settings.lastJointAt).toISOString() : null,
    streakDays,
    relapses: relapseEvents.map((e) => ({ at: new Date(e.at).toISOString() })),
    cravings: cravingRowsForAnalytics.map((c) => ({ at: new Date(c.at).toISOString(), outcome: c.outcome, intensity: c.intensity })),
  });

  const daTotal = dragonAttacks.length;
  const daSurvived = dragonAttacks.filter((a: { survived: boolean }) => a.survived).length;

  // ── Permanent records (for the Intelligence hub) ──
  const dmgTargets = { nclexHoursTarget: settings.nclexHoursTarget, proteinTarget: settings.proteinTarget, waterTarget: settings.waterTarget };
  const discTargets = { proteinTarget: settings.proteinTarget, sleepTarget: settings.sleepTarget, nclexHoursTarget: settings.nclexHoursTarget };
  const records = {
    bestCleanRunSec: Math.max(settings.bestCleanRunSec, cleanSec),
    highestLifeScore: allDays.reduce((mx, d) => Math.max(mx, d.lifeScore), 0),
    highestDamageDay: allDays.reduce((mx, d) => Math.max(mx, dailyDamage(d, dmgTargets).total), 0),
    totalCleanDays: allDays.filter((d) => d.jointClean).length,
    bestDisciplineScore: allDays.reduce((mx, d) => Math.max(mx, dailyScore({
      date: d.date, jointClean: d.jointClean, proteinG: d.proteinG, gymDone: d.gymDone, nclexHours: d.nclexHours,
      nclexQuestions: d.nclexQuestions, bharatfareDone: d.bharatfareDone, sleepHours: d.sleepHours, checkinDone: d.checkinDone, recoveryCheckin: false, hasData: true,
    }, discTargets).score), 0),
  };

  // ── Mission Board (decision engine) ──
  const missionBoard = buildMissionBoard({
    today: { gymDone: todayFacts.gymDone, nclexHours: todayFacts.nclexHours, proteinG: todayFacts.proteinG, spiritualDone: todayFacts.spiritualDone },
    targets: { nclexHoursTarget: settings.nclexHoursTarget, proteinTarget: settings.proteinTarget },
    riskBand: forecast.band,
  });

  // ── Timeline Health (data trust) ──
  const health = timelineHealth({ relapses: relapseEvents.map((e) => ({ at: e.at })), dayThreshold: 3, windowMinutes: 8 });

  // ── Forecast accuracy — snapshot today, score resolved past days ──
  const relapsedToday = !todayFacts.jointClean;
  await adb.forecastLog.upsert({
    where: { date },
    create: { date, band: forecast.band, score: forecast.score, relapsed: relapsedToday },
    update: { band: forecast.band, score: forecast.score, relapsed: relapsedToday },
  }).catch(() => {});
  const since = addDaysKey(date, -30);
  const fcLogs: { date: string; band: string; relapsed: boolean }[] =
    await adb.forecastLog.findMany({ where: { date: { gte: since } }, orderBy: { date: "asc" } }).catch(() => []);
  const resolved = fcLogs.filter((l) => l.date < date); // exclude today (not yet resolved)
  let correct = 0;
  const examples = resolved.map((l) => {
    const ok = l.band === "Low" ? !l.relapsed : l.relapsed;
    if (ok) correct++;
    return { date: l.date, band: l.band, relapsed: l.relapsed, correct: ok };
  });
  const forecastAccuracy = {
    pct: resolved.length ? Math.round((correct / resolved.length) * 100) : 0,
    sample: resolved.length,
    recent: examples.slice(-5).reverse(),
  };

  return {
    forecast,
    recoveryXp,
    dragonIntel,
    missionBoard,
    timelineHealth: health,
    forecastAccuracy,
    records,
    cost,
    coach,
    report,
    timeline,
    futureMessages: futureMessages(streakDays),
    nextFutureMessage: nextFutureMessage(streakDays),
    dragonAttackStats: { total: daTotal, survived: daSurvived, survivalRate: daTotal ? Math.round((daSurvived / daTotal) * 100) : 0 },
    analyticsLite: { victoryRate: analytics.victoryRate, mostDangerousHour: analytics.mostDangerousHour, mostDangerousDay: analytics.mostDangerousDay, total: analytics.total, last7: analytics.last7 },
    streakDays,
  };
}

export async function getIntelligenceData() {
  const date = todayKey();
  const settings = await ensureSettings();
  const today = await ensureDay(date);
  const intel = await loadRecoveryIntel(settings, today);
  return { date, lastJointAt: settings.lastJointAt ? settings.lastJointAt.toISOString() : null, ...intel };
}

export type IntelligenceData = Awaited<ReturnType<typeof getIntelligenceData>>;
export type RecoveryIntel = Awaited<ReturnType<typeof loadRecoveryIntel>>;
