// AmanOS — NICOTINE COMMAND CENTER (the second dragon).
// A first-class citizen built entirely on the shared engines (series, forecast,
// gamify, risk) and the Life Correlation Engine. No duplicated analytics: it
// reuses loadLifeSignals + the correlation card helpers, and the generic risk
// engine, so Nursing / Recovery-AI / Global Dashboard can consume the same data.

import prisma from "@/lib/db";
import { todayKey, addDaysKey } from "@/lib/dates";
import { projectCumulative } from "@/lib/engine/forecast";
import { levelOf, dragonFrom, type Tier } from "@/lib/engine/gamify";
import { riskScore, type RiskFactor, type RiskResult } from "@/lib/engine/risk";
import { loadLifeSignals, numericCard, flagCard, type CorrelationCard } from "@/lib/correlations";

const DAY = 86400000;
const USE_TYPES = new Set(["cigarette", "vape", "pouch", "cigar"]);
const round = (n: number) => Math.round(n * 100) / 100;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

export interface NicotineEventRow {
  id: string; at: Date; type: string; quantity: number; nicotineMg: number; cost: number;
  trigger: string | null; location: string | null; emotion: string | null; outcome: string | null; shift: string | null; note: string | null;
}
export interface NicotineGoalRow {
  quitDate: Date | null; dailyLimit: number; reductionPlan: string | null;
  pricePerUnit: number; mgPerUnit: number; baselinePerDay: number; startedAt: Date;
}

const DEFAULT_GOAL: NicotineGoalRow = { quitDate: null, dailyLimit: 0, reductionPlan: null, pricePerUnit: 0.6, mgPerUnit: 12, baselinePerDay: 10, startedAt: new Date() };

async function readEvents(windowDays: number): Promise<NicotineEventRow[]> {
  try { return (await db.nicotineEvent.findMany({ where: { at: { gte: new Date(Date.now() - windowDays * DAY) } }, orderBy: { at: "desc" } })) as NicotineEventRow[]; }
  catch { return []; }
}
async function readAllEvents(): Promise<NicotineEventRow[]> {
  try { return (await db.nicotineEvent.findMany({ orderBy: { at: "desc" } })) as NicotineEventRow[]; }
  catch { return []; }
}
export async function readGoal(): Promise<NicotineGoalRow> {
  try {
    const g = await db.nicotineGoal.findUnique({ where: { id: 1 } });
    return g ? { ...DEFAULT_GOAL, ...g } : DEFAULT_GOAL;
  } catch { return DEFAULT_GOAL; }
}

// ── daily signal maps (shared with the correlation engine) ────────────────────
export interface NicotineDaily {
  dates: string[];
  use: Record<string, number>;
  cravingCount: Record<string, number>;
  cost: Record<string, number>;
  relapse: Record<string, boolean>;
  nightShift: Record<string, boolean>;
}
export async function loadNicotineDaily(windowDays = 120): Promise<NicotineDaily> {
  const events = await readEvents(windowDays);
  const d: NicotineDaily = { dates: [], use: {}, cravingCount: {}, cost: {}, relapse: {}, nightShift: {} };
  const set = new Set<string>();
  for (const e of events) {
    const k = todayKey(e.at);
    set.add(k);
    if (USE_TYPES.has(e.type)) { d.use[k] = (d.use[k] ?? 0) + (e.quantity || 1); d.cost[k] = (d.cost[k] ?? 0) + (e.cost || 0); }
    if (e.type === "relapse") { d.relapse[k] = true; d.use[k] = (d.use[k] ?? 0) + (e.quantity || 1); }
    if (e.type === "craving") { d.cravingCount[k] = (d.cravingCount[k] ?? 0) + 1; if (e.outcome === "lost") { d.use[k] = (d.use[k] ?? 0) + 1; } }
    if (e.shift === "night") d.nightShift[k] = true;
  }
  d.dates = [...set].sort();
  return d;
}

