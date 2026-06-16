// ─────────────────────────────────────────────────────────────────────────────
// AmanOS CEO Engine — the cockpit synthesis. Answers three questions every
// morning: Am I winning? What is my biggest problem? What should I do next?
//
// This adds NO new data. It synthesises the existing engines (Discipline,
// Dragon, Recovery, NCLEX, Health, BharatFare) into one executive read.
// Pure functions, no I/O.
// ─────────────────────────────────────────────────────────────────────────────

import { dailyScore, type DayFacts, type DiscTargets } from "@/lib/discipline";

export type Grade = "A" | "B" | "C" | "D" | "F";
export type Trend = "improving" | "stable" | "declining";

export function gradeFromScore(s: number): Grade {
  if (s >= 85) return "A";
  if (s >= 70) return "B";
  if (s >= 55) return "C";
  if (s >= 40) return "D";
  return "F";
}
export const GRADE_COLOR: Record<Grade, string> = { A: "#34f5c5", B: "#a3e635", C: "#fbbf24", D: "#f97316", F: "#fb7185" };
const TREND_META: Record<Trend, { label: string; icon: string; color: string }> = {
  improving: { label: "Improving", icon: "▲", color: "#34f5c5" },
  stable: { label: "Stable", icon: "→", color: "#94a3b8" },
  declining: { label: "Declining", icon: "▼", color: "#fb7185" },
};
export function trendMeta(t: Trend) { return TREND_META[t]; }

const avg = (a: number[]) => (a.length ? a.reduce((s, n) => s + n, 0) / a.length : 0);
function trend(last: number, prior: number, thresh: number): Trend {
  if (last > prior + thresh) return "improving";
  if (last < prior - thresh) return "declining";
  return "stable";
}

export interface CeoInput {
  factsDesc: DayFacts[]; // most-recent-first, calendar days (empty for unlogged), today at [0]
  targets: DiscTargets;
  disciplineToday: number;
  dragon: { health: number; threat: string; threatColor: string };
  recovery: { phaseTitle: string; freedom: number; cleanDays: number };
  nclex: { readinessLabel: string; readinessColor: string; overallAccuracy: number; totalQuestions: number; dailyGoal: number; todayQuestions: number; examDaysLeft: number | null; behindPace: boolean };
  todayCraving: number;
}

export interface CeoWarning { title: string; detail: string; severity: "high" | "medium" }
export interface CeoState {
  grade: Grade;
  gradeColor: string;
  ceoScore: number;
  winning: string;
  status: { discipline: number; dragonThreat: string; dragonThreatColor: string; recoveryPhase: string; nclexReadiness: string; nclexReadinessColor: string; bharatfareMomentum: Trend };
  warning: CeoWarning | null;
  priority: { title: string; detail: string };
  momentum: { key: string; label: string; trend: Trend }[];
  weekly: { totalScore: number; grade: Grade; wins: string[]; losses: string[]; missed: string[]; biggestRisk: string; nextFocus: string };
  history: { label: string; score: number; grade: Grade; hasData: boolean }[];
}

const READINESS_NUM: Record<string, number> = { "Exam-ready zone": 90, "On track": 72, "Building base": 55, "Needs work": 40 };

