// AmanOS — Live Daily Briefing (read-layer, no migration).
// A short morning command briefing that aggregates the existing engines. The
// "expected score" is computed concretely with lifeScore() by flipping today's
// unfinished tasks to done; "drift damage" by modelling a relapse day. All
// forward numbers are labelled estimates.
import prisma from "@/lib/db";
import { ensureSettings } from "@/lib/day";
import { todayKey } from "@/lib/dates";
import { lifeScore, type DayInput, type Targets } from "@/lib/score";
import { JOINT_COST } from "@/lib/pricing";
import { getOneThing } from "@/lib/one-thing";
import { getNclexCommand } from "@/lib/nclex-command";
import { getCareerCommand } from "@/lib/career";

export interface BriefingItem { label: string; done: boolean }
export interface DailyBriefing {
  biggestRisk: { title: string; detail: string };
  oneThing: { domain: string; title: string; why: string };
  avoid: string;
  tasks: BriefingItem[];
  remainingCount: number;
  currentScore: number;
  expectedScore: number; // if you execute the remaining tasks
  driftScore: number; // if you drift / relapse today
  driftDamage: string;
}

function toTargets(s: { proteinTarget: number; waterTarget: number; sleepTarget: number; stepsTarget: number; nclexHoursTarget: number }): Targets {
  return { proteinTarget: s.proteinTarget, waterTarget: s.waterTarget, sleepTarget: s.sleepTarget, stepsTarget: s.stepsTarget, nclexHoursTarget: s.nclexHoursTarget };
}

const RISK_COPY: Record<string, { title: string; avoid: string }> = {
  Recovery: { title: "Relapse risk is today’s biggest threat.", avoid: "Avoid idle/alone time in your danger window; remove easy access." },
  Career: { title: "Career risk needs attention today.", avoid: "Don’t ignore registration/investigation actions — they compound." },
  NCLEX: { title: "You’re behind NCLEX pace.", avoid: "Don’t let the day pass without your question set." },
  Fitness: { title: "Training consistency is slipping.", avoid: "Don’t skip today’s session." },
  BharatFare: { title: "Business activity is low.", avoid: "Don’t end the day with zero outreach." },
  Keystone: { title: "Everything stable — main risk is complacency.", avoid: "Don’t coast; keep every keystone habit ticking." },
};

export async function getDailyBriefing(now: Date = new Date()): Promise<DailyBriefing> {
  const today = todayKey(now);
  const [settings, todayLog, oneThing, nclex, career] = await Promise.all([
    ensureSettings(),
    prisma.dayLog.findUnique({ where: { date: today } }).catch(() => null),
    getOneThing(now),
    getNclexCommand(now),
    getCareerCommand(now),
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

  const currentScore = lifeScore(d, t).total;
  // If executed: flip the remaining keystone tasks to done / target.
  const executed: DayInput = {
    ...d,
    jointClean: true,
    proteinG: Math.max(d.proteinG, t.proteinTarget),
    waterMl: Math.max(d.waterMl, t.waterTarget),
    sleepHours: Math.max(d.sleepHours, t.sleepTarget),
    steps: Math.max(d.steps, t.stepsTarget),
    nclexHours: Math.max(d.nclexHours, t.nclexHoursTarget),
    bharatfareDone: true,
    gymDone: true,
    spiritualDone: true,
  };
  const expectedScore = lifeScore(executed, t).total;
  // If drift / relapse: clean lost, no further progress.
  const driftScore = lifeScore({ ...d, jointClean: false }, t).total;

  // Tasks (clean-until-midnight is ongoing; mark ✓ if currently clean).
  const nclexDone = nclex.requiredPerDay > 0 ? (todayLog?.nclexQuestions ?? 0) >= nclex.requiredPerDay : (todayLog?.nclexQuestions ?? 0) > 0;
  const tasks: BriefingItem[] = [
    { label: "Stay clean until midnight", done: d.jointClean },
    { label: `Complete ${nclex.requiredPerDay || 50} NCLEX questions`, done: nclexDone },
    { label: "Train (gym session)", done: d.gymDone },
    { label: `Hit protein target (${t.proteinTarget}g)`, done: d.proteinG >= t.proteinTarget },
    { label: "BharatFare touch (outreach)", done: d.bharatfareDone },
  ];
  const remainingCount = tasks.filter((x) => !x.done).length;

  // Biggest risk copy (driven by the ONE Thing's domain ranking).
  const copy = RISK_COPY[oneThing.domain] ?? RISK_COPY.Keystone;
  let detail = oneThing.why;
  if (oneThing.domain === "Career") detail = `Career risk: ${career.riskLevel}. ${career.nextAction}`;

  const driftDamage = `Discipline drops to ~${driftScore}/100, the clean streak resets, the Dragon regains ground, and a relapse costs ~£${JOINT_COST}+. (estimate)`;

  return {
    biggestRisk: { title: copy.title, detail },
    oneThing: { domain: oneThing.domain, title: oneThing.title, why: oneThing.why },
    avoid: copy.avoid,
    tasks,
    remainingCount,
    currentScore,
    expectedScore,
    driftScore,
    driftDamage,
  };
}
