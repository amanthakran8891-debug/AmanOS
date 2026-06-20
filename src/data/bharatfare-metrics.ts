// AmanOS — BharatFare CEO metrics (manual v0, no database).
// Edit this file by hand: add ONE row per day. Newest or oldest order doesn't
// matter — the dashboard sorts by date. When you're ready to make this a proper
// in-app form, we promote this shape to a Prisma model (BharatfareMetric) and the
// lib/component stay the same.
//
// Fields:
//   date          "YYYY-MM-DD"
//   visitors      sessions/visits that day
//   whatsappClicks WhatsApp CTA clicks
//   leads         genuine enquiries
//   bookings      confirmed bookings
//   revenue       £ gross revenue
//   profit        £ net profit
//   note          optional free text

export interface BharatfareMetric {
  date: string;
  visitors: number;
  whatsappClicks: number;
  leads: number;
  bookings: number;
  revenue: number;
  profit: number;
  note?: string;
}

/** Manual daily entries. Replace these sample rows with your real numbers. */
export const BHARATFARE_METRICS: BharatfareMetric[] = [
  // { date: "2026-06-14", visitors: 120, whatsappClicks: 6, leads: 3, bookings: 0, revenue: 0, profit: 0, note: "" },
  // { date: "2026-06-15", visitors: 140, whatsappClicks: 8, leads: 4, bookings: 1, revenue: 220, profit: 35, note: "First Muscat→Delhi booking" },
];

/** Revenue target used to scale the CEO score's revenue/profit signal (£/day).
 *  Tune to whatever a "good day" looks like for you. */
export const BHARATFARE_DAILY_REVENUE_TARGET = 200;
