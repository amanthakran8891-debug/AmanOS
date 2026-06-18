import prisma from "@/lib/db";
import { buildNicotineReport } from "@/lib/nicotine";
import { buildSerpentBattle, type SerpentToday } from "@/lib/serpent";
import { SerpentClient } from "@/components/nicotine/serpent-client";
import { LogNicotine } from "@/components/nicotine/log-nicotine";
import { ensureSettings, ensureDay } from "@/lib/day";
import { todayKey } from "@/lib/dates";

export const dynamic = "force-dynamic";

const USE_TYPES = new Set(["cigarette", "vape", "pouch", "cigar", "relapse"]);

export default async function NicotinePage() {
  const report = await buildNicotineReport(120);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = prisma as any;

  const [settings, day, rows] = await Promise.all([
    ensureSettings(),
    ensureDay(todayKey()),
    db.nicotineEvent.findMany({ orderBy: { at: "desc" }, take: 20 }).catch(() => []),
  ]);

  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const todayEvents: any[] = await db.nicotineEvent.findMany({ where: { at: { gte: startOfToday } } }).catch(() => []);
  const nicotineUsedToday = todayEvents.some((e) => USE_TYPES.has(e.type) || (e.type === "craving" && e.outcome === "lost"));
  const cravingsWonToday = todayEvents.filter((e) => e.type === "craving" && e.outcome === "won").length;

  // Has the day's strongest-use window passed today (and stayed clean)?
  let pastDangerWindow = false;
  const win = report.dragon.strongestWindow;
  if (win && /^\d/.test(win)) {
    const hour = parseInt(win, 10);
    pastDangerWindow = new Date().getHours() > hour + 1 && !nicotineUsedToday;
  }

  const today: SerpentToday = {
    nicotineUsedToday,
    cravingsWonToday,
    gymDone: day.gymDone,
    waterMl: day.waterMl,
    waterTarget: settings.waterTarget,
    pastDangerWindow,
  };

  const battle = buildSerpentBattle(report, today);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recent = rows.map((r: any) => ({
    id: r.id, at: r.at.toISOString(), type: r.type, quantity: r.quantity, cost: r.cost,
    trigger: r.trigger, outcome: r.outcome, shift: r.shift,
  }));

  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-6">
      {/* Enemy first — the serpent hero leads, analytics follow. */}
      <SerpentClient battle={battle} report={report} recent={recent} />
      <div className="mt-4">
        <LogNicotine />
      </div>
    </main>
  );
}
