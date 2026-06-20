// AmanOS — Future Aman Simulator (read-layer, no migration).
// Projects current behaviour forward over 30/90/180/365 days under 3 scenarios
// (Continue / Improve +20% / Worsen −20%). These are HEURISTIC ESTIMATES from
// recent rates — directional projections, NOT predictions. Reuses existing loaders.
import { dragonHp } from "@/lib/damage";
import { getRecoverySuccess } from "@/lib/recovery-success";
import { getSmokingSplit } from "@/lib/smoking-split";
import { getMoneySavedInputs, computeMoneySaved } from "@/lib/money-saved";
import { getNclexCommand } from "@/lib/nclex-command";
import { getFitness } from "@/lib/fitness";
import { getCareerCommand } from "@/lib/career";
import { getBharatfareCeo } from "@/lib/bharatfare-ceo";
import { getDashboardData } from "@/lib/data";

export const HORIZONS = [30, 90, 180, 365] as const;
export type Scenario = "continue" | "improve" | "worsen";
export type Quad = [number, number, number, number]; // values at 30 / 90 / 180 / 365

export interface Metric {
  label: string;
  unit: string;
  better: "up" | "down" | "none";
  scenarios: Record<Scenario, Quad>;
}
export interface DomainProjection {
  key: string;
  title: string;
  metrics: Metric[];
  notes?: Record<Scenario, string>;
}
export interface FutureSimulation {
  domains: DomainProjection[];
  disclaimer: string;
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const r1 = (n: number) => Math.round(n * 10) / 10;

// Standard ±20% rate factors, and inverse for "lower is better" rates (relapse).
const FAC: Record<Scenario, number> = { continue: 1, improve: 1.2, worsen: 0.8 };
const FAC_INV: Record<Scenario, number> = { continue: 1, improve: 0.8, worsen: 1.2 };

/** Build a metric from a per-horizon function of the scenario rate factor. */
function metricFromRate(label: string, unit: string, better: Metric["better"], make: (factor: number) => (h: number) => number, inverse = false): Metric {
  const fac = inverse ? FAC_INV : FAC;
  const quad = (factor: number): Quad => {
    const fn = make(factor);
    return [Math.round(fn(30)), Math.round(fn(90)), Math.round(fn(180)), Math.round(fn(365))];
  };
  return { label, unit, better, scenarios: { continue: quad(fac.continue), improve: quad(fac.improve), worsen: quad(fac.worsen) } };
}

/** Build a metric from explicit per-year deltas (for drift-style projections). */
function metricFromDrift(label: string, unit: string, better: Metric["better"], current: number, deltaPerYear: Record<Scenario, number>, lo = 0, hi = 100): Metric {
  const quad = (delta: number): Quad => HORIZONS.map((h) => Math.round(clamp(current + delta * (h / 365), lo, hi))) as Quad;
  return { label, unit, better, scenarios: { continue: quad(deltaPerYear.continue), improve: quad(deltaPerYear.improve), worsen: quad(deltaPerYear.worsen) } };
}

export async function getFutureSimulation(now: Date = new Date()): Promise<FutureSimulation> {
  const [recovery, smoking, savedInputs, nclex, fitness, career, bf, dash] = await Promise.all([
    getRecoverySuccess(now), getSmokingSplit(now), getMoneySavedInputs(now), getNclexCommand(now), getFitness(now), getCareerCommand(now), getBharatfareCeo(now), getDashboardData(),
  ]);
  const moneySaved = computeMoneySaved(smoking, savedInputs, now);

  const domains: DomainProjection[] = [];

  // ── RECOVERY ──
  {
    const cleanRate = clamp(recovery.last30Rate || recovery.successRate, 0, 100) / 100; // 0..1
    const dailySave = moneySaved.last30.saved > 0 ? moneySaved.last30.saved / 30 : (savedInputs.lifetimeDays > 0 ? moneySaved.lifetime.saved / savedInputs.lifetimeDays : 0);
    const power = clamp(dash.dragon?.power ?? 50, 0, 100);
    const metrics: Metric[] = [
      metricFromRate("Clean days", "d", "up", (f) => (h) => h * clamp(cleanRate * f, 0, 1)),
      metricFromRate("Relapse risk", "%", "down", (f) => (h) => clamp((1 - cleanRate) * 100 * f * Math.sqrt(h / 30), 0, 99), true),
      metricFromRate("Money saved", "£", "up", (f) => (h) => h * dailySave * f),
      metricFromRate("Dragon HP", "", "down", (f) => (h) => { const cd = h * clamp(cleanRate * f, 0, 1); const p = clamp(power - 0.3 * cd, 0, 100); return dragonHp(p).hp; }),
    ];
    domains.push({ key: "recovery", title: "🜂 Recovery", metrics });
  }

  // ── NCLEX ──
  {
    const pace = Math.max(0, nclex.pacePerDay);
    const { volume: _v, accuracy, consistency, coverage } = nclex.readinessBreakdown;
    void _v;
    const metrics: Metric[] = [
      metricFromRate("Questions done", "", "up", (f) => (h) => nclex.totalQuestions + pace * f * h),
      metricFromRate("Readiness", "/100", "up", (f) => (h) => { const q = nclex.totalQuestions + pace * f * h; const vol = clamp((q / nclex.goal) * 100); return clamp(0.35 * vol + 0.35 * accuracy + 0.15 * consistency + 0.15 * coverage); }),
    ];
    if (nclex.examSet) {
      // P(reach goal before exam): pace×factor vs requirement, bounded estimate. Steady across horizons.
      const prob = (f: number) => {
        if (nclex.remaining <= 0) return 100;
        const ratio = nclex.requiredPerDay > 0 ? (pace * f) / nclex.requiredPerDay : (nclex.totalQuestions + pace * f * nclex.daysLeft >= nclex.goal ? 2 : 0);
        return Math.round(clamp(50 + (ratio - 1) * 50, 5, 95));
      };
      metrics.push({ label: "P(goal by exam)", unit: "%", better: "up", scenarios: { continue: [prob(1), prob(1), prob(1), prob(1)], improve: [prob(1.2), prob(1.2), prob(1.2), prob(1.2)], worsen: [prob(0.8), prob(0.8), prob(0.8), prob(0.8)] } });
    }
    domains.push({ key: "nclex", title: "🎯 NCLEX", metrics });
  }

  // ── FITNESS ──
  {
    const cons = fitness.consistencyPct;
    const { strength, nutrition } = fitness.scoreBreakdown;
    const metrics: Metric[] = [];
    if (fitness.currentWeight != null && fitness.change7 != null) {
      const daily = fitness.change7 / 7; // kg/day trend (amplified by scenario)
      metrics.push({
        label: "Weight", unit: "kg", better: "none",
        scenarios: {
          continue: HORIZONS.map((h) => r1(fitness.currentWeight! + daily * 1 * h)) as Quad,
          improve: HORIZONS.map((h) => r1(fitness.currentWeight! + daily * 1.2 * h)) as Quad,
          worsen: HORIZONS.map((h) => r1(fitness.currentWeight! + daily * 0.8 * h)) as Quad,
        },
      });
    }
    // Fitness score with projected consistency (other components held at current).
    const fitScore = (f: number) => { const c = clamp(cons * f); return Math.round(0.25 * fitness.scoreBreakdown.weight + 0.25 * c + 0.25 * strength + 0.25 * nutrition); };
    metrics.push({ label: "Fitness score", unit: "/100", better: "up", scenarios: { continue: [fitScore(1), fitScore(1), fitScore(1), fitScore(1)], improve: [fitScore(1.2), fitScore(1.2), fitScore(1.2), fitScore(1.2)], worsen: [fitScore(0.8), fitScore(0.8), fitScore(0.8), fitScore(0.8)] } });
    const consQ = (f: number) => Math.round(clamp(cons * f));
    metrics.push({ label: "Consistency", unit: "%", better: "up", scenarios: { continue: [consQ(1), consQ(1), consQ(1), consQ(1)], improve: [consQ(1.2), consQ(1.2), consQ(1.2), consQ(1.2)], worsen: [consQ(0.8), consQ(0.8), consQ(0.8), consQ(0.8)] } });
    domains.push({ key: "fitness", title: "💪 Fitness", metrics });
  }

  // ── CAREER ──
  {
    const metrics: Metric[] = [
      metricFromDrift("Progress score", "/100", "up", career.progressScore, { continue: 5, improve: 25, worsen: -20 }),
    ];
    const notes: Record<Scenario, string> = {
      continue: `Risk holds at ${career.riskLevel} if nothing changes.`,
      improve: "Risk trends down — applications + revalidation kept current.",
      worsen: "Risk trends up — neglected registration / stalled job search.",
    };
    domains.push({ key: "career", title: "🩺 Career", metrics, notes });
  }

  // ── BHARATFARE ──
  {
    const dailyRev = bf.hasData ? bf.week.revenue / 7 : 0;
    const metrics: Metric[] = [
      metricFromRate("Revenue (cum.)", "£", "up", (f) => (h) => dailyRev * f * h),
      metricFromDrift("CEO score", "/100", "up", bf.ceoScore, { continue: 3, improve: 20, worsen: -15 }),
    ];
    domains.push({ key: "bharatfare", title: "💼 BharatFare", metrics });
  }

  return {
    domains,
    disclaimer: "Estimates only — directional projections from recent rates, not predictions. Your choices each day change the curve.",
  };
}
