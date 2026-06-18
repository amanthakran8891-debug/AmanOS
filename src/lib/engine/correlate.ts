// AmanOS shared engine — CORRELATION.
// Discovers relationships between any two daily metrics ("night shifts → +37%
// cravings"). Pearson r over date-aligned series + plain-English phrasing.

export function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return 0;
  let sx = 0, sy = 0, sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) { sx += xs[i]; sy += ys[i]; sxy += xs[i] * ys[i]; sxx += xs[i] * xs[i]; syy += ys[i] * ys[i]; }
  const cov = n * sxy - sx * sy;
  const dx = Math.sqrt(n * sxx - sx * sx);
  const dy = Math.sqrt(n * syy - sy * sy);
  return dx && dy ? Math.max(-1, Math.min(1, cov / (dx * dy))) : 0;
}

/** Align two daily maps (YYYY-MM-DD → value) on shared dates, return r + n. */
export function correlateDaily(a: Record<string, number>, b: Record<string, number>): { r: number; n: number } {
  const keys = Object.keys(a).filter((k) => k in b).sort();
  return { r: pearson(keys.map((k) => a[k]), keys.map((k) => b[k])), n: keys.length };
}

/** Average of metric B on days where boolean condition A is true vs false →
 *  "% change". E.g. cravings on night-shift days vs other days. */
export function conditionalLift(flagByDay: Record<string, boolean>, metricByDay: Record<string, number>): { onAvg: number; offAvg: number; pct: number; nOn: number; nOff: number } {
  let onSum = 0, onN = 0, offSum = 0, offN = 0;
  for (const [day, v] of Object.entries(metricByDay)) {
    if (flagByDay[day]) { onSum += v; onN++; } else { offSum += v; offN++; }
  }
  const onAvg = onN ? onSum / onN : 0;
  const offAvg = offN ? offSum / offN : 0;
  const pct = offAvg ? Math.round(((onAvg - offAvg) / offAvg) * 100) : 0;
  return { onAvg: Math.round(onAvg * 100) / 100, offAvg: Math.round(offAvg * 100) / 100, pct, nOn: onN, nOff: offN };
}

export function strength(r: number): string {
  const a = Math.abs(r);
  if (a >= 0.6) return "strong";
  if (a >= 0.35) return "moderate";
  if (a >= 0.2) return "weak";
  return "none";
}

/** "Poor sleep → higher cravings (strong, r=0.62)". Returns null if too weak/few. */
export function phrase(cause: string, effect: string, r: number, n: number): string | null {
  if (n < 5 || Math.abs(r) < 0.2) return null;
  const dir = r > 0 ? "more" : "less";
  return `${cause} → ${dir} ${effect} (${strength(r)}, r=${r.toFixed(2)}, n=${n})`;
}
