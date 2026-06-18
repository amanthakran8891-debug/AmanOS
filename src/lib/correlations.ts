// AmanOS — LIFE CORRELATION ENGINE.
// Discovers patterns across every life signal and turns them into correlation
// cards, risk-pattern detection, a Recovery-AI relapse forecast and a plain-
// English insight feed. All maths comes from the shared engines — this layer
// only assembles signals and labels them. Designed so Nicotine, Nursing, Finance
// and the Global Dashboard consume the SAME signal maps and helpers.

import prisma from "@/lib/db";
import { todayKey, addDaysKey } from "@/lib/dates";
import { correlateDaily, conditionalLift, strength } from "@/lib/engine/correlate";
import { riskScore, type RiskFactor, type RiskResult } from "@/lib/engine/risk";
import { cravingAnalytics, type CravingRow } from "@/lib/cravings";

const DAY = 86400000;
const WEED = new Set(["weed", "cannabis", "joint"]);
const NIC = new Set(["cigarettes", "cigarette", "nicotine", "vape", "pouches", "cigar"]);
const MIN_POINTS = 5; // below this a relationship is not shown

// ── daily signal maps ─────────────────────────────────────────────────────────
export interface LifeSignals {
  dates: string[];
  daysLogged: number;
  // numeric (date → value)
  sleep: Record<string, number>;
  cravingIntensity: Record<string, number>;
  cravingCount: Record<string, number>;
  spend: Record<string, number>;
  weedSpend: Record<string, number>;
  nicotineSpend: Record<string, number>;
  lifeScore: Record<string, number>;
  nclexHours: Record<string, number>;
  steps: Record<string, number>;
  mood: Record<string, number>;
  anxiety: Record<string, number>;
  relapseNum: Record<string, number>; // 1 on relapse days, else 0
  cleanIndex: Record<string, number>; // running clean-day count at that date
  // boolean flags
  gym: Record<string, boolean>;
  bharatfare: Record<string, boolean>;
  relapse: Record<string, boolean>;
  offDay: Record<string, boolean>;
  lowSleep: Record<string, boolean>;
  highSpend: Record<string, boolean>;
  highCraving: Record<string, boolean>;
}

const add = (m: Record<string, number>, k: string, v: number) => { if (k) m[k] = (m[k] ?? 0) + v; };
const median = (xs: number[]) => { if (!xs.length) return 0; const s = [...xs].sort((a, b) => a - b); const i = Math.floor(s.length / 2); return s.length % 2 ? s[i] : (s[i - 1] + s[i]) / 2; };