export function computeCeo(input: CeoInput): CeoState {
  const { factsDesc, targets, disciplineToday, dragon, recovery, nclex, todayCraving } = input;
  const today = factsDesc[0] ?? null;

  const hit = {
    clean: (d: DayFacts) => d.jointClean,
    study: (d: DayFacts) => d.nclexHours > 0 || d.nclexQuestions > 0,
    gym: (d: DayFacts) => d.gymDone,
    protein: (d: DayFacts) => d.proteinG >= targets.proteinTarget,
    sleep: (d: DayFacts) => d.sleepHours >= targets.sleepTarget,
    bf: (d: DayFacts) => d.bharatfareDone,
  };

  const discScore = (d: DayFacts) => dailyScore(d, targets).score;
  const last7 = factsDesc.slice(0, 7);
  const prior7 = factsDesc.slice(7, 14);
  const disciplineAvg7 = Math.round(avg(last7.map(discScore)));
  const disciplinePrior7 = Math.round(avg(prior7.map(discScore)));

  const healthRate = (d: DayFacts) => ((hit.protein(d) ? 1 : 0) + (hit.sleep(d) ? 1 : 0) + (hit.gym(d) ? 1 : 0)) / 3;
  const momentum = [
    { key: "discipline", label: "Discipline", trend: trend(disciplineAvg7, disciplinePrior7, 4) },
    { key: "health", label: "Health", trend: trend(avg(last7.map(healthRate)), avg(prior7.map(healthRate)), 0.08) },
    { key: "recovery", label: "Recovery", trend: trend(avg(last7.map((d) => (hit.clean(d) ? 1 : 0))), avg(prior7.map((d) => (hit.clean(d) ? 1 : 0))), 0.05) },
    { key: "nclex", label: "NCLEX", trend: trend(avg(last7.map((d) => (hit.study(d) ? 1 : 0))), avg(prior7.map((d) => (hit.study(d) ? 1 : 0))), 0.08) },
    { key: "bharatfare", label: "BharatFare", trend: trend(avg(last7.map((d) => (hit.bf(d) ? 1 : 0))), avg(prior7.map((d) => (hit.bf(d) ? 1 : 0))), 0.08) },
  ];
  const bfTrend = momentum.find((m) => m.key === "bharatfare")!.trend;

  // ── Overall grade / CEO score ──
  const readinessNum = READINESS_NUM[nclex.readinessLabel] ?? 50;
  const bfMomentumScore = avg(last7.map((d) => (hit.bf(d) ? 1 : 0))) * 100;
  const ceoScore = Math.round(
    0.35 * disciplineAvg7 + 0.20 * recovery.freedom + 0.20 * readinessNum + 0.15 * (100 - dragon.health) + 0.10 * bfMomentumScore,
  );
  const grade = gradeFromScore(ceoScore);
  const winning = grade === "A" || grade === "B" ? "You're winning. Keep the pressure on." : grade === "C" ? "Holding the line. Tighten up." : "You're slipping. Refocus today.";

  // ── Drift signals (use LOGGED days only to avoid false alarms from unlogged days) ──
  const logged = factsDesc.filter((d) => d.hasData);
  const last3 = logged.slice(0, 3);
  const all3 = (pred: (d: DayFacts) => boolean) => last3.length === 3 && last3.every(pred);
  const noStudy2 = logged.slice(0, 2).length === 2 && logged.slice(0, 2).every((d) => !hit.study(d));
  const relapseToday = !!today && today.hasData && !today.jointClean;
  const disciplineDeclining = momentum[0].trend === "declining";

  // ── Critical warning — single highest priority ──
  const candidates: CeoWarning[] = [];
  if (relapseToday) candidates.push({ title: "Relapse logged today", detail: "Streak reset. Lock in the next clean hour — momentum rebuilds fast.", severity: "high" });
  else if (todayCraving >= 7 && disciplineDeclining) candidates.push({ title: "Relapse risk elevated", detail: "High craving + slipping discipline. Remove triggers, move your body, call your reason for quitting.", severity: "high" });
  if (nclex.behindPace || noStudy2) candidates.push({ title: "NCLEX behind target pace", detail: nclex.examDaysLeft != null ? `${nclex.examDaysLeft} days to exam and pace is short. Questions today, non-negotiable.` : "Two days without study. The exam date won't move — log questions today.", severity: "high" });
  if (all3((d) => d.sleepHours > 0 && d.sleepHours < targets.sleepTarget * 0.8)) candidates.push({ title: "Sleep debt building", detail: "Three short nights. Poor sleep feeds cravings and kills focus — protect tonight.", severity: "medium" });
  if (all3((d) => !hit.gym(d))) candidates.push({ title: "3 days without training", detail: "Health momentum is dropping. Get one session in today, even a short one.", severity: "medium" });
  if (all3((d) => !hit.bf(d)) || (bfTrend === "declining" && logged.slice(0, 3).every((d) => !hit.bf(d)))) candidates.push({ title: "BharatFare momentum falling", detail: "No business task in days. One shipped move compounds — do it today.", severity: "medium" });
  if (all3((d) => d.proteinG < targets.proteinTarget * 0.7)) candidates.push({ title: "Protein slipping", detail: "Three days under target. Muscle and recovery need the fuel.", severity: "medium" });

  const order = ["Relapse logged today", "Relapse risk elevated", "NCLEX behind target pace", "Sleep debt building", "3 days without training", "BharatFare momentum falling", "Protein slipping"];
  candidates.sort((a, b) => order.indexOf(a.title) - order.indexOf(b.title));
  const warning = candidates[0] ?? null;

  // ── Today's Priority — the single biggest bottleneck ──
  const priority = pickPriority({ today, hit, nclex, targets, momentum, relapseToday, noStudy2, all3 });

  // ── Weekly CEO meeting ──
  const weekly = buildWeekly(last7, hit, targets, warning, momentum, discScore);

  // ── History (rolling 7-day blocks) ──
  const history = Array.from({ length: 6 }).map((_, i) => {
    const block = factsDesc.slice(i * 7, i * 7 + 7).filter((d) => d.hasData);
    const score = Math.round(avg(block.map(discScore)));
    return { label: i === 0 ? "This week" : `${i} wk ago`, score, grade: gradeFromScore(score), hasData: block.length > 0 };
  });

  return {
    grade, gradeColor: GRADE_COLOR[grade], ceoScore, winning,
    status: {
      discipline: disciplineToday,
      dragonThreat: dragon.threat, dragonThreatColor: dragon.threatColor,
      recoveryPhase: recovery.phaseTitle,
      nclexReadiness: nclex.readinessLabel, nclexReadinessColor: nclex.readinessColor,
      bharatfareMomentum: bfTrend,
    },
    warning, priority, momentum, weekly, history,
  };
}