// ── recovery engine ───────────────────────────────────────────────────────────
export interface NicotineRecovery {
  freeMs: number; freeDays: number; longestFreeDays: number;
  unitsAvoided: number; nicotineAvoidedMg: number; moneySaved: number; moneySpent: number;
  lifeRegainedHours: number;
  relapses: number; cravingsWon: number; cravingsLost: number; victoryRate: number;
  lastUse: string | null;
}
function recovery(all: NicotineEventRow[], goal: NicotineGoalRow): NicotineRecovery {
  const uses = all.filter((e) => USE_TYPES.has(e.type) || e.type === "relapse").sort((a, b) => +new Date(a.at) - +new Date(b.at));
  const now = Date.now();
  const lastUse = uses.length ? new Date(uses[uses.length - 1].at) : null;
  const anchor = lastUse ?? new Date(goal.startedAt);
  const freeMs = Math.max(0, now - +anchor);
  const freeDays = Math.floor(freeMs / DAY);

  // longest free streak = max gap between consecutive uses (+ start→first, last→now).
  let longest = 0;
  const points = [+new Date(goal.startedAt), ...uses.map((u) => +new Date(u.at)), now];
  for (let i = 1; i < points.length; i++) longest = Math.max(longest, points[i] - points[i - 1]);
  const longestFreeDays = Math.floor(longest / DAY);

  const daysSinceStart = Math.max(1, Math.floor((now - +new Date(goal.startedAt)) / DAY));
  const unitsUsed = all.filter((e) => USE_TYPES.has(e.type)).reduce((s, e) => s + (e.quantity || 1), 0);
  const expected = goal.baselinePerDay * daysSinceStart;
  const unitsAvoided = Math.max(0, expected - unitsUsed);
  const moneySpent = round(all.reduce((s, e) => s + (e.cost || 0), 0) || unitsUsed * goal.pricePerUnit);
  const moneySaved = round(unitsAvoided * goal.pricePerUnit);
  const cravings = all.filter((e) => e.type === "craving");
  const won = cravings.filter((e) => e.outcome === "won").length;
  const lost = cravings.filter((e) => e.outcome === "lost").length;

  return {
    freeMs, freeDays, longestFreeDays: Math.max(longestFreeDays, freeDays),
    unitsAvoided, nicotineAvoidedMg: round(unitsAvoided * goal.mgPerUnit), moneySaved, moneySpent,
    lifeRegainedHours: round((unitsAvoided * 11) / 60), // ~11 min of life per cigarette
    relapses: all.filter((e) => e.type === "relapse").length,
    cravingsWon: won, cravingsLost: lost,
    victoryRate: won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0,
    lastUse: lastUse ? lastUse.toISOString() : null,
  };
}

// ── nicotine dragon ───────────────────────────────────────────────────────────
export const NICOTINE_TIERS: Tier[] = [
  { name: "Smoke Serpent", min: 0, color: "#94a3b8", icon: "🐍" },
  { name: "Ash Dragon", min: 1, color: "#fb923c", icon: "🐉" },
  { name: "Nicotine Wraith", min: 3, color: "#f59e0b", icon: "👻" },
  { name: "Tar Hydra", min: 7, color: "#a78bfa", icon: "🐲" },
  { name: "Ember Titan", min: 30, color: "#38bdf8", icon: "🔥" },
  { name: "Cleared Skies", min: 90, color: "#34d399", icon: "🕊️" },
  { name: "Free Sovereign", min: 365, color: "#facc15", icon: "👑" },
];
export interface NicotineDragon {
  stage: ReturnType<typeof dragonFrom>;
  hp: number; threat: "LOW" | "MODERATE" | "HIGH"; damageDealt: number;
  weaknesses: string[]; strongestWindow: string;
}
function dragon(rec: NicotineRecovery, daily: NicotineDaily, weaknesses: string[], strongestWindow: string): NicotineDragon {
  const usedLast = (n: number) => daily.dates.filter((d) => +new Date(d + "T00:00:00") >= Date.now() - n * DAY).reduce((s, d) => s + (daily.use[d] ?? 0), 0);
  const used30 = usedLast(30), used3 = usedLast(3);
  const hp = Math.max(0, Math.min(100, Math.round(20 + used30 * 6 - rec.cravingsWon * 3)));
  const threat: NicotineDragon["threat"] = used3 > 0 ? "HIGH" : used30 > 0 ? "MODERATE" : "LOW";
  return { stage: dragonFrom(rec.freeDays, NICOTINE_TIERS), hp, threat, damageDealt: rec.cravingsWon, weaknesses, strongestWindow };
}