/** Load every life signal into date-aligned maps. Reused by Nicotine/Nursing. */
export async function loadLifeSignals(windowDays = 120): Promise<LifeSignals> {
  const sinceMs = Date.now() - windowDays * DAY;
  const sinceKey = todayKey(new Date(sinceMs));

  const [dayLogs, symptoms, cravings, joints, txns, expenses, settings] = await Promise.all([
    prisma.dayLog.findMany({ where: { date: { gte: sinceKey } } }),
    prisma.symptomLog.findMany({ where: { date: { gte: sinceKey } } }),
    prisma.craving.findMany({ where: { at: { gte: new Date(sinceMs) } } }),
    prisma.jointEvent.findMany({ where: { at: { gte: new Date(sinceMs) } } }),
    prisma.transaction.findMany({ where: { date: { gte: sinceKey }, kind: "expense" } }).catch(() => []),
    prisma.expense.findMany({ where: { date: { gte: sinceKey } } }).catch(() => []),
    prisma.settings.findUnique({ where: { id: 1 } }).catch(() => null),
  ]);

  const s: LifeSignals = {
    dates: [], daysLogged: 0,
    sleep: {}, cravingIntensity: {}, cravingCount: {}, spend: {}, weedSpend: {}, nicotineSpend: {},
    lifeScore: {}, nclexHours: {}, steps: {}, mood: {}, anxiety: {}, relapseNum: {}, cleanIndex: {},
    gym: {}, bharatfare: {}, relapse: {}, offDay: {}, lowSleep: {}, highSpend: {}, highCraving: {},
  };
  const allDates = new Set<string>();

  for (const d of dayLogs) {
    allDates.add(d.date);
    if (d.sleepHours > 0) s.sleep[d.date] = d.sleepHours;
    if (d.steps > 0) s.steps[d.date] = d.steps;
    if (d.nclexHours > 0) s.nclexHours[d.date] = d.nclexHours;
    s.lifeScore[d.date] = d.lifeScore;
    s.gym[d.date] = d.gymDone;
    s.bharatfare[d.date] = d.bharatfareDone;
    if (d.jointClean === false) { s.relapse[d.date] = true; s.relapseNum[d.date] = 1; }
    s.offDay[d.date] = !d.gymDone && !d.bharatfareDone && (d.nclexHours ?? 0) === 0;
  }
  for (const sy of symptoms) {
    allDates.add(sy.date);
    if (sy.mood > 0) s.mood[sy.date] = sy.mood;
    if (sy.anxiety > 0) s.anxiety[sy.date] = sy.anxiety;
    if (sy.sleep > 0 && !(sy.date in s.sleep)) s.sleep[sy.date] = sy.sleep; // symptom-sleep fallback
    if (sy.cravings > 0 && !(sy.date in s.cravingIntensity)) s.cravingIntensity[sy.date] = sy.cravings;
  }
  // Actual cravings override symptom-derived intensity (richer).
  const cravingByDay = new Map<string, number[]>();
  for (const c of cravings) {
    const k = todayKey(c.at);
    allDates.add(k);
    add(s.cravingCount, k, 1);
    const arr = cravingByDay.get(k) ?? []; arr.push(c.intensity); cravingByDay.set(k, arr);
    if (c.outcome === "lost") { s.relapse[k] = true; s.relapseNum[k] = 1; }
  }
  for (const [k, arr] of cravingByDay) s.cravingIntensity[k] = Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
  for (const j of joints) {
    const k = todayKey(j.at);
    allDates.add(k);
    if (j.type === "relapse") { s.relapse[k] = true; s.relapseNum[k] = 1; }
    if (j.type === "craving") add(s.cravingCount, k, 1);
  }
  for (const t of txns) { allDates.add(t.date); add(s.spend, t.date, t.amount); if (WEED.has(t.category)) add(s.weedSpend, t.date, t.amount); if (NIC.has(t.category)) add(s.nicotineSpend, t.date, t.amount); }
  for (const e of expenses) { allDates.add(e.date); add(s.spend, e.date, e.amount); if (WEED.has(e.category)) add(s.weedSpend, e.date, e.amount); if (NIC.has(e.category)) add(s.nicotineSpend, e.date, e.amount); }

  // Fill relapseNum 0 for logged days without relapse (so conditionalLift on rate works).
  for (const d of allDates) if (!(d in s.relapseNum)) s.relapseNum[d] = 0;

  // Flags derived from distributions.
  for (const [d, v] of Object.entries(s.sleep)) if (v > 0 && v < 6) s.lowSleep[d] = true;
  const spendVals = Object.values(s.spend).filter((v) => v > 0);
  const spendMed = median(spendVals);
  for (const [d, v] of Object.entries(s.spend)) s.highSpend[d] = v > spendMed && spendMed > 0;
  const cravingVals = Object.values(s.cravingIntensity);
  const cravingMed = median(cravingVals);
  for (const [d, v] of Object.entries(s.cravingIntensity)) s.highCraving[d] = v >= Math.max(5, cravingMed);

  // Running clean-day index (resets on relapse) over the sorted window.
  s.dates = [...allDates].sort();
  let run = 0;
  for (const d of s.dates) { if (s.relapse[d]) run = 0; else run += 1; s.cleanIndex[d] = run; }
  s.daysLogged = s.dates.length;
  return s;
}

