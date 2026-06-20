/**
 * AmanOS — safe relapse de-duplication script (issue #11).
 *
 * Default = PREVIEW ONLY (prints what it would change, deletes nothing).
 * Pass --confirm to actually delete. Only ever touches type="relapse"
 * JointEvent rows — cravings and victories are never affected.
 *
 *   npx tsx scripts/dedupe-relapses.ts                 # preview
 *   npx tsx scripts/dedupe-relapses.ts --confirm       # apply
 *   npx tsx scripts/dedupe-relapses.ts --window 8      # cluster window (min)
 *   npx tsx scripts/dedupe-relapses.ts --max-per-day 4 # suspicious-day threshold
 *
 * Strategy: within each cluster of relapses inside the time window, KEEP the
 * earliest and flag the rest as duplicates. Mirrors the in-app hygiene panel.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function arg(name: string, def: number): number {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && process.argv[i + 1]) { const n = Number(process.argv[i + 1]); if (!isNaN(n)) return n; }
  return def;
}
const CONFIRM = process.argv.includes("--confirm");
const WINDOW_MIN = arg("window", 8);
const MAX_PER_DAY = arg("max-per-day", 4);

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function main() {
  const events = await prisma.jointEvent.findMany({ where: { type: "relapse" }, orderBy: { at: "asc" } });
  console.log(`\nTotal relapse logs: ${events.length}`);

  // Suspicious days
  const byDay = new Map<string, number>();
  for (const e of events) byDay.set(dayKey(e.at), (byDay.get(dayKey(e.at)) ?? 0) + 1);
  const suspicious = [...byDay.entries()].filter(([, n]) => n >= MAX_PER_DAY).sort((a, b) => b[1] - a[1]);
  if (suspicious.length) {
    console.log(`\nSuspicious days (≥ ${MAX_PER_DAY} relapses):`);
    for (const [d, n] of suspicious) console.log(`  ${d}: ${n} relapses`);
  } else {
    console.log(`\nNo suspicious days (≥ ${MAX_PER_DAY}/day).`);
  }

  // Cluster duplicates within window
  const windowMs = Math.max(1, WINDOW_MIN) * 60000;
  const toDelete: string[] = [];
  let cluster: typeof events = [];
  const flush = () => {
    if (cluster.length > 1) {
      console.log(`  keep ${cluster[0].at.toISOString()}  → remove ${cluster.length - 1} within ${WINDOW_MIN}m`);
      for (const d of cluster.slice(1)) toDelete.push(d.id);
    }
    cluster = [];
  };
  for (const e of events) {
    if (cluster.length === 0) { cluster = [e]; continue; }
    if (e.at.getTime() - cluster[0].at.getTime() <= windowMs) cluster.push(e);
    else { flush(); cluster = [e]; }
  }
  flush();

  console.log(`\nDuplicate relapse logs flagged for removal: ${toDelete.length}`);

  if (!CONFIRM) {
    console.log(`\n[PREVIEW] Nothing deleted. Re-run with --confirm to apply.\n`);
    return;
  }
  if (toDelete.length === 0) { console.log(`\nNothing to delete.\n`); return; }
  const res = await prisma.jointEvent.deleteMany({ where: { id: { in: toDelete }, type: "relapse" } });
  console.log(`\n[APPLIED] Deleted ${res.count} duplicate relapse logs. Cravings/victories untouched.\n`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
