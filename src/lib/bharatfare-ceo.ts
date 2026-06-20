// AmanOS — Phase 2, item 2: BharatFare CEO dashboard (v0, no DB).
// Pure: reads the manual metrics data file and derives totals, conversion, a
// 0–100 CEO score, trends and a 30-day graph. Swappable to a Prisma source later
// without changing this file's output shape.
import { BHARATFARE_METRICS, BHARATFARE_DAILY_REVENUE_TARGET, type BharatfareMetric } from "@/data/bharatfare-metrics";
import { todayKey, lastNDays } from "@/lib/dates";

// Score targets (tunable).
const TARGET_WEEKLY_BOOKINGS = 7; // ~1/day
const TARGET_WEEKLY_LEADS = 14; // ~2/day

export interface PeriodTotals {
  visitors: number; whatsappClicks: number; leads: number; bookings: number; revenue: number; profit: number;
}
export interface BharatfareCeo {
  hasData: boolean;
  today: PeriodTotals;
  week: PeriodTotals; // last 7 days
  month: PeriodTotals; // last 30 days
  lifetime: PeriodTotals;
  conversionRate: number; // bookings / leads, % (last 30d)
  visitorToLead: number; // leads / visitors, % (last 30d)
  growthPct: number; // revenue last7 vs prev7
  ceoScore: number; // 0..100
  band: "Struggling" | "Building" | "Healthy" | "Thriving";
  scoreBreakdown: { revenue: number; bookings: number; conversion: number; leads: number; growth: number };
  deltas: { revenue7: number; leads7: number; bookings7: number };
  graph: { date: string; revenue: number; visitors: number }[]; // last 30
}

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));
const ZERO: PeriodTotals = { visitors: 0, whatsappClicks: 0, leads: 0, bookings: 0, revenue: 0, profit: 0 };

function sum(rows: BharatfareMetric[]): PeriodTotals {
  return rows.reduce<PeriodTotals>((a, r) => ({
    visitors: a.visitors + r.visitors,
    whatsappClicks: a.whatsappClicks + r.whatsappClicks,
    leads: a.leads + r.leads,
    bookings: a.bookings + r.bookings,
    revenue: a.revenue + r.revenue,
    profit: a.profit + r.profit,
  }), { ...ZERO });
}

export function buildBharatfareCeo(metrics: BharatfareMetric[] = BHARATFARE_METRICS, now: Date = new Date()): BharatfareCeo {
  const today = todayKey(now);
  const byDate = new Map(metrics.map((m) => [m.date, m]));
  const inWindow = (n: number, offsetDays = 0) => {
    const endKey = lastNDays(1, todayKeyShift(today, -offsetDays))[0];
    const keys = new Set(lastNDays(n, endKey));
    return metrics.filter((m) => keys.has(m.date));
  };

  const todayRow = byDate.get(today);
  const week = sum(inWindow(7));
  const prevWeek = sum(inWindow(7, 7));
  const month = sum(inWindow(30));
  const lifetime = sum(metrics);

  const conversionRate = month.leads > 0 ? Math.round((month.bookings / month.leads) * 100) : 0;
  const visitorToLead = month.visitors > 0 ? Math.round((month.leads / month.visitors) * 100) : 0;
  const growthPct = prevWeek.revenue > 0
    ? Math.round(((week.revenue - prevWeek.revenue) / prevWeek.revenue) * 100)
    : (week.revenue > 0 ? 100 : 0);

  // ── CEO score (Revenue/Profit 35 · Bookings 20 · Conversion 20 · Leads 15 · Growth 10) ──
  const avgDailyRevenue7 = week.revenue / 7;
  const revenueScore = clamp((avgDailyRevenue7 / Math.max(1, BHARATFARE_DAILY_REVENUE_TARGET)) * 100);
  const bookingsScore = clamp((week.bookings / TARGET_WEEKLY_BOOKINGS) * 100);
  const conversionScore = clamp(conversionRate); // already a %, capped at 100
  const leadsScore = clamp((week.leads / TARGET_WEEKLY_LEADS) * 100);
  const growthScore = clamp(50 + growthPct); // 0% → 50, +50% → 100, −50% → 0
  const ceoScore = Math.round(
    0.35 * revenueScore + 0.20 * bookingsScore + 0.20 * conversionScore + 0.15 * leadsScore + 0.10 * growthScore,
  );
  const band: BharatfareCeo["band"] = ceoScore >= 85 ? "Thriving" : ceoScore >= 65 ? "Healthy" : ceoScore >= 40 ? "Building" : "Struggling";

  const graph = lastNDays(30, today).map((k) => {
    const r = byDate.get(k);
    return { date: k, revenue: r?.revenue ?? 0, visitors: r?.visitors ?? 0 };
  });

  return {
    hasData: metrics.length > 0,
    today: todayRow ? { visitors: todayRow.visitors, whatsappClicks: todayRow.whatsappClicks, leads: todayRow.leads, bookings: todayRow.bookings, revenue: todayRow.revenue, profit: todayRow.profit } : { ...ZERO },
    week,
    month,
    lifetime,
    conversionRate,
    visitorToLead,
    growthPct,
    ceoScore,
    band,
    scoreBreakdown: {
      revenue: Math.round(revenueScore),
      bookings: Math.round(bookingsScore),
      conversion: Math.round(conversionScore),
      leads: Math.round(leadsScore),
      growth: Math.round(growthScore),
    },
    deltas: {
      revenue7: Math.round(week.revenue - prevWeek.revenue),
      leads7: week.leads - prevWeek.leads,
      bookings7: week.bookings - prevWeek.bookings,
    },
    graph,
  };
}

// Shift a YYYY-MM-DD key by whole days (negative = earlier).
function todayKeyShift(key: string, deltaDays: number): string {
  const d = new Date(key + "T00:00:00");
  d.setDate(d.getDate() + deltaDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Convenience loader (kept async to match the other dashboards' call sites). */
export async function getBharatfareCeo(now: Date = new Date()): Promise<BharatfareCeo> {
  return buildBharatfareCeo(BHARATFARE_METRICS, now);
}