// ── correlation cards ─────────────────────────────────────────────────────────
export type Direction = "positive" | "negative" | "none";
export type Confidence = "low" | "medium" | "high";
export interface CorrelationCard {
  id: string;
  name: string;
  r: number;
  n: number;
  strength: string;
  direction: Direction;
  confidence: Confidence;
  pct: number | null;     // conditional-lift % change, when flag-based
  explanation: string;
  enough: boolean;
}

function confidenceOf(r: number, n: number): Confidence {
  const a = Math.abs(r);
  if (n >= 20 && a >= 0.4) return "high";
  if (n >= 10 && a >= 0.25) return "medium";
  return "low";
}
const dirOf = (r: number): Direction => (Math.abs(r) < 0.2 ? "none" : r > 0 ? "positive" : "negative");

/** Numeric ↔ numeric correlation card. */
export function numericCard(id: string, name: string, a: Record<string, number>, b: Record<string, number>, explain: (r: number, n: number) => string): CorrelationCard {
  const { r, n } = correlateDaily(a, b);
  return { id, name, r: Math.round(r * 100) / 100, n, strength: strength(r), direction: dirOf(r), confidence: confidenceOf(r, n), pct: null, explanation: explain(r, n), enough: n >= MIN_POINTS && Math.abs(r) >= 0.2 };
}

/** Boolean-flag ↔ numeric-metric card ("on X days, Y is N% higher/lower"). */
export function flagCard(id: string, name: string, flag: Record<string, boolean>, metric: Record<string, number>, explain: (lift: ReturnType<typeof conditionalLift>) => string): CorrelationCard {
  const lift = conditionalLift(flag, metric);
  const n = lift.nOn + lift.nOff;
  // r between the 0/1 flag and the metric, on metric days.
  const flagNum: Record<string, number> = {};
  for (const d of Object.keys(metric)) flagNum[d] = flag[d] ? 1 : 0;
  const { r } = correlateDaily(flagNum, metric);
  return { id, name, r: Math.round(r * 100) / 100, n, strength: strength(r), direction: dirOf(r), confidence: confidenceOf(r, n), pct: lift.pct, explanation: explain(lift), enough: lift.nOn >= 3 && lift.nOff >= 3 };
}