// ── risk (Recovery AI) ────────────────────────────────────────────────────────
type LifeSig = Awaited<ReturnType<typeof loadLifeSignals>>;
export function nicotineRisk(daily: NicotineDaily, life: LifeSig, horizon: "today" | "tomorrow"): RiskResult {
  const today = todayKey(); const y = addDaysKey(today, -1);
  const usedRecent = (daily.use[today] ?? 0) + (daily.use[y] ?? 0) > 0;
  const sleepRef = life.sleep[today] ?? life.sleep[y];
  const anxiety = life.anxiety[today] ?? life.anxiety[y] ?? 0;
  const gymRecent = !!(life.gym[today] || life.gym[y]);
  const cannabisRelapse = !!(life.relapse[today] || life.relapse[y]);
  const nightShift = !!(daily.nightShift[today] || (horizon === "tomorrow" && daily.nightShift[addDaysKey(today, 1)]));
  const cravingRecent = (daily.cravingCount[today] ?? 0) + (daily.cravingCount[y] ?? 0);
  const t = horizon === "tomorrow";

  const factors: RiskFactor[] = [
    { key: "recentuse", label: "Recent nicotine use", weight: t ? 18 : 26, active: usedRecent, detail: "Used nicotine in the last 48h", suggestion: "Reset the free-clock now; throw out remaining supply." },
    { key: "sleep", label: "Sleep debt (<6h)", weight: 18, active: sleepRef !== undefined && sleepRef > 0 && sleepRef < 6, detail: "Poor sleep — nicotine cravings climb on low sleep", suggestion: "Front-load water + a walk; protect sleep tonight." },
    { key: "stress", label: "High stress", weight: 16, active: anxiety >= 6, detail: `Stress/anxiety ${anxiety}/10`, suggestion: "Box-breathing before your usual smoke window." },
    { key: "nogym", label: "No gym in 48h", weight: 12, active: !gymRecent, detail: "No training logged", suggestion: "Train today — gym days cut nicotine cravings." },
    { key: "cannabis", label: "Cannabis relapse nearby", weight: 14, active: cannabisRelapse, detail: "A cannabis slip in the last 48h — the dragons feed each other", suggestion: "Guard both fronts; one relapse pulls the other." },
    { key: "shift", label: "Nursing night shift", weight: 12, active: nightShift, detail: "Night-shift day — your highest-use context", suggestion: "Pack gum/patches; plan break-time without a smoke." },
    { key: "craving", label: "Strong recent cravings", weight: t ? 8 : 14, active: cravingRecent >= 2, detail: `${cravingRecent} craving(s) logged recently`, suggestion: "Use the 15-minute rule and log each craving." },
  ];
  return riskScore(factors);
}

