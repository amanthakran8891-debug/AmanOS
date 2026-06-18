// ─────────────────────────────────────────────────────────────────────────────
// AmanOS — Craving Prediction Engine (Phase 2, #1, highest priority).
//
// Turns real recovery history into "Today's Risk Forecast": a 0–100 risk score,
// a 🟢/🟡/🔴 level, the most dangerous time window, and the reasons it fired.
// Pure — the data loader passes rows in. Built on the shared engine/risk
// primitive so risk scoring is never duplicated.
//
// Self-calibrating: data-driven factors (dangerous window, risky weekday) only
// fire once enough events exist, and `confidence` rises as history accumulates,
// so the forecast genuinely gets more accurate over time.
// ─────────────────────────────────────────────────────────────────────────────

import { riskScore, type RiskFactor } from "@/lib/engine/risk";

export type RiskBand = "Low" | "Medium" | "High";

export interface DangerWindow {
  startHour: number; // 0..23
  endHour: number;   // exclusive end, 0..24
  label: string;     // "10:00 PM – 12:00 AM"
  count: number;     // events that fed it
}

export interface RiskConfidence {
  pct: number;          // 0..100
  level: "learning" | "building" | "calibrated";
  events: number;       // total relapse + craving events seen
  note: string;
}

export interface NextBestMove {
  action: string;
  reason: string;
}

export interface RiskForecast {
  band: RiskBand;
  emoji: string;        // 🟢 🟡 🔴
  color: string;
  score: number;        // 0..100
  window: DangerWindow | null;
  reasons: string[];    // why risk is elevated
  protective: string[]; // what is lowering risk today
  suggestions: string[];
  nextBestMove: NextBestMove | null; // the single highest-leverage action right now
  confidence: RiskConfidence;
  factors: RiskFactor[];
}

export interface PredictionEvent { at: Date | string }

export interface PredictionInput {
  now?: Date;
  streakDays: number;
  today: {
    jointClean: boolean;
    gymDone: boolean;
    sleepHours: number;
    proteinG: number;
    nclexHours: number;
    bharatfareDone: boolean;
    spiritualDone: boolean;
  };
  targets: { proteinTarget: number; sleepTarget: number; nclexHoursTarget: number };
  /** Past relapse moments (JointEvent type=relapse + lost cravings). */
  relapses: PredictionEvent[];
  /** Every craving logged (won + lost) — for window + trend analysis. */
  cravings: PredictionEvent[];
  /** Recent daily rows (last ~30) for streak-context factors. */
  recentDays?: { date: string; jointClean: boolean }[];
}

const DOW_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function hour12(h: number): string {
  const am = h < 12 || h === 24;
  const base = h % 12 === 0 ? 12 : h % 12;
  return `${base}:00 ${am ? "AM" : "PM"}`;
}

function fmtWindow(start: number, end: number): string {
  return `${hour12(start)} – ${hour12(end % 24 === 0 ? 24 : end)}`;
}

/** Peak 2-hour window from an hour histogram (relapses weighted 2x cravings). */
function dangerWindow(relapseHours: number[], cravingHours: number[], minEvents: number): DangerWindow | null {
  const hist = Array(24).fill(0);
  for (const h of relapseHours) hist[h] += 2;
  for (const h of cravingHours) hist[h] += 1;
  const totalWeighted = hist.reduce((s, n) => s + n, 0);
  if (totalWeighted < minEvents) return null;
  let bestStart = 0, best = -1;
  for (let s = 0; s < 24; s++) {
    const score = hist[s] + hist[(s + 1) % 24];
    if (score > best) { best = score; bestStart = s; }
  }
  if (best <= 0) return null;
  const rawCount = relapseHours.filter((h) => h === bestStart || h === (bestStart + 1) % 24).length
    + cravingHours.filter((h) => h === bestStart || h === (bestStart + 1) % 24).length;
  return { startHour: bestStart, endHour: bestStart + 2, label: fmtWindow(bestStart, bestStart + 2), count: rawCount };
}

function hoursOf(events: PredictionEvent[]): number[] {
  return events.map((e) => new Date(e.at).getHours());
}
function dowOf(events: PredictionEvent[]): number[] {
  return events.map((e) => new Date(e.at).getDay());
}

