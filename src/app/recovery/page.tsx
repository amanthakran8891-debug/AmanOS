import { getRecoveryData } from "@/lib/data";
import { PageHeader } from "@/components/bits";
import { RecoveryClient } from "@/components/recovery-client";
import { getCleanRuns } from "@/lib/streak-history";
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
import { getRecoveryLogs } from "@/lib/recovery-logs";
import { RecoveryLogs } from "@/components/recovery-logs";

export const dynamic = "force-dynamic";

export default async function RecoveryPage() {
  const [data, history, smoking, savedInputs, success, cravingVictory, calendar, logs] = await Promise.all([getRecoveryData(), getCleanRuns(), getSmokingSplit(), getMoneySavedInputs(), getRecoverySuccess(), getCravingVictory(), getRecoveryCalendar(), getRecoveryLogs()]);
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
        <RecoveryLogs days={logs.days} />
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
