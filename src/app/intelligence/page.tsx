import { getIntelligenceData } from "@/lib/data";
import { PageHeader } from "@/components/bits";
import { IntelligenceClient } from "@/components/intelligence-client";

export const dynamic = "force-dynamic";

export default async function IntelligencePage() {
  const data = await getIntelligenceData();
  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-6">
      <PageHeader title="Recovery Intelligence" subtitle="Predict danger, intervene early, and win on data — your recovery operating system." accent="#22d3ee" />
      <IntelligenceClient data={data} />
    </main>
  );
}
