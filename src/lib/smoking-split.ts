// AmanOS — Phase 1, item 2: Joint vs Cigarette split (read-layer, no migration).
// Joints  = JointEvent rows of type "relapse" (1 joint each).
// Cigarettes = NicotineEvent rows of type "cigarette" (summed by quantity).
// Cost uses canonical pricing: joint £5, cigarette £0.50.
import prisma from "@/lib/db";
import { JOINT_COST, CIGARETTE_COST } from "@/lib/pricing";

const DAY = 86400000;

export interface SubstanceSplit {
  today: number;
  last7: number;
  last30: number;
  year: number;
  lifetime: number;
  cost: number; // lifetime cost (£)
}

export interface SmokingSplit {
  joints: SubstanceSplit;
  cigarettes: SubstanceSplit;
  totalCost: number;
  jointPct: number; // share of total cost
  cigPct: number;
}

interface Countable { at: Date; qty: number }

function bucket(items: Countable[], now: Date, unitCost: number): SubstanceSplit {
  const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
  const startYear = new Date(now.getFullYear(), 0, 1);
  const cut7 = now.getTime() - 7 * DAY;
  const cut30 = now.getTime() - 30 * DAY;
  let today = 0, last7 = 0, last30 = 0, year = 0, lifetime = 0;
  for (const it of items) {
    const t = it.at.getTime();
    const q = it.qty;
    lifetime += q;
    if (t >= startToday.getTime()) today += q;
    if (t >= cut7) last7 += q;
    if (t >= cut30) last30 += q;
    if (t >= startYear.getTime()) year += q;
  }
  return { today, last7, last30, year, lifetime, cost: Math.round(lifetime * unitCost * 100) / 100 };
}

/** Pure: compute the split from raw event timestamps + cigarette quantities. */
export function computeSmokingSplit(jointAts: Date[], cigs: { at: Date; quantity: number }[], now: Date = new Date()): SmokingSplit {
  const joints = bucket(jointAts.map((at) => ({ at, qty: 1 })), now, JOINT_COST);
  const cigarettes = bucket(cigs.map((c) => ({ at: c.at, qty: Math.max(1, c.quantity || 1) })), now, CIGARETTE_COST);
  const totalCost = Math.round((joints.cost + cigarettes.cost) * 100) / 100;
  const jointPct = totalCost > 0 ? Math.round((joints.cost / totalCost) * 100) : 0;
  const cigPct = totalCost > 0 ? 100 - jointPct : 0;
  return { joints, cigarettes, totalCost, jointPct, cigPct };
}

// ── Dragon Tax (item 3) — smoking COST per period, derived from the split ──────
export interface DragonTaxPeriod { joint: number; cig: number; total: number }
export interface DragonTax {
  today: DragonTaxPeriod;
  last7: DragonTaxPeriod;
  last30: DragonTaxPeriod;
  year: DragonTaxPeriod;
  lifetime: DragonTaxPeriod;
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Pure: turn a SmokingSplit into per-period £ cost (joint/cig/total). No query. */
export function dragonTaxFromSplit(split: SmokingSplit): DragonTax {
  const j = split.joints, c = split.cigarettes;
  const row = (jn: number, cn: number): DragonTaxPeriod => {
    const joint = r2(jn * JOINT_COST);
    const cig = r2(cn * CIGARETTE_COST);
    return { joint, cig, total: r2(joint + cig) };
  };
  return {
    today: row(j.today, c.today),
    last7: row(j.last7, c.last7),
    last30: row(j.last30, c.last30),
    year: row(j.year, c.year),
    lifetime: row(j.lifetime, c.lifetime),
  };
}

/** Loader: read existing models and compute the split. */
export async function getSmokingSplit(now: Date = new Date()): Promise<SmokingSplit> {
  const ndb = prisma as unknown as { nicotineEvent: { findMany: (a: unknown) => Promise<{ at: Date; quantity: number }[]> } };
  const [joints, cigs] = await Promise.all([
    prisma.jointEvent.findMany({ where: { type: "relapse" }, select: { at: true } }).catch(() => [] as { at: Date }[]),
    ndb.nicotineEvent.findMany({ where: { type: "cigarette" }, select: { at: true, quantity: true } }).catch(() => [] as { at: Date; quantity: number }[]),
  ]);
  return computeSmokingSplit(joints.map((j) => j.at), cigs, now);
}
