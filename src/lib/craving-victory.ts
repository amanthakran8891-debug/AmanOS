// AmanOS — Phase 1, item 6: Craving Victory Rate (read-layer, no migration).
// Thin summary over the existing Craving model + cravingAnalytics engine. Adds
// windowed victory rates + strongest-resisted that the base engine doesn't give.
import prisma from "@/lib/db";
import { cravingAnalytics, type CravingRow } from "@/lib/cravings";

export interface CravingVictory {
  total: number;
  won: number; // resisted
  lost: number; // relapsed
  victoryRate: number; // %
  last7Rate: number; // %
  last7Count: number;
  last30Rate: number; // %
  last30Count: number;
  strongestResisted: number; // 0..10, max intensity of a resisted craving
  mostDangerousWindow: string;
  topTrigger: string;
}

const DAY = 86400000;

/** Pure: compute the victory summary from Craving rows. */
export function computeCravingVictory(rows: CravingRow[], now: Date = new Date()): CravingVictory {
  const a = cravingAnalytics(rows, now);

  const windowRate = (days: number) => {
    const cut = now.getTime() - days * DAY;
    const r = rows.filter((x) => new Date(x.at).getTime() >= cut);
    const won = r.filter((x) => x.outcome !== "lost").length;
    return { rate: r.length ? Math.round((won / r.length) * 100) : 0, count: r.length };
  };
  const w7 = windowRate(7);
  const w30 = windowRate(30);

  const strongestResisted = rows.reduce((mx, x) => (x.outcome !== "lost" ? Math.max(mx, Math.round(x.intensity || 0)) : mx), 0);

  return {
    total: a.total,
    won: a.won,
    lost: a.lost,
    victoryRate: a.victoryRate,
    last7Rate: w7.rate,
    last7Count: w7.count,
    last30Rate: w30.rate,
    last30Count: w30.count,
    strongestResisted,
    mostDangerousWindow: a.mostDangerousHour,
    topTrigger: a.topTrigger,
  };
}

/** Loader: read Craving rows and compute the summary. */
export async function getCravingVictory(now: Date = new Date()): Promise<CravingVictory> {
  const rows = await prisma.craving.findMany({ orderBy: { at: "desc" } }).catch(() => [] as CravingRow[]);
  return computeCravingVictory(rows as CravingRow[], now);
}
