// AmanOS — Weekly CEO Review (v0, read-layer, computed not stored).
// Rolling last-7-days summary across the whole Life OS. Reuses the existing
// domain loaders; does NOT touch the Review model / written-reflection system.
import prisma from "@/lib/db";
import { ensureSettings } from "@/lib/day";
import { todayKey, lastNDays } from "@/lib/dates";
import { getRecoverySuccess } from "@/lib/recovery-success";
import { getCravingVictory } from "@/lib/craving-victory";
import { getCleanRuns, formatDHM } from "@/lib/streak-history";
import { getSmokingSplit, dragonTaxFromSplit } from "@/lib/smoking-split";
import { getMoneySavedInputs, computeMoneySaved } from "@/lib/money-saved";
import { getDisciplineHistory } from "@/lib/discipline-history";
import { getNclexCommand } from "@/lib/nclex-command";
import { getFitness } from "@/lib/fitness";
import { getBharatfareCeo } from "@/lib/bharatfare-ceo";
import { getCareerCommand } from "@/lib/career";
import { getOneThing } from "@/lib/one-thing";

export interface HabitAdherence { key: string; label: string; pct: number; metDays: number }
export interface WeeklyCeoReview {
  rangeLabel: string;
  habits: HabitAdherence[];
  bestHabit: HabitAdherence | null;
  weakestHabit: HabitAdherence | null;
  biggestWin: string;
  biggestFailure: string;
  summaries: { recovery: string; nclex: string; fitness: string; bharatfare: string; career: string; discipline: string };
  moneyLost: number;
  moneySaved: number;
  nextWeekFocus: string;
  mondayOneThing: { domain: string; title: string };
}

interface DayRow { date: string; jointClean: boolean; gymDone: boolean; spiritualDone: boolean; bharatfareDone: boolean; checkinDone: boolean; nclexQuestions: number; proteinG: number; waterMl: number }

