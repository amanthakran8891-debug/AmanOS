// AmanOS shared engine — FORECASTING.
// Linear-trend projection + finance forecasts. Turns descriptive series into
// "expected in 30/90/180/365 days".

export function linearTrend(ys: number[]): { slope: number; intercept: number } {
  const n = ys.length;
  if (n < 2) return { slope: 0, intercept: ys[0] ?? 0 };
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) { sx += i; sy += ys[i]; sxy += i * ys[i]; sxx += i * i; }
  const d = n * sxx - sx * sx;
  const slope = d ? (n * sxy - sx * sy) / d : 0;
  return { slope, intercept: (sy - slope * sx) / n };
}

/** Project the next value `ahead` steps past the end of a series. */
export function projectNext(ys: number[], ahead: number): number {
  const { slope, intercept } = linearTrend(ys);
  return intercept + slope * (ys.length - 1 + ahead);
}

export const HORIZONS = [30, 90, 180, 365] as const;

/** Project a cumulative total forward given a per-period rate. */
export function projectCumulative(current: number, perDay: number, days: number): number {
  return Math.round(current + perDay * days);
}

/** Savings forecast from a monthly net cashflow. */
export function savingsForecast(currentSavings: number, monthlyNet: number, months: number): number {
  return Math.round(currentSavings + monthlyNet * months);
}

/** Months to clear a debt at a monthly payment (ignores interest — conservative
 *  v1). Returns Infinity if the payment can't cover it. */
export function debtPayoffMonths(balance: number, monthlyPayment: number): number {
  if (balance <= 0) return 0;
  if (monthlyPayment <= 0) return Infinity;
  return Math.ceil(balance / monthlyPayment);
}

/** Project each horizon using a per-day rate from recent history. */
export function horizonProjection(currentCumulative: number, perDay: number): { days: number; value: number }[] {
  return HORIZONS.map((days) => ({ days, value: projectCumulative(currentCumulative, perDay, days) }));
}
