import { getRecoveryData } from "@/lib/data";
import { PageHeader } from "@/components/bits";
import { RecoveryClient } from "@/components/recovery-client";
import prisma from "@/lib/db";
import { buildStreakHistory, type RelapseInput } from "@/lib/streak-history";
import { CleanRuns } from "@/components/clean-runs";
import { getSmokingSplit, dragonTaxFromSplit } from "@/lib/smoking-split";
import { SmokingSplitPanel } from "@/components/smoking-split";
import { DragonTaxPanel } from "@/components/dragon-tax";
import { getMoneySavedInputs, computeMoneySaved } from "@/lib/money-saved";
import { MoneySavedPanel } from "@/components/money-saved";
import { getRecoverySuccess } from "@/lib/recovery-success";
import { RecoverySuccessPanel } from "@/components/recovery-success";
import { getCravingVictory } from "@/lib/craving-victory";
import { CravingVictoryPanel } from "@/components/craving-victory";
import { getRecoveryCalendar } from "@/lib/recovery-calendar";
import { RecoveryCalendar } from "@/components/recovery-calendar";

export const dynamic = "force-dynamic";

/** Phase 1, item 1: merge cannabis + nicotine relapses into clean-run history.
 *  Read-layer only — derives from existing JointEvent/NicotineEvent logs. */
async function getCleanRuns() {
  const ndb = prisma as unknown as { nicotineEvent: { findMany: (a: unknown) => Promise<{ at: Date }[]> } };
  const [joints, nicotine] = await Promise.all([
    prisma.jointEvent.findMany({ where: { type: "relapse" }, select: { at: true } }).catch(() => [] as { at: Date }[]),
    ndb.nicotineEvent.findMany({ where: { type: "relapse" }, select: { at: true } }).catch(() => [] as { at: Date }[]),
  ]);
  const relapses: RelapseInput[] = [
    ...joints.map((j) => ({ at: j.at, kind: "joint" as const })),
    ...nicotine.map((n) => ({ at: n.at, kind: "cigarette" as const })),
  ];
  return buildStreakHistory(relapses);
}

export default async function RecoveryPage() {
  const [data, history, smoking, savedInputs, success, cravingVictory, calendar] = await Promise.all([getRecoveryData(), getCleanRuns(), getSmokingSplit(), getMoneySavedInputs(), getRecoverySuccess(), getCravingVictory(), getRecoveryCalendar()]);
  const moneySaved = computeMoneySaved(smoking, savedInputs);
  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-6">
      <PageHeader title="Recovery & Freedom" subtitle="An estimated recovery model — personalised by your clean time and daily symptoms." accent="#34f5c5" />
      <RecoveryClient data={data} />
      <div className="mt-4">
        <RecoverySuccessPanel data={success} />
      </div>
      <div className="mt-4">
        <RecoveryCalendar cells={calendar.cells} />
      </div>
      <div className="mt-4">
        <CravingVictoryPanel data={cravingVictory} />
      </div>
      <div className="mt-4">
        <CleanRuns runs={history.runs} />
      </div>
      <div className="mt-4">
        <SmokingSplitPanel split={smoking} />
      </div>
      <div className="mt-4">
        <DragonTaxPanel tax={dragonTaxFromSplit(smoking)} />
      </div>
      <div className="mt-4">
        <MoneySavedPanel data={moneySaved} />
      </div>
    </main>
  );
}
