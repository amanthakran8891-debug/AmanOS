// AmanOS — canonical substance pricing (single source of truth).
// Standardised per the founder's spec. These drive Dragon Tax / Money Saved /
// cost dashboards. RETRO-APPLY rule: cost is computed as (count × unit price) at
// read time — we never edit the raw historical logs, so changing a price here
// re-prices all history consistently and reversibly.
export const JOINT_COST = 5; // £ per joint (cannabis relapse unit)
export const CIGARETTE_COST = 0.5; // £ per cigarette

/** £ cost of a number of joints. */
export const jointCost = (joints: number) => Math.max(0, joints) * JOINT_COST;
/** £ cost of a number of cigarettes. */
export const cigaretteCost = (cigs: number) => Math.max(0, cigs) * CIGARETTE_COST;
/** Combined Dragon Tax for a period: joints×£5 + cigarettes×£0.50. */
export const dragonTax = (joints: number, cigarettes: number) =>
  Math.round((jointCost(joints) + cigaretteCost(cigarettes)) * 100) / 100;
