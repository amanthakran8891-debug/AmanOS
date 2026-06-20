// AmanOS — Phase 2, item 4: Fitness Progress Command Center (v0, no DB).
// Read-layer over DayLog (weight/bodyFat/protein/gymDone) + GymSet (lifts/volume)
// + Settings (goals) + the manual body-measurements file (circumferences/height).
import prisma from "@/lib/db";
import { ensureSettings } from "@/lib/day";
import { todayKey, lastNDays, addDaysKey } from "@/lib/dates";
import { BODY_MEASUREMENTS, HEIGHT_CM, type BodyMeasurement } from "@/data/body-measurements";

const DAY = 86400000;

export interface BestLift { exercise: string; maxWeight: number; bodyPart: string }
export interface MeasureTrend { current: number | null; delta: number | null; date: string | null }
export interface GraphPoint { label: string; value: number }

export interface FitnessCommand {
  // Weight
  currentWeight: number | null;
  goalWeight: number | null;
  startWeight: number | null;
  change7: number | null; change30: number | null; changeLifetime: number | null;
  bmi: number | null;
  progressToGoal: number | null; // %
  // Strength
  bestLifts: BestLift[];
  weeklyVolume: number;
  monthlyVolume: number;
  recentPRs: { exercise: string; weight: number; date: string }[];
  consistencyPct: number; // sessions7 vs target
  sessions7: number; sessions30: number; gymTarget: number;
  // Body metrics (from data file) + body fat (from DayLog)
  chest: MeasureTrend; waist: MeasureTrend; arms: MeasureTrend; thighs: MeasureTrend;
  bodyFat: MeasureTrend;
  // Score
  fitnessScore: number;
  band: "Poor" | "Building" | "Strong" | "Elite";
  scoreBreakdown: { weight: number; consistency: number; strength: number; nutrition: number };
  nextAction: string;
  // Records
  records: { heaviest: number | null; lowest: number | null; bestWeeklyVolume: number; longestGymStreak: number; biggestLossStreak: number };
  // Graphs
  weightTrend: GraphPoint[];
  trainingFrequency: GraphPoint[];
  weeklyVolumeTrend: GraphPoint[];
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const r1 = (n: number) => Math.round(n * 10) / 10;

interface DayRow { date: string; weightKg: number | null; bodyFat: number | null; proteinG: number; gymDone: boolean }
interface SetRow { date: string; bodyPart: string; exercise: string; sets: number; reps: number; weightKg: number }

function lastMeasure(field: keyof BodyMeasurement): MeasureTrend {
  const rows = [...BODY_MEASUREMENTS].filter((m) => m[field] != null).sort((a, b) => a.date.localeCompare(b.date));
  if (rows.length === 0) return { current: null, delta: null, date: null };
  const last = rows[rows.length - 1];
  const prev = rows.length > 1 ? rows[rows.length - 2] : null;
  const cur = last[field] as number;
  return { current: cur, delta: prev ? r1(cur - (prev[field] as number)) : null, date: last.date };
}

export function buildFitness(days: DayRow[], sets: SetRow[], settings: { weightGoal: number | null; proteinTarget: number; gymDaysTarget: number }, now: Date = new Date()): FitnessCommand {
  const today = todayKey(now);
  const wDays = days.filter((d) => d.weightKg != null).sort((a, b) => a.date.localeCompare(b.date));
  const weightAsOf = (key: string): number | null => {
    let v: number | null = null;
    for (const d of wDays) { if (d.date <= key) v = d.weightKg; else break; }
    return v;
  };
  const currentWeight = wDays.length ? wDays[wDays.length - 1].weightKg : null;
  const startWeight = wDays.length ? wDays[0].weightKg : null;
  const goalWeight = settings.weightGoal ?? null;
  const w7 = weightAsOf(addDaysKey(today, -7));
  const w30 = weightAsOf(addDaysKey(today, -30));
  const change7 = currentWeight != null && w7 != null ? r1(currentWeight - w7) : null;
  const change30 = currentWeight != null && w30 != null ? r1(currentWeight - w30) : null;
  const changeLifetime = currentWeight != null && startWeight != null ? r1(currentWeight - startWeight) : null;
  const bmi = currentWeight != null ? r1(currentWeight / ((HEIGHT_CM / 100) ** 2)) : null;
  const progressToGoal = (currentWeight != null && goalWeight != null && startWeight != null && startWeight !== goalWeight)
    ? Math.round(clamp(((startWeight - currentWeight) / (startWeight - goalWeight)) * 100))
    : null;

  // Strength.
  const volOf = (s: SetRow) => s.sets * s.reps * s.weightKg;
  const inWin = (n: number) => { const keys = new Set(lastNDays(n, today)); return sets.filter((s) => keys.has(s.date)); };
  const weeklyVolume = Math.round(inWin(7).reduce((a, s) => a + volOf(s), 0));
  const monthlyVolume = Math.round(inWin(30).reduce((a, s) => a + volOf(s), 0));

  const maxByEx = new Map<string, { maxWeight: number; bodyPart: string; maxDate: string }>();
  for (const s of sets) {
    const e = maxByEx.get(s.exercise);
    if (!e || s.weightKg > e.maxWeight) maxByEx.set(s.exercise, { maxWeight: s.weightKg, bodyPart: s.bodyPart, maxDate: s.date });
  }
  const bestLifts: BestLift[] = [...maxByEx.entries()]
    .map(([exercise, v]) => ({ exercise, maxWeight: v.maxWeight, bodyPart: v.bodyPart }))
    .sort((a, b) => b.maxWeight - a.maxWeight)
    .slice(0, 8);
  const cut30 = addDaysKey(today, -30);
  const recentPRs = [...maxByEx.entries()]
    .filter(([, v]) => v.maxDate >= cut30 && v.maxWeight > 0)
    .map(([exercise, v]) => ({ exercise, weight: v.maxWeight, date: v.maxDate }))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 5);