export function buildCards(s: LifeSignals): CorrelationCard[] {
  const cards: CorrelationCard[] = [
    flagCard("sleep-craving", "Sleep vs cravings", s.lowSleep, s.cravingIntensity,
      (l) => l.pct >= 0 ? `On days you sleep under 6 hours, craving intensity is ${l.pct}% higher (${l.onAvg} vs ${l.offAvg}).` : `Low-sleep days actually show ${Math.abs(l.pct)}% lower cravings here — keep watching.`),
    flagCard("sleep-relapse", "Sleep debt vs relapse", s.lowSleep, s.relapseNum,
      (l) => `Low-sleep days carry a ${l.onAvg > l.offAvg ? "higher" : "lower"} relapse rate (${Math.round(l.onAvg * 100)}% vs ${Math.round(l.offAvg * 100)}%).`),
    numericCard("craving-spend", "Cravings vs spending", s.cravingIntensity, s.spend,
      (r) => r > 0 ? `Higher-craving days line up with more spending (r=${r.toFixed(2)}).` : `Cravings and spending move in opposite directions here (r=${r.toFixed(2)}).`),
    numericCard("weed-discipline", "Weed spend vs discipline", s.weedSpend, s.lifeScore,
      (r) => r < 0 ? `More weed spending tracks with a lower life score (r=${r.toFixed(2)}).` : `Weed spend and discipline aren't clearly linked yet (r=${r.toFixed(2)}).`),
    flagCard("gym-craving", "Gym vs cravings", s.gym, s.cravingIntensity,
      (l) => l.pct <= 0 ? `On gym days, cravings are ${Math.abs(l.pct)}% lower (${l.onAvg} vs ${l.offAvg}).` : `Gym days show ${l.pct}% higher cravings here — unusual; keep logging.`),
    numericCard("nclex-life", "NCLEX study vs life score", s.nclexHours, s.lifeScore,
      (r) => r > 0 ? `More NCLEX study tracks with a higher life score (r=${r.toFixed(2)}).` : `Study hours and life score aren't linked yet (r=${r.toFixed(2)}).`),
    flagCard("spend-relapse", "Finance stress vs relapse", s.highSpend, s.relapseNum,
      (l) => `High-spend days carry a ${l.onAvg > l.offAvg ? "higher" : "lower"} relapse rate (${Math.round(l.onAvg * 100)}% vs ${Math.round(l.offAvg * 100)}%).`),
    flagCard("offday-craving", "Off days vs cravings", s.offDay, s.cravingIntensity,
      (l) => l.pct >= 0 ? `On off days (no gym, study or BharatFare), cravings run ${l.pct}% higher.` : `Off days show ${Math.abs(l.pct)}% lower cravings here.`),
    flagCard("bharatfare-mood", "BharatFare work vs mood", s.bharatfare, s.mood,
      (l) => l.pct >= 0 ? `On days you work on BharatFare, mood is ${l.pct}% higher (${l.onAvg} vs ${l.offAvg}).` : `BharatFare days show ${Math.abs(l.pct)}% lower mood — watch for overwork.`),
    numericCard("clean-discipline", "Clean streak vs discipline", s.cleanIndex, s.lifeScore,
      (r) => r > 0 ? `Longer clean streaks track with a higher life score (r=${r.toFixed(2)}).` : `Clean streak and discipline aren't linked yet (r=${r.toFixed(2)}).`),
  ];
  return cards;
}

// ── Recovery-AI relapse risk (cannabis) ───────────────────────────────────────
export function cannabisRisk(s: LifeSignals, horizon: "today" | "tomorrow"): RiskResult {
  const today = todayKey();
  const y = addDaysKey(today, -1);
  const num = (m: Record<string, number>, k: string) => m[k];
  const sleepRef = num(s.sleep, today) ?? num(s.sleep, y);
  const relapseRecent = !!(s.relapse[today] || s.relapse[y]);
  const gymRecent = !!(s.gym[today] || s.gym[y]);
  const highSpendY = !!s.highSpend[y];
  const cravingRecent = Math.max(s.cravingIntensity[today] ?? 0, s.cravingIntensity[y] ?? 0);
  const life = num(s.lifeScore, today) ?? num(s.lifeScore, y) ?? 100;
  const anxiety = num(s.anxiety, today) ?? num(s.anxiety, y) ?? 0;
  const t = horizon === "tomorrow";

  const factors: RiskFactor[] = [
    { key: "relapse48", label: "Relapse in last 48h", weight: t ? 22 : 30, active: relapseRecent, detail: "A recent slip is the strongest predictor of the next one", suggestion: "Re-set your intention now, tell someone, and remove access tonight." },
    { key: "lowsleep", label: "Sleep debt (<6h)", weight: 18, active: sleepRef !== undefined && sleepRef > 0 && sleepRef < 6, detail: "Poor sleep — cravings spike on low sleep", suggestion: "Protect tonight's sleep; no screens after midnight." },
    { key: "nogym", label: "No gym in 48h", weight: 14, active: !gymRecent, detail: "No training logged recently", suggestion: "Train today — gym days measurably lower your cravings." },
    { key: "highspend", label: "High spending yesterday", weight: 10, active: highSpendY, detail: "Spending spiked yesterday", suggestion: "Pause non-essential purchases; money stress feeds the urge." },
    { key: "craving", label: "Strong recent cravings", weight: t ? 8 : 16, active: cravingRecent >= 7, detail: `Recent craving intensity ${cravingRecent}/10`, suggestion: "Use the 15-minute rule and log every craving." },
    { key: "lowdisc", label: "Low discipline score", weight: 12, active: life < 50, detail: `Life score ${Math.round(life)}/100`, suggestion: "Win one keystone habit early — water, protein, a walk." },
    { key: "stress", label: "High stress/anxiety", weight: 10, active: anxiety >= 6, detail: `Anxiety ${anxiety}/10`, suggestion: "Breathwork or a walk before your danger window." },
  ];
  return riskScore(factors);
}