function pickPriority(ctx: {
  today: DayFacts | null;
  hit: Record<string, (d: DayFacts) => boolean>;
  nclex: CeoInput["nclex"];
  targets: DiscTargets;
  momentum: { key: string; trend: Trend }[];
  relapseToday: boolean;
  noStudy2: boolean;
  all3: (pred: (d: DayFacts) => boolean) => boolean;
}): { title: string; detail: string } {
  const { today, hit, nclex, targets, momentum, relapseToday, noStudy2, all3 } = ctx;
  const t = today;
  const studiedToday = t ? hit.study(t) : false;
  const trainedToday = t ? hit.gym(t) : false;
  const proteinToday = t ? t.proteinG : 0;
  const bfToday = t ? hit.bf(t) : false;

  if (relapseToday) return { title: "Reclaim today — stay clean", detail: "You slipped. Don't compound it. Remove the trigger, ride the next craving out, and log the day clean from here." };

  if (!studiedToday || nclex.behindPace || noStudy2) {
    const remaining = Math.max(0, nclex.dailyGoal - nclex.todayQuestions);
    return { title: `Complete ${remaining > 0 ? remaining : nclex.dailyGoal} NCLEX questions`, detail: nclex.examDaysLeft != null ? `${nclex.examDaysLeft} days to exam. Review every rationale — accuracy beats volume.` : "Study is your highest-leverage move today. Questions first, rationales second." };
  }
  if (!trainedToday && (all3((d) => !hit.gym(d)) || momentum.find((m) => m.key === "health")?.trend === "declining")) {
    return { title: "Train today — don't skip", detail: "Health momentum needs the session. Move heavy, then hit your protein." };
  }
  if (proteinToday < targets.proteinTarget) {
    return { title: `Hit your protein target`, detail: `${Math.max(0, targets.proteinTarget - proteinToday)}g to go. Muscle, recovery and mood all run on it.` };
  }
  if (!bfToday && all3((d) => !hit.bf(d))) {
    return { title: "Ship one BharatFare task", detail: "Publish content, send outreach, or fix one conversion leak. One move a day compounds." };
  }
  return { title: "Hold the standard", detail: "You're on track. Finish a full check-in, protect your sleep, and keep the streak alive." };
}