// ── correlation cards (reuse the shared helpers) ──────────────────────────────
function buildNicotineCards(daily: NicotineDaily, life: LifeSig): CorrelationCard[] {
  const highStress: Record<string, boolean> = {};
  for (const [d, v] of Object.entries(life.anxiety)) highStress[d] = v >= 6;
  const studyDay: Record<string, boolean> = {};
  for (const [d, v] of Object.entries(life.nclexHours)) studyDay[d] = v > 0;

  return [
    flagCard("nic-sleep", "Sleep vs nicotine cravings", life.lowSleep, daily.cravingCount,
      (l) => l.pct >= 0 ? `On nights under 6h sleep, nicotine cravings are ${l.pct}% higher.` : `Low-sleep days show ${Math.abs(l.pct)}% fewer nicotine cravings here.`),
    flagCard("nic-stress", "Stress vs nicotine use", highStress, daily.use,
      (l) => l.pct >= 0 ? `On high-stress days, nicotine use is ${l.pct}% higher.` : `High-stress days show ${Math.abs(l.pct)}% lower use here.`),
    flagCard("nic-gym", "Gym vs nicotine use", life.gym, daily.use,
      (l) => l.pct <= 0 ? `Gym days reduce nicotine use by ${Math.abs(l.pct)}%.` : `Gym days show ${l.pct}% higher use — unusual, keep logging.`),
    flagCard("nic-cannabis", "Cannabis relapse vs nicotine use", life.relapse, daily.use,
      (l) => l.pct >= 0 ? `Nicotine use is ${l.pct}% higher on cannabis-relapse days — the two dragons feed each other.` : `Cannabis-relapse days show ${Math.abs(l.pct)}% lower nicotine use here.`),
    flagCard("nic-shift", "Nursing shift vs nicotine use", daily.nightShift, daily.use,
      (l) => l.pct >= 0 ? `On nursing night shifts, nicotine use is ${l.pct}% higher.` : `Night shifts show ${Math.abs(l.pct)}% lower use here.`),
    flagCard("nic-study", "NCLEX study vs nicotine use", studyDay, daily.use,
      (l) => l.pct >= 0 ? `On study days, nicotine use is ${l.pct}% higher.` : `Study days show ${Math.abs(l.pct)}% lower nicotine use.`),
    numericCard("nic-cost", "Nicotine use vs spending", daily.use, daily.cost,
      (r) => r > 0 ? `More use means more money burned (r=${r.toFixed(2)}).` : `Not enough cost data yet (r=${r.toFixed(2)}).`),
  ];
}

// ── finance integration ───────────────────────────────────────────────────────
export interface NicotineFinance {
  nicotineLifetime: number; cannabisLifetime: number; combinedLifetime: number;
  cost5yr: number; cost10yr: number; freedomFund10yr: number;
}
function finance(rec: NicotineRecovery, daily: NicotineDaily, life: LifeSig, goal: NicotineGoalRow): NicotineFinance {
  const nicotineLifetime = rec.moneySpent;
  const cannabisLifetime = round(Object.values(life.weedSpend).reduce((s, v) => s + v, 0));
  const dailySpendRate = goal.baselinePerDay * goal.pricePerUnit; // £/day if still using at baseline
  const cost5yr = Math.round(dailySpendRate * 365 * 5);
  const cost10yr = Math.round(dailySpendRate * 365 * 10);
  // Freedom Fund: invest the monthly saving at ~5%/yr, compounded monthly, 10y.
  const monthly = dailySpendRate * 30; const rMo = 0.05 / 12; let fv = 0;
  for (let m = 0; m < 120; m++) fv = (fv + monthly) * (1 + rMo);
  return { nicotineLifetime, cannabisLifetime, combinedLifetime: round(nicotineLifetime + cannabisLifetime), cost5yr, cost10yr, freedomFund10yr: Math.round(fv) };
}

// ── shift breakdown ───────────────────────────────────────────────────────────
export interface ShiftRow { shift: string; use: number; cravings: number }
function byShift(events: NicotineEventRow[]): ShiftRow[] {
  const m = new Map<string, { use: number; cravings: number }>();
  for (const e of events) {
    const k = e.shift || "unset";
    const r = m.get(k) ?? { use: 0, cravings: 0 };
    if (USE_TYPES.has(e.type) || e.type === "relapse") r.use += e.quantity || 1;
    if (e.type === "craving") r.cravings += 1;
    m.set(k, r);
  }
  return ["day", "night", "off", "unset"].filter((k) => m.has(k)).map((k) => ({ shift: k, ...m.get(k)! }));
}