export async function getWeeklyCeoReview(now: Date = new Date()): Promise<WeeklyCeoReview> {
  const today = todayKey(now);
  const week = new Set(lastNDays(7, today));

  const [settings, days, recovery, craving, clean, smoking, savedInputs, discipline, nclex, fitness, bf, career, oneThing] = await Promise.all([
    ensureSettings(),
    prisma.dayLog.findMany({ where: { date: { in: [...week] } }, select: { date: true, jointClean: true, gymDone: true, spiritualDone: true, bharatfareDone: true, checkinDone: true, nclexQuestions: true, proteinG: true, waterMl: true } }).catch(() => [] as DayRow[]),
    getRecoverySuccess(now),
    getCravingVictory(now),
    getCleanRuns(now),
    getSmokingSplit(now),
    getMoneySavedInputs(now),
    getDisciplineHistory(now),
    getNclexCommand(now),
    getFitness(now),
    getBharatfareCeo(now),
    getCareerCommand(now),
    getOneThing(now),
  ]);

  const byDate = new Map((days as DayRow[]).map((d) => [d.date, d]));
  const met = (pred: (d: DayRow) => boolean) => [...week].filter((k) => { const d = byDate.get(k); return d ? pred(d) : false; }).length;
  const habits: HabitAdherence[] = [
    { key: "clean", label: "Clean", metDays: met((d) => d.jointClean) },
    { key: "gym", label: "Gym", metDays: met((d) => d.gymDone) },
    { key: "nclex", label: "NCLEX", metDays: met((d) => d.nclexQuestions > 0) },
    { key: "protein", label: "Protein", metDays: met((d) => d.proteinG >= settings.proteinTarget) },
    { key: "water", label: "Water", metDays: met((d) => d.waterMl >= settings.waterTarget) },
    { key: "spiritual", label: "Spiritual", metDays: met((d) => d.spiritualDone) },
    { key: "bharatfare", label: "BharatFare", metDays: met((d) => d.bharatfareDone) },
    { key: "checkin", label: "Check-in", metDays: met((d) => d.checkinDone) },
  ].map((h) => ({ ...h, pct: Math.round((h.metDays / 7) * 100) }));

  const ranked = [...habits].sort((a, b) => b.pct - a.pct);
  const bestHabit = ranked[0] ?? null;
  const weakestHabit = ranked[ranked.length - 1] ?? null;

  // Weekly best clean run (runs that ended within the window, else ongoing).
  const weekRunMs = Math.max(0, ...clean.runs.filter((r) => r.ongoing || (r.endISO && week.has(r.endISO.slice(0, 10)))).map((r) => r.durationMs), 0);
  const relapses7 = recovery.useDays; // within tracking; approximate
  const cleanDays7 = habits.find((h) => h.key === "clean")?.metDays ?? 0;

  // Biggest win / failure.
  let biggestWin: string;
  if (cleanDays7 === 7) biggestWin = "7/7 clean days — a perfect recovery week.";
  else if (bestHabit && bestHabit.pct === 100) biggestWin = `Perfect week on ${bestHabit.label} (7/7).`;
  else if (nclex.onTrack && nclex.examSet) biggestWin = "NCLEX held its exam pace this week.";
  else if (bestHabit) biggestWin = `Strongest habit: ${bestHabit.label} (${bestHabit.pct}%).`;
  else biggestWin = "Showed up — data logged this week.";

  let biggestFailure: string;
  const relapseThisWeek = (7 - cleanDays7) > 0;
  if (relapseThisWeek) biggestFailure = `${7 - cleanDays7} use day${7 - cleanDays7 === 1 ? "" : "s"} this week — recovery is the priority.`;
  else if (weakestHabit && weakestHabit.metDays === 0) biggestFailure = `Zero ${weakestHabit.label} all week.`;
  else if (weakestHabit) biggestFailure = `Weakest habit: ${weakestHabit.label} (${weakestHabit.pct}%).`;
  else biggestFailure = "No major failure flagged.";

  // Money.
  const dragon = dragonTaxFromSplit(smoking);
  const moneySavedObj = computeMoneySaved(smoking, savedInputs, now);
  const moneyLost = dragon.last7.total;
  const moneySaved = moneySavedObj.last7.saved;

  // Discipline trend.
  const d7 = discipline.trends.d7;
  const dir = d7.direction === "improving" ? "▲ improving" : d7.direction === "declining" ? "▼ declining" : "→ stable";

  // Per-domain summaries.
  const resisted7 = Math.round((craving.last7Count * craving.last7Rate) / 100);
  const summaries = {
    recovery: `Clean ${cleanDays7}/7 · best run ${formatDHM(weekRunMs)} · cravings resisted ${resisted7}/${craving.last7Count}`,
    nclex: `${nclex.questionsThisWeek} Qs · ${nclex.acc7Count > 0 ? nclex.acc7 + "% acc" : "no acc data"} · ${nclex.onTrack ? "on pace" : "behind pace"} · readiness ${nclex.readinessScore}`,
    fitness: `${fitness.sessions7}/${fitness.gymTarget} sessions · vol ${fitness.weeklyVolume.toLocaleString()} · weight ${fitness.change7 == null ? "—" : (fitness.change7 > 0 ? "+" : "") + fitness.change7 + "kg"}`,
    bharatfare: bf.hasData ? `${bf.week.leads} leads · ${bf.week.bookings} bookings · £${bf.week.revenue} rev · CEO ${bf.ceoScore}` : "No metrics logged this week.",
    career: `${career.riskLevel} risk · ${career.nextAction}`,
    discipline: `7d avg ${d7.avg} (${dir} ${d7.improvement >= 0 ? "+" : ""}${d7.improvement} vs prev) · ${d7.strongDays} strong / ${d7.driftDays} drift`,
  };

  // Next-week focus from the current top priority.
  const focusMap: Record<string, string> = {
    Recovery: "Protect the streak — recovery is next week's #1.",
    Career: "Resolve the career risk — registration first.",
    NCLEX: "Close the NCLEX pace gap — hit the daily question target.",
    Fitness: "Rebuild training consistency — hit the weekly session target.",
    BharatFare: "Drive BharatFare outreach — leads then bookings.",
    Keystone: "Hold the line — keep every keystone habit ticking.",
  };
  const nextWeekFocus = focusMap[oneThing.domain] ?? `Focus on ${weakestHabit?.label ?? "consistency"}.`;

  return {
    rangeLabel: "Last 7 days",
    habits,
    bestHabit,
    weakestHabit,
    biggestWin,
    biggestFailure,
    summaries,
    moneyLost,
    moneySaved,
    nextWeekFocus,
    mondayOneThing: { domain: oneThing.domain, title: oneThing.title },
  };
}
