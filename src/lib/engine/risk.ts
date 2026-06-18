// AmanOS shared engine — RISK.
// Generic weighted risk scoring. Any command center (cannabis relapse, nicotine
// relapse, financial-stress, discipline-collapse) describes its situation as a
// list of factors; this turns them into a 0–100 score, a level, the reasons that
// fired, and the defensive actions to take. One engine, never duplicated.

export interface RiskFactor {
  key: string;
  label: string;       // short reason text, e.g. "Poor sleep (<6h)"
  weight: number;      // contribution when active (points)
  active: boolean;
  detail?: string;     // optional richer reason
  suggestion?: string; // defensive action to surface when active
}

export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "SEVERE";

export interface RiskResult {
  score: number;       // 0–100
  level: RiskLevel;
  reasons: string[];   // active factor labels/details
  suggestions: string[];
  factors: RiskFactor[];
}

export function riskLevel(score: number): RiskLevel {
  if (score >= 70) return "SEVERE";
  if (score >= 45) return "HIGH";
  if (score >= 22) return "MODERATE";
  return "LOW";
}

/** Sum active weights, clamp to 0–100, derive level + reason/suggestion lists. */
export function riskScore(factors: RiskFactor[]): RiskResult {
  const active = factors.filter((f) => f.active && f.weight > 0);
  const raw = active.reduce((s, f) => s + f.weight, 0);
  const score = Math.max(0, Math.min(100, Math.round(raw)));
  return {
    score,
    level: riskLevel(score),
    reasons: active.map((f) => f.detail || f.label),
    suggestions: active.map((f) => f.suggestion).filter((s): s is string => !!s),
    factors,
  };
}

export const RISK_COLOR: Record<RiskLevel, string> = {
  LOW: "#34d399",
  MODERATE: "#fbbf24",
  HIGH: "#fb923c",
  SEVERE: "#ff5470",
};
