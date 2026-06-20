// AmanOS — Phase 2: the ONE Thing system (read-layer, no DB writes).
// Generates the single highest-priority action for today by ranking five life
// domains on urgency, breaking ties Recovery → Career → NCLEX → Fitness →
// BharatFare. Completion is inferred from today's logs (no storage needed).
import prisma from "@/lib/db";
import { todayKey } from "@/lib/dates";
import { getRecoverySuccess } from "@/lib/recovery-success";
import { getNclexCommand } from "@/lib/nclex-command";
import { getFitness } from "@/lib/fitness";
import { getBharatfareCeo } from "@/lib/bharatfare-ceo";
import { getCareerCommand } from "@/lib/career";

export type OneThingDomain = "Recovery" | "Career" | "NCLEX" | "Fitness" | "BharatFare" | "Keystone";

export interface OneThing {
  domain: OneThingDomain;
  title: string;
  why: string;
  timeEstimate: string;
  xp: number;
  consequence: string;
  done: boolean;
  urgency: number; // 0..100 (debug/sortable)
}

export interface OneThingInputs {
  // recovery
  relapsedToday: boolean;
  recentRelapse48h: boolean;
  last7SuccessRate: number;
  // career
  careerRisk: "Low" | "Elevated" | "High" | "Critical";
  careerNextAction: string;
  // nclex
  nclexExamSet: boolean;
  nclexOnTrack: boolean;
  nclexRequiredPerDay: number;
  nclexDaysLeft: number;
  nclexDoneTodayQ: number;
  // fitness
  fitSessions7: number;
  fitGymTarget: number;
  gymDoneToday: boolean;
  fitnessNextAction: string;
  // bharatfare
  bfHasData: boolean;
  bfWeekLeads: number;
  bfWeekBookings: number;
  bharatfareDoneToday: boolean;
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

/** Pure: rank the domains and return the single ONE Thing. */
export function buildOneThing(i: OneThingInputs): OneThing {
  const candidates: OneThing[] = [];

  // ── Recovery (can override everything) ──
  {
    let urgency = 15;
    let title = "Stay clean until midnight";
    let why = "Protecting the streak is the foundation everything else rests on.";
    let consequence = "The clean clock resets to zero.";
    if (i.relapsedToday) {
      urgency = 95; title = "Limit the damage — reach midnight clean from here";
      why = "A slip isn't a fall. The next hours decide whether this becomes one day or many.";
      consequence = "A single slip turns into a relapse spiral.";
    } else if (i.recentRelapse48h) {
      urgency = 88; why = "Relapse risk compounds for ~48h after a slip — this is the danger window.";
    } else if (i.last7SuccessRate < 70) {
      urgency = 60; why = "Your last 7 days show wobble — lock in a clean day to steady the trend.";
    }
    candidates.push({ domain: "Recovery", title, why, timeEstimate: "until midnight", xp: 80, consequence, done: false, urgency });
  }

  // ── Career (can override if Critical/High) ──
  {
    const map: Record<string, number> = { Critical: 95, High: 80, Elevated: 45, Low: 10 };
    candidates.push({
      domain: "Career",
      title: i.careerNextAction,
      why: i.careerRisk === "Critical" || i.careerRisk === "High" ? "Your registration/livelihood is at risk — this can't wait." : "Keep your registration and job search moving.",
      timeEstimate: "~30–60 min",
      xp: 70,
      consequence: "Career risk escalates while it's ignored.",
      done: false,
      urgency: map[i.careerRisk] ?? 10,
    });
  }

  // ── NCLEX (wins if behind pace) ──
  {
    const doneToday = i.nclexRequiredPerDay > 0 && i.nclexDoneTodayQ >= i.nclexRequiredPerDay;
    let urgency = 20;
    if (i.nclexExamSet && !i.nclexOnTrack) urgency = i.nclexDaysLeft <= 45 ? 75 : 58;
    if (doneToday) urgency = 0;
    candidates.push({
      domain: "NCLEX",
      title: `Complete ${i.nclexRequiredPerDay || 50} NCLEX questions`,
      why: i.nclexExamSet ? `You're behind pace with ${i.nclexDaysLeft} days to exam day.` : "Build question volume toward exam readiness.",
      timeEstimate: `~${Math.max(20, i.nclexRequiredPerDay || 50)} min`,
      xp: 70,
      consequence: "You fall further behind the pace needed to pass.",
      done: doneToday,
      urgency,
    });
  }

  // ── Fitness (wins if slipping) ──
  {
    const deficit = Math.max(0, i.fitGymTarget - i.fitSessions7);
    let urgency = deficit > 0 ? clamp(25 + deficit * 12, 0, 55) : 10;
    if (i.gymDoneToday) urgency = Math.min(urgency, 8);
    candidates.push({
      domain: "Fitness",
      title: i.fitnessNextAction,
      why: deficit > 0 ? `You're ${deficit} session${deficit === 1 ? "" : "s"} short of your weekly target.` : "Keep the training streak alive.",
      timeEstimate: "~1 hr",
      xp: 50,
      consequence: "Another week under your training target.",
      done: i.gymDoneToday,
      urgency,
    });
  }

  // ── BharatFare (wins if low activity and others stable) ──
  {
    const lowActivity = i.bfHasData && i.bfWeekLeads < 3 && i.bfWeekBookings === 0;
    let urgency = lowActivity ? 40 : 10;
    if (i.bharatfareDoneToday) urgency = Math.min(urgency, 8);
    candidates.push({
      domain: "BharatFare",
      title: "Work BharatFare — message Gulf leads & post a fare",
      why: "Business activity is low this week — bookings come from outreach, not waiting.",
      timeEstimate: "~30 min",
      xp: 40,
      consequence: "The pipeline stalls and no bookings come in.",
      done: i.bharatfareDoneToday,
      urgency,
    });
  }

  // Rank: highest urgency wins; ties break by domain order (iterate in order, use >).
  const ORDER: OneThingDomain[] = ["Recovery", "Career", "NCLEX", "Fitness", "BharatFare"];
  let winner: OneThing | null = null;
  for (const dom of ORDER) {
    const c = candidates.find((x) => x.domain === dom);
    if (c && c.urgency > 0 && (!winner || c.urgency > winner.urgency)) winner = c;
  }

  // Fallback: everything healthy/handled → the day's keystone habit.
  if (!winner || winner.urgency <= 20) {
    const keystone: OneThing = !i.nclexOnTrack || (i.nclexRequiredPerDay > 0 && i.nclexDoneTodayQ < i.nclexRequiredPerDay)
      ? { domain: "Keystone", title: `Do your NCLEX set (${i.nclexRequiredPerDay || 50} Qs)`, why: "Small daily reps compound into a pass.", timeEstimate: `~${Math.max(20, i.nclexRequiredPerDay || 50)} min`, xp: 40, consequence: "A wasted day you can't get back.", done: false, urgency: 20 }
      : !i.gymDoneToday
        ? { domain: "Keystone", title: "Train or move today", why: "Consistency is the win when nothing is on fire.", timeEstimate: "~45 min", xp: 40, consequence: "Momentum quietly fades.", done: false, urgency: 20 }
        : { domain: "Keystone", title: "Log today + weigh in", why: "Everything stable — keep the data honest so the system stays sharp.", timeEstimate: "~5 min", xp: 20, consequence: "Blind spots creep into your tracking.", done: false, urgency: 15 };
    // Prefer a real high-urgency winner over the keystone only when winner exists & higher.
    if (!winner || keystone.urgency >= winner.urgency) winner = keystone;
  }
  return winner;
}

/** Canonical loader — used by both Home and Today so the ONE Thing is identical. */
export async function getOneThing(now: Date = new Date()): Promise<OneThing> {
  const today = todayKey(now);
  const ndb = prisma as unknown as { jointEvent: { findFirst: (a: unknown) => Promise<{ at: Date } | null> } };
  const [todayLog, recent, recovery, nclex, fitness, bf, career] = await Promise.all([
    prisma.dayLog.findUnique({ where: { date: today }, select: { jointClean: true, nclexQuestions: true, gymDone: true, bharatfareDone: true } }).catch(() => null),
    ndb.jointEvent.findFirst({ where: { type: "relapse", at: { gte: new Date(now.getTime() - 48 * 3600000) } } }).catch(() => null),
    getRecoverySuccess(now),
    getNclexCommand(now),
    getFitness(now),
    getBharatfareCeo(now),
    getCareerCommand(now),
  ]);

  return buildOneThing({
    relapsedToday: todayLog ? todayLog.jointClean === false : false,
    recentRelapse48h: !!recent,
    last7SuccessRate: recovery.last7Rate,
    careerRisk: career.riskLevel,
    careerNextAction: career.nextAction,
    nclexExamSet: nclex.examSet,
    nclexOnTrack: nclex.onTrack,
    nclexRequiredPerDay: nclex.requiredPerDay,
    nclexDaysLeft: nclex.daysLeft,
    nclexDoneTodayQ: todayLog?.nclexQuestions ?? 0,
    fitSessions7: fitness.sessions7,
    fitGymTarget: fitness.gymTarget,
    gymDoneToday: todayLog?.gymDone ?? false,
    fitnessNextAction: fitness.nextAction,
    bfHasData: bf.hasData,
    bfWeekLeads: bf.week.leads,
    bfWeekBookings: bf.week.bookings,
    bharatfareDoneToday: todayLog?.bharatfareDone ?? false,
  });
}