// ── risk-pattern detection (descriptive) ──────────────────────────────────────
export interface RiskPattern { key: string; title: string; detail: string; severity: "info" | "warn" | "danger" }
export function detectPatterns(s: LifeSignals, cravingA: ReturnType<typeof cravingAnalytics>): RiskPattern[] {
  const out: RiskPattern[] = [];
  if (cravingA.won + cravingA.lost > 0) {
    out.push({ key: "hour", title: "Most dangerous hour", detail: `Cravings peak around ${cravingA.mostDangerousHour}.`, severity: "warn" });
    out.push({ key: "day", title: "Most dangerous day", detail: `${cravingA.mostDangerousDay} is your highest-craving day.`, severity: "warn" });
  }
  const lowSleepDays = Object.keys(s.lowSleep).length;
  if (lowSleepDays >= 3) out.push({ key: "sleepdebt", title: "Sleep-debt pattern", detail: `${lowSleepDays} nights under 6h in this window — a known craving amplifier.`, severity: "danger" });
  const noGym = Object.values(s.gym).filter((g) => !g).length;
  const gymDays = Object.values(s.gym).length;
  if (gymDays >= 5 && noGym / gymDays > 0.6) out.push({ key: "nogym", title: "No-gym danger pattern", detail: `Gym logged on only ${gymDays - noGym}/${gymDays} days — training suppresses cravings.`, severity: "warn" });
  const highSpendDays = Object.values(s.highSpend).filter(Boolean).length;
  if (highSpendDays >= 3) out.push({ key: "highspend", title: "High-spend days", detail: `${highSpendDays} above-median spending days — watch the spend→relapse link.`, severity: "info" });
  const relapses = Object.values(s.relapse).filter(Boolean).length;
  if (relapses > 0) out.push({ key: "relapse", title: "Relapse-prone window", detail: `${relapses} relapse signal(s) in this window. Risk compounds for ~48h after each.`, severity: "danger" });
  return out;
}

// ── unified insight feed ──────────────────────────────────────────────────────
export function buildInsights(cards: CorrelationCard[], s: LifeSignals, cravingA: ReturnType<typeof cravingAnalytics>): string[] {
  const out: string[] = [];
  if (cravingA.won + cravingA.lost >= 5) out.push(`Your strongest craving window is around ${cravingA.mostDangerousHour}.`);
  for (const c of cards) {
    if (!c.enough) continue;
    if (c.id === "gym-craving" && c.pct !== null && c.pct < 0) out.push(`Gym days have ${Math.abs(c.pct)}% lower cravings.`);
    if (c.id === "sleep-craving" && c.pct !== null && c.pct > 0) out.push(`Low sleep predicts ${c.pct}% higher cravings.`);
    if (c.id === "craving-spend" && c.direction === "positive") out.push("Spending rises on high-craving days.");
    if (c.id === "spend-relapse" && c.r > 0.2) out.push("High-spend days precede more relapse signals.");
    if (c.id === "bharatfare-mood" && c.pct !== null && c.pct > 0) out.push(`BharatFare work days lift your mood by ${c.pct}%.`);
    if (c.id === "clean-discipline" && c.direction === "positive") out.push("Longer clean streaks track with higher discipline.");
    if (c.id === "nclex-life" && c.direction === "positive") out.push("Study days raise your life score.");
  }
  return out.slice(0, 8);
}

