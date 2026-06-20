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
 *  "% change". E.g. cravings on night-shift days vs other days.
 *
 *  Confidence caps (issue #4 — no "spiritual raised cravings by 2208%"):
 *   - pct is CLAMPED to ±PCT_CAP so a near-zero baseline can't explode it.
 *   - `reliable` is false when either side has < MIN_SIDE days, the baseline is
 *     near zero, or the raw (un-clamped) pct exceeded the cap — callers should
 *     downgrade confidence / hide the % when reliable is false. */
const PCT_CAP = 300;
const MIN_SIDE = 3;
export function conditionalLift(flagByDay: Record<string, boolean>, metricByDay: Record<string, number>): { onAvg: number; offAvg: number; pct: number; pctRaw: number; reliable: boolean; nOn: number; nOff: number } {
  let onSum = 0, onN = 0, offSum = 0, offN = 0;
  for (const [day, v] of Object.entries(metricByDay)) {
    if (flagByDay[day]) { onSum += v; onN++; } else { offSum += v; offN++; }
  }
  const onAvg = onN ? onSum / onN : 0;
  const offAvg = offN ? offSum / offN : 0;
  // Baseline floor scales with the metric so rates (0–1) and intensities (0–10)
  // are both handled: require the baseline to be a meaningful fraction of the mean.
  const baselineFloor = Math.max(Math.abs(onAvg), Math.abs(offAvg)) * 0.1;
  const pctRaw = offAvg ? Math.round(((onAvg - offAvg) / offAvg) * 100) : 0;
  const pct = Math.max(-PCT_CAP, Math.min(PCT_CAP, pctRaw));
  const reliable =
    onN >= MIN_SIDE && offN >= MIN_SIDE &&
    Math.abs(offAvg) >= baselineFloor && Math.abs(offAvg) > 1e-9 &&
    Math.abs(pctRaw) <= PCT_CAP;
  return { onAvg: Math.round(onAvg * 100) / 100, offAvg: Math.round(offAvg * 100) / 100, pct, pctRaw, reliable, nOn: onN, nOff: offN };
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
