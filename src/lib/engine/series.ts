// AmanOS shared engine — TIME SERIES / ANALYTICS.
// Generic bucketing + aggregation over any event stream. Every command center
// feeds {date,value} here to get daily/weekly/monthly/yearly graph series.

export type Bucket = "day" | "week" | "month" | "year";
export interface Ev { date: string | Date; value?: number }
export type Agg = "sum" | "count" | "avg";

function toDate(d: string | Date): Date {
  return d instanceof Date ? d : new Date(d.length === 10 ? d + "T00:00:00" : d);
}

function isoWeek(d: Date): string {
  const x = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = x.getUTCDay() || 7;
  x.setUTCDate(x.getUTCDate() + 4 - day);
  const yStart = new Date(Date.UTC(x.getUTCFullYear(), 0, 1));
  const wk = Math.ceil(((x.getTime() - yStart.getTime()) / 86400000 + 1) / 7);
  return `${x.getUTCFullYear()}-W${String(wk).padStart(2, "0")}`;
}

export function bucketKey(d: string | Date, b: Bucket): string {
  const dt = toDate(d);
  const iso = dt.toISOString();
  if (b === "day") return iso.slice(0, 10);
  if (b === "month") return iso.slice(0, 7);
  if (b === "year") return iso.slice(0, 4);
  return isoWeek(dt);
}

/** Aggregate events into an ordered series by bucket. */
export function series(events: Ev[], b: Bucket, agg: Agg = "sum"): { key: string; value: number }[] {
  const sums = new Map<string, number>();
  const counts = new Map<string, number>();
  for (const e of events) {
    const k = bucketKey(e.date, b);
    sums.set(k, (sums.get(k) ?? 0) + (e.value ?? 1));
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...sums.keys()].sort().map((k) => ({
    key: k,
    value: agg === "count" ? (counts.get(k) ?? 0) : agg === "avg" ? (sums.get(k)! / (counts.get(k) || 1)) : sums.get(k)!,
  }));
}

/** Group a list by a key fn, summing a value fn. */
export function sumBy<T>(rows: T[], key: (t: T) => string, val: (t: T) => number): Record<string, number> {
  const m: Record<string, number> = {};
  for (const r of rows) { const k = key(r) || "other"; m[k] = (m[k] ?? 0) + (val(r) || 0); }
  return m;
}

/** Daily map (YYYY-MM-DD → summed value) — the canonical input for correlations. */
export function dailyMap(events: Ev[], agg: Agg = "sum"): Record<string, number> {
  const s = series(events, "day", agg);
  const m: Record<string, number> = {};
  for (const p of s) m[p.key] = p.value;
  return m;
}

/** Sum over the last N days. */
export function sumLastDays(events: Ev[], days: number, now = Date.now()): number {
  const since = now - days * 86400000;
  let total = 0;
  for (const e of events) if (toDate(e.date).getTime() >= since) total += e.value ?? 1;
  return total;
}