// ── badges ────────────────────────────────────────────────────────────────────
export interface Badge { key: string; label: string; icon: string; earned: boolean }
function badges(rec: NicotineRecovery): Badge[] {
  const d = rec.freeDays;
  return [
    { key: "d1", label: "First Smoke-Free Day", icon: "🌅", earned: d >= 1 },
    { key: "d3", label: "3 Days Smoke-Free", icon: "💪", earned: d >= 3 },
    { key: "d7", label: "7 Days", icon: "🔥", earned: d >= 7 },
    { key: "d30", label: "30 Days", icon: "🏆", earned: d >= 30 },
    { key: "d90", label: "90 Days", icon: "💎", earned: d >= 90 },
    { key: "d365", label: "1 Year", icon: "👑", earned: d >= 365 },
    { key: "slayer", label: "Craving Slayer", icon: "⚔️", earned: rec.cravingsWon >= 25 },
    { key: "hunter", label: "Dragon Hunter", icon: "🐉", earned: rec.cravingsWon >= 50 },
    { key: "freedom", label: "Freedom Master", icon: "🕊️", earned: d >= 180 },
  ];
}

// ── graphs ────────────────────────────────────────────────────────────────────
export interface NicotineGraphs {
  useOverTime: { date: string; use: number }[];
  cravingsOverTime: { date: string; cravings: number }[];
  costOverTime: { date: string; cost: number }[];
  byHour: { h: string; count: number }[];
  triggers: { name: string; count: number }[];
  riskTrend: { date: string; risk: number }[];
  streakTrend: { date: string; freeDays: number }[];
}
function graphs(events: NicotineEventRow[], daily: NicotineDaily, life: LifeSig): NicotineGraphs {
  const last = daily.dates.slice(-30);
  const useOverTime = last.map((d) => ({ date: d.slice(5), use: daily.use[d] ?? 0 }));
  const cravingsOverTime = last.map((d) => ({ date: d.slice(5), cravings: daily.cravingCount[d] ?? 0 }));
  let cum = 0;
  const costOverTime = last.map((d) => { cum += daily.cost[d] ?? 0; return { date: d.slice(5), cost: round(cum) }; });
  const hours = Array(24).fill(0);
  for (const e of events) if (USE_TYPES.has(e.type) || e.type === "relapse" || e.type === "craving") hours[new Date(e.at).getHours()]++;
  const byHour = hours.map((count, h) => ({ h: String(h).padStart(2, "0"), count }));
  const trigMap = new Map<string, number>();
  for (const e of events) if (e.trigger) trigMap.set(e.trigger, (trigMap.get(e.trigger) ?? 0) + 1);
  const triggers = [...trigMap.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  const riskTrend = last.map((d) => {
    let r = 0; if (daily.relapse[d]) r += 26; if (life.lowSleep[d]) r += 18; if ((life.anxiety[d] ?? 0) >= 6) r += 16; if (life.gym[d] === false) r += 12; r += Math.min(28, (daily.use[d] ?? 0) * 8); return { date: d.slice(5), risk: Math.min(100, r) };
  });
  // running free-days since last use over the window
  let lastUseTs = 0;
  const streakTrend: { date: string; freeDays: number }[] = [];
  for (const d of last) { if ((daily.use[d] ?? 0) > 0) lastUseTs = +new Date(d + "T00:00:00"); const fd = lastUseTs ? Math.max(0, Math.round((+new Date(d + "T00:00:00") - lastUseTs) / DAY)) : 0; streakTrend.push({ date: d.slice(5), freeDays: fd }); }
  return { useOverTime, cravingsOverTime, costOverTime, byHour, triggers, riskTrend, streakTrend };
}

// ── insights ──────────────────────────────────────────────────────────────────
function insights(cards: CorrelationCard[], graphs: NicotineGraphs): string[] {
  const out: string[] = [];
  const peak = graphs.byHour.reduce((a, b) => (b.count > a.count ? b : a), graphs.byHour[0]);
  if (peak && peak.count > 0) out.push(`Most nicotine events occur around ${peak.h}:00.`);
  for (const c of cards) {
    if (!c.enough) continue;
    if (c.id === "nic-sleep" && c.pct && c.pct > 0) out.push(`You crave nicotine more after poor sleep (+${c.pct}%).`);
    if (c.id === "nic-gym" && c.pct && c.pct < 0) out.push(`Gym attendance reduces nicotine use by ${Math.abs(c.pct)}%.`);
    if (c.id === "nic-cannabis" && c.pct && c.pct > 0) out.push(`Nicotine use rises ${c.pct}% after cannabis-relapse days.`);
    if (c.id === "nic-shift" && c.pct && c.pct > 0) out.push(`On nursing shifts nicotine use is ${c.pct}% higher.`);
    if (c.id === "nic-stress" && c.pct && c.pct > 0) out.push(`Stress drives nicotine use up ${c.pct}%.`);
  }
  return out.slice(0, 6);
}

// ── top-level report ──────────────────────────────────────────────────────────
export interface NicotineReport {
  hasData: boolean; daysLogged: number; needMoreDays: number;
  goal: NicotineGoalRow;
  recovery: NicotineRecovery;
  dragon: NicotineDragon;
  riskToday: RiskResult; riskTomorrow: RiskResult; risk7d: number; risk30d: number;
  cards: CorrelationCard[];
  finance: NicotineFinance;
  shifts: ShiftRow[];
  badges: Badge[];
  graphs: NicotineGraphs;
  insights: string[];
}
const MIN_DAYS = 7;
export async function buildNicotineReport(windowDays = 120): Promise<NicotineReport> {
  const [all, goal, daily, life] = await Promise.all([readAllEvents(), readGoal(), loadNicotineDaily(windowDays), loadLifeSignals(windowDays)]);
  const rec = recovery(all, goal);
  const cards = buildNicotineCards(daily, life);
  const g = graphs(all, daily, life);
  const weaknesses: string[] = [];
  for (const c of cards) { if (c.enough && c.id === "nic-gym" && (c.pct ?? 0) < 0) weaknesses.push("exercise"); if (c.enough && c.id === "nic-sleep" && (c.pct ?? 0) > 0) weaknesses.push("good sleep"); }
  if (!weaknesses.length) weaknesses.push("the 15-minute rule", "exercise");
  const peak = g.byHour.reduce((a, b) => (b.count > a.count ? b : a), g.byHour[0]);
  const drg = dragon(rec, daily, weaknesses, peak && peak.count > 0 ? `${peak.h}:00` : "—");
  const riskToday = nicotineRisk(daily, life, "today");
  const riskTomorrow = nicotineRisk(daily, life, "tomorrow");
  const recentRisk = g.riskTrend.slice(-7);
  const risk7d = recentRisk.length ? Math.round(recentRisk.reduce((s, x) => s + x.risk, 0) / recentRisk.length) : riskToday.score;
  const last30 = g.riskTrend.slice(-30);
  const risk30d = last30.length ? Math.round(last30.reduce((s, x) => s + x.risk, 0) / last30.length) : riskToday.score;

  return {
    hasData: daily.dates.length > 0,
    daysLogged: daily.dates.length,
    needMoreDays: Math.max(0, MIN_DAYS - daily.dates.length),
    goal, recovery: rec, dragon: drg,
    riskToday, riskTomorrow, risk7d, risk30d,
    cards, finance: finance(rec, daily, life, goal), shifts: byShift(all), badges: badges(rec),
    graphs: g, insights: insights(cards, g),
  };
}

// Expose for the Global Dashboard / Recovery-AI composition later.
export { projectCumulative, levelOf };
