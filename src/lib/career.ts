// AmanOS — Phase 2, item 3: Career Command Center (v0, no DB).
// Pure: derives risk level, a 0–100 progress score, application funnel counts,
// and a single next action from the manual data file.
import {
  CAREER_STATUS, JOB_APPLICATIONS,
  type CareerStatus, type JobApplication,
} from "@/data/career";

export type RiskLevel = "Low" | "Elevated" | "High" | "Critical";
export type CareerBand = "At Risk" | "Stabilising" | "On Track" | "Secure";

export interface CareerCommand {
  status: CareerStatus;
  riskLevel: RiskLevel;
  progressScore: number; // 0..100
  band: CareerBand;
  scoreBreakdown: { registration: number; revalidation: number; investigation: number; jobSearch: number };
  funnel: { total: number; applied: number; interview: number; offer: number; rejected: number; active: number };
  applications: JobApplication[]; // sorted, newest first
  nextAction: string;
  daysToRevalidation: number | null;
  daysToSuspensionReview: number | null;
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

function daysUntil(dateStr: string | undefined, now: Date): number | null {
  if (!dateStr) return null;
  const t = new Date(dateStr + "T00:00:00").getTime();
  if (isNaN(t)) return null;
  return Math.ceil((t - now.getTime()) / 86400000);
}

function riskOf(s: CareerStatus): RiskLevel {
  if (s.nmcStatus === "suspended" || s.nmcStatus === "removed" || s.nhsInvestigationStatus === "suspended") return "Critical";
  if (s.nhsInvestigationStatus === "ongoing" || s.revalidationStatus === "overdue") return "High";
  if (s.nmcStatus === "conditions" || s.revalidationStatus === "due-soon" || !!s.suspensionReviewDate) return "Elevated";
  return "Low";
}

// ── Score components (0..100 each) ────────────────────────────────────────────
const REGISTRATION_SCORE: Record<CareerStatus["nmcStatus"], number> = {
  registered: 100, conditions: 60, lapsed: 30, suspended: 10, removed: 0,
};
const REVALIDATION_SCORE: Record<CareerStatus["revalidationStatus"], number> = {
  "up-to-date": 100, "due-soon": 60, overdue: 20,
};
const INVESTIGATION_SCORE: Record<CareerStatus["nhsInvestigationStatus"], number> = {
  none: 100, resolved: 90, ongoing: 40, suspended: 0,
};

function jobSearchScore(funnel: CareerCommand["funnel"]): number {
  // Reward momentum, weighted toward later stages. ~caps quickly so a steady
  // pipeline scores well without needing dozens of applications.
  const raw = funnel.applied * 5 + funnel.interview * 20 + funnel.offer * 50;
  return clamp(raw);
}

function nextActionOf(c: { status: CareerStatus; risk: RiskLevel; funnel: CareerCommand["funnel"]; dRev: number | null; dRev0: number | null; dSusp: number | null }): string {
  const { status, funnel, dSusp, dRev } = c;
  if (status.nhsInvestigationStatus === "suspended" || status.nmcStatus === "suspended") {
    return dSusp != null ? `Prepare for your review/hearing (${dSusp} day${dSusp === 1 ? "" : "s"} away).` : "Engage your union/representative on the suspension immediately.";
  }
  if (status.nhsInvestigationStatus === "ongoing") return "Respond to the NHS investigation — document everything and involve your union.";
  if (status.revalidationStatus === "overdue") return "Revalidation is overdue — submit it now to protect your NMC registration.";
  if (status.revalidationStatus === "due-soon") return dRev != null ? `Submit revalidation before it's due (${dRev} day${dRev === 1 ? "" : "s"} left).` : "Submit your revalidation soon.";
  if (funnel.offer > 0) return "Review and respond to your offer(s).";
  if (funnel.interview > 0) return "Prepare for your upcoming interview(s).";
  if (funnel.active < 3) return "Send more applications — aim for at least 3 active in the pipeline.";
  return "Hold steady: keep registration current and the pipeline moving.";
}

export function buildCareerCommand(status: CareerStatus = CAREER_STATUS, applications: JobApplication[] = JOB_APPLICATIONS, now: Date = new Date()): CareerCommand {
  const apps = [...applications].sort((a, b) => (a.dateSent < b.dateSent ? 1 : -1));
  const count = (s: JobApplication["stage"]) => apps.filter((a) => a.stage === s).length;
  const funnel = {
    total: apps.length,
    applied: count("applied"),
    interview: count("interview"),
    offer: count("offer"),
    rejected: count("rejected"),
    active: apps.filter((a) => a.stage !== "rejected").length,
  };

  const riskLevel = riskOf(status);
  const registration = REGISTRATION_SCORE[status.nmcStatus];
  const revalidation = REVALIDATION_SCORE[status.revalidationStatus];
  const investigation = INVESTIGATION_SCORE[status.nhsInvestigationStatus];
  const jobSearch = jobSearchScore(funnel);
  const progressScore = Math.round(0.35 * registration + 0.20 * revalidation + 0.20 * investigation + 0.25 * jobSearch);
  const band: CareerBand = progressScore >= 85 ? "Secure" : progressScore >= 65 ? "On Track" : progressScore >= 40 ? "Stabilising" : "At Risk";

  const daysToRevalidation = daysUntil(status.revalidationDate, now);
  const daysToSuspensionReview = daysUntil(status.suspensionReviewDate, now);
  const nextAction = nextActionOf({ status, risk: riskLevel, funnel, dRev: daysToRevalidation, dRev0: daysToRevalidation, dSusp: daysToSuspensionReview });

  return {
    status,
    riskLevel,
    progressScore,
    band,
    scoreBreakdown: { registration, revalidation, investigation, jobSearch },
    funnel,
    applications: apps,
    nextAction,
    daysToRevalidation,
    daysToSuspensionReview,
  };
}

export async function getCareerCommand(now: Date = new Date()): Promise<CareerCommand> {
  return buildCareerCommand(CAREER_STATUS, JOB_APPLICATIONS, now);
}
