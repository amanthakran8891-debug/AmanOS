// AmanOS — Morning Briefing & Evening Debrief (read-layer, no migration).
// Orchestration layer over existing engines. Morning = mission briefing; Evening
// = CEO after-action review. All forward numbers are labelled estimates.
import prisma from "@/lib/db";
import { ensureSettings } from "@/lib/day";
import { todayKey } from "@/lib/dates";
import { lifeScore, WEIGHTS, type DayInput, type Targets } from "@/lib/score";
import { getDailyBriefing, type DailyBriefing } from "@/lib/daily-briefing";
import { getOneThing } from "@/lib/one-thing";
import { getRecoverySuccess } from "@/lib/recovery-success";
import { getNclexCommand } from "@/lib/nclex-command";
import { getFitness } from "@/lib/fitness";
import { getCareerCommand } from "@/lib/career";
import { getBharatfareCeo } from "@/lib/bharatfare-ceo";

export interface SectorStatus { label: string; text: string; tone: "good" | "warn" | "bad" }

export interface MorningBriefing {
  briefing: DailyBriefing; // reused: risk, ONE Thing, avoid, tasks, execute/drift scores
  sectors: SectorStatus[];
}

export interface EveningDebrief {
  achievedScore: number;
  verdict: "Won" | "Partial" | "Drift";
  completed: string[];
  missed: string[];
  biggestWin: string;
  biggestFailure: string;
  pointLedger: { label: string; lost: number }[]; // missed keystones by weight
  tomorrowOneThing: { domain: string; title: string };
  tomorrowRisk: { level: string; note: string };
}

function toTargets(s: { proteinTarget: number; waterTarget: number; sleepTarget: number; stepsTarget: number; nclexHoursTarget: number }): Targets {
  return { proteinTarget: s.proteinTarget, waterTarget: s.waterTarget, sleepTarget: s.sleepTarget, stepsTarget: s.stepsTarget, nclexHoursTarget: s.nclexHoursTarget };
}

// ── Morning ───────────────────────────────────────────────────────────────────
export async function getMorningBriefing(now: Date = new Date()): Promise<MorningBriefing> {
  const [briefing, recovery, nclex, fitness, career, bf] = await Promise.all([
    getDailyBriefing(now), getRecoverySuccess(now), getNclexCommand(now), getFitness(now), getCareerCommand(now), getBharatfareCeo(now),
  ]);

  const sectors: SectorStatus[] = [
    { label: "Recovery", text: `${recovery.successRate}% clean lifetime · ${recovery.last7Rate}% (7d) · best run ${recovery.bestCleanPeriodDays}d`, tone: recovery.last7Rate >= 80 ? "good" : recovery.last7Rate >= 50 ? "warn" : "bad" },
    { label: "NCLEX", text: nclex.examSet ? `${nclex.daysLeft}d to exam · ${nclex.onTrack ? "on pace" : "behind pace"} · readiness ${nclex.readinessScore}` : `No exam date · ${nclex.totalQuestions} Qs · readiness ${nclex.readinessScore}`, tone: nclex.onTrack ? "good" : "warn" },
    { label: "Fitness", text: `${fitness.sessions7}/${fitness.gymTarget} sessions · score ${fitness.fitnessScore} (${fitness.band})`, tone: fitness.fitnessScore >= 65 ? "good" : fitness.fitnessScore >= 40 ? "warn" : "bad" },
    { label: "Career", text: `${career.riskLevel} risk · progress ${career.progressScore} (${career.band})`, tone: career.riskLevel === "Low" ? "good" : career.riskLevel === "Critical" || career.riskLevel === "High" ? "bad" : "warn" },
    { label: "BharatFare", text: bf.hasData ? `${bf.week.leads} leads · ${bf.week.bookings} bookings (7d) · CEO ${bf.ceoScore}` : "No metrics logged", tone: bf.hasData && bf.ceoScore >= 65 ? "good" : "warn" },
  ];

  return { briefing, sectors };
}

// ── Evening ───────────────────────────────────────────────────────────────────
export async function getEveningDebrief(now: Date = new Date()): Promise<EveningDebrief> {
  const today = todayKey(now);
  const [settings, todayLog, oneThing, nclex, recovery] = await Promise.all([
    ensureSettings(),
    prisma.dayLog.findUnique({ where: { date: today } }).catch(() => null),
    getOneThing(now),
    getNclexCommand(now),
    getRecoverySuccess(now),
  ]);

  const t = toTargets(settings);
  const d: DayInput = {
    jointClean: todayLog?.jointClean ?? true,
    proteinG: todayLog?.proteinG ?? 0,
    waterMl: todayLog?.waterMl ?? 0,
    sleepHours: todayLog?.sleepHours ?? 0,
    steps: todayLog?.steps ?? 0,
    nclexHours: todayLog?.nclexHours ?? 0,
    bharatfareDone: todayLog?.bharatfareDone ?? false,
    gymDone: todayLog?.gymDone ?? false,
    spiritualDone: todayLog?.spiritualDone ?? false,
  };
  const achievedScore = lifeScore(d, t).total;
  const verdict: EveningDebrief["verdict"] = achievedScore >= 70 && d.jointClean ? "Won" : achievedScore >= 45 ? "Partial" : "Drift";

  // Keystone outcomes.
  const nclexDone = nclex.requiredPerDay > 0 ? (todayLog?.nclexQuestions ?? 0) >= nclex.requiredPerDay : (todayLog?.nclexQuestions ?? 0) > 0;
  const items: { label: string; done: boolean; weight: number }[] = [
    { label: "Stayed clean", done: d.jointClean, weight: WEIGHTS.noJoint },
    { label: "NCLEX target", done: nclexDone, weight: WEIGHTS.nclex },
    { label: "Gym session", done: d.gymDone, weight: WEIGHTS.gym },
    { label: `Protein ${t.proteinTarget}g`, done: d.proteinG >= t.proteinTarget, weight: Math.round(WEIGHTS.health / 4) },
    { label: "BharatFare touch", done: d.bharatfareDone, weight: WEIGHTS.bharatfare },
    { label: "Spiritual", done: d.spiritualDone, weight: WEIGHTS.spiritual },
  ];
  const completed = items.filter((x) => x.done).map((x) => x.label);
  const missed = items.filter((x) => !x.done).map((x) => x.label);
  const pointLedger = items.filter((x) => !x.done).map((x) => ({ label: x.label, lost: x.weight })).sort((a, b) => b.lost - a.lost);

  const biggestWin = !d.jointClean
    ? "Showed up and logged the day despite the slip."
    : completed.length === items.length
      ? "Full sweep — every keystone done."
      : completed.length > 0
        ? `Strongest: ${completed[0]}.`
        : "Stayed clean.";
  const biggestFailure = !d.jointClean
    ? "Relapsed today — recovery is tomorrow's #1."
    : pointLedger.length > 0
      ? `Missed ${pointLedger[0].label} (−${pointLedger[0].lost} pts).`
      : "Nothing major missed.";

  // Tomorrow's starting risk (estimate): relapse today or weak 7d → elevated.
  const tomorrowRisk = !d.jointClean
    ? { level: "High", note: "48h post-slip window — risk compounds tomorrow." }
    : recovery.last7Rate < 70
      ? { level: "Elevated", note: "Recent week is wobbly — start tomorrow deliberate." }
      : { level: "Low", note: "Momentum is with you — protect it." };

  return {
    achievedScore,
    verdict,
    completed,
    missed,
    biggestWin,
    biggestFailure,
    pointLedger,
    tomorrowOneThing: { domain: oneThing.domain, title: oneThing.title },
    tomorrowRisk,
  };
}