function buildWeekly(
  week: DayFacts[],
  hit: Record<string, (d: DayFacts) => boolean>,
  targets: DiscTargets,
  warning: CeoWarning | null,
  momentum: { key: string; label: string; trend: Trend }[],
  discScore: (d: DayFacts) => number,
) {
  const logged = week.filter((d) => d.hasData);
  const n = logged.length;
  const cleanDays = logged.filter(hit.clean).length;
  const gymCount = logged.filter(hit.gym).length;
  const studyCount = logged.filter(hit.study).length;
  const proteinCount = logged.filter(hit.protein).length;
  const bfCount = logged.filter(hit.bf).length;
  const relapses = logged.filter((d) => !hit.clean(d)).length;
  const totalScore = Math.round(n ? logged.reduce((s, d) => s + discScore(d), 0) / n : 0);

  const wins: string[] = [];
  if (n >= 5 && cleanDays === n) wins.push(`Clean every one of ${n} logged days`);
  if (gymCount >= 3) wins.push(`${gymCount} training sessions`);
  if (studyCount >= 5) wins.push(`${studyCount} NCLEX study days`);
  if (proteinCount >= 5) wins.push(`Protein on point (${proteinCount} days)`);
  if (bfCount >= 3) wins.push(`${bfCount} BharatFare tasks shipped`);
  if (wins.length === 0 && n > 0) wins.push(`Showed up and logged ${n} day${n === 1 ? "" : "s"}`);
  if (n === 0) wins.push("Nothing logged — start the record this week");

  const losses: string[] = [];
  if (relapses > 0) losses.push(`Relapsed ${relapses} time${relapses === 1 ? "" : "s"}`);
  if (n > 0 && gymCount < 2) losses.push(`Only ${gymCount} training day${gymCount === 1 ? "" : "s"}`);
  if (n > 0 && studyCount < 3) losses.push(`NCLEX neglected (${studyCount} study days)`);
  if (n > 0 && proteinCount < 3) losses.push("Protein missed most days");
  if (n > 0 && bfCount === 0) losses.push("No BharatFare progress");
  if (losses.length === 0) losses.push("No major failures — keep the standard high");

  const missed: string[] = [];
  const untracked = 7 - n;
  if (untracked > 0) missed.push(`${untracked} day${untracked === 1 ? "" : "s"} went untracked`);
  const cleanNoStudy = logged.filter((d) => hit.clean(d) && !hit.study(d)).length;
  if (cleanNoStudy >= 2) missed.push(`${cleanNoStudy} clean days without NCLEX study — clarity wasted`);
  const gymNoProtein = logged.filter((d) => hit.gym(d) && !hit.protein(d)).length;
  if (gymNoProtein >= 2) missed.push(`${gymNoProtein} training days without hitting protein`);
  if (missed.length === 0) missed.push("Few gaps — execution was tight");

  const weakest = momentum.filter((m) => m.trend === "declining").map((m) => m.label);
  const biggestRisk = warning ? warning.title : weakest.length ? `${weakest[0]} momentum declining` : "No major risk — complacency is the only enemy";
  const nextFocus = weakest.length ? `Rebuild ${weakest[0].toLowerCase()} — make it the non-negotiable for 7 days` : studyCount < 5 ? "Raise NCLEX volume toward daily study" : "Protect the streak and grow study volume";

  return { totalScore, grade: gradeFromScore(totalScore), wins, losses, missed, biggestRisk, nextFocus };
}