export function predictRisk(input: PredictionInput): RiskForecast {
  const now = input.now ?? new Date();
  const nowHour = now.getHours();
  const nowDow = now.getDay();
  const t = input.today;

  const relapseHours = hoursOf(input.relapses);
  const cravingHours = hoursOf(input.cravings);
  const totalEvents = input.relapses.length + input.cravings.length;

  // Confidence rises with data — fewer than 5 events is "learning".
  const confidence: RiskConfidence =
    totalEvents >= 25
      ? { pct: 95, level: "calibrated", events: totalEvents, note: "Calibrated on your history." }
      : totalEvents >= 8
        ? { pct: 60, level: "building", events: totalEvents, note: "Accuracy improving as you log." }
        : { pct: 25, level: "learning", events: totalEvents, note: "Still learning your patterns — log cravings to sharpen this." };

  // Data-driven window needs a minimum of events before it's trusted.
  const window = dangerWindow(relapseHours, cravingHours, 4);
  const inWindow = !!window && (nowHour === window.startHour || nowHour === (window.startHour + 1) % 24);
  const approachingWindow = !!window && !inWindow && ((window.startHour - nowHour + 24) % 24 <= 2);

  // Risky weekday — only if relapses meaningfully cluster on this DOW.
  const relapseDow = dowOf(input.relapses);
  const dowCount = relapseDow.filter((d) => d === nowDow).length;
  const riskyWeekday = input.relapses.length >= 6 && dowCount >= 2 && dowCount / input.relapses.length >= 0.25;

  // Craving trend — last 7 days vs prior 7.
  const nowMs = now.getTime();
  let last7 = 0, prev7 = 0;
  for (const c of input.cravings) {
    const age = (nowMs - new Date(c.at).getTime()) / 86400000;
    if (age <= 7) last7++; else if (age <= 14) prev7++;
  }
  const risingCravings = last7 > prev7 && last7 >= 2;
  const recentRelapse = input.relapses.some((r) => (nowMs - new Date(r.at).getTime()) / 86400000 <= 7);

  const proteinHit = t.proteinG >= Math.max(1, input.targets.proteinTarget);
  const nclexHit = t.nclexHours >= Math.max(0.1, input.targets.nclexHoursTarget);
  const poorSleep = t.sleepHours > 0 && t.sleepHours < 6;
  const noSleepData = t.sleepHours === 0;

  const factors: RiskFactor[] = [
    { key: "window-now", label: "Inside your danger window", weight: 22, active: inWindow,
      detail: window ? `Right now is inside your most dangerous window (${window.label})` : "", suggestion: "Leave the trigger environment for the next 2 hours." },
    { key: "window-soon", label: "Danger window approaching", weight: 10, active: approachingWindow,
      detail: window ? `Your danger window (${window.label}) starts soon` : "", suggestion: "Pre-empt it: plan the next 2 hours now." },
    { key: "poor-sleep", label: "Poor sleep (<6h)", weight: 16, active: poorSleep,
      detail: `Poor sleep last night (${t.sleepHours}h) — willpower runs low`, suggestion: "Protect tonight's sleep; nap if you can." },
    { key: "no-gym", label: "No gym today", weight: 13, active: !t.gymDone,
      detail: "No gym yet — your strongest dragon-damage habit is unused", suggestion: "Train before evening — gym deals 2× damage." },
    { key: "no-nclex", label: "No study today", weight: 8, active: !nclexHit,
      detail: "NCLEX target not met — an idle, unstructured day raises risk", suggestion: "Do one focused study block." },
    { key: "early-streak", label: "Fragile early streak", weight: 14, active: input.streakDays < 3,
      detail: `Only ${input.streakDays}d clean — the early window is the most fragile`, suggestion: "Just win today. Don't negotiate." },
    { key: "recent-relapse", label: "Recent relapse", weight: 10, active: recentRelapse && input.streakDays >= 3,
      detail: "A relapse in the last 7 days — vulnerability lingers", suggestion: "Rebuild routine; avoid known triggers." },
    { key: "risky-weekday", label: `Risky day (${DOW_NAMES[nowDow]})`, weight: 11, active: riskyWeekday,
      detail: `Past relapses cluster on ${DOW_NAMES[nowDow]}s`, suggestion: "Add structure to today specifically." },
    { key: "rising-cravings", label: "Cravings trending up", weight: 8, active: risingCravings,
      detail: "Cravings are up vs last week", suggestion: "Use Dragon Attack Mode early, not late." },
    { key: "no-protein", label: "Protein target missed", weight: 5, active: !proteinHit,
      detail: "Protein low — physical depletion nudges cravings", suggestion: "Hit your protein target." },
    { key: "no-spiritual", label: "No spiritual practice", weight: 5, active: !t.spiritualDone,
      detail: "No Gita/spiritual time — it measurably lowers craving strength", suggestion: "Read one verse." },
    { key: "no-data-sleep", label: "Sleep not logged", weight: 3, active: noSleepData,
      detail: "Sleep not logged — blind spot in the forecast", suggestion: "Log sleep to improve accuracy." },
  ];

  const result = riskScore(factors);

  // Protective factors actually completed today.
  const protective: string[] = [];
  if (t.gymDone) protective.push("Gym done — dragon took 2× damage");
  if (nclexHit) protective.push("Study target hit — mind occupied");
  if (proteinHit) protective.push("Protein target hit");
  if (t.spiritualDone) protective.push("Spiritual practice done");
  if (input.streakDays >= 7) protective.push(`${input.streakDays}d streak — momentum on your side`);
  if (t.sleepHours >= 7) protective.push("Well rested");

  // Next best move — the single highest-leverage habit still missing today,
  // in impact order: gym → study → protein → spiritual.
  let nextBestMove: NextBestMove | null;
  if (!t.gymDone) nextBestMove = { action: "Complete gym now", reason: "it reduces today's risk most — 2× dragon damage" };
  else if (!nclexHit) nextBestMove = { action: "Do one NCLEX study block", reason: "an occupied mind resists cravings" };
  else if (!proteinHit) nextBestMove = { action: "Hit your protein target", reason: "physical depletion fuels cravings" };
  else if (!t.spiritualDone) nextBestMove = { action: "Read one Gita verse", reason: "it lowers craving strength" };
  else nextBestMove = { action: "Protect the evening", reason: "high-impact habits already done — hold the line tonight" };

  // 3-band display mapping.
  const band: RiskBand = result.score >= 60 ? "High" : result.score >= 30 ? "Medium" : "Low";
  const emoji = band === "High" ? "🔴" : band === "Medium" ? "🟡" : "🟢";
  const color = band === "High" ? "#fb7185" : band === "Medium" ? "#fbbf24" : "#34d399";

  return {
    band,
    emoji,
    color,
    score: result.score,
    window,
    reasons: result.reasons,
    protective,
    suggestions: result.suggestions,
    nextBestMove,
    confidence,
    factors,
  };
}
