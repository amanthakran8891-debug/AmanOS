import { getIntelligenceData } from "@/lib/data";
import { PageHeader } from "@/components/bits";
import { IntelligenceClient } from "@/components/intelligence-client";
import { getCravingVictory } from "@/lib/craving-victory";
import { CravingVictoryPanel } from "@/components/craving-victory";
import { getRecoveryCalendar } from "@/lib/recovery-calendar";
import { RecoveryCalendar } from "@/components/recovery-calendar";

export const dynamic = "force-dynamic";

export default async function IntelligencePage() {
  const [data, cravingVictory, calendar] = await Promise.all([getIntelligenceData(), getCravingVictory(), getRecoveryCalendar()]);
  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-6">
      <PageHeader title="Recovery Intelligence" subtitle="Predict danger, intervene early, and win on data — your recovery operating system." accent="#22d3ee" />
      <div className="mb-4">
        <RecoveryCalendar cells={calendar.cells} />
      </div>
      <div className="mb-4">
        <CravingVictoryPanel data={cravingVictory} />
      </div>
      <IntelligenceClient data={data} />
    </main>
  );
}