// ── graph series ──────────────────────────────────────────────────────────────
export interface CorrelationGraphs {
  sleepVsCraving: { sleep: number; craving: number }[];
  spendVsCraving: { spend: number; craving: number }[];
  cravingByDow: { day: string; avg: number }[];
  riskTrend: { date: string; risk: number }[];
  disciplineVsClean: { clean: number; discipline: number }[];
}
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function dailyRiskProxy(s: LifeSignals, d: string): number {
  let r = 0;
  if (s.relapse[d]) r += 30;
  if (s.lowSleep[d]) r += 18;
  if (s.gym[d] === false) r += 12;
  if (s.highSpend[d]) r += 10;
  r += Math.min(30, (s.cravingIntensity[d] ?? 0) * 3);
  if ((s.lifeScore[d] ?? 100) < 50) r += 12;
  return Math.min(100, r);
}
export function buildGraphs(s: LifeSignals): CorrelationGraphs {
  const sleepVsCraving = Object.keys(s.cravingIntensity).filter((d) => d in s.sleep).map((d) => ({ sleep: s.sleep[d], craving: s.cravingIntensity[d] }));
  const spendVsCraving = Object.keys(s.cravingIntensity).filter((d) => d in s.spend).map((d) => ({ spend: Math.round(s.spend[d]), craving: s.cravingIntensity[d] }));
  const dowSum = Array(7).fill(0), dowN = Array(7).fill(0);
  for (const [d, v] of Object.entries(s.cravingIntensity)) { const w = new Date(d + "T00:00:00").getDay(); dowSum[w] += v; dowN[w]++; }
  const cravingByDow = DOW.map((day, i) => ({ day, avg: dowN[i] ? Math.round((dowSum[i] / dowN[i]) * 10) / 10 : 0 }));
  const riskTrend = s.dates.slice(-30).map((d) => ({ date: d.slice(5), risk: dailyRiskProxy(s, d) }));
  const disciplineVsClean = s.dates.filter((d) => d in s.lifeScore).map((d) => ({ clean: s.cleanIndex[d], discipline: s.lifeScore[d] }));
  return { sleepVsCraving, spendVsCraving, cravingByDow, riskTrend, disciplineVsClean };
}

// ── top-level assembler ───────────────────────────────────────────────────────
export interface CorrelationReport {
  windowDays: number;
  daysLogged: number;
  enoughData: boolean;
  needMoreDays: number;
  cards: CorrelationCard[];
  patterns: RiskPattern[];
  insights: string[];
  graphs: CorrelationGraphs;
  cannabisRiskToday: RiskResult;
  cannabisRiskTomorrow: RiskResult;
  cravingSummary: { won: number; lost: number; victoryRate: number; mostDangerousHour: string; mostDangerousDay: string };
}

const MIN_DAYS = 7;
export async function buildCorrelationReport(windowDays = 120): Promise<CorrelationReport> {
  const s = await loadLifeSignals(windowDays);
  const cravingRows = await prisma.craving.findMany({ where: { at: { gte: new Date(Date.now() - windowDays * DAY) } }, orderBy: { at: "desc" } }).catch(() => []);
  const cravingA = cravingAnalytics(cravingRows as CravingRow[]);
  const cards = buildCards(s);
  return {
    windowDays,
    daysLogged: s.daysLogged,
    enoughData: s.daysLogged >= MIN_DAYS,
    needMoreDays: Math.max(0, MIN_DAYS - s.daysLogged),
    cards,
    patterns: detectPatterns(s, cravingA),
    insights: buildInsights(cards, s, cravingA),
    graphs: buildGraphs(s),
    cannabisRiskToday: cannabisRisk(s, "today"),
    cannabisRiskTomorrow: cannabisRisk(s, "tomorrow"),
    cravingSummary: { won: cravingA.won, lost: cravingA.lost, victoryRate: cravingA.victoryRate, mostDangerousHour: cravingA.mostDangerousHour, mostDangerousDay: cravingA.mostDangerousDay },
  };
}
