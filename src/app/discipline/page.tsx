import { getDisciplineData } from "@/lib/data";
import { PageHeader } from "@/components/bits";
import { DisciplineClient } from "@/components/discipline-client";
import { getDisciplineHistory } from "@/lib/discipline-history";
import { DisciplineHistoryPanel } from "@/components/discipline-history";

export const dynamic = "force-dynamic";

export default async function DisciplinePage() {
  const [data, history] = await Promise.all([getDisciplineData(), getDisciplineHistory()]);
  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-6">
      <PageHeader title="Discipline" subtitle="The truth mirror — did you move forward today, or drift?" accent="#fbbf24" />
      <DisciplineClient data={data} />
      <div className="mt-4">
        <DisciplineHistoryPanel data={history} />
      </div>
    </main>
  );
}