  // Consistency — session days (gymDone OR any GymSet that day).
  const sessionDays = new Set<string>();
  for (const d of days) if (d.gymDone) sessionDays.add(d.date);
  for (const s of sets) sessionDays.add(s.date);
  const sessions7 = lastNDays(7, today).filter((k) => sessionDays.has(k)).length;
  const sessions30 = lastNDays(30, today).filter((k) => sessionDays.has(k)).length;
  const gymTarget = Math.max(1, settings.gymDaysTarget);
  const consistencyPct = clamp((sessions7 / gymTarget) * 100);

  // Body fat trend from DayLog.
  const bfDays = days.filter((d) => d.bodyFat != null).sort((a, b) => a.date.localeCompare(b.date));
  const bodyFat: MeasureTrend = bfDays.length
    ? { current: bfDays[bfDays.length - 1].bodyFat!, delta: bfDays.length > 1 ? r1(bfDays[bfDays.length - 1].bodyFat! - bfDays[bfDays.length - 2].bodyFat!) : null, date: bfDays[bfDays.length - 1].date }
    : { current: null, delta: null, date: null };

  // ── Weekly buckets (12) for graphs + strength progression ──
  const weekVol: number[] = [], weekFreq: number[] = [];
  for (let k = 11; k >= 0; k--) {
    const keys = new Set(lastNDays(7, addDaysKey(today, -7 * k)));
    const v = sets.filter((s) => keys.has(s.date)).reduce((a, s) => a + volOf(s), 0);
    const f = [...sessionDays].filter((d) => keys.has(d)).length;
    weekVol.push(Math.round(v)); weekFreq.push(f);
  }
  const thisWeekVol = weekVol[weekVol.length - 1] ?? 0;
  const prior4 = weekVol.slice(-5, -1);
  const prior4Avg = prior4.length ? prior4.reduce((a, b) => a + b, 0) / prior4.length : 0;

  // ── Fitness Score (Weight / Consistency / Strength / Nutrition, 25 each) ──
  const weightScore = progressToGoal != null ? clamp(progressToGoal) : 50;
  const consistencyScore = consistencyPct;
  const strengthScore = prior4Avg > 0 ? clamp(50 + ((thisWeekVol / prior4Avg) - 1) * 50) : (thisWeekVol > 0 ? 60 : 50);
  const proteinTarget = Math.max(1, settings.proteinTarget);
  const proteinDays7 = lastNDays(7, today).filter((k) => { const d = days.find((x) => x.date === k); return d ? d.proteinG >= proteinTarget : false; }).length;
  const nutritionScore = clamp((proteinDays7 / 7) * 100);
  const fitnessScore = Math.round(0.25 * weightScore + 0.25 * consistencyScore + 0.25 * strengthScore + 0.25 * nutritionScore);
  const band: FitnessCommand["band"] = fitnessScore >= 85 ? "Elite" : fitnessScore >= 65 ? "Strong" : fitnessScore >= 40 ? "Building" : "Poor";

