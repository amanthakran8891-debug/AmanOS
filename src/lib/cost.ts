// ─────────────────────────────────────────────────────────────────────────────
// AmanOS — Addiction Cost Dashboard (Phase 2, #7).
// The true price of the dragon: money, time, and lost potential. Awareness, not
// guilt. Pure — the loader passes real spend rows + usage-day counts in.
// ─────────────────────────────────────────────────────────────────────────────

/** Assumptions for opportunity-cost estimates (conservative, tunable). */
export const COST_ASSUMPTIONS = {
  impairedHoursPerUseDay: 4, // hours effectively lost on a use day
  lifeScoreDamagePerUseDay: 30, // the "No Joint" weight forfeited
} as const;

export interface CostBlock {
  money: number;
  moneyEstimated: boolean; // true when derived from profile, not logged spend
  hoursLost: number;
  studyHoursLost: number;
  gymSessionsLost: number;
  lifeScoreDamage: number;
  useDays: number;
}

export interface CostDashboard {
  lifetime: CostBlock;
  last30: CostBlock;
  currency: string;
  framing: string;
}

export interface CostInput {
  currency?: string;
  /** Logged cannabis spend rows (date + amount). */
  spend: { date: string; amount: number }[];
  nowKey: string; // today's YYYY-MM-DD
  thirtyAgoKey: string;
  /** Use days = days not clean (relapse/use). */
  useDaysLifetime: number;
  useDaysLast30: number;
  /** Profile fallback for money when nothing logged. */
  jointsPerDay: number;
  pricePerJoint: number;
  /** Opportunity-cost targets. */
  nclexHoursTarget: number;
  gymDaysPerWeek: number;
}

function block(useDays: number, loggedMoney: number, input: CostInput): CostBlock {
  const a = COST_ASSUMPTIONS;
  const estimated = loggedMoney <= 0;
  const money = estimated
    ? Math.round(useDays * Math.max(0, input.jointsPerDay) * Math.max(0, input.pricePerJoint))
    : Math.round(loggedMoney);
  return {
    money,
    moneyEstimated: estimated,
    hoursLost: Math.round(useDays * a.impairedHoursPerUseDay),
    studyHoursLost: Math.round(useDays * Math.max(0, input.nclexHoursTarget)),
    gymSessionsLost: Math.round(useDays * (Math.max(0, input.gymDaysPerWeek) / 7)),
    lifeScoreDamage: useDays * a.lifeScoreDamagePerUseDay,
    useDays,
  };
}

export function computeCost(input: CostInput): CostDashboard {
  const lifetimeMoney = input.spend.reduce((s, r) => s + r.amount, 0);
  const last30Money = input.spend
    .filter((r) => r.date >= input.thirtyAgoKey && r.date <= input.nowKey)
    .reduce((s, r) => s + r.amount, 0);

  return {
    lifetime: block(input.useDaysLifetime, lifetimeMoney, input),
    last30: block(input.useDaysLast30, last30Money, input),
    currency: input.currency ?? "£",
    framing: "This is what the dragon has cost — not to shame you, but to show you exactly what you're winning back.",
  };
}
