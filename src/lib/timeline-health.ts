// ─────────────────────────────────────────────────────────────────────────────
// AmanOS — Timeline Health (Phase 3, Priority 1). The intelligence system is
// only as good as its data. This scores how trustworthy the relapse log is and
// flags suspicious patterns (test data, button spam, duplicate logging).
// Pure — data passed in.
// ─────────────────────────────────────────────────────────────────────────────

export interface SuspiciousDay { date: string; count: number }

export interface TimelineHealth {
  confidence: number;            // 0..100
  band: "High" | "Medium" | "Low";
  color: string;
  suspiciousDays: SuspiciousDay[]; // days with implausible relapse counts
  duplicateClusters: number;       // clusters of relapses within a short window
  duplicateCount: number;          // total likely-duplicate events
  totalRelapses: number;
  flags: string[];
  hasIssues: boolean;
}

export interface TimelineHealthInput {
  relapses: { at: string | Date }[];
  /** Same-day relapses above this look implausible for real behaviour. */
  dayThreshold?: number;
  /** Relapses within this window are likely duplicates / button spam. */
  windowMinutes?: number;
}

function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const SHORT_MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function pretty(date: string): string {
  const [, m, d] = date.split("-");
  return `${Number(d)} ${SHORT_MONTH[Number(m) - 1]}`;
}

export function timelineHealth(input: TimelineHealthInput): TimelineHealth {
  const dayThreshold = input.dayThreshold ?? 3;
  const windowMs = (input.windowMinutes ?? 8) * 60000;

  const ms = input.relapses
    .map((r) => new Date(r.at).getTime())
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => a - b);

  // Per-day counts.
  const byDay = new Map<string, number>();
  for (const t of ms) byDay.set(dayKey(t), (byDay.get(dayKey(t)) ?? 0) + 1);
  const suspiciousDays: SuspiciousDay[] = [...byDay.entries()]
    .filter(([, c]) => c > dayThreshold)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.count - a.count);

  // Duplicate clusters (relapses bunched within the window).
  let duplicateClusters = 0, duplicateCount = 0;
  let clusterStart = -Infinity, clusterSize = 0;
  for (const t of ms) {
    if (t - clusterStart <= windowMs) clusterSize++;
    else {
      if (clusterSize > 1) { duplicateClusters++; duplicateCount += clusterSize - 1; }
      clusterStart = t; clusterSize = 1;
    }
  }
  if (clusterSize > 1) { duplicateClusters++; duplicateCount += clusterSize - 1; }

  // Confidence: start at 100, penalise implausible days + duplicates.
  let penalty = 0;
  for (const d of suspiciousDays) penalty += (d.count - dayThreshold) * 4;
  penalty += duplicateCount * 3;
  const confidence = Math.max(0, Math.min(100, Math.round(100 - penalty)));
  const band = confidence >= 80 ? "High" : confidence >= 55 ? "Medium" : "Low";
  const color = band === "High" ? "#34d399" : band === "Medium" ? "#fbbf24" : "#fb7185";

  const flags: string[] = [];
  if (suspiciousDays.length) {
    const top = suspiciousDays[0];
    flags.push(`${top.count} relapses logged on ${pretty(top.date)} — looks like test or duplicate data.`);
    if (suspiciousDays.length > 1) flags.push(`${suspiciousDays.length} days show implausible relapse counts.`);
  }
  if (duplicateCount > 0) flags.push(`Potential duplicate logs detected (${duplicateCount} within ${input.windowMinutes ?? 8} min of another).`);
  if (flags.length === 0) flags.push("No suspicious logging patterns detected.");

  return {
    confidence, band, color,
    suspiciousDays, duplicateClusters, duplicateCount,
    totalRelapses: ms.length,
    flags,
    hasIssues: suspiciousDays.length > 0 || duplicateCount > 0,
  };
}