  // ── Next action ──
  const lastWeighKey = wDays.length ? wDays[wDays.length - 1].date : null;
  const daysSinceWeigh = lastWeighKey ? Math.round((new Date(today + "T00:00:00").getTime() - new Date(lastWeighKey + "T00:00:00").getTime()) / DAY) : 999;
  // stalest major body part
  const MAJOR = ["legs", "chest", "back", "shoulders", "arms"];
  const lastTrained = new Map<string, string>();
  for (const s of sets) { const bp = s.bodyPart.toLowerCase(); const cur = lastTrained.get(bp); if (!cur || s.date > cur) lastTrained.set(bp, s.date); }
  let stalest: string | null = null, stalestDate = "9999";
  for (const bp of MAJOR) { const d = lastTrained.get(bp) ?? "0000"; if (d < stalestDate) { stalestDate = d; stalest = bp; } }
  let nextAction: string;
  if (daysSinceWeigh >= 3) nextAction = "Weigh in — log today's weight to keep the trend honest.";
  else if (sessions7 < gymTarget) nextAction = stalest ? `Train ${stalest} — complete session ${sessions7 + 1} of ${gymTarget} this week.` : `Complete session ${sessions7 + 1} of ${gymTarget} this week.`;
  else if (nutritionScore < 60) nextAction = `Increase protein — hit ${proteinTarget}g on more days (only ${proteinDays7}/7 last week).`;
  else if (strengthScore < 45) nextAction = "Add volume — this week is below your recent average.";
  else nextAction = "Hold the line: weigh in, train on plan, hit protein.";

  // ── Records ──
  const weights = wDays.map((d) => d.weightKg!).filter((x) => x > 0);
  // longest gym streak (consecutive calendar days that are session days)
  const sdSorted = [...sessionDays].sort();
  let gymStreak = 0, gRun = 0, gPrev: string | null = null;
  for (const k of sdSorted) { const contig = gPrev && new Date(k + "T00:00:00").getTime() - new Date(gPrev + "T00:00:00").getTime() === DAY; gRun = contig ? gRun + 1 : 1; if (gRun > gymStreak) gymStreak = gRun; gPrev = k; }
  // biggest weight-loss streak (consecutive logged weigh-ins each ≤ previous)
  let lossStreak = 0, lRun = 0;
  for (let i = 1; i < wDays.length; i++) { if ((wDays[i].weightKg ?? 0) <= (wDays[i - 1].weightKg ?? 0)) { lRun += 1; if (lRun > lossStreak) lossStreak = lRun; } else lRun = 0; }

  return {
    currentWeight, goalWeight, startWeight, change7, change30, changeLifetime, bmi, progressToGoal,
    bestLifts, weeklyVolume, monthlyVolume, recentPRs, consistencyPct: Math.round(consistencyPct), sessions7, sessions30, gymTarget,
    chest: lastMeasure("chest"), waist: lastMeasure("waist"), arms: lastMeasure("arms"), thighs: lastMeasure("thighs"), bodyFat,
    fitnessScore, band,
    scoreBreakdown: { weight: Math.round(weightScore), consistency: Math.round(consistencyScore), strength: Math.round(strengthScore), nutrition: Math.round(nutritionScore) },
    nextAction,
    records: {
      heaviest: weights.length ? Math.max(...weights) : null,
      lowest: weights.length ? Math.min(...weights) : null,
      bestWeeklyVolume: weekVol.length ? Math.max(...weekVol) : 0,
      longestGymStreak: gymStreak,
      biggestLossStreak: lossStreak,
    },
    weightTrend: wDays.slice(-40).map((d) => ({ label: d.date.slice(5), value: r1(d.weightKg!) })),
    trainingFrequency: weekFreq.map((f, i) => ({ label: `w${i - 11}`, value: f })),
    weeklyVolumeTrend: weekVol.map((v, i) => ({ label: `w${i - 11}`, value: v })),
  };
}

export async function getFitness(now: Date = new Date()): Promise<FitnessCommand> {
  const [settings, days, sets] = await Promise.all([
    ensureSettings(),
    prisma.dayLog.findMany({ select: { date: true, weightKg: true, bodyFat: true, proteinG: true, gymDone: true }, orderBy: { date: "asc" } }).catch(() => [] as DayRow[]),
    prisma.gymSet.findMany({ select: { date: true, bodyPart: true, exercise: true, sets: true, reps: true, weightKg: true } }).catch(() => [] as SetRow[]),
  ]);
  return buildFitness(days as DayRow[], sets as SetRow[], { weightGoal: settings.weightGoal ?? null, proteinTarget: settings.proteinTarget, gymDaysTarget: settings.gymDaysTarget }, now);
}
