// AmanOS — Body measurements (manual v0, no database).
// Tape measurements aren't in DayLog, so log them here by hand (one row per
// measurement day). Weight, body fat, training and nutrition all come from the
// existing DayLog/GymSet/Settings — only circumferences live here.
// When ready, promote to a Prisma `BodyMeasurement` model without changing the
// fitness lib/component output.

export const HEIGHT_CM = 173; // used for BMI

export interface BodyMeasurement {
  date: string; // "YYYY-MM-DD"
  chest?: number; // cm
  waist?: number; // cm
  arms?: number; // cm
  thighs?: number; // cm
  note?: string;
}

/** Add one row per measurement day. Newest or oldest order is fine — sorted in code. */
export const BODY_MEASUREMENTS: BodyMeasurement[] = [
  // { date: "2026-06-01", chest: 102, waist: 92, arms: 36, thighs: 58, note: "" },
  // { date: "2026-06-15", chest: 103, waist: 90, arms: 36.5, thighs: 58.5, note: "" },
];
